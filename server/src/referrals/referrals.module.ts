import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { Referral, ReferralSchema } from './entities/referral.schema';
import { Participant, ParticipantSchema } from '../clients/entities/participant.schema';
import { Campaign, CampaignSchema } from '../campaigns/entities/campaign.schema';
import { Reward, RewardSchema } from '../rewards/entities/reward.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Referral.name, schema: ReferralSchema },
      { name: Participant.name, schema: ParticipantSchema },
      { name: Campaign.name, schema: CampaignSchema },
      { name: Reward.name, schema: RewardSchema },
    ]),
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
