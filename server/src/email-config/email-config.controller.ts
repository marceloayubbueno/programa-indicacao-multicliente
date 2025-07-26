import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { EmailConfigService } from './email-config.service';
import { CreateEmailConfigDto, UpdateEmailConfigDto, TestEmailDto } from './dto/create-email-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtClientAuthGuard } from '../auth/guards/jwt-client-auth.guard';

@Controller('email-config')
export class EmailConfigController {
  constructor(private readonly emailConfigService: EmailConfigService) {}

  // 🔧 ADMIN - Criar/Atualizar configuração global
  @UseGuards(JwtAuthGuard)
  @Post('admin/:provider')
  async createOrUpdateGlobalConfig(
    @Param('provider') provider: string,
    @Body() createEmailConfigDto: CreateEmailConfigDto,
  ) {
    createEmailConfigDto.provider = provider;
    createEmailConfigDto.clientId = undefined; // Configuração global
    return this.emailConfigService.createOrUpdateConfig(createEmailConfigDto);
  }

  // 📥 ADMIN - Buscar configuração global
  @UseGuards(JwtAuthGuard)
  @Get('admin/:provider')
  async getGlobalConfig(@Param('provider') provider: string) {
    const config = await this.emailConfigService.findGlobalByProvider(provider);
    if (!config) {
      return { message: 'Configuração não encontrada', config: null };
    }
    return config;
  }

  // 🧪 ADMIN - Testar configuração global
  @UseGuards(JwtAuthGuard)
  @Post('admin/:provider/test')
  async testGlobalConfig(
    @Param('provider') provider: string,
    @Body() testEmailDto: TestEmailDto,
  ) {
    return this.emailConfigService.testEmailConfig(provider, testEmailDto);
  }

  // 📊 ADMIN - Listar todas as configurações globais
  @UseGuards(JwtAuthGuard)
  @Get('admin')
  async getAllGlobalConfigs() {
    return this.emailConfigService.findAll();
  }

  // 🔧 CLIENTE - Criar/Atualizar configuração específica
  @UseGuards(JwtClientAuthGuard)
  @Post(':provider')
  async createOrUpdateClientConfig(
    @Param('provider') provider: string,
    @Body() createEmailConfigDto: CreateEmailConfigDto,
    @Request() req,
  ) {
    createEmailConfigDto.provider = provider;
    createEmailConfigDto.clientId = req.user.clientId;
    return this.emailConfigService.createOrUpdateConfig(createEmailConfigDto);
  }

  // 📥 CLIENTE - Buscar configuração específica
  @UseGuards(JwtClientAuthGuard)
  @Get(':provider')
  async getClientConfig(
    @Param('provider') provider: string,
    @Request() req,
  ) {
    return this.emailConfigService.findByClientAndProvider(req.user.clientId, provider);
  }

  // 🧪 CLIENTE - Testar configuração específica
  @UseGuards(JwtClientAuthGuard)
  @Post(':provider/test')
  async testClientConfig(
    @Param('provider') provider: string,
    @Body() testEmailDto: TestEmailDto,
    @Request() req,
  ) {
    return this.emailConfigService.testEmailConfig(provider, testEmailDto, req.user.clientId);
  }

  // 📊 CLIENTE - Listar configurações do cliente
  @UseGuards(JwtClientAuthGuard)
  @Get()
  async getClientConfigs(@Request() req) {
    return this.emailConfigService.findAll(req.user.clientId);
  }

  // 🔄 ADMIN/CLIENTE - Habilitar/Desabilitar configuração
  @UseGuards(JwtAuthGuard, JwtClientAuthGuard)
  @Put(':id/toggle')
  async toggleConfig(
    @Param('id') id: string,
    @Body() body: { enabled: boolean },
  ) {
    return this.emailConfigService.toggleConfig(id, body.enabled);
  }

  // 🗑️ ADMIN/CLIENTE - Deletar configuração
  @UseGuards(JwtAuthGuard, JwtClientAuthGuard)
  @Delete(':id')
  async deleteConfig(@Param('id') id: string) {
    return this.emailConfigService.deleteConfig(id);
  }
} 