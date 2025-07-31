import { Controller, Get, Post, Put, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WhatsAppAdminService } from './whatsapp-admin.service';

@Controller('admin/whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppAdminController {
  constructor(private readonly whatsappAdminService: WhatsAppAdminService) {}

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