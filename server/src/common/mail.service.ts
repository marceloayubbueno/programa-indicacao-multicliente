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
  }, apiKey: string): Promise<void> {
    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
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
        },
        {
          headers: {
            'api-key': apiKey,
            'content-type': 'application/json'
          }
        }
      );

      if (response.status !== 201) {
        throw new Error(`Brevo API error: ${response.status} - ${response.statusText}`);
      }

      console.log(`[BREVO] Email enviado com sucesso para ${emailData.to}`);
    } catch (error) {
      console.error('[BREVO ERROR]', error.response?.data || error.message);
      throw new InternalServerErrorException(`Erro ao enviar email via Brevo: ${error.message}`);
    }
  }

  // 📧 Enviar email via SendGrid API
  async sendMailViaSendGrid(emailData: {
    to: string;
    subject: string;
    html: string;
    from?: string;
    fromName?: string;
  }, apiKey: string): Promise<void> {
    try {
      const response = await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [
            {
              to: [
                {
                  email: emailData.to,
                  name: emailData.to.split('@')[0]
                }
              ]
            }
          ],
          from: {
            email: emailData.from || 'noreply@example.com',
            name: emailData.fromName || 'Sistema'
          },
          subject: emailData.subject,
          content: [
            {
              type: 'text/html',
              value: emailData.html
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 202) {
        throw new Error(`SendGrid API error: ${response.status} - ${response.statusText}`);
      }

      console.log(`[SENDGRID] Email enviado com sucesso para ${emailData.to}`);
    } catch (error) {
      console.error('[SENDGRID ERROR]', error.response?.data || error.message);
      throw new InternalServerErrorException(`Erro ao enviar email via SendGrid: ${error.message}`);
    }
  }
} 