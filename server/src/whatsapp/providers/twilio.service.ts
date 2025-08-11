import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WhatsAppTwilioConfig, WhatsAppTwilioConfigDocument } from './whatsapp-twilio-config.schema';
import { CreateTwilioConfigDto, UpdateTwilioConfigDto, TestTwilioMessageDto } from './twilio-config.dto';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {
  private client: twilio.Twilio | null = null;

  constructor(
    @InjectModel(WhatsAppTwilioConfig.name)
    private twilioConfigModel: Model<WhatsAppTwilioConfigDocument>,
  ) {}

  async createConfig(createDto: CreateTwilioConfigDto): Promise<WhatsAppTwilioConfig> {
    // Verificar se já existe uma configuração
    const existingConfig = await this.twilioConfigModel.findOne({ configId: 'platform' });
    
    if (existingConfig) {
      throw new BadRequestException('Configuração Twilio já existe. Use updateConfig para modificar.');
    }

    const config = new this.twilioConfigModel({
      configId: 'platform',
      ...createDto,
      isActive: true,
    });

    return config.save();
  }

  async updateConfig(updateDto: UpdateTwilioConfigDto): Promise<WhatsAppTwilioConfig> {
    const config = await this.twilioConfigModel.findOne({ configId: 'platform' });
    
    if (!config) {
      throw new NotFoundException('Configuração Twilio não encontrada');
    }

    Object.assign(config, updateDto);
    return config.save();
  }

  async getConfig(): Promise<WhatsAppTwilioConfig | null> {
    return this.twilioConfigModel.findOne({ configId: 'platform' });
  }

  async deleteConfig(): Promise<void> {
    const result = await this.twilioConfigModel.deleteOne({ configId: 'platform' });
    
    if (result.deletedCount === 0) {
      throw new NotFoundException('Configuração Twilio não encontrada');
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();
    
    if (!config) {
      throw new NotFoundException('Configuração Twilio não encontrada');
    }

    try {
      // Criar cliente Twilio
      this.client = twilio(config.accountSid, config.authToken);
      
      // Testar conexão buscando informações da conta
      const account = await this.client.api.accounts(config.accountSid).fetch();
      
      // Atualizar status do teste
      await this.twilioConfigModel.updateOne(
        { configId: 'platform' },
        { 
          lastTestAt: new Date(),
          lastTestResult: 'success',
          isActive: true
        }
      );

      return {
        success: true,
        message: `Conexão bem-sucedida com conta: ${account.friendlyName || account.sid}`
      };
    } catch (error) {
      // Atualizar status do teste
      await this.twilioConfigModel.updateOne(
        { configId: 'platform' },
        { 
          lastTestAt: new Date(),
          lastTestResult: 'failed',
          isActive: false
        }
      );

      return {
        success: false,
        message: `Erro na conexão: ${error.message}`
      };
    }
  }

  async sendTestMessage(testDto: TestTwilioMessageDto): Promise<{ success: boolean; message: string; sid?: string }> {
    const config = await this.getConfig();
    
    if (!config) {
      throw new NotFoundException('Configuração Twilio não encontrada');
    }

    if (!config.isActive) {
      throw new BadRequestException('Configuração Twilio não está ativa');
    }

    try {
      // Criar cliente Twilio se não existir
      if (!this.client) {
        this.client = twilio(config.accountSid, config.authToken);
      }

      // Enviar mensagem via WhatsApp
      const message = await this.client.messages.create({
        body: testDto.message,
        from: `whatsapp:${config.phoneNumber}`,  // ✅ COM 'whatsapp:' prefix para WhatsApp
        to: `whatsapp:${testDto.to}`             // ✅ COM 'whatsapp:' prefix para WhatsApp
      });

      // Atualizar estatísticas
      await this.twilioConfigModel.updateOne(
        { configId: 'platform' },
        { 
          $inc: { messagesSent: 1 },
          lastTestAt: new Date(),
          lastTestResult: 'success'
        }
      );

      return {
        success: true,
        message: 'Mensagem enviada com sucesso',
        sid: message.sid
      };
    } catch (error) {
      // Atualizar estatísticas
      await this.twilioConfigModel.updateOne(
        { configId: 'platform' },
        { 
          $inc: { messagesFailed: 1 },
          lastTestAt: new Date(),
          lastTestResult: 'failed'
        }
      );

      return {
        success: false,
        message: `Erro ao enviar mensagem: ${error.message}`
      };
    }
  }

  async getStatus(): Promise<{ isActive: boolean; lastTest: Date | null; lastResult: string | null }> {
    const config = await this.getConfig();
    
    if (!config) {
      return {
        isActive: false,
        lastTest: null,
        lastResult: null
      };
    }

    return {
      isActive: config.isActive,
      lastTest: config.lastTestAt || null,
      lastResult: config.lastTestResult || null
    };
  }
}
