import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WhatsAppClientConfig, WhatsAppClientConfigDocument } from '../entities/whatsapp-client-config.schema';

export interface CreateWhatsAppClientConfigDto {
  clientId: string;
  whatsappNumber: string;
  displayName: string;
  businessDescription?: string;
  settings?: {
    enableNotifications?: boolean;
    defaultLanguage?: string;
    timezone?: string;
    businessHours?: {
      start: string;
      end: string;
    };
    autoReply?: {
      enabled: boolean;
      message: string;
    };
  };
}

export interface UpdateWhatsAppClientConfigDto {
  whatsappNumber?: string;
  displayName?: string;
  businessDescription?: string;
  isActive?: boolean;
  settings?: {
    enableNotifications?: boolean;
    defaultLanguage?: string;
    timezone?: string;
    businessHours?: {
      start: string;
      end: string;
    };
    autoReply?: {
      enabled: boolean;
      message: string;
    };
  };
  tags?: string[];
}

@Injectable()
export class WhatsAppClientService {
  constructor(
    @InjectModel(WhatsAppClientConfig.name)
    private whatsAppClientConfigModel: Model<WhatsAppClientConfigDocument>,
  ) {}

  /**
   * Criar configuração de WhatsApp para um cliente
   */
  async createConfig(createDto: CreateWhatsAppClientConfigDto): Promise<WhatsAppClientConfig> {
    try {
      // Validar se já existe configuração para este cliente
      const existingConfig = await this.whatsAppClientConfigModel.findOne({
        clientId: new Types.ObjectId(createDto.clientId)
      });

      if (existingConfig) {
        throw new ConflictException('Cliente já possui configuração de WhatsApp');
      }

      // Validar se o número já está sendo usado por outro cliente
      const existingNumber = await this.whatsAppClientConfigModel.findOne({
        whatsappNumber: createDto.whatsappNumber
      });

      if (existingNumber) {
        throw new ConflictException('Número de WhatsApp já está sendo usado por outro cliente');
      }

      // Validar formato do número
      this.validatePhoneNumber(createDto.whatsappNumber);

      const config = new this.whatsAppClientConfigModel({
        ...createDto,
        clientId: new Types.ObjectId(createDto.clientId),
        isActive: false, // Inicialmente inativo até verificação
        isVerified: false,
        statistics: {
          totalMessagesSent: 0,
          totalMessagesDelivered: 0,
          totalMessagesFailed: 0,
          monthlyUsage: {
            current: 0,
            limit: 1000
          }
        }
      });

      return await config.save();
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao criar configuração de WhatsApp');
    }
  }

  /**
   * Buscar configuração de WhatsApp por cliente
   */
  async getConfigByClientId(clientId: string): Promise<WhatsAppClientConfig> {
    try {
      const config = await this.whatsAppClientConfigModel.findOne({
        clientId: new Types.ObjectId(clientId)
      }).exec();

      if (!config) {
        throw new NotFoundException('Configuração de WhatsApp não encontrada para este cliente');
      }

      return config;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao buscar configuração de WhatsApp');
    }
  }

  /**
   * Atualizar configuração de WhatsApp
   */
  async updateConfig(clientId: string, updateDto: UpdateWhatsAppClientConfigDto): Promise<WhatsAppClientConfig> {
    try {
      // Validar se a configuração existe
      const existingConfig = await this.getConfigByClientId(clientId);

      // Se estiver atualizando o número, validar se não está sendo usado por outro cliente
      if (updateDto.whatsappNumber && updateDto.whatsappNumber !== existingConfig.whatsappNumber) {
        const existingNumber = await this.whatsAppClientConfigModel.findOne({
          whatsappNumber: updateDto.whatsappNumber,
          clientId: { $ne: new Types.ObjectId(clientId) }
        });

        if (existingNumber) {
          throw new ConflictException('Número de WhatsApp já está sendo usado por outro cliente');
        }

        // Validar formato do novo número
        this.validatePhoneNumber(updateDto.whatsappNumber);
      }

      const updatedConfig = await this.whatsAppClientConfigModel.findOneAndUpdate(
        { clientId: new Types.ObjectId(clientId) },
        { $set: updateDto },
        { new: true, runValidators: true }
      ).exec();

      if (!updatedConfig) {
        throw new NotFoundException('Configuração de WhatsApp não encontrada');
      }

      return updatedConfig;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao atualizar configuração de WhatsApp');
    }
  }

