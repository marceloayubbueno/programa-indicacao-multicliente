import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { DebugController } from './debug.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Campaign, CampaignSchema } from './entities/campaign.schema';
import { LPIndicadores, LPIndicadoresSchema } from '../lp-indicadores/entities/lp-indicadores.schema';
import { ParticipantList, ParticipantListSchema } from '../clients/entities/participant-list.schema';
import { Participant, ParticipantSchema } from '../clients/entities/participant.schema';
import { ClientsModule } from '../clients/clients.module';
import { RewardsModule } from '../rewards/rewards.module';
import { LPIndicadoresModule } from '../lp-indicadores/lp-indicadores.module';
import { LPDivulgacaoModule } from '../lp-divulgacao/lp-divulgacao.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: LPIndicadores.name, schema: LPIndicadoresSchema },
      { name: ParticipantList.name, schema: ParticipantListSchema },
      { name: Participant.name, schema: ParticipantSchema }
    ]),
    ClientsModule,
    RewardsModule,
    LPIndicadoresModule,
    LPDivulgacaoModule
  ],
  controllers: [CampaignsController, DebugController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
