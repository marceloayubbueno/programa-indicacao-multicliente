import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WhatsAppTemplatesService } from './whatsapp-templates.service';

@Controller('admin/whatsapp/templates')
@UseGuards(JwtAuthGuard)
export class WhatsAppTemplatesController {
  constructor(private readonly whatsappTemplatesService: WhatsAppTemplatesService) {}

  @Get()
  async getAllTemplates(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    try {
      return await this.whatsappTemplatesService.getAllTemplates({ category, status, search });
    } catch (error) {
      throw new HttpException(
        'Erro ao buscar templates',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getTemplateById(@Param('id') id: string) {
    try {
      const template = await this.whatsappTemplatesService.getTemplateById(id);
      if (!template) {
        throw new HttpException('Template não encontrado', HttpStatus.NOT_FOUND);
      }
      return template;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erro ao buscar template',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  async createTemplate(@Body() templateData: any) {
    try {
      return await this.whatsappTemplatesService.createTemplate(templateData);
    } catch (error) {
      throw new HttpException(
        `Erro ao criar template: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id')
  async updateTemplate(@Param('id') id: string, @Body() templateData: any) {
    try {
      const template = await this.whatsappTemplatesService.updateTemplate(id, templateData);
      if (!template) {
        throw new HttpException('Template não encontrado', HttpStatus.NOT_FOUND);
      }
      return template;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erro ao atualizar template: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string) {
    try {
      const result = await this.whatsappTemplatesService.deleteTemplate(id);
      if (!result) {
        throw new HttpException('Template não encontrado', HttpStatus.NOT_FOUND);
      }
      return { message: 'Template excluído com sucesso' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erro ao excluir template',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/duplicate')
  async duplicateTemplate(@Param('id') id: string) {
    try {
      const template = await this.whatsappTemplatesService.duplicateTemplate(id);
      if (!template) {
        throw new HttpException('Template não encontrado', HttpStatus.NOT_FOUND);
      }
      return template;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erro ao duplicar template',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 