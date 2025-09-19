import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppFlowService } from './whatsapp-flow.service';
import { WhatsAppFlow, WhatsAppFlowSchema } from '../entities/whatsapp-flow.schema';
import { Participant, ParticipantSchema } from '../../clients/entities/participant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppFlow.name, schema: WhatsAppFlowSchema },
      { name: Participant.name, schema: ParticipantSchema }
    ])
  ],
  providers: [WhatsAppFlowService],
  exports: [WhatsAppFlowService]
})
export class WhatsAppFlowModule {}