  /**
   * Ativar/Desativar configuração de WhatsApp
   */
  async toggleActive(clientId: string, isActive: boolean): Promise<WhatsAppClientConfig> {
    try {
      const config = await this.getConfigByClientId(clientId);

      // Só pode ativar se estiver verificado
      if (isActive && !config.isVerified) {
        throw new BadRequestException('Não é possível ativar configuração não verificada');
      }

      const updatedConfig = await this.whatsAppClientConfigModel.findOneAndUpdate(
        { clientId: new Types.ObjectId(clientId) },
        { $set: { isActive } },
        { new: true }
      ).exec();

      return updatedConfig;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao alterar status da configuração');
    }
  }

  /**
   * Verificar número de WhatsApp
   */
  async verifyNumber(clientId: string): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getConfigByClientId(clientId);

      // Aqui seria feita a verificação real com a API do WhatsApp
      // Por enquanto, simulamos uma verificação bem-sucedida
      const isVerified = await this.performWhatsAppVerification(config.whatsappNumber);

      if (isVerified) {
        await this.whatsAppClientConfigModel.findOneAndUpdate(
          { clientId: new Types.ObjectId(clientId) },
          { 
            $set: { 
              isVerified: true,
              verifiedAt: new Date(),
              'verification.status': 'approved',
              'verification.approvedAt': new Date()
            }
          }
        ).exec();

        return {
          success: true,
          message: 'Número de WhatsApp verificado com sucesso'
        };
      } else {
        await this.whatsAppClientConfigModel.findOneAndUpdate(
          { clientId: new Types.ObjectId(clientId) },
          { 
            $set: { 
              'verification.status': 'rejected',
              'verification.rejectedAt': new Date(),
              'verification.rejectionReason': 'Falha na verificação do número'
            }
          }
        ).exec();

        return {
          success: false,
          message: 'Falha na verificação do número de WhatsApp'
        };
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao verificar número de WhatsApp');
    }
  }

  /**
   * Buscar estatísticas de uso
   */
  async getStatistics(clientId: string): Promise<any> {
    try {
      const config = await this.getConfigByClientId(clientId);
      
      return {
        clientId: config.clientId,
        whatsappNumber: config.whatsappNumber,
        isActive: config.isActive,
        isVerified: config.isVerified,
        statistics: config.statistics,
        monthlyUsage: config.statistics?.monthlyUsage,
        lastMessageSentAt: config.statistics?.lastMessageSentAt
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao buscar estatísticas');
    }
  }

  /**
   * Atualizar estatísticas de mensagem
   */
  async updateMessageStatistics(clientId: string, messageStatus: 'sent' | 'delivered' | 'failed'): Promise<void> {
    try {
      const updateData: any = {
        [`statistics.totalMessages${messageStatus.charAt(0).toUpperCase() + messageStatus.slice(1)}`]: 1,
        'statistics.lastMessageSentAt': new Date()
      };

      if (messageStatus === 'sent') {
        updateData['statistics.monthlyUsage.current'] = 1;
      }

      await this.whatsAppClientConfigModel.findOneAndUpdate(
        { clientId: new Types.ObjectId(clientId) },
        { $inc: updateData }
      ).exec();
    } catch (error) {
      console.error('Erro ao atualizar estatísticas de mensagem:', error);
    }
  }

  /**
   * Listar todas as configurações (para admin)
   */
  async getAllConfigs(filters?: {
    isActive?: boolean;
    isVerified?: boolean;
    search?: string;
  }): Promise<WhatsAppClientConfig[]> {
    try {
      const query: any = {};

      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters?.isVerified !== undefined) {
        query.isVerified = filters.isVerified;
      }

      if (filters?.search) {
        query.$or = [
          { whatsappNumber: { $regex: filters.search, $options: 'i' } },
          { displayName: { $regex: filters.search, $options: 'i' } },
          { businessDescription: { $regex: filters.search, $options: 'i' } }
        ];
      }

      return await this.whatsAppClientConfigModel.find(query)
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new BadRequestException('Erro ao buscar configurações');
    }
  }

  /**
   * Deletar configuração de WhatsApp
   */
  async deleteConfig(clientId: string): Promise<void> {
    try {
      const result = await this.whatsAppClientConfigModel.deleteOne({
        clientId: new Types.ObjectId(clientId)
      }).exec();

      if (result.deletedCount === 0) {
        throw new NotFoundException('Configuração de WhatsApp não encontrada');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao deletar configuração');
    }
  }

  /**
   * Validar formato do número de telefone
   */
  private validatePhoneNumber(phoneNumber: string): void {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new BadRequestException('Número de WhatsApp deve estar no formato internacional (+5511999999999)');
    }
  }

  /**
   * Simular verificação com API do WhatsApp
   */
  private async performWhatsAppVerification(phoneNumber: string): Promise<boolean> {
    // Aqui seria feita a verificação real com a API do WhatsApp
    // Por enquanto, simulamos uma verificação bem-sucedida
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simula 90% de sucesso na verificação
        resolve(Math.random() > 0.1);
      }, 2000);
    });
  }
} 