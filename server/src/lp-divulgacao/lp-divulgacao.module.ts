import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LPDivulgacaoService } from './lp-divulgacao.service';
import { LPDivulgacaoController } from './lp-divulgacao.controller';
import { LPDivulgacao, LPDivulgacaoSchema } from './entities/lp-divulgacao.schema';
import { Referral, ReferralSchema } from '../referrals/entities/referral.schema';
import { Participant, ParticipantSchema } from '../clients/entities/participant.schema';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LPDivulgacao.name, schema: LPDivulgacaoSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: Participant.name, schema: ParticipantSchema }
    ]),
    ReferralsModule
  ],
  controllers: [LPDivulgacaoController],
  providers: [LPDivulgacaoService],
  exports: [LPDivulgacaoService]
})
export class LPDivulgacaoModule {} 