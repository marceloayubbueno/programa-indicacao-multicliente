import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WhatsAppQueue, WhatsAppQueueDocument, MessagePriority, QueueStatus } from './entities/whatsapp-queue.schema';
import { CreateQueueMessageDto } from './dto/create-queue-message.dto';
import { UpdateQueueMessageDto } from './dto/update-queue-message.dto';

@Injectable()
export class WhatsAppQueueService {
  private readonly logger = new Logger(WhatsAppQueueService.name);

  constructor(
    @InjectModel(WhatsAppQueue.name) private whatsappQueueModel: Model<WhatsAppQueueDocument>,
  ) {}

  /**
   * Adiciona uma nova mensagem à fila
   */
  async addToQueue(createQueueMessageDto: CreateQueueMessageDto): Promise<WhatsAppQueue> {
    try {
      // Garantir que priority não seja undefined
      const priority = createQueueMessageDto.priority || MessagePriority.MEDIUM;
      
      // Calcular posição na fila baseada na prioridade
      const queuePosition = await this.calculateQueuePosition(priority);
      
      const queueMessage = new this.whatsappQueueModel({
        ...createQueueMessageDto,
        priority,
        queuePosition,
        status: QueueStatus.PENDING,
        retryCount: 0,
        maxRetries: 3,
        attemptsCount: 0,
        createdAt: new Date(),
      });

      const savedMessage = await queueMessage.save();
      this.logger.log(`Mensagem adicionada à fila: ${savedMessage._id} - Prioridade: ${savedMessage.priority}`);
      
      return savedMessage;
    } catch (error) {
      this.logger.error(`Erro ao adicionar mensagem à fila: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcula a posição na fila baseada na prioridade
   */
  private async calculateQueuePosition(priority: MessagePriority): Promise<number> {
    const priorityOrder = {
      [MessagePriority.HIGH]: 1,
      [MessagePriority.MEDIUM]: 2,
      [MessagePriority.LOW]: 3,
    };

    // Buscar a última posição da fila para esta prioridade
    const lastMessage = await this.whatsappQueueModel
      .findOne({ priority })
      .sort({ queuePosition: -1 })
      .exec();

    if (!lastMessage) {
      return priorityOrder[priority] * 1000; // Posição inicial para cada prioridade
    }

    return lastMessage.queuePosition + 1;
  }

  /**
   * Busca mensagens da fila com filtros e paginação
   */
  async getQueueMessages(
    filters: {
      clientId?: string;
      status?: QueueStatus;
      priority?: MessagePriority;
      trigger?: string;
    } = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<{ messages: WhatsAppQueue[]; total: number; page: number; totalPages: number }> {
    try {
      const query: any = {};

      // Aplicar filtros
      if (filters.clientId) {
        query.clientId = new Types.ObjectId(filters.clientId);
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.priority) {
        query.priority = filters.priority;
      }
      if (filters.trigger) {
        query.trigger = filters.trigger;
      }

      // Calcular skip para paginação
      const skip = (page - 1) * limit;

      // Executar queries
      const [messages, total] = await Promise.all([
        this.whatsappQueueModel
          .find(query)
          .sort({ priority: 1, queuePosition: 1, createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .populate('clientId', 'name')
          .exec(),
        this.whatsappQueueModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        messages,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar mensagens da fila: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém estatísticas da fila
   */
  async getQueueStatus(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    retry: number;
    high: number;
    medium: number;
    low: number;
  }> {
    try {
      const [
        total,
        pending,
        processing,
        completed,
        failed,
        retry,
        high,
        medium,
        low,
      ] = await Promise.all([
        this.whatsappQueueModel.countDocuments(),
        this.whatsappQueueModel.countDocuments({ status: QueueStatus.PENDING }),
        this.whatsappQueueModel.countDocuments({ status: QueueStatus.PROCESSING }),
        this.whatsappQueueModel.countDocuments({ status: QueueStatus.COMPLETED }),
        this.whatsappQueueModel.countDocuments({ status: QueueStatus.FAILED }),
        this.whatsappQueueModel.countDocuments({ status: QueueStatus.RETRY }),
        this.whatsappQueueModel.countDocuments({ priority: MessagePriority.HIGH }),
        this.whatsappQueueModel.countDocuments({ priority: MessagePriority.MEDIUM }),
        this.whatsappQueueModel.countDocuments({ priority: MessagePriority.LOW }),
      ]);

      return {
        total,
        pending,
        processing,
        completed,
        failed,
        retry,
        high,
        medium,
        low,
      };
    } catch (error) {
      this.logger.error(`Erro ao obter status da fila: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza o status de uma mensagem na fila
   */
  async updateMessageStatus(
    messageId: string,
    status: QueueStatus,
    metadata?: any,
  ): Promise<WhatsAppQueue> {
    try {
      const updateData: any = { status };

      if (status === QueueStatus.PROCESSING) {
        updateData.lastAttemptAt = new Date();
        updateData.$inc = { attemptsCount: 1 };
      } else if (status === QueueStatus.COMPLETED) {
        updateData.processedAt = new Date();
        updateData.providerResponse = metadata?.providerResponse;
      } else if (status === QueueStatus.FAILED) {
        updateData.lastAttemptAt = new Date();
        updateData.$inc = { attemptsCount: 1 };
        updateData.providerResponse = metadata?.providerResponse;
      } else if (status === QueueStatus.RETRY) {
        updateData.$inc = { retryCount: 1, attemptsCount: 1 };
        updateData.nextRetryAt = this.calculateNextRetryTime();
        updateData.lastAttemptAt = new Date();
      }

      const updatedMessage = await this.whatsappQueueModel
        .findByIdAndUpdate(
          messageId,
          updateData,
          { new: true, runValidators: true }
        )
        .exec();

      if (!updatedMessage) {
        throw new Error(`Mensagem não encontrada: ${messageId}`);
      }

      this.logger.log(`Status da mensagem ${messageId} atualizado para: ${status}`);
      return updatedMessage;
    } catch (error) {
      this.logger.error(`Erro ao atualizar status da mensagem ${messageId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcula o próximo horário de retry baseado no número de tentativas
   */
  private calculateNextRetryTime(): Date {
    const now = new Date();
    // Retry exponencial: 1min, 5min, 15min, 30min
    const retryDelays = [1, 5, 15, 30];
    const delayMinutes = retryDelays[Math.min(retryDelays.length - 1, 3)];
    
    return new Date(now.getTime() + delayMinutes * 60 * 1000);
  }

  /**
   * Remove uma mensagem da fila
   */
  async removeFromQueue(messageId: string): Promise<boolean> {
    try {
      const result = await this.whatsappQueueModel.findByIdAndDelete(messageId).exec();
      
      if (result) {
        this.logger.log(`Mensagem ${messageId} removida da fila`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Erro ao remover mensagem ${messageId} da fila: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca mensagens prontas para processamento
   */
  async getMessagesForProcessing(limit: number = 10): Promise<WhatsAppQueue[]> {
    try {
      const now = new Date();
      
      const messages = await this.whatsappQueueModel
        .find({
          $or: [
            { status: QueueStatus.PENDING },
            {
              status: QueueStatus.RETRY,
              nextRetryAt: { $lte: now },
            },
          ],
          retryCount: { $lt: 3 }, // Máximo de 3 tentativas
        })
        .sort({ priority: 1, queuePosition: 1, createdAt: 1 })
        .limit(limit)
        .exec();

      return messages;
    } catch (error) {
      this.logger.error(`Erro ao buscar mensagens para processamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 NOVO: Busca todas as mensagens da fila para debug
   */
  async getAllMessages(): Promise<WhatsAppQueue[]> {
    try {
      const messages = await this.whatsappQueueModel
        .find({})
        .sort({ createdAt: -1 })
        .limit(100) // Limitar a 100 para não sobrecarregar
        .exec();

      return messages;
    } catch (error) {
      this.logger.error(`Erro ao buscar todas as mensagens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Limpa mensagens antigas da fila
   */
  async cleanupOldMessages(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.whatsappQueueModel
        .deleteMany({
          status: { $in: [QueueStatus.COMPLETED, QueueStatus.FAILED] },
          createdAt: { $lt: cutoffDate },
        })
        .exec();

      this.logger.log(`${result.deletedCount} mensagens antigas removidas da fila`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error(`Erro ao limpar mensagens antigas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém estatísticas por cliente
   */
  async getClientQueueStats(clientId: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
    successRate: number;
  }> {
    try {
      const [total, pending, completed, failed] = await Promise.all([
        this.whatsappQueueModel.countDocuments({ clientId: new Types.ObjectId(clientId) }),
        this.whatsappQueueModel.countDocuments({ 
          clientId: new Types.ObjectId(clientId), 
          status: QueueStatus.PENDING 
        }),
        this.whatsappQueueModel.countDocuments({ 
          clientId: new Types.ObjectId(clientId), 
          status: QueueStatus.COMPLETED 
        }),
        this.whatsappQueueModel.countDocuments({ 
          clientId: new Types.ObjectId(clientId), 
          status: QueueStatus.FAILED 
        }),
      ]);

      const successRate = total > 0 ? ((completed / total) * 100) : 0;

      return {
        total,
        pending,
        completed,
        failed,
        successRate: Math.round(successRate * 100) / 100, // 2 casas decimais
      };
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas do cliente ${clientId}: ${error.message}`);
      throw error;
    }
  }
}
