import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
          // Configurações de Rate Limiting
          globalRateLimitPerMinute: 30,
          defaultDailyLimitPerClient: 100,
          
          // Configurações de Horário
          globalSendTimeStart: '08:00',
          globalSendTimeEnd: '20:00',
          defaultTimezone: 'America/Sao_Paulo',
          
          // Configurações de Funcionalidades
          enableGlobalWebhooks: true,
          requireVerification: false,
          enableAutoReply: false,
          
          // Configurações legadas (mantidas para compatibilidade)
          rateLimitPerMinute: 30,
          sendTimeStart: '08:00',
          sendTimeEnd: '20:00',
          timezone: 'America/Sao_Paulo',
          enableWebhooks: true
        },
        status: {
          connected: false,
          messagesToday: 0,
          dailyLimit: 5000,
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
    
    // Atualiza configurações globais se fornecidas
    if (globalSettings) {
      config.globalSettings = {
        // Configurações de Rate Limiting
        globalRateLimitPerMinute: globalSettings.globalRateLimitPerMinute || 30,
        defaultDailyLimitPerClient: globalSettings.defaultDailyLimitPerClient || 100,
        
        // Configurações de Horário
        globalSendTimeStart: globalSettings.globalSendTimeStart || '08:00',
        globalSendTimeEnd: globalSettings.globalSendTimeEnd || '20:00',
        defaultTimezone: globalSettings.defaultTimezone || 'America/Sao_Paulo',
        
        // Configurações de Funcionalidades
        enableGlobalWebhooks: globalSettings.enableGlobalWebhooks !== false,
        requireVerification: globalSettings.requireVerification !== false,
        enableAutoReply: globalSettings.enableAutoReply !== false,
        
        // Configurações legadas (mantidas para compatibilidade)
        rateLimitPerMinute: globalSettings.globalRateLimitPerMinute || 30,
        sendTimeStart: globalSettings.globalSendTimeStart || '08:00',
        sendTimeEnd: globalSettings.globalSendTimeEnd || '20:00',
        timezone: globalSettings.defaultTimezone || 'America/Sao_Paulo',
        enableWebhooks: globalSettings.enableGlobalWebhooks !== false
      };
    }

    // Testa conexão se credenciais foram fornecidas
    if (this.hasValidWhatsAppBusinessCredentials(credentials)) {
      try {
        const isConnected = await this.testWhatsAppBusinessConnection(credentials);
        config.status = {
          ...config.status,
          connected: isConnected,
          messagesToday: await this.getMessagesToday(),
          dailyLimit: this.getDailyLimit(),
          activeClients: await this.getActiveClientsCount(),
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

  async saveGlobalSettings(globalSettings: any): Promise<any> {
    console.log('=== SALVANDO CONFIGURAÇÕES GLOBAIS ===');
    console.log('Configurações recebidas:', JSON.stringify(globalSettings, null, 2));

    // Validações básicas
    if (!globalSettings) {
      throw new Error('Configurações globais são obrigatórias');
    }

    // Busca configuração existente ou cria nova
    let config = await this.whatsappConfigModel.findOne().exec();
    
    if (!config) {
      config = new this.whatsappConfigModel();
      config.provider = 'whatsapp-business';
      config.credentials = {
        accessToken: '',
        phoneNumberId: '',
        businessAccountId: '',
        webhookUrl: ''
      };
    }

    // Atualiza apenas as configurações globais
    config.globalSettings = {
      // Configurações de Rate Limiting
      globalRateLimitPerMinute: globalSettings.globalRateLimitPerMinute || 30,
      defaultDailyLimitPerClient: globalSettings.defaultDailyLimitPerClient || 100,
      
      // Configurações de Horário
      globalSendTimeStart: globalSettings.globalSendTimeStart || '08:00',
      globalSendTimeEnd: globalSettings.globalSendTimeEnd || '20:00',
      defaultTimezone: globalSettings.defaultTimezone || 'America/Sao_Paulo',
      
      // Configurações de Funcionalidades
      enableGlobalWebhooks: globalSettings.enableGlobalWebhooks !== false,
      requireVerification: globalSettings.requireVerification !== false,
      enableAutoReply: globalSettings.enableAutoReply !== false,
      
      // Configurações legadas (mantidas para compatibilidade)
      rateLimitPerMinute: globalSettings.globalRateLimitPerMinute || 30,
      sendTimeStart: globalSettings.globalSendTimeStart || '08:00',
      sendTimeEnd: globalSettings.globalSendTimeEnd || '20:00',
      timezone: globalSettings.defaultTimezone || 'America/Sao_Paulo',
      enableWebhooks: globalSettings.enableGlobalWebhooks !== false
    };

    await config.save();
    console.log('Configurações globais salvas com sucesso');
    
    return {
      success: true,
      message: 'Configurações globais salvas com sucesso',
      globalSettings: config.globalSettings
    };
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
      activeClients: await this.getActiveClientsCount(),
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
      case 'whatsapp-business':
        if (!credentials.accessToken || !credentials.phoneNumberId) {
          throw new Error('Access Token e Phone Number ID são obrigatórios para WhatsApp Business API');
        }
        break;
      default:
        throw new Error(`Provedor não suportado: ${provider}`);
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
        case 'whatsapp-business':
          return await this.testWhatsAppBusinessConnection(credentials);
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
    // Twilio removido - retorna false
    console.log('Twilio não suportado mais');
    return false;
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
    // Twilio removido - retorna erro
    throw new Error('Twilio não é mais suportado. Use WhatsApp Business API.');
  }

  // Método formatPhoneForTwilio removido - não é mais necessário

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

  private async getActiveClientsCount(): Promise<number> {
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

  // ===== MÉTODOS GUPSHUP =====

  async getGupshupConfig(): Promise<any> {
    try {
      const config = await this.getConfig();
      return {
        apiKey: config?.gupshupConfig?.apiKey || 'ojlftrm5pv02cemljepf29g86wyrpuk8',
        appName: config?.gupshupConfig?.appName || 'ViralLeadWhatsApp',
        clientId: config?.gupshupConfig?.clientId || '4000307927',
        sourceNumber: config?.gupshupConfig?.sourceNumber || '15557777720',
        isConnected: config?.gupshupConfig?.isConnected || false
      };
    } catch (error) {
      console.error('Erro ao buscar configuração Gupshup:', error);
      throw new Error('Erro ao buscar configuração Gupshup');
    }
  }

  async saveGupshupConfig(configData: any): Promise<any> {
    try {
      const { apiKey, appName, clientId, sourceNumber } = configData;
      
      // Validar dados
      if (!apiKey || !appName || !clientId || !sourceNumber) {
        throw new Error('Todos os campos são obrigatórios');
      }

      // Buscar configuração existente ou criar nova
      let config = await this.whatsappConfigModel.findOne();
      
      if (!config) {
        config = new this.whatsappConfigModel({
          gupshupConfig: {
            apiKey,
            appName,
            clientId,
            sourceNumber,
            isConnected: false
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        config.gupshupConfig = {
          apiKey,
          appName,
          clientId,
          sourceNumber,
          isConnected: config.gupshupConfig?.isConnected || false
        };
        // Mongoose timestamps: true cuida automaticamente do updatedAt
      }

      const savedConfig = await config.save();
      console.log('Configuração Gupshup salva:', savedConfig._id);

      return {
        apiKey: savedConfig.gupshupConfig.apiKey,
        appName: savedConfig.gupshupConfig.appName,
        clientId: savedConfig.gupshupConfig.clientId,
        sourceNumber: savedConfig.gupshupConfig.sourceNumber,
        isConnected: savedConfig.gupshupConfig.isConnected
      };
    } catch (error) {
      console.error('Erro ao salvar configuração Gupshup:', error);
      throw new Error('Erro ao salvar configuração Gupshup');
    }
  }

  async testGupshupConnection(): Promise<any> {
    try {
      const config = await this.getGupshupConfig();
      
      if (!config.apiKey) {
        throw new Error('API Key não configurada');
      }

      // Testar conexão com Gupshup
      const testResult = await this.testGupshupApiConnection(config);
      
      // Atualizar status de conexão
      await this.updateGupshupConnectionStatus(testResult.success);
      
      return {
        success: testResult.success,
        message: testResult.success ? 'Conexão com Gupshup estabelecida' : 'Falha na conexão com Gupshup',
        details: testResult.details
      };
    } catch (error) {
      console.error('Erro ao testar conexão Gupshup:', error);
      throw new Error('Erro ao testar conexão Gupshup');
    }
  }

  private async testGupshupApiConnection(config: any): Promise<any> {
    try {
      // Teste básico de conectividade com Gupshup
      const response = await axios.get('https://api.gupshup.io/wa/api/v1/account/status', {
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return {
        success: response.status === 200,
        details: response.data
      };
    } catch (error) {
      console.error('Erro na API Gupshup:', error.response?.data || error.message);
      return {
        success: false,
        details: error.response?.data || error.message
      };
    }
  }

  private async updateGupshupConnectionStatus(isConnected: boolean): Promise<void> {
    try {
      await this.whatsappConfigModel.updateOne(
        {},
        { 
          $set: { 
            'gupshupConfig.isConnected': isConnected,
            updatedAt: new Date()
          } 
        }
      );
    } catch (error) {
      console.error('Erro ao atualizar status de conexão:', error);
    }
  }

  // ===== MÉTODOS DE PREÇOS =====

  async getPricingConfig(): Promise<any> {
    try {
      const config = await this.getConfig();
      return {
        pricePerMessage: config?.pricingConfig?.pricePerMessage || 0.05,
        monthlyLimitPerClient: config?.pricingConfig?.monthlyLimitPerClient || 1000,
        setupFee: config?.pricingConfig?.setupFee || 0.00
      };
    } catch (error) {
      console.error('Erro ao buscar configuração de preços:', error);
      throw new Error('Erro ao buscar configuração de preços');
    }
  }

  async savePricingConfig(pricingData: any): Promise<any> {
    try {
      const { pricePerMessage, monthlyLimitPerClient, setupFee } = pricingData;
      
      // Validar dados
      if (pricePerMessage < 0.01 || pricePerMessage > 1.00) {
        throw new Error('Preço por mensagem deve estar entre R$ 0,01 e R$ 1,00');
      }
      
      if (monthlyLimitPerClient < 100 || monthlyLimitPerClient > 10000) {
        throw new Error('Limite mensal deve estar entre 100 e 10.000 mensagens');
      }
      
      if (setupFee < 0 || setupFee > 100) {
        throw new Error('Taxa de setup deve estar entre R$ 0,00 e R$ 100,00');
      }

      // Buscar configuração existente ou criar nova
      let config = await this.whatsappConfigModel.findOne();
      
      if (!config) {
        config = new this.whatsappConfigModel({
          pricingConfig: {
            pricePerMessage,
            monthlyLimitPerClient,
            setupFee
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        config.pricingConfig = {
          pricePerMessage,
          monthlyLimitPerClient,
          setupFee
        };
        // Mongoose timestamps: true cuida automaticamente do updatedAt
      }

      const savedConfig = await config.save();
      console.log('Configuração de preços salva:', savedConfig._id);

      return {
        pricePerMessage: savedConfig.pricingConfig.pricePerMessage,
        monthlyLimitPerClient: savedConfig.pricingConfig.monthlyLimitPerClient,
        setupFee: savedConfig.pricingConfig.setupFee
      };
    } catch (error) {
      console.error('Erro ao salvar configuração de preços:', error);
      throw new Error('Erro ao salvar configuração de preços');
    }
  }

  // ===== MÉTODOS DE ESTATÍSTICAS =====

  async getStatistics(): Promise<any> {
    try {
      // Buscar estatísticas do banco
      const [
        totalClients,
        activeClients,
        totalMessagesSent,
        messagesThisMonth,
        totalRevenue,
        revenueThisMonth,
        deliveryRate,
        avgDeliveryTime
      ] = await Promise.all([
        this.getTotalClients(),
        this.getActiveClientsStats(),
        this.getTotalMessagesSent(),
        this.getMessagesThisMonth(),
        this.getTotalRevenue(),
        this.getRevenueThisMonth(),
        this.getDeliveryRate(),
        this.getAverageDeliveryTime()
      ]);

      return {
        totalClients,
        activeClients,
        totalMessagesSent,
        messagesThisMonth,
        totalRevenue,
        revenueThisMonth,
        deliveryRate,
        avgDeliveryTime
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error('Erro ao buscar estatísticas');
    }
  }

  private async getTotalClients(): Promise<number> {
    try {
      // Implementar lógica para contar clientes totais
      return 0; // Placeholder
    } catch (error) {
      console.error('Erro ao contar clientes totais:', error);
      return 0;
    }
  }

  private async getActiveClientsStats(): Promise<number> {
    try {
      // Implementar lógica para contar clientes ativos
      return 0; // Placeholder
    } catch (error) {
      console.error('Erro ao contar clientes ativos:', error);
      return 0;
    }
  }

  private async getTotalMessagesSent(): Promise<number> {
    try {
      const count = await this.whatsappMessageModel.countDocuments({});
      return count;
    } catch (error) {
      console.error('Erro ao contar mensagens totais:', error);
      return 0;
    }
  }

  private async getMessagesThisMonth(): Promise<number> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const count = await this.whatsappMessageModel.countDocuments({
        sentAt: { $gte: startOfMonth }
      });
      return count;
    } catch (error) {
      console.error('Erro ao contar mensagens do mês:', error);
      return 0;
    }
  }

  private async getTotalRevenue(): Promise<number> {
    try {
      // Implementar lógica para calcular receita total
      return 0; // Placeholder
    } catch (error) {
      console.error('Erro ao calcular receita total:', error);
      return 0;
    }
  }

  private async getRevenueThisMonth(): Promise<number> {
    try {
      // Implementar lógica para calcular receita do mês
      return 0; // Placeholder
    } catch (error) {
      console.error('Erro ao calcular receita do mês:', error);
      return 0;
    }
  }

  private async getDeliveryRate(): Promise<number> {
    try {
      const totalMessages = await this.whatsappMessageModel.countDocuments({});
      const deliveredMessages = await this.whatsappMessageModel.countDocuments({
        status: { $in: ['delivered', 'read'] }
      });
      
      return totalMessages > 0 ? Math.round((deliveredMessages / totalMessages) * 100) : 0;
    } catch (error) {
      console.error('Erro ao calcular taxa de entrega:', error);
      return 0;
    }
  }

  private async getAverageDeliveryTime(): Promise<number> {
    try {
      // Implementar lógica para calcular tempo médio de entrega
      return 0; // Placeholder
    } catch (error) {
      console.error('Erro ao calcular tempo médio de entrega:', error);
      return 0;
    }
  }
} 