import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WhatsAppQueueService } from './whatsapp-queue.service';
import { TwilioService } from './providers/twilio.service';
import { QueueStatus, MessagePriority } from './entities/whatsapp-queue.schema';
import { PhoneFormatterUtil } from './utils/phone-formatter.util'; // 🆕 NOVO: Importar formatação

@Injectable()
export class WhatsAppQueueProcessorService {
  private readonly logger = new Logger(WhatsAppQueueProcessorService.name);
  private isProcessing = false;

  constructor(
    private readonly whatsappQueueService: WhatsAppQueueService,
    private readonly twilioService: TwilioService,
  ) {
    // 🆕 NOVO: Logs de debug para identificar instanciação
    console.log('🚀 [DEBUG] WhatsAppQueueProcessorService constructor chamado!');
    console.log('🔧 [DEBUG] whatsappQueueService injetado:', !!this.whatsappQueueService);
    console.log('🔧 [DEBUG] twilioService injetado:', !!this.twilioService);
    
    // 🆕 NOVO: Log de inicialização para debug
    this.logger.log('🚀 WhatsAppQueueProcessorService inicializado!');
    this.logger.log('⏰ Cron job configurado para rodar a cada 30 segundos');
  }

  // Processar filas a cada 30 segundos
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processQueues() {
    // 🆕 NOVO: Log de execução do cron job
    this.logger.log('⏰ Cron job executando: processQueues()');
    
    if (this.isProcessing) {
      this.logger.debug('Processamento já em andamento, pulando...');
      return;
    }

    this.isProcessing = true;
    
    try {
      await this.processPendingMessages();
    } catch (error) {
      this.logger.error(`Erro ao processar filas: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  // Processar mensagens pendentes
  private async processPendingMessages() {
    try {
      // 🆕 NOVO: Log de debug para identificar execução
      this.logger.log('🔍 [DEBUG] processPendingMessages() - Iniciando...');
      
      // 🆕 NOVO: Verificar mensagens existentes na fila
      const allMessages = await this.whatsappQueueService.getAllMessages();
      this.logger.log(`🔍 [DEBUG] Total de mensagens na fila: ${allMessages.length}`);
      
      // 🆕 NOVO: Verificar status das mensagens
      const statusCounts = allMessages.reduce((acc, msg) => {
        acc[msg.status] = (acc[msg.status] || 0) + 1;
        return acc;
      }, {});
      this.logger.log(`🔍 [DEBUG] Status das mensagens:`, statusCounts);
      
      // 🆕 NOVO: Verificar mensagens PENDING especificamente
      const pendingMessages = allMessages.filter(msg => msg.status === 'pending');
      this.logger.log(`🔍 [DEBUG] Mensagens PENDING encontradas: ${pendingMessages.length}`);
      if (pendingMessages.length > 0) {
        this.logger.log(`🔍 [DEBUG] IDs das mensagens PENDING:`, pendingMessages.map(m => (m as any)._id));
      }
      
      // 🆕 NOVO: Verificar mensagens RETRY especificamente
      const retryMessages = allMessages.filter(msg => msg.status === 'retry');
      this.logger.log(`🔍 [DEBUG] Mensagens RETRY encontradas: ${retryMessages.length}`);
      if (retryMessages.length > 0) {
        this.logger.log(`🔍 [DEBUG] IDs das mensagens RETRY:`, retryMessages.map(m => (m as any)._id));
        this.logger.log(`🔍 [DEBUG] nextRetryAt das mensagens RETRY:`, retryMessages.map(m => ({ id: (m as any)._id, nextRetryAt: m.nextRetryAt, now: new Date() })));
      }
      
      // Buscar mensagens prontas para processamento (máximo 10 por vez)
      const messages = await this.whatsappQueueService.getMessagesForProcessing(10);
      
      // 🆕 NOVO: Log de debug para identificar resultado da busca
      this.logger.log(`🔍 [DEBUG] Mensagens encontradas para processamento: ${messages.length}`);
      
      if (messages.length === 0) {
        this.logger.log('🔍 [DEBUG] Nenhuma mensagem para processar');
        return;
      }

      this.logger.log(`Processando ${messages.length} mensagens da fila`);

      for (const message of messages) {
        try {
          await this.processMessage(message);
        } catch (error) {
          this.logger.error(`Erro ao processar mensagem: ${error.message}`);
          
          // Marcar como falha e agendar retry
          await this.handleMessageFailure(message, error.message);
        }
      }

    } catch (error) {
      // 🆕 NOVO: Log de debug para identificar erro
      this.logger.error(`🔍 [DEBUG] Erro em processPendingMessages(): ${error.message}`);
      this.logger.error(`🔍 [DEBUG] Stack trace: ${error.stack}`);
    }
  }

  // Processar mensagem individual
  private async processMessage(message: any) {
    const messageId = message._id || message.id || 'unknown';
    this.logger.log(`Processando mensagem: ${messageId} para: ${message.to}`);

    // Marcar como em processamento
    await this.whatsappQueueService.updateMessageStatus(messageId.toString(), QueueStatus.PROCESSING);

    try {
      // 🆕 NOVO: Formatar número do destinatário automaticamente
      const formattedTo = PhoneFormatterUtil.formatPhoneNumber(message.to);
      
      // 🆕 NOVO: Log para debug da formatação
      this.logger.log(`🔧 [DEBUG] Formatação de número: "${message.to}" → "${formattedTo}"`);
      
      // 🆕 NOVO: Validar se o número está correto para Twilio
      if (!PhoneFormatterUtil.isValidForTwilio(formattedTo)) {
        throw new Error(`Número de telefone inválido após formatação: ${formattedTo}`);
      }

      // Enviar via Twilio
      const twilioResponse = await this.twilioService.sendTestMessage({
        to: formattedTo, // 🆕 NOVO: Usar número formatado
        message: message.content.body,
        // Adicionar outros campos se necessário (header, footer, buttons)
      });

      // Marcar como completada
      await this.whatsappQueueService.updateMessageStatus(
        messageId.toString(), 
        QueueStatus.COMPLETED,
        { twilioResponse }
      );

      this.logger.log(`Mensagem ${messageId} enviada com sucesso via Twilio`);

    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem ${messageId} via Twilio: ${error.message}`);
      throw error;
    }
  }

