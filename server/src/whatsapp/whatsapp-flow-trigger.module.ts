import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppFlowTriggerService } from './whatsapp-flow-trigger.service';
import { WhatsAppFlowTriggerController } from './whatsapp-flow-trigger.controller';
import { WhatsAppFlow, WhatsAppFlowSchema } from './entities/whatsapp-flow.schema';
import { WhatsAppTemplate, WhatsAppTemplateSchema } from './entities/whatsapp-template.schema';
import { WhatsAppQueueModule } from './whatsapp-queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppFlow.name, schema: WhatsAppFlowSchema },
      { name: WhatsAppTemplate.name, schema: WhatsAppTemplateSchema },
    ]),
    WhatsAppQueueModule,
  ],
  controllers: [WhatsAppFlowTriggerController],
  providers: [WhatsAppFlowTriggerService],
  exports: [WhatsAppFlowTriggerService],
})
export class WhatsAppFlowTriggerModule {}
