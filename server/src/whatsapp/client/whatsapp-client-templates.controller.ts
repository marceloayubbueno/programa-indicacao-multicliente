import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WhatsAppClientTemplatesService, CreateTemplateDto, UpdateTemplateDto, TemplateFilters } from './whatsapp-client-templates.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('client/whatsapp/templates')
@UseGuards(JwtAuthGuard)
export class WhatsAppClientTemplatesController {
  constructor(private readonly whatsappClientTemplatesService: WhatsAppClientTemplatesService) {}

  @Post()
  async createTemplate(@Request() req, @Body() templateData: CreateTemplateDto) {
    try {
      const clientId = req.user.clientId;
      const template = await this.whatsappClientTemplatesService.createTemplate(clientId, templateData);
      
      return {
        success: true,
        message: 'Template criado com sucesso',
        data: template,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao criar template',
      };
    }
  }

  @Get()
  async getAllTemplates(@Request() req, @Query() filters: TemplateFilters) {
    try {
      const clientId = req.user.clientId;
      const templates = await this.whatsappClientTemplatesService.getAllTemplates(clientId, filters);
      
      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao buscar templates',
      };
    }
  }

  @Get('global')
  async getGlobalTemplates() {
    try {
      const templates = await this.whatsappClientTemplatesService.getGlobalTemplates();
      
      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao buscar templates globais',
      };
    }
  }

  @Get('stats')
  async getTemplateStats(@Request() req) {
    try {
      const clientId = req.user.clientId;
      const stats = await this.whatsappClientTemplatesService.getTemplateStats(clientId);
      
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao buscar estatísticas',
      };
    }
  }

  @Get(':id')
  async getTemplateById(@Request() req, @Param('id') id: string) {
    try {
      const clientId = req.user.clientId;
      const template = await this.whatsappClientTemplatesService.getTemplateById(clientId, id);
      
      return {
        success: true,
        data: template,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao buscar template',
      };
    }
  }

  @Put(':id')
  async updateTemplate(@Request() req, @Param('id') id: string, @Body() templateData: UpdateTemplateDto) {
    try {
      const clientId = req.user.clientId;
      const template = await this.whatsappClientTemplatesService.updateTemplate(clientId, id, templateData);
      
      return {
        success: true,
        message: 'Template atualizado com sucesso',
        data: template,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao atualizar template',
      };
    }
  }

  @Delete(':id')
  async deleteTemplate(@Request() req, @Param('id') id: string) {
    try {
      const clientId = req.user.clientId;
      const result = await this.whatsappClientTemplatesService.deleteTemplate(clientId, id);
      
      if (result) {
        return {
          success: true,
          message: 'Template deletado com sucesso',
        };
      } else {
        return {
          success: false,
          message: 'Template não encontrado',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao deletar template',
      };
    }
  }

  @Post(':id/duplicate')
  async duplicateTemplate(@Request() req, @Param('id') id: string) {
    try {
      const clientId = req.user.clientId;
      const template = await this.whatsappClientTemplatesService.duplicateTemplate(clientId, id);
      
      return {
        success: true,
        message: 'Template duplicado com sucesso',
        data: template,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao duplicar template',
      };
    }
  }

  @Post('global/:id/create')
  async createFromGlobalTemplate(@Request() req, @Param('id') globalTemplateId: string) {
    try {
      const clientId = req.user.clientId;
      const template = await this.whatsappClientTemplatesService.createFromGlobalTemplate(clientId, globalTemplateId);
      
      return {
        success: true,
        message: 'Template criado a partir do template global com sucesso',
        data: template,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao criar template a partir do global',
      };
    }
  }
} 