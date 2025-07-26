import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiEmailConfig, ApiEmailConfigDocument } from './entities/email-config.schema';
import { CreateEmailConfigDto, UpdateEmailConfigDto, TestEmailDto } from './dto/create-email-config.dto';
import { MailService } from '../common/mail.service';

@Injectable()
export class EmailConfigService {
  constructor(
    @InjectModel(ApiEmailConfig.name) private emailConfigModel: Model<ApiEmailConfigDocument>,
    private mailService: MailService,
  ) {}

  // 🔧 Criar ou atualizar configuração
  async createOrUpdateConfig(createEmailConfigDto: CreateEmailConfigDto): Promise<ApiEmailConfig> {
    const { clientId, provider } = createEmailConfigDto;
    
    // Se for configuração global (clientId = null), desabilitar outras configurações globais do mesmo provider
    if (!clientId && createEmailConfigDto.isDefault) {
      await this.emailConfigModel.updateMany(
        { clientId: null, provider, isDefault: true },
        { isDefault: false }
      );
    }

    // Buscar configuração existente
    const existingConfig = await this.emailConfigModel.findOne({
      clientId: clientId || null,
      provider
    });

    if (existingConfig) {
      // Atualizar configuração existente
      const updatedConfig = await this.emailConfigModel.findByIdAndUpdate(
        existingConfig._id,
        {
          ...createEmailConfigDto,
          updatedAt: new Date()
        },
        { new: true }
      );
      
      console.log(`[EMAIL CONFIG] Configuração ${provider} ${clientId ? 'do cliente' : 'global'} atualizada`);
      return updatedConfig!;
    } else {
      // Criar nova configuração
      const newConfig = new this.emailConfigModel({
        ...createEmailConfigDto,
        clientId: clientId || null
      });
      
      const savedConfig = await newConfig.save();
      console.log(`[EMAIL CONFIG] Nova configuração ${provider} ${clientId ? 'do cliente' : 'global'} criada`);
      return savedConfig;
    }
  }

  // 📥 Buscar configuração por cliente e provider
  async findByClientAndProvider(clientId: string, provider: string): Promise<ApiEmailConfig | null> {
    return this.emailConfigModel.findOne({ clientId, provider, enabled: true });
  }

  // 📥 Buscar configuração global por provider
  async findGlobalByProvider(provider: string): Promise<ApiEmailConfig | null> {
    return this.emailConfigModel.findOne({ 
      clientId: null, 
      provider, 
      enabled: true,
      isDefault: true 
    });
  }

  // 📥 Buscar configuração padrão para envio
  async findDefaultConfig(clientId?: string, provider?: string): Promise<ApiEmailConfig | null> {
    // 1. Tentar configuração específica do cliente
    if (clientId && provider) {
      const clientConfig = await this.findByClientAndProvider(clientId, provider);
      if (clientConfig) return clientConfig;
    }

    // 2. Tentar configuração global do provider específico
    if (provider) {
      const globalConfig = await this.findGlobalByProvider(provider);
      if (globalConfig) return globalConfig;
    }

    // 3. Tentar qualquer configuração global ativa
    const anyGlobalConfig = await this.emailConfigModel.findOne({
      clientId: null,
      enabled: true,
      isDefault: true
    });

    return anyGlobalConfig;
  }

  // 🧪 Testar configuração de email
  async testEmailConfig(provider: string, testEmailDto: TestEmailDto, clientId?: string): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log(`[EMAIL TEST START] Iniciando teste ${provider} para ${testEmailDto.testEmail}`);
      
      // Buscar configuração
      const config = clientId 
        ? await this.findByClientAndProvider(clientId, provider)
        : await this.findGlobalByProvider(provider);

      if (!config) {
        console.error(`[EMAIL TEST ERROR] Configuração ${provider} não encontrada`);
        throw new BadRequestException(`Configuração ${provider} não encontrada ou inativa`);
      }

