import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailTemplatesService } from './email-templates.service';
import { EmailTemplatesController } from './email-templates.controller';
import { EmailTemplate, EmailTemplateSchema } from './entities/email-template.schema';
import { EmailConfig, EmailConfigSchema } from './entities/email-config.schema';
import { MailService } from '../common/mail.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: EmailConfig.name, schema: EmailConfigSchema },
    ]),
  ],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService, MailService],
  exports: [EmailTemplatesService],
})
export class EmailTemplatesModule {} 