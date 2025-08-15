import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { WhatsAppAdminController } from './admin/whatsapp-admin.controller';
import { WhatsAppAdminService } from './admin/whatsapp-admin.service';
import { WhatsAppClientController } from './client/whatsapp-client.controller';
import { WhatsAppClientService } from './client/whatsapp-client.service';
import { WhatsAppClientTemplatesController } from './client/whatsapp-client-templates.controller';
import { WhatsAppClientTemplatesService } from './client/whatsapp-client-templates.service';
import { TwilioController } from './providers/twilio.controller';
import { TwilioService } from './providers/twilio.service';
import { WhatsAppConfig, WhatsAppConfigSchema } from './entities/whatsapp-config.schema';
import { WhatsAppClientConfig, WhatsAppClientConfigSchema } from './entities/whatsapp-client-config.schema';
import { WhatsAppTemplate, WhatsAppTemplateSchema } from './entities/whatsapp-template.schema';
import { WhatsAppFlow, WhatsAppFlowSchema } from './entities/whatsapp-flow.schema';
import { WhatsAppMessage, WhatsAppMessageSchema } from './entities/whatsapp-message.schema';
import { WhatsAppTwilioConfig, WhatsAppTwilioConfigSchema } from './providers/whatsapp-twilio-config.schema';
import { CompanyHeaderModule } from './company-header/company-header.module';
import { WhatsAppCompanyHeader, WhatsAppCompanyHeaderSchema } from './entities/whatsapp-company-header.schema';
import { WhatsAppFlowModule } from './flows/whatsapp-flow.module';
import { WhatsAppFlowController } from './flows/whatsapp-flow.controller';
import { WhatsAppQueueModule } from './whatsapp-queue.module';
import { WhatsAppQueue, WhatsAppQueueSchema } from './entities/whatsapp-queue.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppConfig.name, schema: WhatsAppConfigSchema },
      { name: WhatsAppClientConfig.name, schema: WhatsAppClientConfigSchema },
      { name: WhatsAppTemplate.name, schema: WhatsAppTemplateSchema },
      { name: WhatsAppFlow.name, schema: WhatsAppFlowSchema },
      { name: WhatsAppMessage.name, schema: WhatsAppMessageSchema },
      { name: WhatsAppTwilioConfig.name, schema: WhatsAppTwilioConfigSchema },
      { name: WhatsAppCompanyHeader.name, schema: WhatsAppCompanyHeaderSchema },
      { name: WhatsAppQueue.name, schema: WhatsAppQueueSchema },
    ]),
    CompanyHeaderModule,
    WhatsAppFlowModule,
    WhatsAppQueueModule,
  ],
  controllers: [
    WhatsAppAdminController,
    WhatsAppClientController,
    WhatsAppClientTemplatesController,
    TwilioController,
    WhatsAppFlowController,
  ],
  providers: [
    WhatsAppAdminService,
    WhatsAppClientService,
    WhatsAppClientTemplatesService,
    TwilioService,
  ],
  exports: [
    WhatsAppAdminService,
    WhatsAppClientService,
    WhatsAppClientTemplatesService,
    WhatsAppFlowModule,
    WhatsAppQueueModule,
  ],
})
export class WhatsAppModule {} 