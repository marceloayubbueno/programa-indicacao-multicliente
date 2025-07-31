import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppAdminController } from './admin/whatsapp-admin.controller';
import { WhatsAppAdminService } from './admin/whatsapp-admin.service';
import { WhatsAppConfig, WhatsAppConfigSchema } from './entities/whatsapp-config.schema';
import { WhatsAppTemplate, WhatsAppTemplateSchema } from './entities/whatsapp-template.schema';
import { WhatsAppFlow, WhatsAppFlowSchema } from './entities/whatsapp-flow.schema';
import { WhatsAppMessage, WhatsAppMessageSchema } from './entities/whatsapp-message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppConfig.name, schema: WhatsAppConfigSchema },
      { name: WhatsAppTemplate.name, schema: WhatsAppTemplateSchema },
      { name: WhatsAppFlow.name, schema: WhatsAppFlowSchema },
      { name: WhatsAppMessage.name, schema: WhatsAppMessageSchema },
    ]),
  ],
  controllers: [WhatsAppController, WhatsAppAdminController],
  providers: [WhatsAppService, WhatsAppAdminService],
  exports: [WhatsAppService, WhatsAppAdminService],
})
export class WhatsAppModule {} 