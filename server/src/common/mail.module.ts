import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailService } from './mail.service';
import { EmailConfig, EmailConfigSchema } from '../email-templates/entities/email-config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailConfig.name, schema: EmailConfigSchema },
    ]),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {} 