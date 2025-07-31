import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as twilio from 'twilio';
import axios from 'axios';
import { WhatsAppConfig, WhatsAppConfigDocument } from '../entities/whatsapp-config.schema';
import { WhatsAppMessage, WhatsAppMessageDocument } from '../entities/whatsapp-message.schema';

@Injectable()
export class WhatsAppAdminService {
  constructor(
    @InjectModel(WhatsAppConfig.name) private whatsappConfigModel: Model<WhatsAppConfigDocument>,
    @InjectModel(WhatsAppMessage.name) private whatsappMessageModel: Model<WhatsAppMessageDocument>,
  ) {}

  async getConfig(): Promise<any> {
    let config = await this.whatsappConfigModel.findOne().exec();
    
    if (!config) {
      // Retorna configuração padrão se não existir
      return {
        provider: 'twilio',
        credentials: {},
        globalSettings: {
          rateLimitPerMinute: 30,
          sendTimeStart: '08:00',
          sendTimeEnd: '20:00',
          timezone: 'America/Sao_Paulo',
          enableWebhooks: true
        },
        status: {
          connected: false,
          messagesToday: 0,
          dailyLimit: 1000,
          activeClients: 0,
          totalTemplates: 0
        }
      };
    }

    return config.toObject();
  }

  async saveConfig(configData: any): Promise<any> {
    const { provider, credentials, globalSettings } = configData;

    // Validações básicas
    if (!provider || !['twilio', 'meta', '360dialog'].includes(provider)) {
      throw new Error('Provedor inválido');
    }

    // Valida credenciais específicas do provedor
    this.validateProviderCredentials(provider, credentials);

    // Busca configuração existente ou cria nova
    let config = await this.whatsappConfigModel.findOne().exec();
    
    if (!config) {
      config = new this.whatsappConfigModel();
    }

    // Atualiza configuração
    config.provider = provider;
    config.credentials = credentials;
    config.globalSettings = {
      rateLimitPerMinute: globalSettings.rateLimitPerMinute || 30,
      sendTimeStart: globalSettings.sendTimeStart || '08:00',
      sendTimeEnd: globalSettings.sendTimeEnd || '20:00',
      timezone: globalSettings.timezone || 'America/Sao_Paulo',
      enableWebhooks: globalSettings.enableWebhooks !== false
    };

    // Testa conexão se credenciais foram fornecidas
    if (this.hasValidCredentials(provider, credentials)) {
      try {
        const isConnected = await this.testProviderConnection(provider, credentials);
        config.status = {
          ...config.status,
          connected: isConnected,
          messagesToday: await this.getMessagesToday(),
          dailyLimit: this.getDailyLimit(provider),
          activeClients: await this.getActiveClients(),
          totalTemplates: await this.getTotalTemplates()
        };
      } catch (error) {
        config.status = {
          ...config.status,
          connected: false
        };
      }
    } else {
      config.status = {
        ...config.status,
        connected: false
      };
    }

    await config.save();
    return config.toObject();
  }

  async testConnection(testData: any): Promise<any> {
    const { phoneNumber, provider, credentials } = testData;
    
    if (!phoneNumber) {
      throw new Error('Número de telefone de teste é obrigatório');
    }

    // Valida formato do telefone
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error('Formato de telefone inválido');
    }

    // Valida credenciais
    if (!provider || !credentials) {
      throw new Error('Provedor e credenciais são obrigatórios');
    }

