import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request, 
  Query,
  BadRequestException 
} from '@nestjs/common';
import { EmailTemplatesService, BulkSendResult } from './email-templates.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { CreateEmailConfigDto } from './dto/create-email-config.dto';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { JwtClientAuthGuard } from '../auth/guards/jwt-client-auth.guard';

@Controller('email-templates')
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  // ===== EMAIL TEMPLATES =====

  @UseGuards(JwtClientAuthGuard)
  @Post()
  async create(@Body() createEmailTemplateDto: CreateEmailTemplateDto, @Request() req) {
    const clientId = req.user?.clientId || req.user?.sub;
    createEmailTemplateDto.clientId = clientId;
    
    return this.emailTemplatesService.create(createEmailTemplateDto);
  }

  @UseGuards(JwtClientAuthGuard)
  @Get()
  async findAll(@Request() req, @Query('type') type?: string) {
    const clientId = req.user?.clientId || req.user?.sub;
    console.log('🔍 [CONTROLLER] findAll - req.user:', req.user);
    console.log('🔍 [CONTROLLER] findAll - clientId extraído:', clientId);
    console.log('🔍 [CONTROLLER] findAll - type:', type);
    
    return this.emailTemplatesService.findAll(clientId, type);
  }

  @UseGuards(JwtClientAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.emailTemplatesService.findOne(id);
  }

  @UseGuards(JwtClientAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateEmailTemplateDto: UpdateEmailTemplateDto) {
    return this.emailTemplatesService.update(id, updateEmailTemplateDto);
  }

  @UseGuards(JwtClientAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.emailTemplatesService.remove(id);
  }

  @UseGuards(JwtClientAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    if (!status || !['active', 'inactive', 'draft'].includes(status)) {
      throw new BadRequestException('Status inválido');
    }
    
    return this.emailTemplatesService.updateStatus(id, status);
  }

  @UseGuards(JwtClientAuthGuard)
  @Post(':id/send-test')
  async sendTestEmail(@Param('id') id: string, @Body('testEmail') testEmail: string) {
    if (!testEmail) {
      throw new BadRequestException('E-mail de teste é obrigatório');
    }
    
    return this.emailTemplatesService.sendTestEmail(id, testEmail);
  }

  @UseGuards(JwtClientAuthGuard)
  @Post(':id/send-bulk')
  async sendBulkEmail(
    @Param('id') templateId: string,
    @Body() bulkData: {
      recipients: {
        listIds: string[];
        participantIds: string[];
      };
      subject: string;
      senderName?: string;
      scheduleAt?: Date;
    },
    @Request() req
  ) {
    // 🚨 DEBUG: Log imediato para verificar se requisição chega
    console.log('🚨 [DEBUG-SEND-BULK] ===== ENDPOINT CHAMADO =====');
    console.log('🚨 [DEBUG-SEND-BULK] Template ID:', templateId);
    console.log('🚨 [DEBUG-SEND-BULK] Bulk Data:', JSON.stringify(bulkData, null, 2));
    console.log('🚨 [DEBUG-SEND-BULK] Request URL:', req.url);
    console.log('🚨 [DEBUG-SEND-BULK] Request Method:', req.method);
    console.log('🚨 [DEBUG-SEND-BULK] ================================');
    
    const clientId = req.user?.clientId || req.user?.sub;
    
    console.log('📤 [BULK-SEND] Endpoint chamado:', {
      templateId,
      clientId,
      listIds: bulkData.recipients?.listIds?.length || 0,
      participantIds: bulkData.recipients?.participantIds?.length || 0,
      subject: bulkData.subject
    });
    
    // Validações básicas
    if (!bulkData.recipients || (!bulkData.recipients.listIds?.length && !bulkData.recipients.participantIds?.length)) {
      throw new BadRequestException('Pelo menos uma lista ou participante deve ser selecionado');
    }
    
    if (!bulkData.subject?.trim()) {
      throw new BadRequestException('Assunto do e-mail é obrigatório');
    }
    
    return this.emailTemplatesService.sendBulkEmail(templateId, clientId, bulkData);
  }

  @UseGuards(JwtClientAuthGuard)
  @Post('test')
  async testTemplateDirect(@Body() body: { testEmail: string; htmlContent: string; css?: string; subject?: string }, @Request() req) {
    if (!body.testEmail) {
      throw new BadRequestException('E-mail de teste é obrigatório');
    }
    
    if (!body.htmlContent) {
      throw new BadRequestException('Conteúdo HTML é obrigatório');
    }
    
    const clientId = req.user?.clientId || req.user?.sub;
    
    return this.emailTemplatesService.testTemplateDirect(clientId, body.testEmail, body.htmlContent, body.css, body.subject);
  }

  // ===== EMAIL CONFIG =====

  @UseGuards(JwtClientAuthGuard)
  @Post('config')
  async createConfig(@Body() createEmailConfigDto: CreateEmailConfigDto, @Request() req) {
    console.log('📧 [EMAIL-CONFIG] POST /config chamado');
    console.log('📧 [EMAIL-CONFIG] Body recebido:', createEmailConfigDto);
    
    const clientId = req.user?.clientId || req.user?.sub;
    console.log('📧 [EMAIL-CONFIG] ClientId extraído:', clientId);
    
    createEmailConfigDto.clientId = clientId;
    
    try {
      const result = await this.emailTemplatesService.createConfig(createEmailConfigDto);
      console.log('📧 [EMAIL-CONFIG] Configuração criada com sucesso');
      return result;
    } catch (error) {
      console.error('📧 [EMAIL-CONFIG] Erro ao criar configuração:', error.message);
      throw error;
    }
  }

  @UseGuards(JwtClientAuthGuard)
  @Get('config/me')
  async findMyConfig(@Request() req) {
    const clientId = req.user?.clientId || req.user?.sub;
    
    try {
      return this.emailTemplatesService.findConfigByClientId(clientId);
    } catch (error) {
      if (error.message === 'Configuração de e-mail não encontrada') {
        return { message: 'Nenhuma configuração encontrada', config: null };
      }
      throw error;
    }
  }

  @UseGuards(JwtClientAuthGuard)
  @Patch('config/me')
  async updateMyConfig(@Body() updateEmailConfigDto: UpdateEmailConfigDto, @Request() req) {
    console.log('📧 [EMAIL-CONFIG] PATCH /config/me chamado');
    console.log('📧 [EMAIL-CONFIG] Body recebido:', updateEmailConfigDto);
    
    const clientId = req.user?.clientId || req.user?.sub;
    console.log('📧 [EMAIL-CONFIG] ClientId extraído:', clientId);
    
    try {
      const result = await this.emailTemplatesService.updateConfig(clientId, updateEmailConfigDto);
      console.log('📧 [EMAIL-CONFIG] Configuração atualizada com sucesso');
      return result;
    } catch (error) {
      console.error('📧 [EMAIL-CONFIG] Erro ao atualizar configuração:', error.message);
      throw error;
    }
  }

  @UseGuards(JwtClientAuthGuard)
  @Post('config/test')
  async testConfig(@Body('testEmail') testEmail: string, @Request() req) {
    if (!testEmail) {
      throw new BadRequestException('E-mail de teste é obrigatório');
    }
    
    const clientId = req.user?.clientId || req.user?.sub;
    
    return this.emailTemplatesService.testConfig(clientId, testEmail);
  }

  @UseGuards(JwtClientAuthGuard)
  @Post('config/test-send')
  async testSendEmail(@Body() testData: { testEmail: string; subject?: string; message?: string }, @Request() req) {
    if (!testData.testEmail) {
      throw new BadRequestException('E-mail de teste é obrigatório');
    }
    
    const clientId = req.user?.clientId || req.user?.sub;
    
    return this.emailTemplatesService.testSendEmail(clientId, testData);
  }

  // ===== ENDPOINTS AUXILIARES =====

  @UseGuards(JwtClientAuthGuard)
  @Get('types/available')
  async getAvailableTypes() {
    return {
      types: [
        { value: 'welcome', label: 'E-mail de Boas-vindas', description: 'Enviado automaticamente aos novos indicadores' },
        { value: 'campaign', label: 'E-mail de Campanha', description: 'Campanhas personalizadas de marketing' },
        { value: 'flow', label: 'E-mail de Fluxo', description: 'Parte de sequências automatizadas' },
        { value: 'notification', label: 'E-mail de Notificação', description: 'Notificações do sistema' }
      ]
    };
  }

  @UseGuards(JwtClientAuthGuard)
  @Get('stats/overview')
  async getStatsOverview(@Request() req) {
    const clientId = req.user?.clientId || req.user?.sub;
    
    const [welcomeTemplates, campaignTemplates, flowTemplates, notificationTemplates] = await Promise.all([
      this.emailTemplatesService.findAll(clientId, 'welcome'),
      this.emailTemplatesService.findAll(clientId, 'campaign'),
      this.emailTemplatesService.findAll(clientId, 'flow'),
      this.emailTemplatesService.findAll(clientId, 'notification')
    ]);

    const totalEmailsSent = [
      ...welcomeTemplates.templates,
      ...campaignTemplates.templates,
      ...flowTemplates.templates,
      ...notificationTemplates.templates
    ].reduce((total, template) => total + (template.emailsSent || 0), 0);

    return {
      stats: {
        totalTemplates: welcomeTemplates.total + campaignTemplates.total + flowTemplates.total + notificationTemplates.total,
        welcomeTemplates: welcomeTemplates.total,
        campaignTemplates: campaignTemplates.total,
        flowTemplates: flowTemplates.total,
        notificationTemplates: notificationTemplates.total,
        totalEmailsSent,
        activeTemplates: [
          ...welcomeTemplates.templates,
          ...campaignTemplates.templates,
          ...flowTemplates.templates,
          ...notificationTemplates.templates
        ].filter(t => t.status === 'active').length
      }
    };
  }
} 