import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  UseGuards,
  Request,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { WhatsAppClientService, CreateWhatsAppClientConfigDto, UpdateWhatsAppClientConfigDto } from './whatsapp-client.service';
import { JwtClientAuthGuard } from '../../auth/guards/jwt-client-auth.guard';

@Controller('whatsapp/client')
export class WhatsAppClientController {
  constructor(private readonly whatsAppClientService: WhatsAppClientService) {}

  /**
   * Criar configuração de WhatsApp para o cliente autenticado
   */
  @Post('config')
  @UseGuards(JwtClientAuthGuard)
  async createConfig(
    @Request() req,
    @Body() createDto: CreateWhatsAppClientConfigDto
  ) {
    try {
      // Usar o clientId do token JWT
      const clientId = req.user.clientId;
      
      const config = await this.whatsAppClientService.createConfig({
        ...createDto,
        clientId
      });

      return {
        success: true,
        message: 'Configuração de WhatsApp criada com sucesso',
        data: config
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao criar configuração de WhatsApp',
          error: error.response?.message || error.message
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Buscar configuração de WhatsApp do cliente autenticado
   */
  @Get('config')
  @UseGuards(JwtClientAuthGuard)
  async getConfig(@Request() req) {
    try {
      const clientId = req.user.clientId;
      const config = await this.whatsAppClientService.getConfigByClientId(clientId);

      return {
        success: true,
        data: config
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao buscar configuração de WhatsApp',
          error: error.response?.message || error.message
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Atualizar configuração de WhatsApp do cliente autenticado
   */
  @Put('config')
  @UseGuards(JwtClientAuthGuard)
  async updateConfig(
    @Request() req,
    @Body() updateDto: UpdateWhatsAppClientConfigDto
  ) {
    try {
      const clientId = req.user.clientId;
      const config = await this.whatsAppClientService.updateConfig(clientId, updateDto);

      return {
        success: true,
        message: 'Configuração de WhatsApp atualizada com sucesso',
        data: config
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao atualizar configuração de WhatsApp',
          error: error.response?.message || error.message
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Enviar mensagem de teste
   */
  @Post('message')
  @UseGuards(JwtClientAuthGuard)
  async sendTestMessage(
    @Request() req,
    @Body() messageData: { to: string; message: string }
  ) {
    try {
      const clientId = req.user.clientId;
      const result = await this.whatsAppClientService.sendTestMessage(clientId, messageData);

      return {
        success: true,
        message: 'Mensagem enviada com sucesso',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao enviar mensagem',
          error: error.response?.message || error.message
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Obter histórico de mensagens do cliente
   */
  @Get('messages')
  @UseGuards(JwtClientAuthGuard)
  async getMessageHistory(@Request() req) {
    try {
      const clientId = req.user.clientId;
      const messages = await this.whatsAppClientService.getMessageHistory(clientId);

      return {
        success: true,
        data: messages
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao buscar histórico de mensagens',
          error: error.response?.message || error.message
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }
} 