import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

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
} 