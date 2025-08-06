import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppAdminController } from './admin/whatsapp-admin.controller';
import { WhatsAppAdminService } from './admin/whatsapp-admin.service';
import { WhatsAppClientController } from './client/whatsapp-client.controller';
import { WhatsAppClientService } from './client/whatsapp-client.service';
import { WhatsAppClientTemplatesController } from './client/whatsapp-client-templates.controller';
import { WhatsAppClientTemplatesService } from './client/whatsapp-client-templates.service';
import { WhatsAppConfig, WhatsAppConfigSchema } from './entities/whatsapp-config.schema';
import { WhatsAppClientConfig, WhatsAppClientConfigSchema } from './entities/whatsapp-client-config.schema';
import { WhatsAppTemplate, WhatsAppTemplateSchema } from './entities/whatsapp-template.schema';
import { WhatsAppFlow, WhatsAppFlowSchema } from './entities/whatsapp-flow.schema';
import { WhatsAppMessage, WhatsAppMessageSchema } from './entities/whatsapp-message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppConfig.name, schema: WhatsAppConfigSchema },
      { name: WhatsAppClientConfig.name, schema: WhatsAppClientConfigSchema },
      { name: WhatsAppTemplate.name, schema: WhatsAppTemplateSchema },
      { name: WhatsAppFlow.name, schema: WhatsAppFlowSchema },
      { name: WhatsAppMessage.name, schema: WhatsAppMessageSchema },
    ]),
  ],
  controllers: [
    WhatsAppController,
    WhatsAppAdminController,
    WhatsAppClientController,
    WhatsAppClientTemplatesController,
  ],
  providers: [
    WhatsAppService,
    WhatsAppAdminService,
    WhatsAppClientService,
    WhatsAppClientTemplatesService,
  ],
  exports: [
    WhatsAppService,
    WhatsAppAdminService,
    WhatsAppClientService,
    WhatsAppClientTemplatesService,
  ],
})
export class WhatsAppModule {} 