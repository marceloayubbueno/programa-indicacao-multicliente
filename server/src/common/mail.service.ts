import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

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
    let emailHtml = html;
    if (templatePath) {
      const template = fs.readFileSync(path.resolve(templatePath), 'utf8');
      emailHtml = this.parseTemplate(template, variables);
    }
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@programa-indicacao.com',
        to,
        subject,
        html: emailHtml,
      });
    } catch (err) {
      throw new InternalServerErrorException('Erro ao enviar e-mail: ' + err.message);
    }
  }

  private parseTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const key in variables) {
      result = result.replace(new RegExp(`{{\s*${key}\s*}}`, 'g'), variables[key]);
    }
    return result;
  }

  // 📧 Enviar email via Brevo API
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
            'content-type': 'application/json'
          },
          timeout: 30000 // 30 segundos
        }
      );

      console.log(`[BREVO] Resposta da API:`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      if (response.status !== 201) {
        throw new Error(`Brevo API error: ${response.status} - ${response.statusText}`);
      }

      console.log(`[BREVO SUCCESS] Email enviado com sucesso para ${emailData.to}`);
      return response.data;
    } catch (error) {
      console.error('[BREVO ERROR] Detalhes do erro:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers ? {
            'api-key': error.config.headers['api-key'] ? '***PRESENT***' : '***MISSING***',
            'content-type': error.config.headers['content-type']
          } : '***NO HEADERS***'
        }
      });
      throw new InternalServerErrorException(`Erro ao enviar email via Brevo: ${error.message}`);
    }
  }


} 