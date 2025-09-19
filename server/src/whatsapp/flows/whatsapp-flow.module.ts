import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppFlowService } from './whatsapp-flow.service';
import { WhatsAppFlow, WhatsAppFlowSchema } from '../entities/whatsapp-flow.schema';
import { Participant, ParticipantSchema } from '../../clients/entities/participant.schema';
import { WhatsAppFlowTriggerService } from '../whatsapp-flow-trigger.service';
import { WhatsAppQueueService } from '../whatsapp-queue.service';
import { WhatsAppTemplate, WhatsAppTemplateSchema } from '../entities/whatsapp-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppFlow.name, schema: WhatsAppFlowSchema },
      { name: Participant.name, schema: ParticipantSchema },
      { name: WhatsAppTemplate.name, schema: WhatsAppTemplateSchema }
    ])
  ],
  providers: [WhatsAppFlowService, WhatsAppFlowTriggerService, WhatsAppQueueService],
  exports: [WhatsAppFlowService]
})
export class WhatsAppFlowModule {}
