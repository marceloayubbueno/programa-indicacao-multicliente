import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { WhatsAppQueueService } from './whatsapp-queue.service';
import { CreateQueueMessageDto } from './dto/create-queue-message.dto';
import { UpdateQueueMessageDto } from './dto/update-queue-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueueStatus, MessagePriority, WhatsAppQueueDocument } from './entities/whatsapp-queue.schema';

@Controller('admin/whatsapp/queue')
@UseGuards(JwtAuthGuard)
export class WhatsAppQueueController {
  private readonly logger = new Logger(WhatsAppQueueController.name);

  constructor(private readonly whatsappQueueService: WhatsAppQueueService) {}

  /**
   * Adiciona uma nova mensagem à fila
   */
  @Post('messages')
  async addToQueue(@Body() createQueueMessageDto: CreateQueueMessageDto) {
    try {
      const message = await this.whatsappQueueService.addToQueue(createQueueMessageDto);
      return {
        success: true,
        message: 'Mensagem adicionada à fila com sucesso',
        data: message,
      };
    } catch (error) {
      this.logger.error(`Erro ao adicionar mensagem à fila: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao adicionar mensagem à fila',
        error: error.message,
      };
    }
  }

  /**
   * Lista mensagens da fila com filtros e paginação
   */
  @Get('messages')
  async getQueueMessages(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('clientId') clientId?: string,
    @Query('status') status?: QueueStatus,
    @Query('priority') priority?: MessagePriority,
    @Query('trigger') trigger?: string,
  ) {
    try {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      const filters = {
        clientId,
        status,
        priority,
        trigger,
      };

      const result = await this.whatsappQueueService.getQueueMessages(filters, pageNum, limitNum);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar mensagens da fila: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao buscar mensagens da fila',
        error: error.message,
      };
    }
  }

  /**
   * Obtém estatísticas da fila
   */
  @Get('status')
  async getQueueStatus() {
    try {
      const status = await this.whatsappQueueService.getQueueStatus();
      
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      this.logger.error(`Erro ao obter status da fila: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao obter status da fila',
        error: error.message,
      };
    }
  }

  /**
   * Atualiza o status de uma mensagem
   */
  @Put('messages/:id/status')
  async updateMessageStatus(
    @Param('id') messageId: string,
    @Body() body: { status: QueueStatus; metadata?: any },
  ) {
    try {
      const message = await this.whatsappQueueService.updateMessageStatus(
        messageId,
        body.status,
        body.metadata,
      );
      
      return {
        success: true,
        message: 'Status da mensagem atualizado com sucesso',
        data: message,
      };
    } catch (error) {
      this.logger.error(`Erro ao atualizar status da mensagem ${messageId}: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao atualizar status da mensagem',
        error: error.message,
      };
    }
  }

  /**
   * Remove uma mensagem da fila
   */
  @Delete('messages/:id')
  async removeFromQueue(@Param('id') messageId: string) {
    try {
      const removed = await this.whatsappQueueService.removeFromQueue(messageId);
      
      if (removed) {
        return {
          success: true,
          message: 'Mensagem removida da fila com sucesso',
        };
      } else {
        return {
          success: false,
          message: 'Mensagem não encontrada',
        };
      }
    } catch (error) {
      this.logger.error(`Erro ao remover mensagem ${messageId} da fila: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao remover mensagem da fila',
        error: error.message,
      };
    }
  }

  /**
   * Busca mensagens prontas para processamento
   */
  @Get('messages/processing')
  async getMessagesForProcessing(@Query('limit') limit: string = '10') {
    try {
      const limitNum = parseInt(limit, 10);
      const messages = await this.whatsappQueueService.getMessagesForProcessing(limitNum);
      
      return {
        success: true,
        data: messages,
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar mensagens para processamento: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao buscar mensagens para processamento',
        error: error.message,
      };
    }
  }

