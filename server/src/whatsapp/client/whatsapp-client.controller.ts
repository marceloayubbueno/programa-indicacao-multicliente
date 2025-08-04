import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { WhatsAppClientService, CreateWhatsAppClientConfigDto, UpdateWhatsAppClientConfigDto } from './whatsapp-client.service';
import { JwtClientAuthGuard } from '../../auth/guards/jwt-client-auth.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

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
   * Ativar/Desativar configuração de WhatsApp
   */
  @Put('config/toggle-active')
  @UseGuards(JwtClientAuthGuard)
  async toggleActive(
    @Request() req,
    @Body() body: { isActive: boolean }
  ) {
    try {
      const clientId = req.user.clientId;
      const config = await this.whatsAppClientService.toggleActive(clientId, body.isActive);

      return {
        success: true,
        message: `Configuração ${body.isActive ? 'ativada' : 'desativada'} com sucesso`,
        data: config
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao alterar status da configuração',
          error: error.response?.message || error.message
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Verificar número de WhatsApp
   */
  @Post('config/verify')
  @UseGuards(JwtClientAuthGuard)
  async verifyConfig(@Request() req: any) {
    try {
      const clientId = req.user.clientId;
      const result = await this.whatsAppClientService.verifyConfig(clientId);
      
      return {
        success: result.success,
        message: result.message
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao verificar configuração WhatsApp'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('test-message')
  @UseGuards(JwtClientAuthGuard)
  async sendTestMessage(@Request() req: any, @Body() messageData: any) {
    try {
      console.log('=== CONTROLLER: INÍCIO ENVIO MENSAGEM DE TESTE ===');
      console.log('ClientId:', req.user.clientId);
      console.log('Dados da mensagem:', JSON.stringify(messageData, null, 2));
      
      const clientId = req.user.clientId;
      const result = await this.whatsAppClientService.sendTestMessage(clientId, messageData);
      
      console.log('=== CONTROLLER: MENSAGEM ENVIADA COM SUCESSO ===');
      console.log('Resultado:', result);
      
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

  /**
   * Buscar estatísticas de uso
   */
  @Get('statistics')
  @UseGuards(JwtClientAuthGuard)
  async getStatistics(@Request() req) {
    try {
      const clientId = req.user.clientId;
      const statistics = await this.whatsAppClientService.getStatistics(clientId);

      return {
        success: true,
        data: statistics
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao buscar estatísticas',
          error: error.response?.message || error.message
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Deletar configuração de WhatsApp
   */
  @Delete('config')
  @UseGuards(JwtClientAuthGuard)
  async deleteConfig(@Request() req) {
    try {
      const clientId = req.user.clientId;
      await this.whatsAppClientService.deleteConfig(clientId);

      return {
        success: true,
        message: 'Configuração de WhatsApp deletada com sucesso'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao deletar configuração',
          error: error.response?.message || error.message
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // ===== ENDPOINTS PARA ADMIN =====

  /**
   * Listar todas as configurações (apenas admin)
   */
  @Get('admin/configs')
  @UseGuards(JwtAuthGuard)
  async getAllConfigs(
    @Query('isActive') isActive?: string,
    @Query('isVerified') isVerified?: string,
    @Query('search') search?: string
  ) {
    try {
      const filters: any = {};
      
      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      }
      
      if (isVerified !== undefined) {
        filters.isVerified = isVerified === 'true';
      }
      
      if (search) {
        filters.search = search;
      }

      const configs = await this.whatsAppClientService.getAllConfigs(filters);

      return {
        success: true,
        data: configs,
        total: configs.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao buscar configurações',
          error: error.response?.message || error.message
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Buscar configuração específica por clientId (apenas admin)
   */
  @Get('admin/config/:clientId')
  @UseGuards(JwtAuthGuard)
  async getConfigByClientId(@Param('clientId') clientId: string) {
    try {
      const config = await this.whatsAppClientService.getConfigByClientId(clientId);

      return {
        success: true,
        data: config
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao buscar configuração',
          error: error.response?.message || error.message
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Atualizar configuração específica (apenas admin)
   */
  @Put('admin/config/:clientId')
  @UseGuards(JwtAuthGuard)
  async updateConfigByClientId(
    @Param('clientId') clientId: string,
    @Body() updateDto: UpdateWhatsAppClientConfigDto
  ) {
    try {
      const config = await this.whatsAppClientService.updateConfig(clientId, updateDto);

      return {
        success: true,
        message: 'Configuração atualizada com sucesso',
        data: config
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao atualizar configuração',
          error: error.response?.message || error.message
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Deletar configuração específica (apenas admin)
   */
  @Delete('admin/config/:clientId')
  @UseGuards(JwtAuthGuard)
  async deleteConfigByClientId(@Param('clientId') clientId: string) {
    try {
      await this.whatsAppClientService.deleteConfig(clientId);

      return {
        success: true,
        message: 'Configuração deletada com sucesso'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao deletar configuração',
          error: error.response?.message || error.message
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Verificar número de WhatsApp (apenas admin)
   */
  @Post('admin/config/:clientId/verify')
  @UseGuards(JwtAuthGuard)
  async verifyNumberByClientId(@Param('clientId') clientId: string) {
    try {
      const result = await this.whatsAppClientService.verifyNumber(clientId);

      return {
        success: result.success,
        message: result.message
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao verificar número',
          error: error.response?.message || error.message
        },
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }
} 