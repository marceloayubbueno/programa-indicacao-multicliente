import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WhatsAppTemplate, WhatsAppTemplateDocument } from '../entities/whatsapp-template.schema';

export interface CreateTemplateDto {
  name: string;
  category: string;
  language?: string;
  content: {
    header?: {
      type: string;
      text?: string;
      mediaUrl?: string;
    };
    body: string;
    footer?: string;
    buttons?: Array<{
      type: string;
      text: string;
      url?: string;
      phoneNumber?: string;
    }>;
  };
  variables?: string[];
  isGlobal?: boolean;
}

export interface UpdateTemplateDto extends Partial<CreateTemplateDto> {}

export interface TemplateFilters {
  category?: string;
  status?: string;
  search?: string;
}

@Injectable()
export class WhatsAppClientTemplatesService {
  constructor(
    @InjectModel(WhatsAppTemplate.name)
    private whatsappTemplateModel: Model<WhatsAppTemplateDocument>,
  ) {}

  async createTemplate(clientId: string, templateData: CreateTemplateDto): Promise<WhatsAppTemplate> {
    try {
      const template = new this.whatsappTemplateModel({
        clientId: new Types.ObjectId(clientId),
        ...templateData,
        status: 'draft',
        isGlobal: false,
      });

      return await template.save();
    } catch (error) {
      console.error('Erro ao criar template:', error);
      throw new Error('Erro ao criar template');
    }
  }

  async getAllTemplates(clientId: string, filters: TemplateFilters = {}): Promise<WhatsAppTemplate[]> {
    try {
      const query: any = { clientId: new Types.ObjectId(clientId) };

      if (filters.category) {
        query.category = filters.category;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { 'content.body': { $regex: filters.search, $options: 'i' } },
        ];
      }

      return await this.whatsappTemplateModel
        .find(query)
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      throw new Error('Erro ao buscar templates');
    }
  }

  async getTemplateById(clientId: string, templateId: string): Promise<WhatsAppTemplate> {
    try {
      const template = await this.whatsappTemplateModel
        .findOne({
          _id: new Types.ObjectId(templateId),
          clientId: new Types.ObjectId(clientId),
        })
        .exec();

      if (!template) {
        throw new Error('Template não encontrado');
      }

      return template;
    } catch (error) {
      console.error('Erro ao buscar template:', error);
      throw new Error('Erro ao buscar template');
    }
  }

  async updateTemplate(clientId: string, templateId: string, templateData: UpdateTemplateDto): Promise<WhatsAppTemplate> {
    try {
      const updatedTemplate = await this.whatsappTemplateModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(templateId),
            clientId: new Types.ObjectId(clientId),
          },
          { ...templateData, updatedAt: new Date() },
          { new: true }
        )
        .exec();

      if (!updatedTemplate) {
        throw new Error('Template não encontrado');
      }

      return updatedTemplate;
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      throw new Error('Erro ao atualizar template');
    }
  }

  async deleteTemplate(clientId: string, templateId: string): Promise<boolean> {
    try {
      const result = await this.whatsappTemplateModel
        .findOneAndDelete({
          _id: new Types.ObjectId(templateId),
          clientId: new Types.ObjectId(clientId),
        })
        .exec();

      return !!result;
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      throw new Error('Erro ao deletar template');
    }
  }

  async duplicateTemplate(clientId: string, templateId: string): Promise<WhatsAppTemplate> {
    try {
      const originalTemplate = await this.getTemplateById(clientId, templateId);
      
      const templateData = {
        clientId: originalTemplate.clientId,
        name: `${originalTemplate.name} (Cópia)`,
        category: originalTemplate.category,
        language: originalTemplate.language,
        content: originalTemplate.content,
        variables: originalTemplate.variables,
        status: 'draft',
        isGlobal: originalTemplate.isGlobal,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const duplicatedTemplate = new this.whatsappTemplateModel(templateData);
      return await duplicatedTemplate.save();
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      throw new Error('Erro ao duplicar template');
    }
  }

  async getTemplateStats(clientId: string): Promise<any> {
    try {
      const stats = await this.whatsappTemplateModel.aggregate([
        { $match: { clientId: new Types.ObjectId(clientId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const total = await this.whatsappTemplateModel.countDocuments({
        clientId: new Types.ObjectId(clientId)
      });

      return {
        total,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error('Erro ao buscar estatísticas');
    }
  }
} 