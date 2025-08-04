import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WhatsAppClientConfig, WhatsAppClientConfigDocument } from '../entities/whatsapp-client-config.schema';
import { WhatsAppMessage, WhatsAppMessageDocument } from '../entities/whatsapp-message.schema';
import { InjectModel as InjectAdminModel } from '@nestjs/mongoose';
import { Model as AdminModel } from 'mongoose';
import { WhatsAppConfig, WhatsAppConfigDocument } from '../entities/whatsapp-config.schema';
import * as twilio from 'twilio';
import axios from 'axios';

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

      if (!updatedConfig) {
        throw new NotFoundException('Configuração de WhatsApp não encontrada');
      }

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
   * Verificar configuração de WhatsApp (alias para verifyNumber)
   */
  async verifyConfig(clientId: string): Promise<{ success: boolean; message: string }> {
    return this.verifyNumber(clientId);
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

  async sendTestMessage(clientId: string, messageData: any) {
    try {
      console.log('=== CLIENT SERVICE: ENVIO DE MENSAGEM DE TESTE ===');
      console.log('ClientId:', clientId);
      console.log('Dados da mensagem:', JSON.stringify(messageData, null, 2));
      
      const { to, message } = messageData;
      
      // Validar dados
      if (!to || !message) {
        throw new Error('Número de destino e mensagem são obrigatórios');
      }
      
      // Validar formato do número
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(to)) {
        throw new Error('Formato de telefone inválido');
      }
      
      // Buscar configuração do cliente
      const clientConfig = await this.whatsAppClientConfigModel.findOne({ 
        clientId: new Types.ObjectId(clientId) 
      }).exec();
      if (!clientConfig) {
        throw new Error('Configuração de WhatsApp não encontrada');
      }
      
      if (!clientConfig.isActive) {
        throw new Error('Configuração de WhatsApp não está ativa');
      }
      
      console.log('Configuração do cliente encontrada:', clientConfig);
      
      // Buscar configuração global do admin
      const adminConfig = await this.whatsappConfigModel.findOne().exec();
      if (!adminConfig) {
        throw new Error('Configuração global de WhatsApp não encontrada');
      }
      
      console.log('Configuração admin encontrada:', adminConfig);
      
      // Enviar mensagem usando o provedor configurado
      const result = await this.sendMessage({
        to: to.trim().replace(/\s+/g, ''),
        message: message,
        from: clientConfig.whatsappNumber,
        clientId: clientId
      });
      
      console.log('=== CLIENT SERVICE: MENSAGEM ENVIADA COM SUCESSO ===');
      console.log('Resultado:', result);
      
      return {
        success: true,
        message: 'Mensagem de teste enviada com sucesso',
        data: {
          messageId: result.messageId || 'unknown',
          to: to,
          status: result.status || 'sent',
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('=== CLIENT SERVICE: ERRO NO ENVIO ===');
      console.error('Erro:', error);
      throw error;
    }
  }

  private async sendMessage(messageData: any) {
    const { to, message, from, clientId } = messageData;
    
    try {
      let messageId: string;
      let status: string;

      // Buscar configuração global do admin
      const adminConfig = await this.whatsappConfigModel.findOne().exec();
      if (!adminConfig) {
        throw new Error('Configuração global de WhatsApp não encontrada');
      }

      // Enviar mensagem usando o provedor configurado
      switch (adminConfig.provider) {
        case 'twilio':
          const twilioResult = await this.sendTwilioMessage(to, adminConfig.credentials, message);
          messageId = twilioResult.sid;
          status = twilioResult.status;
          break;
        case 'meta':
          const metaResult = await this.sendMetaMessage(to, adminConfig.credentials, message);
          messageId = metaResult.id;
          status = metaResult.status;
          break;
        case '360dialog':
          const dialogResult = await this.send360DialogMessage(to, adminConfig.credentials, message);
          messageId = dialogResult.message_id;
          status = dialogResult.status;
          break;
        default:
          throw new Error(`Provedor não suportado: ${adminConfig.provider}`);
      }

      // Salva mensagem no banco
      const testMessage = new this.whatsappMessageModel({
        clientId: clientId,
        to: to,
        from: from || 'client',
        content: {
          body: message
        },
        status: status || 'sent',
        providerResponse: {
          messageId,
          status,
          provider: adminConfig.provider
        },
        sentAt: new Date()
      });

      const savedMessage = await testMessage.save();
      console.log('Mensagem salva no banco:', savedMessage._id);
      
      return {
        messageId: messageId || savedMessage._id.toString(),
        status: status || 'sent',
        provider: adminConfig.provider
      };
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Implementações específicas por provedor (copiadas do admin service)
  private async sendTwilioMessage(phoneNumber: string, credentials: any, messageText?: string): Promise<any> {
    try {
      console.log('=== INÍCIO ENVIO TWILIO (CLIENT) ===');
      console.log('Telefone de destino:', phoneNumber);
      console.log('Número WhatsApp configurado:', credentials.whatsappNumber);
      console.log('Mensagem a ser enviada:', messageText);
      
      // Validações específicas para Twilio
      if (!credentials.whatsappNumber) {
        throw new Error('Número WhatsApp não configurado');
      }

      if (!credentials.accountSid || !credentials.authToken) {
        throw new Error('Credenciais Twilio incompletas');
      }

      // Formatar número de telefone para Twilio
      const formattedPhone = this.formatPhoneForTwilio(phoneNumber);
      console.log('Telefone formatado para Twilio:', formattedPhone);
      
      const client = twilio(credentials.accountSid, credentials.authToken);
      
      // Usar mensagem personalizada ou padrão
      const messageBody = messageText || 'Teste de conectividade WhatsApp - Sistema de Indicação';
      
      console.log('Enviando mensagem...');
      const message = await client.messages.create({
        body: messageBody,
        from: `whatsapp:${credentials.whatsappNumber}`,
        to: `whatsapp:${formattedPhone}`
      });

      console.log('Mensagem Twilio enviada com sucesso!');
      console.log('Message SID:', message.sid);
      console.log('Status:', message.status);
      console.log('=== FIM ENVIO TWILIO (CLIENT) ===');
      
      return {
        sid: message.sid,
        status: message.status
      };
    } catch (error) {
      console.error('=== ERRO TWILIO (CLIENT) ===');
      console.error('Erro:', error);
      throw error;
    }
  }

  private formatPhoneForTwilio(phone: string): string {
    // Remove todos os caracteres não numéricos exceto +
    let formatted = phone.replace(/[^\d+]/g, '');
    
    // Garante que começa com +
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    
    // Remove zeros extras após o código do país
    formatted = formatted.replace(/^\+(\d{1,3})0+/, '+$1');
    
    return formatted;
  }

  private async sendMetaMessage(phoneNumber: string, credentials: any, messageText?: string): Promise<any> {
    const messageBody = messageText || 'Teste de conectividade WhatsApp - Sistema de Indicação';
    
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: messageBody
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      id: response.data.messages[0].id,
      status: 'sent'
    };
  }

  private async send360DialogMessage(phoneNumber: string, credentials: any, messageText?: string): Promise<any> {
    const messageBody = messageText || 'Teste de conectividade WhatsApp - Sistema de Indicação';
    
    const response = await axios.post(
      `https://waba.360dialog.io/v1/instances/${credentials.instanceId}/messages`,
      {
        to: phoneNumber,
        type: 'text',
        text: {
          body: messageBody
        }
      },
      {
        headers: {
          'D360-API-KEY': credentials.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      message_id: response.data.messages[0].id,
      status: 'sent'
    };
  }
} 