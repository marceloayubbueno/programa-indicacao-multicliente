import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WhatsAppEvolutionConfig, WhatsAppEvolutionConfigDocument } from './whatsapp-evolution-config.schema';
import { CreateEvolutionConfigDto, UpdateEvolutionConfigDto, TestEvolutionMessageDto } from './evolution-config.dto';

@Injectable()
export class EvolutionService {
  constructor(
    @InjectModel(WhatsAppEvolutionConfig.name)
    private evolutionConfigModel: Model<WhatsAppEvolutionConfigDocument>,
  ) {}

  async createConfig(createDto: CreateEvolutionConfigDto): Promise<WhatsAppEvolutionConfig> {
    // Verificar se já existe uma configuração
    const existingConfig = await this.evolutionConfigModel.findOne({ configId: 'platform' });
    
    if (existingConfig) {
      throw new BadRequestException('Configuração Evolution API já existe. Use updateConfig para modificar.');
    }

    const config = new this.evolutionConfigModel({
      configId: 'platform',
      ...createDto,
      isActive: true,
    });

    return config.save();
  }

  async updateConfig(updateDto: UpdateEvolutionConfigDto): Promise<WhatsAppEvolutionConfig> {
    const config = await this.evolutionConfigModel.findOne({ configId: 'platform' });
    
    if (!config) {
      throw new NotFoundException('Configuração Evolution API não encontrada');
    }

    Object.assign(config, updateDto);
    return config.save();
  }

  async getConfig(): Promise<WhatsAppEvolutionConfig | null> {
    return this.evolutionConfigModel.findOne({ configId: 'platform' });
  }

  async deleteConfig(): Promise<void> {
    const result = await this.evolutionConfigModel.deleteOne({ configId: 'platform' });
    
    if (result.deletedCount === 0) {
      throw new NotFoundException('Configuração Evolution API não encontrada');
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();
    
    if (!config) {
      throw new NotFoundException('Configuração Evolution API não encontrada');
    }

    try {
      // Testar conexão com Evolution API
      const response = await fetch(`${config.webhookUrl || 'http://localhost:8080'}/instance/connectionState/${config.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Atualizar status do teste
        await this.evolutionConfigModel.updateOne(
          { configId: 'platform' },
          { 
            lastTestAt: new Date(),
            lastTestResult: 'success',
            isActive: true
          }
        );

        return {
          success: true,
          message: `Conexão bem-sucedida com Evolution API: ${config.instanceName}`
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Atualizar status do teste
      await this.evolutionConfigModel.updateOne(
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

  async sendTestMessage(testDto: TestEvolutionMessageDto): Promise<{ success: boolean; message: string; messageId?: string }> {
    const config = await this.getConfig();
    
    if (!config) {
      throw new NotFoundException('Configuração Evolution API não encontrada');
    }

    if (!config.isActive) {
      throw new BadRequestException('Configuração Evolution API não está ativa');
    }

    try {
      // Enviar mensagem via Evolution API
      const response = await fetch(`${config.webhookUrl || 'http://localhost:8080'}/message/sendText/${config.instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: testDto.to,
          text: testDto.message
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Atualizar estatísticas
        await this.evolutionConfigModel.updateOne(
          { configId: 'platform' },
          { 
            $inc: { messagesSent: 1 },
            lastTestAt: new Date(),
            lastTestResult: 'success'
          }
        );

        return {
          success: true,
          message: 'Mensagem enviada com sucesso via Evolution API',
          messageId: data.key?.id || 'unknown'
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Atualizar estatísticas
      await this.evolutionConfigModel.updateOne(
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