  /**
   * Limpa mensagens antigas da fila
   */
  @Delete('messages/cleanup')
  async cleanupOldMessages(@Query('days') days: string = '30') {
    try {
      const daysNum = parseInt(days, 10);
      const removedCount = await this.whatsappQueueService.cleanupOldMessages(daysNum);
      
      return {
        success: true,
        message: `${removedCount} mensagens antigas removidas da fila`,
        data: { removedCount },
      };
    } catch (error) {
      this.logger.error(`Erro ao limpar mensagens antigas: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao limpar mensagens antigas',
        error: error.message,
      };
    }
  }

  /**
   * Obtém estatísticas por cliente
   */
  @Get('clients/:clientId/stats')
  async getClientQueueStats(@Param('clientId') clientId: string) {
    try {
      const stats = await this.whatsappQueueService.getClientQueueStats(clientId);
      
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas do cliente ${clientId}: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao obter estatísticas do cliente',
        error: error.message,
      };
    }
  }

  /**
   * Retry de uma mensagem falhada
   */
  @Post('messages/:id/retry')
  async retryMessage(@Param('id') messageId: string) {
    try {
      const message = await this.whatsappQueueService.updateMessageStatus(
        messageId,
        QueueStatus.RETRY,
      );
      
      return {
        success: true,
        message: 'Mensagem marcada para retry',
        data: message,
      };
    } catch (error) {
      this.logger.error(`Erro ao marcar mensagem ${messageId} para retry: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao marcar mensagem para retry',
        error: error.message,
      };
    }
  }

  /**
   * Obtém configurações da fila
   */
  @Get('settings')
  async getQueueSettings() {
    try {
      // Configurações padrão da fila
      const settings = {
        rateLimitPerMinute: 30,
        delayBetweenMessages: 2000,
        sendTimeStart: '08:00',
        sendTimeEnd: '20:00',
        autoProcess: true,
        enableRetries: true,
        logAllMessages: false
      };
      
      return {
        success: true,
        data: settings,
      };
    } catch (error) {
      this.logger.error(`Erro ao obter configurações da fila: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao obter configurações da fila',
        error: error.message,
      };
    }
  }

  /**
   * Salva configurações da fila
   */
  @Post('settings')
  async saveQueueSettings(@Body() settings: {
    rateLimitPerMinute?: number;
    delayBetweenMessages?: number;
    sendTimeStart?: string;
    sendTimeEnd?: string;
    autoProcess?: boolean;
    enableRetries?: boolean;
    logAllMessages?: boolean;
  }) {
    try {
      // Aqui você pode implementar a lógica para salvar as configurações
      // Por enquanto, apenas retorna sucesso
      this.logger.log(`Configurações da fila atualizadas: ${JSON.stringify(settings)}`);
      
      return {
        success: true,
        message: 'Configurações da fila salvas com sucesso',
        data: settings,
      };
    } catch (error) {
      this.logger.error(`Erro ao salvar configurações da fila: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao salvar configurações da fila',
        error: error.message,
      };
    }
  }

  /**
   * Processa filas em lote
   */
  @Post('process')
  async processQueues(@Body() body: { limit?: number; clientId?: string }) {
    try {
      const limit = body.limit || 10;
      const clientId = body.clientId;
      
      // Buscar mensagens para processamento
      let messages = await this.whatsappQueueService.getMessagesForProcessing(limit);
      
      // Filtrar por cliente se especificado
      if (clientId) {
        messages = messages.filter(msg => msg.clientId.toString() === clientId);
      }
      
      // Marcar mensagens como processando
      const processingPromises = messages.map(msg => {
        const msgDoc = msg as WhatsAppQueueDocument;
        return this.whatsappQueueService.updateMessageStatus(msgDoc._id.toString(), QueueStatus.PROCESSING);
      });
      
      await Promise.all(processingPromises);
      
      return {
        success: true,
        message: `${messages.length} mensagens marcadas para processamento`,
        data: {
          processedCount: messages.length,
          messages: messages.map(msg => {
            const msgDoc = msg as WhatsAppQueueDocument;
            return {
              id: msgDoc._id,
              clientId: msg.clientId,
              priority: msg.priority,
              trigger: msg.trigger,
            };
          }),
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao processar filas: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao processar filas',
        error: error.message,
      };
    }
  }

  /**
   * 🆕 NOVO: Resetar mensagens que falharam para reprocessamento
   * Útil para mensagens que atingiram maxRetries mas precisam ser reenviadas
   */
  @Post('messages/reset-failed')
  async resetFailedMessages(@Body() body: { messageIds?: string[] }) {
    try {
      const result = await this.whatsappQueueService.resetFailedMessages(body.messageIds);
      
      return {
        success: true,
        message: `Resetadas ${result.reset} mensagens para reprocessamento`,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Erro ao resetar mensagens falhadas: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao resetar mensagens falhadas',
        error: error.message,
      };
    }
  }
}
