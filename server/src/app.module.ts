import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { FormsModule } from './forms/forms.module';
import { ReferralsModule } from './referrals/referrals.module';
import { RewardsModule } from './rewards/rewards.module';
import { AdminsModule } from './admins/admins.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule } from './clients/clients.module';
import { PlanosModule } from './planos/planos.module';
import { LandingPagesModule } from './landing-pages/landing-pages.module';
import { IndicatorsModule } from './indicators/indicators.module';
import { LPIndicadoresModule } from './lp-indicadores/lp-indicadores.module';
import { LPDivulgacaoModule } from './lp-divulgacao/lp-divulgacao.module';
import { PublicReferralsModule } from './public-referrals/public-referrals.module';
import { IndicatorAuthModule } from './indicator-auth/indicator-auth.module';
import { FinanceModule } from './finance/finance.module';
import { EmailTemplatesModule } from './email-templates/email-templates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || (() => {
      throw new Error('MONGODB_URI environment variable is required');
    })(), {
      dbName: 'programa-indicacao',
      retryWrites: true,
      w: 'majority'
    }),
    AuthModule,
    UsersModule,
    CampaignsModule,
    FormsModule,
    ReferralsModule,
    RewardsModule,
    AdminsModule,
    ClientsModule,
    PlanosModule,
    LandingPagesModule,
    IndicatorsModule,
    LPIndicadoresModule,
    LPDivulgacaoModule,
    PublicReferralsModule,
    IndicatorAuthModule,
    FinanceModule,
    EmailTemplatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
