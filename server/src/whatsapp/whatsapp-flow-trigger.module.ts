import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppFlowTriggerService } from './whatsapp-flow-trigger.service';
import { WhatsAppFlowTriggerController } from './whatsapp-flow-trigger.controller';
import { WhatsAppFlow, WhatsAppFlowSchema } from './entities/whatsapp-flow.schema';
import { WhatsAppTemplate, WhatsAppTemplateSchema } from './entities/whatsapp-template.schema';
import { WhatsAppQueueModule } from './whatsapp-queue.module';

// Schemas para buscar dados reais
import { Participant, ParticipantSchema } from '../clients/entities/participant.schema';
import { Referral, ReferralSchema } from '../referrals/entities/referral.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppFlow.name, schema: WhatsAppFlowSchema },
      { name: WhatsAppTemplate.name, schema: WhatsAppTemplateSchema },
      { name: Participant.name, schema: ParticipantSchema },
      { name: Referral.name, schema: ReferralSchema },
    ]),
    WhatsAppQueueModule,
  ],
  controllers: [WhatsAppFlowTriggerController],
  providers: [WhatsAppFlowTriggerService],
  exports: [WhatsAppFlowTriggerService],
})
export class WhatsAppFlowTriggerModule {}