      console.log(`[EMAIL TEST] Configuração encontrada:`, {
        provider: config.provider,
        enabled: config.enabled,
        isDefault: config.isDefault,
        hasApiKey: !!config.apiKey,
        apiKeyLength: config.apiKey?.length || 0
      });

      // Preparar dados do email
      const emailData = {
        to: testEmailDto.testEmail,
        subject: testEmailDto.subject || `Teste de Email - ${provider.toUpperCase()}`,
        html: testEmailDto.message || `
          <h2>Teste de Email - ${provider.toUpperCase()}</h2>
          <p>Este é um email de teste para verificar a configuração do ${provider}.</p>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Cliente ID:</strong> ${clientId || 'Global'}</p>
          <p><strong>Provider:</strong> ${provider}</p>
          <p><strong>Config ID:</strong> ${config._id}</p>
        `,
        from: config.settings?.fromEmail || 'noreply@example.com',
        fromName: config.settings?.fromName || 'Sistema de Teste'
      };

      console.log(`[EMAIL TEST] Dados do email preparados:`, {
        to: emailData.to,
        subject: emailData.subject,
        from: emailData.from,
        fromName: emailData.fromName,
        htmlLength: emailData.html.length
      });

      // Enviar email usando o provider específico
      let result;
      if (provider === 'brevo') {
        console.log(`[EMAIL TEST] Enviando via Brevo API...`);
        result = await this.mailService.sendMailViaBrevo(emailData, config.apiKey);
        console.log(`[EMAIL TEST] Resultado do Brevo:`, result);
      } else {
        throw new BadRequestException(`Provider ${provider} não suportado`);
      }

      // Atualizar último teste
      await this.emailConfigModel.findByIdAndUpdate((config as any)._id, {
        lastTestAt: new Date(),
        lastTestResult: true,
        lastTestError: null
      });

      console.log(`[EMAIL TEST SUCCESS] Teste ${provider} para ${testEmailDto.testEmail} - SUCESSO`);
      
      return {
        success: true,
        message: `Email de teste enviado com sucesso para ${testEmailDto.testEmail}`,
        details: {
          provider,
          email: testEmailDto.testEmail,
          timestamp: new Date().toISOString(),
          configId: config._id
        }
      };

    } catch (error) {
      console.error(`[EMAIL TEST ERROR] Erro no teste ${provider}:`, {
        error: error.message,
        stack: error.stack,
        response: error.response?.data
      });

      // Atualizar último teste com erro
      const config = clientId 
        ? await this.findByClientAndProvider(clientId, provider)
        : await this.findGlobalByProvider(provider);
      
      if (config) {
        await this.emailConfigModel.findByIdAndUpdate((config as any)._id, {
          lastTestAt: new Date(),
          lastTestResult: false,
          lastTestError: error.message
        });
      }

      throw new BadRequestException(`Erro no teste de email: ${error.message}`);
    }
  }

  // 📊 Listar todas as configurações
  async findAll(clientId?: string): Promise<ApiEmailConfig[]> {
    const filter = clientId ? { clientId } : { clientId: null };
    return this.emailConfigModel.find(filter).sort({ createdAt: -1 });
  }

  // 🗑️ Deletar configuração
  async deleteConfig(id: string): Promise<void> {
    const config = await this.emailConfigModel.findByIdAndDelete(id);
    if (!config) {
      throw new NotFoundException('Configuração não encontrada');
    }
    console.log(`[EMAIL CONFIG] Configuração ${config.provider} deletada`);
  }

  // 🔄 Habilitar/Desabilitar configuração
  async toggleConfig(id: string, enabled: boolean): Promise<ApiEmailConfig> {
    const config = await this.emailConfigModel.findByIdAndUpdate(
      id,
      { enabled },
      { new: true }
    );
    
    if (!config) {
      throw new NotFoundException('Configuração não encontrada');
    }

    console.log(`[EMAIL CONFIG] Configuração ${config.provider} ${enabled ? 'habilitada' : 'desabilitada'}`);
    return config;
  }
} 