  // Tratar falha na mensagem
  private async handleMessageFailure(message: any, errorMessage: string) {
    const messageId = message._id || message.id || 'unknown';
    try {
      if (message.retryCount < message.maxRetries) {
        // Agendar retry
        await this.whatsappQueueService.updateMessageStatus(
          messageId.toString(),
          QueueStatus.RETRY,
          { error: errorMessage }
        );
        
        this.logger.log(`Mensagem ${messageId} agendada para retry (${message.retryCount + 1}/${message.maxRetries})`);
      } else {
        // 🆕 NOVO: Máximo de tentativas atingido - tentar próxima mensagem do fluxo
        await this.handleSequentialFallback(message, errorMessage);
      }
    } catch (updateError) {
      this.logger.error(`Erro ao atualizar status da mensagem ${messageId}: ${updateError.message}`);
    }
  }

  // 🆕 NOVO: Método para implementar fallback sequencial
  private async handleSequentialFallback(failedMessage: any, errorMessage: string) {
    try {
      const messageId = failedMessage._id || failedMessage.id || 'unknown';
      this.logger.log(`🔄 [FALLBACK] Mensagem ${messageId} falhou definitivamente, tentando fallback sequencial...`);

      // Marcar mensagem atual como falhada
      await this.whatsappQueueService.updateMessageStatus(
        messageId.toString(),
        QueueStatus.FAILED,
        { error: errorMessage, maxRetriesReached: true }
      );

      // Verificar se há próxima mensagem no fluxo para fallback
      if (failedMessage.flowId && failedMessage.to) {
        const nextMessage = await this.findNextMessageInFlow(failedMessage.flowId, failedMessage.to, failedMessage.metadata?.messageOrder);
        
        if (nextMessage) {
          this.logger.log(`🔄 [FALLBACK] Próxima mensagem encontrada para fallback: ${nextMessage._id}`);
          
          // Resetar próxima mensagem para processamento
          await this.whatsappQueueService.updateMessageStatus(
            nextMessage._id.toString(),
            QueueStatus.PENDING,
            { 
              error: null,
              retryCount: 0,
              attemptsCount: 0,
              lastAttemptAt: null,
              nextRetryAt: null,
              fallbackFrom: messageId // Marcar como fallback
            }
          );
          
          this.logger.log(`✅ [FALLBACK] Próxima mensagem ${nextMessage._id} marcada para processamento como fallback`);
        } else {
          this.logger.log(`⚠️ [FALLBACK] Nenhuma próxima mensagem encontrada para fallback no fluxo ${failedMessage.flowId}`);
        }
      } else {
        this.logger.log(`⚠️ [FALLBACK] Mensagem ${messageId} não possui fluxo ou destinatário para fallback`);
      }

    } catch (error) {
      this.logger.error(`❌ [FALLBACK] Erro ao processar fallback sequencial: ${error.message}`);
    }
  }

