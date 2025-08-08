import { Controller, Get, Post, Put, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WhatsAppAdminService } from './whatsapp-admin.service';

@Controller('admin/whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppAdminController {
  constructor(private readonly whatsappAdminService: WhatsAppAdminService) {}

  // ===== ENDPOINTS GUPSHUP =====

  @Get('gupshup-config')
  async getGupshupConfig() {
    try {
      const config = await this.whatsappAdminService.getGupshupConfig();
      return {
        success: true,
        data: config
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar configuração Gupshup',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('gupshup-config')
  async saveGupshupConfig(@Body() configData: any) {
    try {
      const result = await this.whatsappAdminService.saveGupshupConfig(configData);
      return {
        success: true,
        data: result,
        message: 'Configuração Gupshup salva com sucesso'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao salvar configuração Gupshup',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('test-gupshup-connection')
  async testGupshupConnection() {
    try {
      const result = await this.whatsappAdminService.testGupshupConnection();
      return {
        success: true,
        data: result,
        message: 'Conexão com Gupshup testada com sucesso'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao testar conexão Gupshup',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== ENDPOINTS DE PREÇOS =====

  @Get('pricing-config')
  async getPricingConfig() {
    try {
      const config = await this.whatsappAdminService.getPricingConfig();
      return {
        success: true,
        data: config
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar configuração de preços',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('pricing-config')
  async savePricingConfig(@Body() pricingData: any) {
    try {
      const result = await this.whatsappAdminService.savePricingConfig(pricingData);
      return {
        success: true,
        data: result,
        message: 'Configuração de preços salva com sucesso'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao salvar configuração de preços',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== ENDPOINTS DE ESTATÍSTICAS =====

  @Get('statistics')
  async getStatistics() {
    try {
      const stats = await this.whatsappAdminService.getStatistics();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar estatísticas',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== ENDPOINTS LEGADOS (MANTIDOS PARA COMPATIBILIDADE) =====

  @Get('config')
  async getConfig() {
    try {
      return await this.whatsappAdminService.getConfig();
    } catch (error) {
      throw new HttpException(
        'Erro ao buscar configuração WhatsApp',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('config')
  async saveConfig(@Body() configData: any) {
    try {
      return await this.whatsappAdminService.saveConfig(configData);
    } catch (error) {
      throw new HttpException(
        'Erro ao salvar configuração WhatsApp',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('global-settings')
  async saveGlobalSettings(@Body() globalSettings: any) {
    try {
      return await this.whatsappAdminService.saveGlobalSettings(globalSettings);
    } catch (error) {
      throw new HttpException(
        'Erro ao salvar configurações globais',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('test')
  async testConnection(@Body() testData: any) {
    try {
      console.log('=== CONTROLLER: INÍCIO TESTE ===');
      console.log('Dados recebidos:', JSON.stringify(testData, null, 2));
      
      const result = await this.whatsappAdminService.testConnection(testData);
      
      console.log('=== CONTROLLER: TESTE CONCLUÍDO ===');
      return result;
    } catch (error) {
      console.error('=== CONTROLLER: ERRO NO TESTE ===');
      console.error('Erro completo:', error);
      console.error('Stack trace:', error.stack);
      console.error('Mensagem:', error.message);
      
      throw new HttpException(
        {
          message: 'Erro ao testar conexão WhatsApp',
          details: error.message,
          code: error.code || 'UNKNOWN'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('test-message')
  async sendTestMessage(@Body() messageData: any) {
    try {
      console.log('=== CONTROLLER: ENVIO DE MENSAGEM DE TESTE ===');
      console.log('Dados recebidos:', JSON.stringify(messageData, null, 2));
      
      const result = await this.whatsappAdminService.sendTestMessage(messageData);
      
      console.log('=== CONTROLLER: MENSAGEM ENVIADA ===');
      return result;
    } catch (error) {
      console.error('=== CONTROLLER: ERRO NO ENVIO ===');
      console.error('Erro completo:', error);
      console.error('Stack trace:', error.stack);
      console.error('Mensagem:', error.message);
      
      throw new HttpException(
        {
          message: 'Erro ao enviar mensagem de teste',
          details: error.message,
          code: error.code || 'UNKNOWN'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status')
  async getStatus() {
    try {
      return await this.whatsappAdminService.getStatus();
    } catch (error) {
      throw new HttpException(
        'Erro ao buscar status WhatsApp',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('message/:messageId/status')
  async getMessageStatus(@Param('messageId') messageId: string) {
    try {
      return await this.whatsappAdminService.getMessageStatus(messageId);
    } catch (error) {
      throw new HttpException(
        'Erro ao buscar status da mensagem',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 