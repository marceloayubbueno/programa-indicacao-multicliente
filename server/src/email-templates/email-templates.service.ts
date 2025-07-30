import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmailTemplate, EmailTemplateDocument } from './entities/email-template.schema';
import { EmailConfig, EmailConfigDocument } from './entities/email-config.schema';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { CreateEmailConfigDto } from './dto/create-email-config.dto';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { MailService } from '../common/mail.service';
import { Participant } from '../clients/entities/participant.schema';
import { ParticipantList } from '../clients/entities/participant-list.schema';

// Interfaces para tipagem do envio em massa
export interface BulkSendResult {
  recipient: string;
  status: 'success' | 'error';
  method?: 'smtp' | 'brevo' | 'default';
  message: string;
}

export interface ProcessingResults {
  processed: number;
  errors: number;
  details: BulkSendResult[];
}

export interface Recipient {
  _id: string;
  name: string;
  email: string;
  source: string;
}

@Injectable()
export class EmailTemplatesService {
  constructor(
    @InjectModel(EmailTemplate.name) private emailTemplateModel: Model<EmailTemplateDocument>,
    @InjectModel(EmailConfig.name) private emailConfigModel: Model<EmailConfigDocument>,
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
    @InjectModel(ParticipantList.name) private participantListModel: Model<ParticipantList>,
    private mailService: MailService,
  ) {}

  // ===== EMAIL TEMPLATES =====

  async create(createEmailTemplateDto: CreateEmailTemplateDto): Promise<EmailTemplate> {
    const template = new this.emailTemplateModel(createEmailTemplateDto);
    return template.save();
  }

  async findAll(clientId?: string, type?: string): Promise<{ templates: EmailTemplate[]; total: number }> {
    console.log('🔍 [BACKEND] findAll chamado com clientId:', clientId);
    console.log('🔍 [BACKEND] findAll chamado com type:', type);
    
    const filter: any = {};
    
    if (clientId) {
      console.log('🔍 [BACKEND] ClientId original:', clientId);
      console.log('🔍 [BACKEND] ClientId é ObjectId válido?', Types.ObjectId.isValid(clientId));
      
      // Tentar buscar tanto como ObjectId quanto como string
      const objectIdFilter = { clientId: new Types.ObjectId(clientId) };
      const stringFilter = { clientId: clientId };
      
      console.log('🔍 [BACKEND] Tentando buscar com ObjectId filter:', objectIdFilter);
      console.log('🔍 [BACKEND] Tentando buscar com string filter:', stringFilter);
      
      // Primeiro, tentar com ObjectId
      let templates = await this.emailTemplateModel
        .find(objectIdFilter)
        .populate('clientId', 'companyName accessEmail')
        .sort({ createdAt: -1 })
        .exec();
      
      console.log('🔍 [BACKEND] Templates encontrados com ObjectId:', templates.length);
      
      // Se não encontrou nada, tentar com string
      if (templates.length === 0) {
        console.log('🔍 [BACKEND] Nenhum template encontrado com ObjectId, tentando com string...');
        templates = await this.emailTemplateModel
          .find(stringFilter)
          .populate('clientId', 'companyName accessEmail')
          .sort({ createdAt: -1 })
          .exec();
        
        console.log('🔍 [BACKEND] Templates encontrados com string:', templates.length);
      }
      
      // Se ainda não encontrou, tentar sem filtro de clientId para ver se há templates
      if (templates.length === 0) {
        console.log('🔍 [BACKEND] Nenhum template encontrado, verificando se há templates no banco...');
        const allTemplates = await this.emailTemplateModel.find({}).limit(5).exec();
        console.log('🔍 [BACKEND] Total de templates no banco (primeiros 5):', allTemplates.length);
        if (allTemplates.length > 0) {
          console.log('🔍 [BACKEND] Exemplo de template no banco:', {
            _id: allTemplates[0]._id,
            name: allTemplates[0].name,
            clientId: allTemplates[0].clientId,
            type: allTemplates[0].type
          });
        }
      }
      
      // Aplicar filtro de tipo se especificado
      if (type && templates.length > 0) {
        templates = templates.filter(t => t.type === type);
        console.log('🔍 [BACKEND] Templates após filtro de tipo:', templates.length);
      }
      
      const total = templates.length;
      console.log('🔍 [BACKEND] Total final:', total);
      
      return { templates, total };
    }
    
    // Se não tem clientId, buscar todos
    console.log('🔍 [BACKEND] Buscando todos os templates (sem clientId)');
    
    const templates = await this.emailTemplateModel
      .find({})
      .populate('clientId', 'companyName accessEmail')
      .sort({ createdAt: -1 })
      .exec();
    
    console.log('🔍 [BACKEND] Total de templates encontrados:', templates.length);
    
    return { templates, total: templates.length };
  }

