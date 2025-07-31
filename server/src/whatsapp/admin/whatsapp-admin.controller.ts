import { Controller, Get, Post, Put, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
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
  async testConnection(@Body() testData: { testPhone: string; [key: string]: any }) {
    try {
      return await this.whatsappAdminService.testConnection(testData);
    } catch (error) {
      throw new HttpException(
        'Erro ao testar conexão WhatsApp',
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
} 