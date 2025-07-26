import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailConfigController } from './email-config.controller';
import { EmailConfigService } from './email-config.service';
import { EmailConfig, EmailConfigSchema } from './entities/email-config.schema';
import { MailService } from '../common/mail.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailConfig.name, schema: EmailConfigSchema }
    ])
  ],
  controllers: [EmailConfigController],
  providers: [EmailConfigService, MailService],
  exports: [EmailConfigService]
})
export class EmailConfigModule {} 