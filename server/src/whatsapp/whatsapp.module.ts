import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppAdminController } from './admin/whatsapp-admin.controller';
import { WhatsAppAdminService } from './admin/whatsapp-admin.service';
import { WhatsAppTemplatesController } from './admin/whatsapp-templates.controller';
import { WhatsAppTemplatesService } from './admin/whatsapp-templates.service';
import { WhatsAppClientController } from './client/whatsapp-client.controller';
import { WhatsAppClientService } from './client/whatsapp-client.service';
import { WhatsAppClientTemplatesController } from './client/whatsapp-client-templates.controller';
import { WhatsAppClientTemplatesService } from './client/whatsapp-client-templates.service';
import { WhatsAppConfig, WhatsAppConfigSchema } from './entities/whatsapp-config.schema';
import { WhatsAppTemplate, WhatsAppTemplateSchema } from './entities/whatsapp-template.schema';
import { WhatsAppGlobalTemplate, WhatsAppGlobalTemplateSchema } from './entities/whatsapp-global-template.schema';
import { WhatsAppFlow, WhatsAppFlowSchema } from './entities/whatsapp-flow.schema';
import { WhatsAppMessage, WhatsAppMessageSchema } from './entities/whatsapp-message.schema';
import { WhatsAppClientConfig, WhatsAppClientConfigSchema } from './entities/whatsapp-client-config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppConfig.name, schema: WhatsAppConfigSchema },
      { name: WhatsAppTemplate.name, schema: WhatsAppTemplateSchema },
      { name: WhatsAppGlobalTemplate.name, schema: WhatsAppGlobalTemplateSchema },
      { name: WhatsAppFlow.name, schema: WhatsAppFlowSchema },
      { name: WhatsAppMessage.name, schema: WhatsAppMessageSchema },
      { name: WhatsAppClientConfig.name, schema: WhatsAppClientConfigSchema },
    ]),
  ],
  controllers: [
    WhatsAppController, 
    WhatsAppAdminController, 
    WhatsAppTemplatesController,
    WhatsAppClientController,
    WhatsAppClientTemplatesController
  ],
  providers: [
    WhatsAppService, 
    WhatsAppAdminService, 
    WhatsAppTemplatesService,
    WhatsAppClientService,
    WhatsAppClientTemplatesService
  ],
  exports: [
    WhatsAppService, 
    WhatsAppAdminService, 
    WhatsAppTemplatesService,
    WhatsAppClientService,
    WhatsAppClientTemplatesService
  ],
})
export class WhatsAppModule {} 