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
        provider: 'whatsapp-business',
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
    const { credentials, globalSettings } = configData;

    // Validações básicas
    if (!credentials) {
      throw new Error('Credenciais são obrigatórias');
    }

    // Valida credenciais do WhatsApp Business API
    this.validateWhatsAppBusinessCredentials(credentials);

    // Busca configuração existente ou cria nova
    let config = await this.whatsappConfigModel.findOne().exec();
    
    if (!config) {
      config = new this.whatsappConfigModel();
    }

    // Atualiza configuração
    config.provider = 'whatsapp-business';
    config.credentials = credentials;
    config.globalSettings = {
      rateLimitPerMinute: globalSettings.rateLimitPerMinute || 30,
      sendTimeStart: globalSettings.sendTimeStart || '08:00',
      sendTimeEnd: globalSettings.sendTimeEnd || '20:00',
      timezone: globalSettings.timezone || 'America/Sao_Paulo',
      enableWebhooks: globalSettings.enableWebhooks !== false
    };

    // Testa conexão se credenciais foram fornecidas
    if (this.hasValidWhatsAppBusinessCredentials(credentials)) {
      try {
        const isConnected = await this.testWhatsAppBusinessConnection(credentials);
        config.status = {
          ...config.status,
          connected: isConnected,
          messagesToday: await this.getMessagesToday(),
          dailyLimit: this.getDailyLimit(),
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

    // Limpa o número de telefone (remove espaços e caracteres especiais)
    const cleanPhoneNumber = phoneNumber.trim().replace(/\s+/g, '');
    console.log('Número original:', phoneNumber);
    console.log('Número limpo:', cleanPhoneNumber);

    // Valida formato do telefone
    if (!this.isValidPhoneNumber(cleanPhoneNumber)) {
      throw new Error('Formato de telefone inválido');
    }

    // Valida credenciais
    if (!provider || !credentials) {
      throw new Error('Provedor e credenciais são obrigatórios');
    }

    try {
      console.log('=== INÍCIO TESTE DE CONEXÃO ===');
      console.log('Provedor:', provider);
      console.log('Telefone original:', phoneNumber);
      console.log('Telefone limpo:', cleanPhoneNumber);
      
      // Testa conexão com o provedor primeiro
      console.log('Testando conectividade básica...');
      const isConnected = await this.testProviderConnection(provider, credentials);
      
      if (!isConnected) {
        throw new Error('Falha na conexão básica com o provedor WhatsApp');
      }

      console.log('Conectividade básica OK, tentando enviar mensagem...');

      // Envia mensagem de teste usando o método correto
      const testMessage = await this.sendTestMessage({ 
        to: cleanPhoneNumber, 
        message: 'Teste de conectividade WhatsApp - Sistema de Indicação' 
      });
      
      console.log('=== TESTE CONCLUÍDO COM SUCESSO ===');
      
      return {
        success: true,
        message: 'Mensagem de teste enviada com sucesso',
        messageId: testMessage.data?.messageId,
        status: testMessage.data?.status
      };
    } catch (error) {
      console.error('=== ERRO NO TESTE DE CONEXÃO ===');
      console.error('Erro completo:', error);
      throw new Error(`Erro ao testar conexão WhatsApp: ${error.message}`);
    }
  }

  async getStatus(): Promise<any> {
    const config = await this.getConfig();
    
    // Atualiza estatísticas
    const updatedStatus = {
      connected: config.status?.connected || false,
      messagesToday: await this.getMessagesToday(),
      dailyLimit: this.getDailyLimit(),
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

  async sendTestMessage(messageData: any) {
    try {
      console.log('=== SERVICE: ENVIO DE MENSAGEM DE TESTE ===');
      console.log('Dados da mensagem:', JSON.stringify(messageData, null, 2));
      
      const { to, message, from } = messageData;
      
      // Validar dados
      if (!to || !message) {
        throw new Error('Número de destino e mensagem são obrigatórios');
      }
      
      // Validar formato do número
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(to)) {
        throw new Error('Formato de telefone inválido');
      }
      
      // Obter configuração do admin
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Configuração WhatsApp não encontrada');
      }
      
      console.log('Configuração encontrada:', config);
      
      // Enviar mensagem usando o provedor configurado
      const result = await this.sendMessage({
        to: to.trim().replace(/\s+/g, ''),
        message: message,
        from: from || config.whatsappNumber
      });
      
      console.log('=== SERVICE: MENSAGEM ENVIADA COM SUCESSO ===');
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
      console.error('=== SERVICE: ERRO NO ENVIO ===');
      console.error('Erro:', error);
      throw error;
    }
  }

  private async sendMessage(messageData: any) {
    const { to, message, from } = messageData;
    
    try {
      let messageId: string;
      let status: string;

      // Obter configuração do admin
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Configuração WhatsApp não encontrada');
      }

      // Enviar mensagem usando WhatsApp Business API
      const result = await this.sendWhatsAppBusinessMessage(to, config.credentials, message);
      messageId = result.id;
      status = result.status;

      // Salva mensagem no banco
      const testMessage = new this.whatsappMessageModel({
        clientId: null, // Mensagem administrativa
        to: to,
        from: from || 'admin',
        content: {
          body: message
        },
        status: status || 'sent',
        providerResponse: {
          messageId,
          status,
          provider: 'whatsapp-business'
        },
        sentAt: new Date()
      });

      const savedMessage = await testMessage.save();
      console.log('Mensagem salva no banco:', savedMessage._id);
      
      return {
        messageId: messageId || savedMessage._id.toString(),
        status: status || 'sent',
        provider: 'whatsapp-business'
      };
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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
      console.log('=== INÍCIO ENVIO TWILIO ===');
      console.log('Telefone de destino:', phoneNumber);
      console.log('Número WhatsApp configurado:', credentials.whatsappNumber);
      console.log('Account SID:', credentials.accountSid);
      
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
      
      // Verificar se o sandbox está ativo primeiro
      console.log('Verificando sandbox...');
      try {
        const sandboxInfo = await client.messaging.v1.services('MG' + credentials.accountSid.substring(2)).fetch();
        console.log('Sandbox encontrado:', sandboxInfo.sid);
      } catch (sandboxError) {
        console.log('Sandbox não encontrado, tentando envio direto...');
      }
      
      console.log('Enviando mensagem...');
      const message = await client.messages.create({
        body: 'Teste de conectividade WhatsApp - Sistema de Indicação',
        from: `whatsapp:${credentials.whatsappNumber}`,
        to: `whatsapp:${formattedPhone}`
      });

      console.log('Mensagem Twilio enviada com sucesso!');
      console.log('Message SID:', message.sid);
      console.log('Status:', message.status);
      console.log('=== FIM ENVIO TWILIO ===');
      
      return {
        sid: message.sid,
        status: message.status
      };
    } catch (error) {
      console.error('=== ERRO TWILIO ===');
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      console.error('Informações adicionais:', error.moreInfo);
      console.error('Status HTTP:', error.status);
      console.error('Stack trace:', error.stack);
      console.error('=== FIM ERRO TWILIO ===');

      // Tratamento específico para erro 540
      if (error.code === 540) {
        throw new Error(`Erro 540: Número não verificado no sandbox do WhatsApp. Para resolver:
1. Abra o WhatsApp no seu telefone
2. Envie a mensagem "join <palavra-chave>" para ${credentials.whatsappNumber}
3. Aguarde a confirmação
4. Tente novamente`);
      }

      // Outros erros comuns do Twilio
      if (error.code === 21211) {
        throw new Error('Número de telefone inválido. Use formato: +5511999999999');
      }
      if (error.code === 21214) {
        throw new Error('Número não está no sandbox do WhatsApp. Verifique se enviou "join <palavra-chave>"');
      }
      if (error.code === 21215) {
        throw new Error('Credenciais Twilio inválidas. Verifique Account SID e Auth Token');
      }
      if (error.code === 21608) {
        throw new Error('Número WhatsApp não configurado corretamente');
      }

      // Erro genérico com mais detalhes
      throw new Error(`Erro Twilio (${error.code}): ${error.message}. Verifique as credenciais e configuração do sandbox.`);
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

  private getDailyLimit(): number {
    return 5000; // WhatsApp Business API tem limite mais alto
  }

  private async getActiveClients(): Promise<number> {
    // TODO: Implementar contagem de clientes ativos
    return 0;
  }

  private async getTotalTemplates(): Promise<number> {
    // TODO: Implementar contagem de templates
    return 0;
  }

  // Métodos para WhatsApp Business API
  private validateWhatsAppBusinessCredentials(credentials: any): void {
    if (!credentials.accessToken) {
      throw new Error('Access Token é obrigatório');
    }
    if (!credentials.phoneNumberId) {
      throw new Error('Phone Number ID é obrigatório');
    }
    if (!credentials.businessAccountId) {
      throw new Error('Business Account ID é obrigatório');
    }
  }

  private hasValidWhatsAppBusinessCredentials(credentials: any): boolean {
    return !!(credentials.accessToken && credentials.phoneNumberId && credentials.businessAccountId);
  }

  private async testWhatsAppBusinessConnection(credentials: any): Promise<boolean> {
    try {
      console.log('=== TESTANDO CONEXÃO WHATSAPP BUSINESS API ===');
      
      // Testa a conexão fazendo uma requisição para a API
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Resposta da API:', response.status);
      return response.status === 200;
    } catch (error) {
      console.error('Erro ao testar conexão WhatsApp Business API:', error);
      return false;
    }
  }

  private async sendWhatsAppBusinessMessage(phoneNumber: string, credentials: any, messageText: string): Promise<any> {
    try {
      console.log('=== ENVIANDO MENSAGEM VIA WHATSAPP BUSINESS API ===');
      console.log('Telefone de destino:', phoneNumber);
      console.log('Mensagem:', messageText);
      
      // Validações
      if (!credentials.accessToken || !credentials.phoneNumberId) {
        throw new Error('Credenciais incompletas para WhatsApp Business API');
      }

      // Formatar número de telefone
      const formattedPhone = this.formatPhoneForWhatsApp(phoneNumber);
      console.log('Telefone formatado:', formattedPhone);
      
      // Enviar mensagem via API
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: messageText
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Mensagem enviada com sucesso!');
      console.log('Response:', response.data);
      
      return {
        id: response.data.messages[0].id,
        status: 'sent'
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem via WhatsApp Business API:', error);
      throw error;
    }
  }

  private formatPhoneForWhatsApp(phone: string): string {
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

  async getMessageStatus(messageId: string): Promise<any> {
    try {
      console.log('=== VERIFICANDO STATUS DA MENSAGEM ===');
      console.log('Message ID:', messageId);
      
      // Busca a mensagem no banco
      const message = await this.whatsappMessageModel.findOne({
        'providerResponse.messageId': messageId
      }).exec();
      
      if (!message) {
        throw new Error('Mensagem não encontrada');
      }
      
      console.log('Mensagem encontrada no banco:', {
        id: message._id,
        status: message.status,
        to: message.to,
        from: message.from
      });
      
      // Verifica o status atual na API do WhatsApp Business
      if (message.providerResponse && message.providerResponse.provider === 'whatsapp-business') {
        const config = await this.getConfig();
        const credentials = config.credentials;
        
        if (credentials.accessToken && credentials.phoneNumberId) {
          try {
            const response = await axios.get(
              `https://graph.facebook.com/v18.0/${messageId}`,
              {
                headers: {
                  'Authorization': `Bearer ${credentials.accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            const messageStatus = response.data;
            console.log('Status atual na API:', messageStatus);
            
            // Atualiza o status no banco
            await this.whatsappMessageModel.updateOne(
              { _id: message._id },
              { 
                $set: { 
                  status: messageStatus.status,
                  'providerResponse.errorCode': messageStatus.error?.code,
                  'providerResponse.errorMessage': messageStatus.error?.message
                }
              }
            );
            
            return {
              messageId,
              status: messageStatus.status,
              errorCode: messageStatus.error?.code,
              errorMessage: messageStatus.error?.message
            };
          } catch (apiError) {
            console.error('Erro ao verificar status na API:', apiError);
            return {
              messageId,
              status: message.status,
              error: 'Erro ao verificar status na API'
            };
          }
        }
      }
      
      return {
        messageId,
        status: message.status,
        to: message.to,
        from: message.from
      };
    } catch (error) {
      console.error('Erro ao verificar status da mensagem:', error);
      throw error;
    }
  }
} 