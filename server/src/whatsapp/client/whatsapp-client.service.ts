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
  whatsappNumber: string;
  displayName: string;
  businessDescription?: string;
  whatsappCredentials?: {
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    webhookUrl?: string;
  };
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
  whatsappCredentials?: {
    accessToken?: string;
    phoneNumberId?: string;
    businessAccountId?: string;
    webhookUrl?: string;
  };
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
      console.error('Erro ao criar configuração:', error);
      throw error;
    }
  }

  /**
   * Buscar configuração de WhatsApp por clientId
   */
  async getConfigByClientId(clientId: string): Promise<WhatsAppClientConfigDocument> {
    try {
      const config = await this.whatsAppClientConfigModel.findOne({
        clientId: new Types.ObjectId(clientId)
      }).exec();

      if (!config) {
        throw new NotFoundException('Configuração de WhatsApp não encontrada');
      }

      return config;
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      throw error;
    }
  }

  /**
   * Atualizar configuração de WhatsApp
   */
  async updateConfig(clientId: string, updateDto: UpdateWhatsAppClientConfigDto): Promise<WhatsAppClientConfigDocument> {
    try {
      const config = await this.whatsAppClientConfigModel.findOne({
        clientId: new Types.ObjectId(clientId)
      }).exec();

      if (!config) {
        throw new NotFoundException('Configuração de WhatsApp não encontrada');
      }

      // Validar número se foi alterado
      if (updateDto.whatsappNumber && updateDto.whatsappNumber !== config.whatsappNumber) {
        this.validatePhoneNumber(updateDto.whatsappNumber);
        
        // Verificar se o novo número já está sendo usado
        const existingNumber = await this.whatsAppClientConfigModel.findOne({
          whatsappNumber: updateDto.whatsappNumber,
          clientId: { $ne: new Types.ObjectId(clientId) }
        });

        if (existingNumber) {
          throw new ConflictException('Número de WhatsApp já está sendo usado por outro cliente');
        }
      }

      // Atualizar configuração
      Object.assign(config, updateDto);
      
      // Se credenciais foram atualizadas, marcar como não verificado
      if (updateDto.whatsappCredentials) {
        config.isVerified = false;
        config.verifiedAt = undefined; // Usar undefined em vez de null
      }

      return await config.save();
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      throw error;
    }
  }

  /**
   * Ativar/Desativar configuração de WhatsApp
   */
  async toggleActive(clientId: string, isActive: boolean): Promise<WhatsAppClientConfigDocument> {
    try {
      const config = await this.whatsAppClientConfigModel.findOne({
        clientId: new Types.ObjectId(clientId)
      }).exec();

      if (!config) {
        throw new NotFoundException('Configuração de WhatsApp não encontrada');
      }

      // Verificar se está verificado antes de ativar
      if (isActive && !config.isVerified) {
        throw new BadRequestException('Configuração deve ser verificada antes de ser ativada');
      }

      config.isActive = isActive;
      return await config.save();
    } catch (error) {
      console.error('Erro ao alterar status da configuração:', error);
      throw error;
    }
  }

  /**
   * Verificar número de WhatsApp (método legado - manter para compatibilidade)
   */
  async verifyNumber(clientId: string): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getConfigByClientId(clientId);
      
      if (!config.whatsappNumber) {
        return { success: false, message: 'Número de WhatsApp não configurado' };
      }

      // Verificação básica de formato
      const isValid = this.validatePhoneNumber(config.whatsappNumber);
      
      if (isValid) {
        config.isVerified = true;
        config.verifiedAt = new Date();
        await config.save();
        
        return { success: true, message: 'Número de WhatsApp verificado com sucesso' };
      } else {
        return { success: false, message: 'Formato de número inválido' };
      }
    } catch (error) {
      console.error('Erro ao verificar número:', error);
      return { success: false, message: 'Erro ao verificar número' };
    }
  }

  /**
   * Verificar configuração de WhatsApp (usar credenciais do WhatsApp Business API)
   */
  async verifyConfig(clientId: string): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getConfigByClientId(clientId);
      
      if (!config.whatsappCredentials) {
        return { success: false, message: 'Credenciais do WhatsApp Business API não configuradas' };
      }

      // Testar credenciais do WhatsApp Business API
      const testResult = await this.testWhatsAppBusinessAPI(config.whatsappCredentials);
      
      if (testResult.success) {
        config.isVerified = true;
        config.verifiedAt = new Date();
        await config.save();
        
        return { success: true, message: 'Configuração verificada com sucesso' };
      } else {
        return { success: false, message: testResult.message };
      }
    } catch (error) {
      console.error('Erro ao verificar configuração:', error);
      return { success: false, message: 'Erro ao verificar configuração' };
    }
  }

  /**
   * Buscar estatísticas de uso
   */
  async getStatistics(clientId: string): Promise<any> {
    try {
      const config = await this.getConfigByClientId(clientId);
      
      return {
        totalMessagesSent: config.statistics?.totalMessagesSent || 0,
        totalMessagesDelivered: config.statistics?.totalMessagesDelivered || 0,
        totalMessagesFailed: config.statistics?.totalMessagesFailed || 0,
        monthlyUsage: config.statistics?.monthlyUsage || { current: 0, limit: 1000 },
        isActive: config.isActive,
        isVerified: config.isVerified,
        verifiedAt: config.verifiedAt
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  /**
   * Atualizar estatísticas de mensagens
   */
  async updateMessageStatistics(clientId: string, messageStatus: 'sent' | 'delivered' | 'failed'): Promise<void> {
    try {
      const config = await this.getConfigByClientId(clientId);
      
      // Atualizar estatísticas gerais
      if (!config.statistics) {
        config.statistics = {
          totalMessagesSent: 0,
          totalMessagesDelivered: 0,
          totalMessagesFailed: 0,
          monthlyUsage: { current: 0, limit: 1000 }
        };
      }

      if (messageStatus === 'sent') {
        config.statistics.totalMessagesSent++;
        config.statistics.monthlyUsage.current++;
      } else if (messageStatus === 'delivered') {
        config.statistics.totalMessagesDelivered++;
      } else if (messageStatus === 'failed') {
        config.statistics.totalMessagesFailed++;
      }

      // Atualizar lastMessageSentAt
      if (messageStatus === 'sent') {
        config.statistics.lastMessageSentAt = new Date();
      }

      await config.save();
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  }

  /**
   * Buscar todas as configurações (para admin)
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
          { displayName: { $regex: filters.search, $options: 'i' } }
        ];
      }

      return await this.whatsAppClientConfigModel.find(query).exec();
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      throw error;
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
      console.error('Erro ao deletar configuração:', error);
      throw error;
    }
  }

  /**
   * Validar formato de número de telefone
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    // Validação básica de formato internacional
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Testar credenciais do WhatsApp Business API
   */
  async testCredentials(clientId: string, credentials: any) {
    try {
      console.log('=== INÍCIO TESTE DE CREDENCIAIS ===');
      console.log('ClientId:', clientId);
      console.log('Credenciais:', JSON.stringify(credentials, null, 2));

      // Validar credenciais obrigatórias
      if (!credentials.accessToken || !credentials.phoneNumberId || !credentials.businessAccountId) {
        throw new Error('Credenciais incompletas. Necessário: accessToken, phoneNumberId, businessAccountId');
      }

      // Testar conexão com WhatsApp Business API
      const testResult = await this.testWhatsAppBusinessAPI(credentials);
      
      console.log('=== FIM TESTE DE CREDENCIAIS ===');
      console.log('Resultado:', testResult);
      
      return testResult;
    } catch (error) {
      console.error('=== ERRO NO TESTE DE CREDENCIAIS ===');
      console.error('Erro:', error);
      throw error;
    }
  }

  /**
   * Enviar mensagem de teste
   */
  async sendTestMessage(clientId: string, messageData: any) {
    try {
      console.log('=== INÍCIO ENVIO MENSAGEM DE TESTE ===');
      console.log('ClientId:', clientId);
      console.log('Dados da mensagem:', JSON.stringify(messageData, null, 2));

      const { to, message, from } = messageData;

      // Validar dados da mensagem
      if (!to || !message) {
        throw new Error('Dados da mensagem incompletos. Necessário: to, message');
      }

      // Validar formato do número
      if (!this.validatePhoneNumber(to)) {
        throw new Error('Formato de número inválido');
      }

      // Buscar configuração do cliente
      const clientConfig = await this.getConfigByClientId(clientId);
      
      if (!clientConfig.whatsappCredentials) {
        throw new Error('Credenciais do WhatsApp Business API não configuradas');
      }

      if (!clientConfig.isVerified) {
        throw new Error('Configuração não verificada. Teste as credenciais primeiro.');
      }

      // Enviar mensagem usando WhatsApp Business API
      const result = await this.sendMessage({
        to,
        message,
        from: from || clientConfig.whatsappNumber,
        clientId
      });

      console.log('=== FIM ENVIO MENSAGEM DE TESTE ===');
      console.log('Resultado:', result);

      return {
        success: true,
        message: 'Mensagem de teste enviada com sucesso',
        data: result
      };
    } catch (error) {
      console.error('=== ERRO NO ENVIO DE MENSAGEM DE TESTE ===');
      console.error('Erro:', error);
      throw error;
    }
  }

  /**
   * Enviar mensagem (método interno)
   */
  private async sendMessage(messageData: any) {
    const { to, message, from, clientId } = messageData;
    
    try {
      let messageId: string;
      let status: string;

      // Buscar configuração do cliente
      const clientConfig = await this.whatsAppClientConfigModel.findOne({ 
        clientId: new Types.ObjectId(clientId) 
      }).exec();
      
      if (!clientConfig || !clientConfig.whatsappCredentials) {
        throw new Error('Credenciais WhatsApp não configuradas para este cliente');
      }

      // Enviar mensagem usando WhatsApp Business API (modelo HubSpot)
      const whatsappResult = await this.sendWhatsAppBusinessMessage(to, clientConfig.whatsappCredentials, message);
      messageId = whatsappResult.id;
      status = whatsappResult.status;

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
          provider: 'whatsapp-business'
        },
        sentAt: new Date()
      });

      const savedMessage = await testMessage.save();
      console.log('Mensagem salva no banco:', savedMessage._id);
      
      // Atualizar estatísticas
      await this.updateMessageStatistics(clientId, 'sent');
      
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

  /**
   * Testar conexão com WhatsApp Business API
   */
  private async testWhatsAppBusinessAPI(credentials: any): Promise<any> {
    try {
      console.log('=== INÍCIO TESTE WHATSAPP BUSINESS API ===');
      
      // Testar acesso à API fazendo uma requisição para obter informações do número
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Resposta da API:', response.data);
      
      if (response.data && response.data.id) {
        console.log('=== TESTE WHATSAPP BUSINESS API SUCESSO ===');
        return {
          success: true,
          message: 'Conexão com WhatsApp Business API estabelecida com sucesso',
          data: {
            phoneNumberId: response.data.id,
            verifiedName: response.data.verified_name,
            codeVerificationStatus: response.data.code_verification_status
          }
        };
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      console.error('=== ERRO TESTE WHATSAPP BUSINESS API ===');
      console.error('Erro:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Token de acesso inválido ou expirado');
      } else if (error.response?.status === 404) {
        throw new Error('Phone Number ID não encontrado');
      } else if (error.response?.status === 403) {
        throw new Error('Sem permissão para acessar este número');
      } else {
        throw new Error(`Erro na API: ${error.response?.data?.error?.message || error.message}`);
      }
    }
  }

  /**
   * Enviar mensagem via WhatsApp Business API
   */
  private async sendWhatsAppBusinessMessage(to: string, credentials: any, message: string): Promise<any> {
    try {
      console.log('=== INÍCIO ENVIO WHATSAPP BUSINESS API ===');
      console.log('Para:', to);
      console.log('Mensagem:', message);
      
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Resposta da API:', response.data);
      
      if (response.data && response.data.messages && response.data.messages[0]) {
        console.log('=== ENVIO WHATSAPP BUSINESS API SUCESSO ===');
        return {
          id: response.data.messages[0].id,
          status: 'sent'
        };
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      console.error('=== ERRO ENVIO WHATSAPP BUSINESS API ===');
      console.error('Erro:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Token de acesso inválido ou expirado');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error?.message || 'Erro na requisição';
        throw new Error(`Erro na API: ${errorMessage}`);
      } else {
        throw new Error(`Erro na API: ${error.response?.data?.error?.message || error.message}`);
      }
    }
  }
} 