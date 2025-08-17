import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LPIndicadoresService } from './lp-indicadores.service';
import { LPIndicadoresController } from './lp-indicadores.controller';
import { LPIndicadores, LPIndicadoresSchema } from './entities/lp-indicadores.schema';
import { Participant, ParticipantSchema } from '../clients/entities/participant.schema';
import { ParticipantList, ParticipantListSchema } from '../clients/entities/participant-list.schema';
import { Campaign, CampaignSchema } from '../campaigns/entities/campaign.schema';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LPIndicadores.name, schema: LPIndicadoresSchema },
      { name: Participant.name, schema: ParticipantSchema },
      { name: ParticipantList.name, schema: ParticipantListSchema },
      { name: Campaign.name, schema: CampaignSchema }
    ]),
    WhatsAppModule
  ],
  controllers: [LPIndicadoresController],
  providers: [LPIndicadoresService],
  exports: [LPIndicadoresService]
})
export class LPIndicadoresModule {} 