  // 🆕 NOVO: Método para encontrar próxima mensagem no fluxo
  private async findNextMessageInFlow(flowId: string, to: string, currentOrder: number): Promise<any> {
    try {
      // Buscar próxima mensagem do mesmo fluxo e destinatário usando o service
      const allMessages = await this.whatsappQueueService.getAllMessages();
      
      const nextMessage = allMessages.find(msg => 
        msg.flowId?.toString() === flowId &&
        msg.to === to &&
        ['pending', 'retry'].includes(msg.status) &&
        (msg.metadata as any)?.messageOrder > (currentOrder || 0)
      );

      if (nextMessage) {
        // Ordenar por ordem da mensagem e pegar a primeira
        const nextMessages = allMessages
          .filter(msg => 
            msg.flowId?.toString() === flowId &&
            msg.to === to &&
            ['pending', 'retry'].includes(msg.status) &&
            (msg.metadata as any)?.messageOrder > (currentOrder || 0)
          )
          .sort((a, b) => {
            const orderA = (a.metadata as any)?.messageOrder || 0;
            const orderB = (b.metadata as any)?.messageOrder || 0;
            return orderA - orderB;
          });

        return nextMessages[0];
      }

      return null;
    } catch (error) {
      this.logger.error(`Erro ao buscar próxima mensagem no fluxo: ${error.message}`);
      return null;
    }
  }

  // Processar filas manualmente (para admin)
  async processQueuesManually(limit: number = 50): Promise<{ processed: number; errors: number }> {
    if (this.isProcessing) {
      throw new Error('Processamento já em andamento');
    }

    this.isProcessing = true;
    let processed = 0;
    let errors = 0;

    try {
      const messages = await this.whatsappQueueService.getMessagesForProcessing(limit);
      
      for (const message of messages) {
        try {
          await this.processMessage(message);
          processed++;
        } catch (error) {
          await this.handleMessageFailure(message, error.message);
          errors++;
        }
      }

      return { processed, errors };

    } finally {
      this.isProcessing = false;
    }
  }

  // Limpar mensagens antigas (diariamente às 2h da manhã)
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldMessages() {
    try {
      this.logger.log('Iniciando limpeza de mensagens antigas...');
      
      // Remover mensagens completadas/falhadas com mais de 30 dias
      const result = await this.whatsappQueueService.cleanupOldMessages(30);
      
      this.logger.log(`Limpeza concluída. Mensagens removidas: ${result}`);
      
    } catch (error) {
      this.logger.error(`Erro na limpeza de mensagens antigas: ${error.message}`);
    }
  }

  // Obter status do processador
  getProcessorStatus() {
    return {
      isProcessing: this.isProcessing,
      lastRun: new Date(),
      status: this.isProcessing ? 'PROCESSING' : 'IDLE',
    };
  }
}
