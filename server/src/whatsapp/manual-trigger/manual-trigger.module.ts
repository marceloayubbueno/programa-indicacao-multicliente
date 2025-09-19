import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ManualTriggerService } from './manual-trigger.service';
import { ManualTriggerController } from './manual-trigger.controller';
import { WhatsAppFlow, WhatsAppFlowSchema } from '../entities/whatsapp-flow.schema';
import { Participant, ParticipantSchema } from '../../clients/entities/participant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppFlow.name, schema: WhatsAppFlowSchema },
      { name: Participant.name, schema: ParticipantSchema }
    ])
  ],
  providers: [ManualTriggerService],
  controllers: [ManualTriggerController],
  exports: [ManualTriggerService]
})
export class ManualTriggerModule {}
