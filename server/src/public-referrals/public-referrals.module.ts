import { Module } from '@nestjs/common';
import { PublicReferralsController } from './public-referrals.controller';
import { ClientsModule } from '../clients/clients.module';
import { LPDivulgacaoModule } from '../lp-divulgacao/lp-divulgacao.module';

@Module({
  imports: [ClientsModule, LPDivulgacaoModule],
  controllers: [PublicReferralsController],
})
export class PublicReferralsModule {} 