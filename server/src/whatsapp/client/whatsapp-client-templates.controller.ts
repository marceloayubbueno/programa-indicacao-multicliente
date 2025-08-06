import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WhatsAppClientTemplatesService, CreateTemplateDto, UpdateTemplateDto, TemplateFilters } from './whatsapp-client-templates.service';
import { JwtClientAuthGuard } from '../../auth/guards/jwt-client-auth.guard';

@Controller('client/whatsapp/templates')
@UseGuards(JwtClientAuthGuard)
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
        data: template
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao criar template',
        error: error.message
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
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao buscar templates',
        error: error.message
      };
    }
  }

  @Get(':id')
  async getTemplateById(@Request() req, @Param('id') templateId: string) {
    try {
      const clientId = req.user.clientId;
      const template = await this.whatsappClientTemplatesService.getTemplateById(clientId, templateId);
      
      return {
        success: true,
        data: template
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao buscar template',
        error: error.message
      };
    }
  }

  @Put(':id')
  async updateTemplate(@Request() req, @Param('id') templateId: string, @Body() templateData: UpdateTemplateDto) {
    try {
      const clientId = req.user.clientId;
      const template = await this.whatsappClientTemplatesService.updateTemplate(clientId, templateId, templateData);
      
      return {
        success: true,
        message: 'Template atualizado com sucesso',
        data: template
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao atualizar template',
        error: error.message
      };
    }
  }

  @Delete(':id')
  async deleteTemplate(@Request() req, @Param('id') templateId: string) {
    try {
      const clientId = req.user.clientId;
      const deleted = await this.whatsappClientTemplatesService.deleteTemplate(clientId, templateId);
      
      if (deleted) {
        return {
          success: true,
          message: 'Template deletado com sucesso'
        };
      } else {
        return {
          success: false,
          message: 'Template não encontrado'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao deletar template',
        error: error.message
      };
    }
  }

  @Post(':id/duplicate')
  async duplicateTemplate(@Request() req, @Param('id') templateId: string) {
    try {
      const clientId = req.user.clientId;
      const template = await this.whatsappClientTemplatesService.duplicateTemplate(clientId, templateId);
      
      return {
        success: true,
        message: 'Template duplicado com sucesso',
        data: template
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao duplicar template',
        error: error.message
      };
    }
  }

  @Get('stats/overview')
  async getTemplateStats(@Request() req) {
    try {
      const clientId = req.user.clientId;
      const stats = await this.whatsappClientTemplatesService.getTemplateStats(clientId);
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao buscar estatísticas',
        error: error.message
      };
    }
  }
} 