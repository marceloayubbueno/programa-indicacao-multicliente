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
  ) {}

  // Processar filas a cada 30 segundos
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processQueues() {
    if (this.isProcessing) {
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
      const messages = await this.whatsappQueueService.getMessagesForProcessing(10);
      
      // 🔍 LOG DE INVESTIGAÇÃO: Quantas mensagens foram encontradas
      this.logger.log(`🔍 [INVESTIGAÇÃO] ===== INICIANDO PROCESSAMENTO DA FILA =====`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] Mensagens encontradas para processamento: ${messages.length}`);
      
      if (messages.length === 0) {
        this.logger.log(`🔍 [INVESTIGAÇÃO] Nenhuma mensagem para processar`);
        return;
      }

      // 🔍 LOG DE INVESTIGAÇÃO: Detalhes de cada mensagem
      messages.forEach((msg, index) => {
        const msgDoc = msg as any; // Cast para acessar propriedades do Document
        this.logger.log(`🔍 [INVESTIGAÇÃO] Mensagem ${index + 1}: ID=${msgDoc._id}, Para=${msg.to}, Trigger=${msg.trigger}, Status=${msg.status}`);
      });

      for (const message of messages) {
        try {
          // 🔍 LOG DE INVESTIGAÇÃO: Antes de processar cada mensagem
          const msgDoc = message as any; // Cast para acessar propriedades do Document
          const messageId = msgDoc._id || 'unknown';
          this.logger.log(`🔍 [INVESTIGAÇÃO] ===== PROCESSANDO MENSAGEM ${messageId} =====`);
          this.logger.log(`🔍 [INVESTIGAÇÃO] Status antes do processamento: ${message.status}`);
          this.logger.log(`🔍 [INVESTIGAÇÃO] Retry count: ${message.retryCount}/${message.maxRetries}`);
          
          await this.processMessage(message);
          
          // 🔍 LOG DE INVESTIGAÇÃO: Após processar com sucesso
          this.logger.log(`🔍 [INVESTIGAÇÃO] Mensagem ${messageId} processada com sucesso`);
          
        } catch (error) {
          const msgDoc = message as any; // Cast para acessar propriedades do Document
          const messageId = msgDoc._id || 'unknown';
          this.logger.error(`🔍 [INVESTIGAÇÃO] Erro ao processar mensagem ${messageId}: ${error.message}`);
          
          // Marcar como falha e agendar retry
          await this.handleMessageFailure(message, error.message);
        }
      }

      // 🔍 LOG DE INVESTIGAÇÃO: Após processar todas as mensagens
      this.logger.log(`🔍 [INVESTIGAÇÃO] ===== PROCESSAMENTO DA FILA CONCLUÍDO =====`);

    } catch (error) {
      // 🆕 NOVO: Log de debug para identificar erro
      this.logger.error(`🔍 [DEBUG] Erro em processPendingMessages(): ${error.message}`);
      this.logger.error(`🔍 [DEBUG] Stack trace: ${error.stack}`);
    }
  }

  // Processar mensagem individual
  private async processMessage(message: any) {
    const messageId = message._id || message.id || 'unknown';
    
    // 🔍 LOG ESTRATÉGICO: Início do processamento da mensagem
    this.logger.log(`🔍 [FILA-TWILIO] ===== INICIANDO PROCESSAMENTO DA MENSAGEM =====`);
    this.logger.log(`🔍 [FILA-TWILIO] ID da mensagem: ${messageId}`);
    this.logger.log(`🔍 [FILA-TWILIO] Para: ${message.to}`);
    this.logger.log(`🔍 [FILA-TWILIO] Trigger: ${message.trigger}`);
    this.logger.log(`🔍 [FILA-TWILIO] Status atual: ${message.status}`);
    this.logger.log(`🔍 [FILA-TWILIO] Retry: ${message.retryCount}/${message.maxRetries}`);
    
    this.logger.log(`Processando mensagem: ${messageId} para: ${message.to}`);

    // 🔍 LOG ESTRATÉGICO: Antes de marcar como PROCESSING
    this.logger.log(`🔍 [FILA-TWILIO] Marcando mensagem ${messageId} como PROCESSING...`);

    // Marcar como em processamento
    await this.whatsappQueueService.updateMessageStatus(messageId.toString(), QueueStatus.PROCESSING);
    
    // 🔍 LOG ESTRATÉGICO: Após marcar como PROCESSING
    this.logger.log(`🔍 [FILA-TWILIO] Mensagem ${messageId} marcada como PROCESSING com sucesso`);

    try {
      // 🔍 LOG ESTRATÉGICO: Antes da formatação do número
      this.logger.log(`🔍 [FILA-TWILIO] Formatando número: "${message.to}"`);
      
      // Formatar número do destinatário automaticamente
      const formattedTo = PhoneFormatterUtil.formatPhoneNumber(message.to);
      
      // 🔍 LOG ESTRATÉGICO: Após formatação
      this.logger.log(`🔍 [FILA-TWILIO] Número formatado: "${formattedTo}"`);
      
      // Log para debug da formatação
      this.logger.log(`🔧 [DEBUG] Formatação de número: "${message.to}" → "${formattedTo}"`);
      
      // 🔍 LOG ESTRATÉGICO: Antes da validação
      this.logger.log(`🔍 [FILA-TWILIO] Validando número para Twilio...`);
      
      // Validar se o número está correto para Twilio
      if (!PhoneFormatterUtil.isValidForTwilio(formattedTo)) {
        throw new Error(`Número de telefone inválido após formatação: ${formattedTo}`);
      }
      
      // 🔍 LOG ESTRATÉGICO: Número validado
      this.logger.log(`🔍 [FILA-TWILIO] Número validado com sucesso para Twilio`);

      // 🔍 LOG ESTRATÉGICO: ANTES de chamar Twilio
      this.logger.log(`🔍 [FILA-TWILIO] ===== CHAMANDO TWILIO =====`);
      this.logger.log(`🔍 [FILA-TWILIO] Enviando mensagem ${messageId} via Twilio para: ${formattedTo}`);
      this.logger.log(`🔍 [FILA-TWILIO] Conteúdo da mensagem: ${message.content.body.substring(0, 100)}...`);
      
      // Enviar via Twilio
      const twilioResponse = await this.twilioService.sendTestMessage({
        to: formattedTo,
        message: message.content.body,
      });
      
      // 🔍 LOG ESTRATÉGICO: RESPOSTA DO TWILIO
      this.logger.log(`🔍 [FILA-TWILIO] ===== RESPOSTA DO TWILIO RECEBIDA =====`);
      this.logger.log(`🔍 [FILA-TWILIO] Message ID: ${twilioResponse.sid || 'N/A'}`);
      this.logger.log(`🔍 [FILA-TWILIO] Success: ${twilioResponse.success || 'N/A'}`);
      this.logger.log(`🔍 [FILA-TWILIO] Resposta completa:`, twilioResponse);

      // 🔍 LOG ESTRATÉGICO: ANTES de marcar como COMPLETED
      this.logger.log(`🔍 [FILA-TWILIO] Marcando mensagem ${messageId} como COMPLETED...`);

      // Marcar como completada
      await this.whatsappQueueService.updateMessageStatus(
        messageId.toString(), 
        QueueStatus.COMPLETED,
        { twilioResponse }
      );
      
      // 🔍 LOG ESTRATÉGICO: Após marcar como COMPLETED
      this.logger.log(`🔍 [FILA-TWILIO] Mensagem ${messageId} marcada como COMPLETED com sucesso`);
      this.logger.log(`🔍 [FILA-TWILIO] ===== PROCESSAMENTO CONCLUÍDO COM SUCESSO =====`);

      this.logger.log(`Mensagem ${messageId} enviada com sucesso via Twilio`);

    } catch (error) {
      // 🔍 LOG ESTRATÉGICO: ERRO DETALHADO
      this.logger.error(`🔍 [FILA-TWILIO] ===== ERRO NO PROCESSAMENTO =====`);
      this.logger.error(`🔍 [FILA-TWILIO] Mensagem ${messageId}: ${error.message}`);
      this.logger.error(`🔍 [FILA-TWILIO] Stack trace: ${error.stack}`);
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
          await this.whatsappQueueService.updateMessageStatus(
            nextMessage._id.toString(),
            QueueStatus.PENDING,
            { 
              error: null,
              retryCount: 0,
              attemptsCount: 0,
              lastAttemptAt: null,
              nextRetryAt: null,
              fallbackFrom: messageId
            }
          );
        }
      }

    } catch (error) {
      this.logger.error(`Erro ao processar fallback sequencial: ${error.message}`);
    }
  }

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
