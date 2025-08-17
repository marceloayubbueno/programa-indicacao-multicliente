import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client, ClientSchema } from './entities/client.schema';
import { MailModule } from '../common/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { Participant, ParticipantSchema } from './entities/participant.schema';
import { ParticipantList, ParticipantListSchema } from './entities/participant-list.schema';
import { ParticipantsService } from './participants.service';
import { ParticipantsController } from './participants.controller';
import { ParticipantListsService } from './participant-lists.service';
import { ParticipantListsController } from './participant-lists.controller';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { ParticipantHooksService } from './participant-hooks.service';
import { initializeParticipantHooks, cleanupParticipantHooks } from './participant-hooks-init';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Participant.name, schema: ParticipantSchema },
      { name: ParticipantList.name, schema: ParticipantListSchema },
    ]),
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    WhatsAppModule,
  ],
  controllers: [ClientsController, ParticipantsController, ParticipantListsController],
  providers: [ClientsService, ParticipantsService, ParticipantListsService, ParticipantHooksService],
  exports: [ClientsService, ParticipantsService, ParticipantListsService, ParticipantHooksService],
})
export class ClientsModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly participantHooksService: ParticipantHooksService) {}

  onModuleInit() {
    // Inicializar o service globalmente para os hooks do Mongoose
    initializeParticipantHooks(this.participantHooksService);
  }

  onModuleDestroy() {
    // Limpar referência global
    cleanupParticipantHooks();
  }
} 