  async findOne(id: string): Promise<EmailTemplate> {
    const template = await this.emailTemplateModel
      .findById(id)
      .populate('clientId', 'companyName accessEmail')
      .exec();

    if (!template) {
      throw new NotFoundException('Template de e-mail não encontrado');
    }

    return template;
  }

  async update(id: string, updateEmailTemplateDto: UpdateEmailTemplateDto): Promise<EmailTemplate> {
    const template = await this.emailTemplateModel
      .findByIdAndUpdate(id, updateEmailTemplateDto, { new: true })
      .populate('clientId', 'companyName accessEmail')
      .exec();

    if (!template) {
      throw new NotFoundException('Template de e-mail não encontrado');
    }

    return template;
  }

  async remove(id: string): Promise<void> {
    const result = await this.emailTemplateModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('Template de e-mail não encontrado');
    }
  }

  async updateStatus(id: string, status: string): Promise<EmailTemplate> {
    const template = await this.emailTemplateModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate('clientId', 'companyName accessEmail')
      .exec();

    if (!template) {
      throw new NotFoundException('Template de e-mail não encontrado');
    }

    return template;
  }

  async sendTestEmail(id: string, testEmail: string): Promise<{ success: boolean; message: string }> {
    const template = await this.findOne(id);
    const config = await this.findConfigByClientId(template.clientId.toString());

    if (!config || config.status !== 'active') {
      throw new BadRequestException('Configuração de e-mail não encontrada ou inativa');
    }

    try {
      await this.mailService.sendMail({
        to: testEmail,
        subject: template.subject || 'Teste de E-mail',
        html: template.htmlContent,
      });

      return { success: true, message: 'E-mail de teste enviado com sucesso' };
    } catch (error) {
      throw new BadRequestException(`Erro ao enviar e-mail de teste: ${error.message}`);
    }
  }

  async testTemplateDirect(clientId: string, testEmail: string, htmlContent: string, css?: string, subject?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Buscar configuração do cliente
      const config = await this.findConfigByClientId(clientId);

      if (!config || config.status !== 'active') {
        throw new BadRequestException('Configuração de e-mail não encontrada ou inativa');
      }

      // Combinar HTML e CSS
      const fullHtml = css ? `<style>${css}</style>${htmlContent}` : htmlContent;

      // Enviar e-mail de teste
      await this.mailService.sendMail({
        to: testEmail,
        subject: subject || 'Teste de Template de E-mail',
        html: fullHtml,
      });

      console.log(`[EMAIL TEST] E-mail de teste enviado para ${testEmail} do cliente ${clientId}`);

      return { 
        success: true, 
        message: 'E-mail de teste enviado com sucesso! Verifique sua caixa de entrada.' 
      };
    } catch (error) {
      console.error(`[EMAIL TEST ERROR] Erro ao enviar teste para ${testEmail}:`, error);
      throw new BadRequestException(`Erro ao enviar e-mail de teste: ${error.message}`);
    }
  }

  // ===== EMAIL CONFIG =====

  async createConfig(createEmailConfigDto: CreateEmailConfigDto): Promise<EmailConfig> {
    // Verificar se já existe configuração para este cliente
    const existingConfig = await this.emailConfigModel.findOne({ 
      clientId: createEmailConfigDto.clientId 
    }).exec();

    if (existingConfig) {
      throw new BadRequestException('Já existe uma configuração de e-mail para este cliente');
    }

    const config = new this.emailConfigModel(createEmailConfigDto);
    return config.save();
  }

  async findConfigByClientId(clientId: string): Promise<EmailConfig> {
    const config = await this.emailConfigModel
      .findOne({ clientId: new Types.ObjectId(clientId) })
      .populate('clientId', 'companyName accessEmail')
      .exec();

    if (!config) {
      throw new NotFoundException('Configuração de e-mail não encontrada');
    }

    return config;
  }

  async updateConfig(clientId: string, updateEmailConfigDto: UpdateEmailConfigDto): Promise<EmailConfig> {
    const config = await this.emailConfigModel
      .findOneAndUpdate(
        { clientId: new Types.ObjectId(clientId) },
        updateEmailConfigDto,
        { new: true, upsert: true }
      )
      .populate('clientId', 'companyName accessEmail')
      .exec();

    return config;
  }

  async testConfig(clientId: string, testEmail: string): Promise<{ success: boolean; message: string }> {
    const config = await this.findConfigByClientId(clientId);

    try {
      // Criar transporter temporário para teste
      const testTransporter = require('nodemailer').createTransporter({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.isSecure,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword,
        },
      });

      await testTransporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: testEmail,
        subject: 'Teste de Configuração SMTP',
        html: '<h1>Teste de Configuração</h1><p>Se você recebeu este e-mail, a configuração SMTP está funcionando corretamente.</p>',
      });

      // Atualizar status do teste
      await this.emailConfigModel.findOneAndUpdate(
        { clientId: new Types.ObjectId(clientId) },
        { 
          testSuccess: true, 
          lastTestAt: new Date() 
        }
      );

      return { success: true, message: 'Teste de configuração realizado com sucesso' };
    } catch (error) {
      // Atualizar status do teste
      await this.emailConfigModel.findOneAndUpdate(
        { clientId: new Types.ObjectId(clientId) },
        { 
          testSuccess: false, 
          lastTestAt: new Date() 
        }
      );

      throw new BadRequestException(`Erro no teste de configuração: ${error.message}`);
    }
  }

  async testSendEmail(clientId: string, testData: { testEmail: string; subject?: string; message?: string }): Promise<{ success: boolean; method: string; message: string }> {
    try {
      const result = await this.mailService.sendMailWithClientConfig({
        clientId,
        to: testData.testEmail,
        subject: testData.subject || 'Teste de Envio - Configuração SMTP',
        html: testData.message || `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">🧪 Teste de Configuração SMTP</h2>
            <p>Olá!</p>
            <p>Este é um e-mail de teste para validar sua configuração SMTP.</p>
            <p>Se você recebeu este e-mail, sua configuração está funcionando corretamente! ✅</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Enviado via Sistema de Indicação<br>
              Data: ${new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        `,
        fallbackToBrevo: true
      });

      return result;
    } catch (error) {
      throw new BadRequestException(`Erro ao enviar e-mail de teste: ${error.message}`);
    }
  }

  // ===== ENVIO EM MASSA =====

  async sendBulkEmail(
    templateId: string, 
    clientId: string, 
    bulkData: {
      recipients: {
        listIds: string[];
        participantIds: string[];
      };
      subject: string;
      senderName?: string;
      scheduleAt?: Date;
    }
  ): Promise<{
    success: boolean;
    message: string;
    totalRecipients: number;
    processed: number;
    errors: number;
    details: BulkSendResult[];
  }> {
    
    console.log('📤 [BULK-SEND] Iniciando envio em massa:', {
      templateId,
      clientId,
      listIds: bulkData.recipients.listIds?.length || 0,
      participantIds: bulkData.recipients.participantIds?.length || 0
    });

    try {
      // 1. Buscar e validar template
      const template = await this.emailTemplateModel
        .findOne({ 
          _id: new Types.ObjectId(templateId), 
          clientId: new Types.ObjectId(clientId),
          status: 'active'
        })
        .exec();

      if (!template) {
        throw new NotFoundException('Template não encontrado ou não está ativo');
      }

      if (template.type !== 'campaign') {
        throw new BadRequestException('Apenas templates do tipo "campaign" podem ser enviados em massa');
      }

      console.log('✅ [BULK-SEND] Template encontrado:', template.name);

      // 2. Resolver destinatários únicos
      const recipients = await this.resolveRecipients(clientId, bulkData.recipients);
      const totalRecipients = recipients.length;

      if (totalRecipients === 0) {
        throw new BadRequestException('Nenhum destinatário válido encontrado');
      }

      console.log(`📊 [BULK-SEND] ${totalRecipients} destinatários únicos encontrados`);

      // 3. Processar envios
      const results = await this.processBulkSending(
        template,
        clientId,
        recipients,
        bulkData.subject,
        bulkData.senderName
      );

      // 4. Atualizar estatísticas do template
      await this.emailTemplateModel.findByIdAndUpdate(templateId, {
        $inc: { emailsSent: results.processed },
        lastSentAt: new Date()
      });

      console.log('✅ [BULK-SEND] Processamento concluído:', {
        total: totalRecipients,
        processed: results.processed,
        errors: results.errors
      });

      return {
        success: true,
        message: `Envio em massa processado com sucesso`,
        totalRecipients,
        processed: results.processed,
        errors: results.errors,
        details: results.details
      };

    } catch (error) {
      console.error('❌ [BULK-SEND] Erro no envio em massa:', error);
      throw error;
    }
  }

  /**
   * 🔍 Resolve destinatários únicos a partir de listas e IDs individuais
   */
  private async resolveRecipients(
    clientId: string, 
    recipients: { listIds: string[]; participantIds: string[] }
  ): Promise<Recipient[]> {
    
    const allRecipients = new Map(); // Usar Map para evitar duplicatas por email
    const clientObjectId = new Types.ObjectId(clientId);

    // Buscar participantes das listas selecionadas
    if (recipients.listIds && recipients.listIds.length > 0) {
      console.log('📋 [BULK-SEND] Buscando participantes de listas...');
      
      for (const listId of recipients.listIds) {
        try {
          const list = await this.participantListModel
            .findOne({ 
              _id: new Types.ObjectId(listId), 
              clientId: clientObjectId 
            })
            .populate('participants')
            .exec();

          if (list && list.participants) {
            list.participants.forEach((participant: any) => {
              if (participant.email && participant.status === 'ativo') {
                allRecipients.set(participant.email, {
                  _id: participant._id,
                  name: participant.name,
                  email: participant.email,
                  source: `lista:${list.name}`
                });
              }
            });
          }
        } catch (error) {
          console.error(`❌ [BULK-SEND] Erro ao buscar lista ${listId}:`, error);
        }
      }
    }

    // Buscar participantes individuais selecionados
    if (recipients.participantIds && recipients.participantIds.length > 0) {
      console.log('👤 [BULK-SEND] Buscando participantes individuais...');
      
      const individualParticipants = await this.participantModel
        .find({
          _id: { $in: recipients.participantIds.map(id => new Types.ObjectId(id)) },
          clientId: clientObjectId,
          status: 'ativo'
        })
        .exec();

      individualParticipants.forEach(participant => {
        if (participant.email) {
          allRecipients.set(participant.email, {
            _id: participant._id,
            name: participant.name,
            email: participant.email,
            source: 'individual'
          });
        }
      });
    }

    const uniqueRecipients = Array.from(allRecipients.values());
    
    console.log(`🔍 [BULK-SEND] Destinatários resolvidos: ${uniqueRecipients.length} únicos`);
    
    return uniqueRecipients;
  }

  /**
   * 📤 Processa envios em lote
   */
  private async processBulkSending(
    template: any,
    clientId: string,
    recipients: Recipient[],
    subject: string,
    senderName?: string
  ): Promise<ProcessingResults> {
    
    const results: ProcessingResults = {
      processed: 0,
      errors: 0,
      details: []
    };

    console.log(`📤 [BULK-SEND] Iniciando processamento de ${recipients.length} envios...`);

    // Processar em lotes de 10 para não sobrecarregar
    const batchSize = 10;
    const batches: Recipient[][] = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`📦 [BULK-SEND] Processando lote ${batchIndex + 1}/${batches.length} (${batch.length} destinatários)`);

      const batchPromises = batch.map(async (recipient) => {
        try {
          // Personalizar HTML com variáveis do destinatário
          const personalizedHtml = this.personalizeTemplate(template.htmlContent, {
            nome: recipient.name,
            email: recipient.email,
            // Adicionar mais variáveis conforme necessário
          });

          // Enviar e-mail
          const result = await this.mailService.sendMailWithClientConfig({
            clientId,
            to: recipient.email,
            subject: subject,
            html: personalizedHtml,
            fallbackToBrevo: true
          });

          results.processed++;
          results.details.push({
            recipient: recipient.email,
            status: 'success',
            method: result.method,
            message: result.message
          });

          console.log(`✅ [BULK-SEND] Enviado para ${recipient.email} via ${result.method}`);

        } catch (error) {
          results.errors++;
          results.details.push({
            recipient: recipient.email,
            status: 'error',
            message: error.message
          });

          console.error(`❌ [BULK-SEND] Erro ao enviar para ${recipient.email}:`, error.message);
        }
      });

      // Aguardar conclusão do lote atual
      await Promise.all(batchPromises);
      
      // Pequena pausa entre lotes para não sobrecarregar
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`🎯 [BULK-SEND] Processamento concluído: ${results.processed} sucessos, ${results.errors} erros`);
    
    return results;
  }

  /**
   * 🎨 Personaliza template com variáveis do destinatário
   */
  private personalizeTemplate(htmlContent: string, variables: Record<string, string>): string {
    let personalizedHtml = htmlContent;
    
    // Substituir variáveis básicas
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      personalizedHtml = personalizedHtml.replace(regex, value || '');
    });

    // Adicionar variáveis de data/hora se não existirem
    if (!variables.dataCriacao) {
      personalizedHtml = personalizedHtml.replace(/{{dataCriacao}}/g, new Date().toLocaleDateString('pt-BR'));
    }

    return personalizedHtml;
  }

  // ===== MÉTODOS AUXILIARES =====

  async getDefaultTemplate(clientId: string, type: string): Promise<EmailTemplate | null> {
    return this.emailTemplateModel
      .findOne({ 
        clientId: new Types.ObjectId(clientId), 
        type, 
        isDefault: true,
        status: 'active'
      })
      .exec();
  }

  async incrementEmailsSent(id: string): Promise<void> {
    await this.emailTemplateModel.findByIdAndUpdate(id, {
      $inc: { emailsSent: 1 },
      lastSentAt: new Date()
    }).exec();
  }
} 