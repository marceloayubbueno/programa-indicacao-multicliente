import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; // 🆕 NOVO: Para ativar cron jobs
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
import { EmailConfigModule } from './email-config/email-config.module';
import { MailModule } from './common/mail.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

// 🆕 NOVO: Função UUID customizada para resolver problema do ScheduleModule
function generateUUID(): `${string}-${string}-${string}-${string}-${string}` {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }) as `${string}-${string}-${string}-${string}-${string}`;
}

// 🆕 NOVO: Configurar global crypto para ScheduleModule funcionar
(global as any).crypto = { randomUUID: generateUUID };

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
    ScheduleModule.forRoot(), // 🆕 NOVO: ATIVA PROCESSAMENTO AUTOMÁTICO DAS FILAS WHATSAPP
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
    EmailConfigModule,
    MailModule,
    WhatsAppModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
