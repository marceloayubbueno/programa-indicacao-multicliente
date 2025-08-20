import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WhatsAppQueue, WhatsAppQueueDocument, MessagePriority, QueueStatus } from './entities/whatsapp-queue.schema';
import { CreateQueueMessageDto } from './dto/create-queue-message.dto';
import { UpdateQueueMessageDto } from './dto/update-queue-message.dto';
import { PhoneFormatterUtil } from './utils/phone-formatter.util'; // 🆕 NOVO: Importar formatação

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
      // 🆕 NOVO: Formatar número do destinatário automaticamente
      const formattedTo = PhoneFormatterUtil.formatPhoneNumber(createQueueMessageDto.to);
      
      // 🆕 NOVO: Log para debug da formatação

      
      // 🆕 NOVO: Validar se o número está correto para Twilio
      if (!PhoneFormatterUtil.isValidForTwilio(formattedTo)) {
        throw new Error(`Número de telefone inválido após formatação: ${formattedTo}`);
      }

      // Garantir que priority não seja undefined
      const priority = createQueueMessageDto.priority || MessagePriority.MEDIUM;
      
      // Calcular posição na fila baseada na prioridade
      const queuePosition = await this.calculateQueuePosition(priority);
      
      const queueMessage = new this.whatsappQueueModel({
        ...createQueueMessageDto,
        to: formattedTo, // 🆕 NOVO: Salvar número formatado
        priority,
        queuePosition,
        status: QueueStatus.PENDING,
        retryCount: 0,
        maxRetries: 1,
        attemptsCount: 0,
        createdAt: new Date(),
      });

      const savedMessage = await queueMessage.save();
      
      // 🔍 LOG DE INVESTIGAÇÃO: Mensagem criada na fila
      this.logger.log(`🔍 [INVESTIGAÇÃO] ===== MENSAGEM CRIADA NA FILA =====`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] ID: ${savedMessage._id}`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] Para: ${savedMessage.to}`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] Trigger: ${savedMessage.trigger}`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] Prioridade: ${savedMessage.priority}`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] Client ID: ${savedMessage.clientId}`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] Flow ID: ${savedMessage.flowId}`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] Template ID: ${savedMessage.templateId}`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] ===== FIM MENSAGEM CRIADA =====`);
      
      // 🔍 LOG DETALHADO: Conteúdo da mensagem criada
      console.log('🔍 [QUEUE-CREATE] ===== CONTEÚDO DA MENSAGEM CRIADA =====');
      console.log('🔍 [QUEUE-CREATE] Content Body:', savedMessage.content?.body);
      console.log('🔍 [QUEUE-CREATE] Content Header:', savedMessage.content?.header);
      console.log('🔍 [QUEUE-CREATE] Content Footer:', savedMessage.content?.footer);
      console.log('🔍 [QUEUE-CREATE] Variables:', JSON.stringify(savedMessage.variables, null, 2));
      console.log('🔍 [QUEUE-CREATE] ===== FIM DO CONTEÚDO =====');
      
      // 🆕 LOG SIMPLES E VISÍVEL PARA RASTREAR
      console.log(`🚀 [CRIAÇÃO] MENSAGEM CRIADA: ID=${savedMessage._id}, Para=${savedMessage.to}, Trigger=${savedMessage.trigger}`);
      
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
          .sort({ priority: 1, queuePosition: 1, createdAt: -1 })
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
        // 🆕 CORREÇÃO: Incrementar attemptsCount também quando completar
        updateData.$inc = { attemptsCount: 1 };
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
      
      // 🆕 NOVO: Buscar mensagens com lógica de fallback sequencial
      const messages = await this.whatsappQueueModel
        .find({
          $or: [
            { status: QueueStatus.PENDING },
            {
              status: QueueStatus.RETRY,
              nextRetryAt: { $lte: now },
            },
          ],
          retryCount: { $lt: 1 }, // Máximo de 1 tentativa
        })
        .sort({ priority: 1, queuePosition: 1, createdAt: 1 })
        .limit(limit * 2) // Buscar mais mensagens para aplicar lógica de fallback
        .exec();

      // 🆕 NOVO: Aplicar lógica de fallback sequencial
      const processedMessages = this.applySequentialFallbackLogic(messages, limit);
      
      return processedMessages;
    } catch (error) {
      this.logger.error(`Erro ao buscar mensagens para processamento: ${error.message}`);
      throw error;
    }
  }

  // 🆕 NOVO: Método para aplicar lógica de fallback sequencial
  private applySequentialFallbackLogic(messages: WhatsAppQueue[], limit: number): WhatsAppQueue[] {
    try {
      const now = new Date();
      const result: WhatsAppQueue[] = [];
      const processedFlows = new Set<string>(); // Controlar fluxos já processados

      // Agrupar mensagens por fluxo e destinatário
      const flowGroups = new Map<string, WhatsAppQueue[]>();
      
      for (const message of messages) {
        const flowKey = `${message.flowId?.toString() || 'no-flow'}-${message.to}`;
        
        if (!flowGroups.has(flowKey)) {
          flowGroups.set(flowKey, []);
        }
        flowGroups.get(flowKey)!.push(message);
      }

      // Processar cada grupo de fluxo
      for (const [flowKey, flowMessages] of flowGroups) {
        if (result.length >= limit) break; // Limite atingido
        
        // Ordenar mensagens do fluxo por ordem (1, 2, 3...)
        const sortedMessages = flowMessages.sort((a, b) => {
          const orderA = (a.metadata as any)?.messageOrder || 0;
          const orderB = (b.metadata as any)?.messageOrder || 0;
          return orderA - orderB;
        });

        // Verificar se há mensagem agendada para agora
        let messageToProcess: WhatsAppQueue | null = null;
        
        for (const message of sortedMessages) {
          // Verificar se a mensagem está agendada para agora
          const scheduledFor = (message.metadata as any)?.scheduledFor;
          if (scheduledFor) {
            const scheduledTime = new Date(scheduledFor);
            if (scheduledTime <= now) {
              messageToProcess = message;
              break;
            }
          } else {
            // Mensagem sem agendamento, processar imediatamente
            messageToProcess = message;
            break;
          }
        }

        if (messageToProcess) {
          // Verificar se não excedeu o limite de tentativas
          if (messageToProcess.retryCount < (messageToProcess.maxRetries || 1)) {
            result.push(messageToProcess);
            processedFlows.add(flowKey);
            this.logger.log(`🔄 [FALLBACK] Mensagem selecionada para processamento: ${(messageToProcess as any)._id} (Ordem: ${(messageToProcess.metadata as any)?.messageOrder || 'N/A'})`);
          }
        }
      }

      this.logger.log(`🔄 [FALLBACK] ${result.length} mensagens selecionadas para processamento com lógica de fallback`);
      return result;

    } catch (error) {
      this.logger.error(`Erro ao aplicar lógica de fallback: ${error.message}`);
      // Em caso de erro, retornar mensagens originais limitadas
      return messages.slice(0, limit);
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

  /**
   * 🆕 NOVO: Corrigir mensagens existentes com attemptsCount incorreto
   * Atualiza mensagens COMPLETED para ter attemptsCount: 1
   */
  async fixExistingMessagesAttemptsCount(): Promise<{ fixed: number; errors: number }> {
    try {
      let fixed = 0;
      let errors = 0;

      // Buscar mensagens COMPLETED com attemptsCount: 0
      const messagesToFix = await this.whatsappQueueModel.find({
        status: QueueStatus.COMPLETED,
        attemptsCount: 0
      }).exec();

      for (const message of messagesToFix) {
        try {
          await this.whatsappQueueModel.findByIdAndUpdate(
            message._id,
            { attemptsCount: 1 }
          ).exec();
          fixed++;
        } catch (error) {
          this.logger.error(`Erro ao corrigir mensagem ${message._id}: ${error.message}`);
          errors++;
        }
      }

      this.logger.log(`Corrigidas ${fixed} mensagens com attemptsCount incorreto`);
      return { fixed, errors };
    } catch (error) {
      this.logger.error(`Erro ao corrigir mensagens existentes: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 NOVO: Resetar mensagens que falharam para reprocessamento
   * Útil para mensagens que atingiram maxRetries mas precisam ser reenviadas
   */
  async resetFailedMessages(messageIds?: string[]): Promise<{ reset: number; errors: number }> {
    try {
      let reset = 0;
      let errors = 0;

      if (messageIds && messageIds.length > 0) {
        // Resetar mensagens específicas
        for (const messageId of messageIds) {
          try {
            await this.whatsappQueueModel.findByIdAndUpdate(
              messageId,
              {
                status: QueueStatus.PENDING,
                retryCount: 0,
                attemptsCount: 0,
                nextRetryAt: null,
                lastAttemptAt: null,
                error: null,
                providerResponse: null
              }
            ).exec();
            reset++;
          } catch (error) {
            this.logger.error(`Erro ao resetar mensagem ${messageId}: ${error.message}`);
            errors++;
          }
        }
      } else {
        // Resetar todas as mensagens falhadas
        const result = await this.whatsappQueueModel.updateMany(
          {
            $or: [
              { status: QueueStatus.FAILED },
              { retryCount: { $gte: 1 } }
            ]
          },
          {
            status: QueueStatus.PENDING,
            retryCount: 0,
            attemptsCount: 0,
            nextRetryAt: null,
            lastAttemptAt: null,
            error: null,
            providerResponse: null
          }
        ).exec();

        reset = result.modifiedCount;
      }

      this.logger.log(`Resetadas ${reset} mensagens para reprocessamento`);
      return { reset, errors };
    } catch (error) {
      this.logger.error(`Erro ao resetar mensagens falhadas: ${error.message}`);
      throw error;
    }
  }
}
