import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailConfigController } from './email-config.controller';
import { EmailConfigService } from './email-config.service';
import { ApiEmailConfig, ApiEmailConfigSchema } from './entities/email-config.schema';
import { MailModule } from '../common/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApiEmailConfig.name, schema: ApiEmailConfigSchema }
    ]),
    MailModule
  ],
  controllers: [EmailConfigController],
  providers: [EmailConfigService],
  exports: [EmailConfigService]
})
export class EmailConfigModule {} 