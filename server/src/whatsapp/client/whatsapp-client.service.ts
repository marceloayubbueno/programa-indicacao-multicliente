import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WhatsAppClientConfig, WhatsAppClientConfigDocument } from '../entities/whatsapp-client-config.schema';
import { WhatsAppMessage, WhatsAppMessageDocument } from '../entities/whatsapp-message.schema';
import { InjectModel as InjectAdminModel } from '@nestjs/mongoose';
import { Model as AdminModel } from 'mongoose';
import { WhatsAppConfig, WhatsAppConfigDocument } from '../entities/whatsapp-config.schema';
import axios from 'axios';

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
   * Enviar mensagem de teste
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

      // Obter configuração global do Gupshup
      const globalConfig = await this.whatsappConfigModel.findOne();
      if (!globalConfig?.gupshupConfig?.isConnected) {
        throw new BadRequestException('API Gupshup não está configurada');
      }

      // Enviar mensagem via Gupshup
      const response = await this.sendMessageViaGupshup(messageData, globalConfig.gupshupConfig);

      // Salvar mensagem no histórico
      await this.saveMessageToHistory(clientId, messageData, response);

      return {
        success: true,
        message: 'Mensagem enviada com sucesso',
        messageId: response.messageId
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
   * Enviar mensagem via Gupshup
   */
  private async sendMessageViaGupshup(messageData: { to: string; message: string }, gupshupConfig: any): Promise<any> {
    try {
      const url = 'https://api.gupshup.io/wa/api/v1/msg';
      const payload = {
        channel: 'whatsapp',
        source: gupshupConfig.sourceNumber,
        destination: messageData.to,
        message: JSON.stringify({
          type: 'text',
          text: messageData.message
        }),
        'src.name': gupshupConfig.appName
      };

      const response = await axios.post(url, payload, {
          headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apikey': gupshupConfig.apiKey
          }
      });
      
        return {
        messageId: response.data.messageId,
        status: 'sent'
      };
    } catch (error) {
      throw new Error('Erro ao enviar mensagem via Gupshup: ' + error.message);
    }
  }

  /**
   * Salvar mensagem no histórico
   */
  private async saveMessageToHistory(clientId: string, messageData: { to: string; message: string }, response: any): Promise<void> {
    try {
      const message = new this.whatsappMessageModel({
        clientId: new Types.ObjectId(clientId),
        to: messageData.to,
        from: 'Gupshup',
        content: {
          body: messageData.message
        },
        status: 'sent',
        providerResponse: {
          messageId: response.messageId,
          status: response.status,
          provider: 'Gupshup'
        }
      });

      await message.save();
    } catch (error) {
      console.error('Erro ao salvar mensagem no histórico:', error);
    }
  }
} 