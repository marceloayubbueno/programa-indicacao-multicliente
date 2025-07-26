import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailConfigController } from './email-config.controller';
import { EmailConfigService } from './email-config.service';
import { ApiEmailConfig, ApiEmailConfigSchema } from './entities/email-config.schema';
import { MailService } from '../common/mail.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApiEmailConfig.name, schema: ApiEmailConfigSchema }
    ])
  ],
  controllers: [EmailConfigController],
  providers: [EmailConfigService, MailService],
  exports: [EmailConfigService]
})
export class EmailConfigModule {} 