    try {
      // Testa conexão com o provedor
      const isConnected = await this.testProviderConnection(provider, credentials);
      
      if (!isConnected) {
        throw new Error('Falha na conexão com o provedor WhatsApp');
      }

      // Envia mensagem de teste
      const testMessage = await this.sendTestMessage(phoneNumber, { provider, credentials });
      
      return {
        success: true,
        message: 'Mensagem de teste enviada com sucesso',
        messageId: testMessage.providerResponse?.messageId,
        status: testMessage.status
      };
    } catch (error) {
      console.error('Error in testConnection:', error);
      throw new Error(`Erro ao testar conexão WhatsApp: ${error.message}`);
    }
  }

  async getStatus(): Promise<any> {
    const config = await this.getConfig();
    
    // Atualiza estatísticas
    const updatedStatus = {
      connected: config.status?.connected || false,
      messagesToday: await this.getMessagesToday(),
      dailyLimit: this.getDailyLimit(config.provider),
      activeClients: await this.getActiveClients(),
      totalTemplates: await this.getTotalTemplates()
    };

    // Atualiza status no banco se houver mudanças
    if (config._id) {
      await this.whatsappConfigModel.updateOne(
        { _id: config._id },
        { $set: { status: updatedStatus } }
      );
    }

    return updatedStatus;
  }

  private validateProviderCredentials(provider: string, credentials: any): void {
    switch (provider) {
      case 'twilio':
        if (!credentials.accountSid || !credentials.authToken) {
          throw new Error('Account SID e Auth Token são obrigatórios para Twilio');
        }
        break;
      case 'meta':
        if (!credentials.accessToken || !credentials.phoneNumberId) {
          throw new Error('Access Token e Phone Number ID são obrigatórios para Meta');
        }
        break;
      case '360dialog':
        if (!credentials.apiKey || !credentials.instanceId) {
          throw new Error('API Key e Instance ID são obrigatórios para 360dialog');
        }
        break;
    }
  }

  private hasValidCredentials(provider: string, credentials: any): boolean {
    try {
      this.validateProviderCredentials(provider, credentials);
      return true;
    } catch {
      return false;
    }
  }

  private async testProviderConnection(provider: string, credentials: any): Promise<boolean> {
    try {
      switch (provider) {
        case 'twilio':
          return await this.testTwilioConnection(credentials);
        case 'meta':
          return await this.testMetaConnection(credentials);
        case '360dialog':
          return await this.test360DialogConnection(credentials);
        default:
          throw new Error(`Provedor não suportado: ${provider}`);
      }
    } catch (error) {
      console.error(`Erro ao testar conexão com ${provider}:`, error.message);
      return false;
    }
  }

  private async sendTestMessage(phoneNumber: string, config: any): Promise<any> {
    const { provider, credentials } = config;
    
    try {
      let messageId: string;
      let status: string;

      switch (provider) {
        case 'twilio':
          const twilioResult = await this.sendTwilioMessage(phoneNumber, credentials);
          messageId = twilioResult.sid;
          status = twilioResult.status;
          break;
        case 'meta':
          const metaResult = await this.sendMetaMessage(phoneNumber, credentials);
          messageId = metaResult.id;
          status = metaResult.status;
          break;
        case '360dialog':
          const dialogResult = await this.send360DialogMessage(phoneNumber, credentials);
          messageId = dialogResult.message_id;
          status = dialogResult.status;
          break;
        default:
          throw new Error(`Provedor não suportado: ${provider}`);
      }

      // Salva mensagem no banco
      const testMessage = new this.whatsappMessageModel({
        clientId: null, // Mensagem administrativa
        to: phoneNumber,
        from: credentials.whatsappNumber || 'admin',
        content: {
          body: 'Teste de conectividade WhatsApp - Sistema de Indicação'
        },
        status: 'sent',
        providerResponse: {
          messageId,
          status,
          provider
        }
      });

      await testMessage.save();
      return testMessage.toObject();
    } catch (error) {
      console.error('Erro ao enviar mensagem de teste:', error.message);
      throw error;
    }
  }

  // Implementações específicas por provedor
  private async testTwilioConnection(credentials: any): Promise<boolean> {
    try {
      const client = twilio(credentials.accountSid, credentials.authToken);
      
      // Testa conectividade buscando informações da conta
      const account = await client.api.accounts(credentials.accountSid).fetch();
      return !!account.sid;
    } catch (error) {
      console.error('Erro ao testar conexão Twilio:', error.message);
      return false;
    }
  }

  private async testMetaConnection(credentials: any): Promise<boolean> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.status === 200;
    } catch (error) {
      console.error('Erro ao testar conexão Meta:', error.message);
      return false;
    }
  }

  private async test360DialogConnection(credentials: any): Promise<boolean> {
    try {
      const response = await axios.get(
        `https://waba.360dialog.io/v1/instances/${credentials.instanceId}`,
        {
          headers: {
            'D360-API-KEY': credentials.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.status === 200;
    } catch (error) {
      console.error('Erro ao testar conexão 360dialog:', error.message);
      return false;
    }
  }

  private async sendTwilioMessage(phoneNumber: string, credentials: any): Promise<any> {
    try {
      console.log('Enviando mensagem Twilio para:', phoneNumber);
      console.log('Credenciais:', { accountSid: credentials.accountSid, whatsappNumber: credentials.whatsappNumber });
      
      // Validações específicas para Twilio
      if (!credentials.whatsappNumber) {
        throw new Error('Número WhatsApp não configurado');
      }

      // Formatar número de telefone para Twilio
      const formattedPhone = this.formatPhoneForTwilio(phoneNumber);
      console.log('Telefone formatado:', formattedPhone);
      
      const client = twilio(credentials.accountSid, credentials.authToken);
      
      const message = await client.messages.create({
        body: 'Teste de conectividade WhatsApp - Sistema de Indicação',
        from: `whatsapp:${credentials.whatsappNumber}`,
        to: `whatsapp:${formattedPhone}`
      });

      console.log('Mensagem Twilio enviada:', message.sid);
      
      return {
        sid: message.sid,
        status: message.status
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem Twilio:', error);
      console.error('Detalhes do erro:', {
        code: error.code,
        message: error.message,
        moreInfo: error.moreInfo,
        status: error.status
      });

      // Tratamento específico para erro 540
      if (error.code === 540) {
        throw new Error(`Erro 540: Número não verificado no sandbox. Envie "join <palavra-chave>" para ${credentials.whatsappNumber} no WhatsApp`);
      }

      // Outros erros comuns
      if (error.code === 21211) {
        throw new Error('Número de telefone inválido');
      }
      if (error.code === 21214) {
        throw new Error('Número não está no sandbox do WhatsApp');
      }

      throw new Error(`Erro Twilio: ${error.message} (${error.code})`);
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

  private async sendMetaMessage(phoneNumber: string, credentials: any): Promise<any> {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: 'Teste de conectividade WhatsApp - Sistema de Indicação'
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

  private async send360DialogMessage(phoneNumber: string, credentials: any): Promise<any> {
    const response = await axios.post(
      `https://waba.360dialog.io/v1/instances/${credentials.instanceId}/messages`,
      {
        to: phoneNumber,
        type: 'text',
        text: {
          body: 'Teste de conectividade WhatsApp - Sistema de Indicação'
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

  private isValidPhoneNumber(phone: string): boolean {
    // Validação mais específica para Twilio
    const phoneRegex = /^\+[1-9]\d{10,14}$/;
    const isValid = phoneRegex.test(phone);
    
    if (!isValid) {
      console.log('Telefone inválido:', phone);
    }
    
    return isValid;
  }

  private async getMessagesToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const count = await this.whatsappMessageModel.countDocuments({
      createdAt: { $gte: today }
    });
    
    return count;
  }

  private getDailyLimit(provider: string): number {
    const limits = {
      twilio: 1000,
      meta: 250,
      '360dialog': 1000
    };
    return limits[provider] || 1000;
  }

  private async getActiveClients(): Promise<number> {
    // TODO: Implementar contagem de clientes ativos
    return 0;
  }

  private async getTotalTemplates(): Promise<number> {
    // TODO: Implementar contagem de templates
    return 0;
  }
} 