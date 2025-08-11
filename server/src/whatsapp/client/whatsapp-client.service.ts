import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WhatsAppClientConfig, WhatsAppClientConfigDocument } from '../entities/whatsapp-client-config.schema';
import { WhatsAppMessage, WhatsAppMessageDocument } from '../entities/whatsapp-message.schema';
import { InjectModel as InjectAdminModel } from '@nestjs/mongoose';
import { Model as AdminModel } from 'mongoose';
import { WhatsAppConfig, WhatsAppConfigDocument } from '../entities/whatsapp-config.schema';
import { TwilioService } from '../providers/twilio.service';

export interface CreateWhatsAppClientConfigDto {
  clientId: string;
  displayName: string;
  businessDescription?: string;
}

export interface UpdateWhatsAppClientConfigDto {
  displayName?: string;
  businessDescription?: string;
  isActive?: boolean;
}

@Injectable()
export class WhatsAppClientService {
  constructor(
    @InjectModel(WhatsAppClientConfig.name)
    private whatsAppClientConfigModel: Model<WhatsAppClientConfigDocument>,
    @InjectAdminModel(WhatsAppConfig.name)
    private whatsappConfigModel: AdminModel<WhatsAppConfigDocument>,
    @InjectAdminModel(WhatsAppMessage.name)
    private whatsappMessageModel: Model<WhatsAppMessageDocument>,
    private twilioService: TwilioService, // ✅ Integração com Twilio
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

      // Criar nova configuração
      const newConfig = new this.whatsAppClientConfigModel({
        clientId: new Types.ObjectId(createDto.clientId),
        displayName: createDto.displayName,
        businessDescription: createDto.businessDescription,
        isActive: true,
        isVerified: true
      });

      return await newConfig.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Erro ao criar configuração: ' + error.message);
    }
  }

  /**
   * Obter configuração de WhatsApp por clientId
   */
  async getConfigByClientId(clientId: string): Promise<WhatsAppClientConfigDocument | null> {
    try {
      const config = await this.whatsAppClientConfigModel.findOne({
        clientId: new Types.ObjectId(clientId)
      });

      return config; // Retorna null se não encontrar
    } catch (error) {
      throw new BadRequestException('Erro ao buscar configuração: ' + error.message);
    }
  }

  /**
   * Atualizar configuração de WhatsApp
   */
  async updateConfig(clientId: string, updateDto: UpdateWhatsAppClientConfigDto): Promise<WhatsAppClientConfigDocument> {
    try {
      const config = await this.whatsAppClientConfigModel.findOne({
        clientId: new Types.ObjectId(clientId)
      });

      if (!config) {
        throw new NotFoundException('Configuração de WhatsApp não encontrada para este cliente');
      }

      // Atualizar campos
      if (updateDto.displayName !== undefined) {
        config.displayName = updateDto.displayName;
      }
      if (updateDto.businessDescription !== undefined) {
        config.businessDescription = updateDto.businessDescription;
      }
      if (updateDto.isActive !== undefined) {
        config.isActive = updateDto.isActive;
      }

      return await config.save();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao atualizar configuração: ' + error.message);
    }
  }

  /**
   * Enviar mensagem de teste - AGORA USANDO TWILIO ✅
   */
  async sendTestMessage(clientId: string, messageData: { to: string; message: string }): Promise<any> {
    try {
      // Verificar se o cliente tem configuração
      const config = await this.getConfigByClientId(clientId);
      if (!config) {
        throw new BadRequestException('Configuração de WhatsApp não encontrada para este cliente');
      }
      if (!config.isActive) {
        throw new BadRequestException('Configuração de WhatsApp não está ativa');
      }

      // ✅ USAR TWILIO SERVICE - MÁXIMO REAPROVEITAMENTO
      const twilioResponse = await this.twilioService.sendTestMessage({
        to: messageData.to,
        message: messageData.message
      });

      if (!twilioResponse.success) {
        throw new BadRequestException(twilioResponse.message);
      }

      // Salvar mensagem no histórico
      await this.saveMessageToHistory(clientId, messageData, {
        messageId: twilioResponse.sid,
        status: 'sent',
        provider: 'Twilio'
      });

      return {
        success: true,
        message: 'Mensagem enviada com sucesso via Twilio',
        messageId: twilioResponse.sid
      };
    } catch (error) {
      throw new BadRequestException('Erro ao enviar mensagem: ' + error.message);
    }
  }

  /**
   * Obter histórico de mensagens do cliente
   */
  async getMessageHistory(clientId: string): Promise<WhatsAppMessage[]> {
    try {
      const messages = await this.whatsappMessageModel
        .find({ clientId: new Types.ObjectId(clientId) })
        .sort({ createdAt: -1 })
        .limit(50);

      return messages;
    } catch (error) {
      throw new BadRequestException('Erro ao buscar histórico: ' + error.message);
    }
  }

  /**
   * ✅ NOVO: Verificar status da plataforma WhatsApp
   */
  async getPlatformStatus(): Promise<{ isActive: boolean; provider: string; lastTest?: Date }> {
    try {
      const twilioStatus = await this.twilioService.getStatus();
      
      return {
        isActive: twilioStatus.isActive,
        provider: 'Twilio',
        lastTest: twilioStatus.lastTest || undefined
      };
    } catch (error) {
      return {
        isActive: false,
        provider: 'Twilio',
        lastTest: undefined
      };
    }
  }

  /**
   * ✅ NOVO: Enviar mensagem genérica (flexível para múltiplos providers)
   */
  async sendMessage(clientId: string, messageData: { to: string; message: string; provider?: string }): Promise<any> {
    try {
      // Verificar se o cliente tem configuração
      const config = await this.getConfigByClientId(clientId);
      if (!config) {
        throw new BadRequestException('Configuração de WhatsApp não encontrada para este cliente');
      }
      if (!config.isActive) {
        throw new BadRequestException('Configuração de WhatsApp não está ativa');
      }

      // Por padrão, usar Twilio (provider ativo)
      const provider = messageData.provider || 'twilio';
      
      if (provider === 'twilio') {
        const response = await this.twilioService.sendTestMessage({
          to: messageData.to,
          message: messageData.message
        });

        if (!response.success) {
          throw new BadRequestException(response.message);
        }

        // Salvar no histórico
        await this.saveMessageToHistory(clientId, messageData, {
          messageId: response.sid,
          status: 'sent',
          provider: 'Twilio'
        });

        return {
          success: true,
          message: 'Mensagem enviada com sucesso via Twilio',
          messageId: response.sid,
          provider: 'Twilio'
        };
      }

      // ✅ FUTURO: Adicionar outros providers aqui
      throw new BadRequestException(`Provider ${provider} não suportado ainda`);
      
    } catch (error) {
      throw new BadRequestException('Erro ao enviar mensagem: ' + error.message);
    }
  }

  /**
   * Salvar mensagem no histórico - ADAPTADO PARA MULTI-PROVIDER ✅
   */
  private async saveMessageToHistory(clientId: string, messageData: { to: string; message: string }, response: any): Promise<void> {
    try {
      const message = new this.whatsappMessageModel({
        clientId: new Types.ObjectId(clientId),
        to: messageData.to,
        from: response.provider || 'Twilio', // ✅ Flexível
        content: {
          body: messageData.message
        },
        status: 'sent',
        providerResponse: {
          messageId: response.messageId,
          status: response.status,
          provider: response.provider || 'Twilio'
        }
      });

      await message.save();
    } catch (error) {
      console.error('Erro ao salvar mensagem no histórico:', error);
    }
  }
} 