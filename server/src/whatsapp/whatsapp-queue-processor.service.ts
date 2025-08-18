import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WhatsAppQueueService } from './whatsapp-queue.service';
import { TwilioService } from './providers/twilio.service';
import { QueueStatus, MessagePriority } from './entities/whatsapp-queue.schema';

@Injectable()
export class WhatsAppQueueProcessorService {
  private readonly logger = new Logger(WhatsAppQueueProcessorService.name);
  private isProcessing = false;

  constructor(
    private readonly whatsappQueueService: WhatsAppQueueService,
    private readonly twilioService: TwilioService,
  ) {
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
      // Buscar mensagens prontas para processamento (máximo 10 por vez)
      const messages = await this.whatsappQueueService.getMessagesForProcessing(10);
      
      if (messages.length === 0) {
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
      this.logger.error(`Erro ao buscar mensagens para processamento: ${error.message}`);
    }
  }

  // Processar mensagem individual
  private async processMessage(message: any) {
    const messageId = message._id || message.id || 'unknown';
    this.logger.log(`Processando mensagem: ${messageId} para: ${message.to}`);

    // Marcar como em processamento
    await this.whatsappQueueService.updateMessageStatus(messageId.toString(), QueueStatus.PROCESSING);

    try {
      // Enviar via Twilio
      const twilioResponse = await this.twilioService.sendTestMessage({
        to: message.to,
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
        // Máximo de tentativas atingido
        await this.whatsappQueueService.updateMessageStatus(
          messageId.toString(),
          QueueStatus.FAILED,
          { error: errorMessage, maxRetriesReached: true }
        );
        
        this.logger.error(`Mensagem ${messageId} falhou definitivamente após ${message.maxRetries} tentativas`);
      }
    } catch (updateError) {
      this.logger.error(`Erro ao atualizar status da mensagem ${messageId}: ${updateError.message}`);
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
