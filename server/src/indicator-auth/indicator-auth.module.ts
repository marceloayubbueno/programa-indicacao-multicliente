import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { IndicatorAuthController } from './indicator-auth.controller';
import { IndicatorAuthService } from './indicator-auth.service';
import { JwtIndicatorStrategy } from './strategies/jwt-indicator.strategy';
import { JwtIndicatorAuthGuard } from './guards/jwt-indicator-auth.guard';
import { Participant, ParticipantSchema } from '../clients/entities/participant.schema';
import { Referral, ReferralSchema } from '../referrals/entities/referral.schema';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '24h' },
    }),
    MongooseModule.forFeature([
      { name: Participant.name, schema: ParticipantSchema },
      { name: Referral.name, schema: ReferralSchema },
    ]),
  ],
  controllers: [IndicatorAuthController],
  providers: [IndicatorAuthService, JwtIndicatorStrategy, JwtIndicatorAuthGuard],
  exports: [IndicatorAuthService, JwtIndicatorAuthGuard],
})
export class IndicatorAuthModule {} 