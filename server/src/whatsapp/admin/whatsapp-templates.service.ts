import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WhatsAppGlobalTemplate, WhatsAppGlobalTemplateDocument } from '../entities/whatsapp-global-template.schema';

@Injectable()
export class WhatsAppTemplatesService {
  constructor(
    @InjectModel(WhatsAppGlobalTemplate.name) 
    private whatsappGlobalTemplateModel: Model<WhatsAppGlobalTemplateDocument>,
  ) {}

  async getAllTemplates(filters: { category?: string; status?: string; search?: string }) {
    try {
      const query: any = { isGlobal: true };

      // Aplicar filtros
      if (filters.category) {
        query.category = filters.category;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { 'content.body': { $regex: filters.search, $options: 'i' } }
        ];
      }

      const templates = await this.whatsappGlobalTemplateModel
        .find(query)
        .sort({ createdAt: -1 })
        .exec();

      return templates.map(template => template.toObject());
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      throw error;
    }
  }

  async getTemplateById(id: string) {
    try {
      const template = await this.whatsappGlobalTemplateModel
        .findOne({ _id: id, isGlobal: true })
        .exec();

      return template ? template.toObject() : null;
    } catch (error) {
      console.error('Erro ao buscar template por ID:', error);
      throw error;
    }
  }

  async createTemplate(templateData: any) {
    try {
      // Validar dados obrigatórios
      this.validateTemplateData(templateData);

      // Detectar variáveis automaticamente
      const variables = this.detectVariables(templateData.content.body);

      // Criar template
      const template = new this.whatsappGlobalTemplateModel({
        ...templateData,
        variables,
        isGlobal: true
      });

      const savedTemplate = await template.save();
      return savedTemplate.toObject();
    } catch (error) {
      console.error('Erro ao criar template:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, templateData: any) {
    try {
      // Validar dados obrigatórios
      this.validateTemplateData(templateData);

      // Detectar variáveis automaticamente
      const variables = this.detectVariables(templateData.content.body);

      // Atualizar template
      const updatedTemplate = await this.whatsappGlobalTemplateModel
        .findOneAndUpdate(
          { _id: id, isGlobal: true },
          { 
            ...templateData, 
            variables,
            updatedAt: new Date()
          },
          { new: true }
        )
        .exec();

      return updatedTemplate ? updatedTemplate.toObject() : null;
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string) {
    try {
      const result = await this.whatsappGlobalTemplateModel
        .findOneAndDelete({ _id: id, isGlobal: true })
        .exec();

      return !!result;
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      throw error;
    }
  }

  async duplicateTemplate(id: string) {
    try {
      const originalTemplate = await this.whatsappGlobalTemplateModel
        .findOne({ _id: id, isGlobal: true })
        .exec();

      if (!originalTemplate) {
        return null;
      }

      // Criar cópia do template
      const templateData = originalTemplate.toObject();
      delete templateData._id;
      delete (templateData as any).createdAt;
      delete (templateData as any).updatedAt;

      // Adicionar "(Cópia)" ao nome
      templateData.name = `${templateData.name} (Cópia)`;

      const duplicatedTemplate = new this.whatsappGlobalTemplateModel(templateData);
      const savedTemplate = await duplicatedTemplate.save();

      return savedTemplate.toObject();
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      throw error;
    }
  }

  async getTemplatesByCategory(category: string) {
    try {
      const templates = await this.whatsappGlobalTemplateModel
        .find({ category, status: 'active', isGlobal: true })
        .sort({ name: 1 })
        .exec();

      return templates.map(template => template.toObject());
    } catch (error) {
      console.error('Erro ao buscar templates por categoria:', error);
      throw error;
    }
  }

  async getActiveTemplates() {
    try {
      const templates = await this.whatsappGlobalTemplateModel
        .find({ status: 'active', isGlobal: true })
        .sort({ category: 1, name: 1 })
        .exec();

      return templates.map(template => template.toObject());
    } catch (error) {
      console.error('Erro ao buscar templates ativos:', error);
      throw error;
    }
  }

  async getTemplateStatistics() {
    try {
      const stats = await this.whatsappGlobalTemplateModel.aggregate([
        { $match: { isGlobal: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            inactive: {
              $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
            },
            byCategory: {
              $push: {
                category: '$category',
                status: '$status'
              }
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          total: 0,
          active: 0,
          inactive: 0,
          byCategory: {}
        };
      }

      const stat = stats[0];
      const byCategory = stat.byCategory.reduce((acc: any, item: any) => {
        if (!acc[item.category]) {
          acc[item.category] = { total: 0, active: 0, inactive: 0 };
        }
        acc[item.category].total++;
        if (item.status === 'active') {
          acc[item.category].active++;
        } else {
          acc[item.category].inactive++;
        }
        return acc;
      }, {});

      return {
        total: stat.total,
        active: stat.active,
        inactive: stat.inactive,
        byCategory
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas dos templates:', error);
      throw error;
    }
  }

  private validateTemplateData(templateData: any) {
    if (!templateData.name || templateData.name.trim() === '') {
      throw new Error('Nome do template é obrigatório');
    }

    if (!templateData.category || !['indicadores', 'leads', 'geral'].includes(templateData.category)) {
      throw new Error('Categoria inválida');
    }

    if (!templateData.content || !templateData.content.body || templateData.content.body.trim() === '') {
      throw new Error('Conteúdo da mensagem é obrigatório');
    }

    if (templateData.status && !['active', 'inactive'].includes(templateData.status)) {
      throw new Error('Status inválido');
    }
  }

  private detectVariables(content: string): string[] {
    if (!content) return [];
    
    const variables = content.match(/\{\{([^}]+)\}\}/g) || [];
    const uniqueVariables = [...new Set(variables.map(v => v.replace(/\{\{|\}\}/g, '')))];
    
    return uniqueVariables;
  }
} 