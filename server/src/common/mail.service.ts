import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { EmailConfig, EmailConfigDocument } from '../email-templates/entities/email-config.schema';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private defaultTransporter: nodemailer.Transporter;

  constructor(
    @InjectModel(EmailConfig.name) private emailConfigModel: Model<EmailConfigDocument>,
  ) {
    // Criar transporter padrão com variáveis de ambiente (fallback)
    this.defaultTransporter = this.createDefaultTransporter();
  }

  /**
   * 🔧 Criar transporter padrão com variáveis de ambiente
   */
  private createDefaultTransporter(): nodemailer.Transporter {
    if (!process.env.SMTP_HOST) {
      this.logger.warn('SMTP_HOST não configurado nas variáveis de ambiente');
      return null;
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * 🔧 Criar transporter com configuração específica do cliente
   */
  private createClientTransporter(config: EmailConfig): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.isSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });
  }

  /**
   * 📧 Enviar e-mail usando configuração do cliente (PRINCIPAL)
   */
  async sendMailWithClientConfig({
    clientId,
    to,
    subject,
    templatePath,
    variables = {},
    html,
    fallbackToBrevo = true,
  }: {
    clientId: string;
    to: string;
    subject: string;
    templatePath?: string;
    variables?: Record<string, string>;
    html?: string;
    fallbackToBrevo?: boolean;
  }): Promise<{ success: boolean; method: 'smtp' | 'brevo' | 'default'; message: string }> {
    
    this.logger.log(`[MAIL-START] Enviando e-mail para ${to} (cliente: ${clientId})`);

    try {
      // 1️⃣ Tentar buscar configuração SMTP do cliente
      const clientConfig = await this.getClientEmailConfig(clientId);
      
      if (clientConfig && clientConfig.status === 'active') {
        this.logger.log(`[MAIL-SMTP] Usando configuração SMTP do cliente`);
        return await this.sendWithClientSMTP(clientConfig, { to, subject, templatePath, variables, html });
      }

      // 2️⃣ Se fallback habilitado, tentar Brevo API
      if (fallbackToBrevo) {
        this.logger.log(`[MAIL-BREVO] Tentando fallback via Brevo API`);
        return await this.sendWithBrevoFallback({ to, subject, templatePath, variables, html });
      }

      // 3️⃣ Último recurso: transporter padrão
      if (this.defaultTransporter) {
        this.logger.log(`[MAIL-DEFAULT] Usando transporter padrão`);
        return await this.sendWithDefaultTransporter({ to, subject, templatePath, variables, html });
      }

      throw new Error('Nenhuma configuração de e-mail disponível');

    } catch (error) {
      this.logger.error(`[MAIL-ERROR] Erro ao enviar e-mail: ${error.message}`);
      throw new InternalServerErrorException(`Erro ao enviar e-mail: ${error.message}`);
    }
  }

  /**
   * 📧 Enviar via SMTP do cliente
   */
  private async sendWithClientSMTP(
    config: EmailConfig, 
    emailData: { to: string; subject: string; templatePath?: string; variables?: Record<string, string>; html?: string }
  ): Promise<{ success: boolean; method: 'smtp'; message: string }> {
    
    const transporter = this.createClientTransporter(config);
    
    let emailHtml = emailData.html;
    if (emailData.templatePath) {
      const template = fs.readFileSync(path.resolve(emailData.templatePath), 'utf8');
      emailHtml = this.parseTemplate(template, emailData.variables || {});
    }

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailHtml,
      replyTo: config.replyTo || config.fromEmail,
    });

    return { 
      success: true, 
      method: 'smtp', 
      message: `E-mail enviado via SMTP do cliente (${config.smtpHost})` 
    };
  }

  /**
   * 📧 Enviar via Brevo API (fallback)
   */
  private async sendWithBrevoFallback(
    emailData: { to: string; subject: string; templatePath?: string; variables?: Record<string, string>; html?: string }
  ): Promise<{ success: boolean; method: 'brevo'; message: string }> {
    
    // Buscar API Key do Brevo (configuração global do admin)
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      throw new Error('Brevo API Key não configurada');
    }

    let emailHtml = emailData.html;
    if (emailData.templatePath) {
      const template = fs.readFileSync(path.resolve(emailData.templatePath), 'utf8');
      emailHtml = this.parseTemplate(template, emailData.variables || {});
    }

    await this.sendMailViaBrevo({
      to: emailData.to,
      subject: emailData.subject,
      html: emailHtml || '',
      from: process.env.MAIL_FROM || 'sistema@programa-indicacao.com',
      fromName: 'Sistema de Indicação'
    }, brevoApiKey);

    return { 
      success: true, 
      method: 'brevo', 
      message: 'E-mail enviado via Brevo API (fallback)' 
    };
  }

  /**
   * 📧 Enviar via transporter padrão (último recurso)
   */
  private async sendWithDefaultTransporter(
    emailData: { to: string; subject: string; templatePath?: string; variables?: Record<string, string>; html?: string }
  ): Promise<{ success: boolean; method: 'default'; message: string }> {
    
    let emailHtml = emailData.html;
    if (emailData.templatePath) {
      const template = fs.readFileSync(path.resolve(emailData.templatePath), 'utf8');
      emailHtml = this.parseTemplate(template, emailData.variables || {});
    }

    await this.defaultTransporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@programa-indicacao.com',
      to: emailData.to,
      subject: emailData.subject,
      html: emailHtml,
    });

    return { 
      success: true, 
      method: 'default', 
      message: 'E-mail enviado via configuração padrão' 
    };
  }

  /**
   * 🔍 Buscar configuração de e-mail do cliente
   */
  private async getClientEmailConfig(clientId: string): Promise<EmailConfig | null> {
    try {
      const config = await this.emailConfigModel
        .findOne({ 
          clientId: new Types.ObjectId(clientId),
          status: 'active'
        })
        .exec();
      
      return config;
    } catch (error) {
      this.logger.warn(`[MAIL-CONFIG] Erro ao buscar configuração do cliente ${clientId}: ${error.message}`);
      return null;
    }
  }

  /**
   * 📧 Método legado para compatibilidade (DEPRECATED)
   */
  async sendMail({
    to,
    subject,
    templatePath,
    variables = {},
    html,
  }: {
    to: string;
    subject: string;
    templatePath?: string;
    variables?: Record<string, string>;
    html?: string;
  }): Promise<void> {
    this.logger.warn('[MAIL-DEPRECATED] Método sendMail() é deprecated. Use sendMailWithClientConfig()');
    
    if (!this.defaultTransporter) {
      throw new InternalServerErrorException('Transporter padrão não configurado');
    }

    let emailHtml = html;
    if (templatePath) {
      const template = fs.readFileSync(path.resolve(templatePath), 'utf8');
      emailHtml = this.parseTemplate(template, variables);
    }
    
    try {
      await this.defaultTransporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@programa-indicacao.com',
        to,
        subject,
        html: emailHtml,
      });
    } catch (err) {
      throw new InternalServerErrorException('Erro ao enviar e-mail: ' + err.message);
    }
  }

  /**
   * 🔧 Parse de template com variáveis
   */
  private parseTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const key in variables) {
      result = result.replace(new RegExp(`{{\s*${key}\s*}}`, 'g'), variables[key]);
    }
    return result;
  }

  /**
   * 📧 Enviar email via Brevo API (método existente)
   */
  async sendMailViaBrevo(emailData: {
    to: string;
    subject: string;
    html: string;
    from?: string;
    fromName?: string;
  }, apiKey: string): Promise<any> {
    try {
      console.log(`[BREVO START] Iniciando envio para ${emailData.to}`);
      console.log(`[BREVO] API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
      
      const payload = {
        sender: {
          name: emailData.fromName || 'Sistema',
          email: emailData.from || 'noreply@example.com'
        },
        to: [
          {
            email: emailData.to,
            name: emailData.to.split('@')[0]
          }
        ],
        subject: emailData.subject,
        htmlContent: emailData.html
      };

      console.log(`[BREVO] Payload preparado:`, {
        sender: payload.sender,
        to: payload.to,
        subject: payload.subject,
        htmlLength: payload.htmlContent.length
      });

      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        payload,
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`[BREVO SUCCESS] E-mail enviado com sucesso:`, {
        messageId: response.data?.messageId,
        status: response.status
      });

      return response.data;
    } catch (error) {
      console.error(`[BREVO ERROR] Erro ao enviar via Brevo:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }
} 