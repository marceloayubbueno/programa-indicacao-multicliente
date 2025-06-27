import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client, ClientSchema } from './entities/client.schema';
import { MailService } from '../common/mail.service';
import { JwtModule } from '@nestjs/jwt';
import { Participant, ParticipantSchema } from './entities/participant.schema';
import { ParticipantList, ParticipantListSchema } from './entities/participant-list.schema';
import { ParticipantsService } from './participants.service';
import { ParticipantsController } from './participants.controller';
import { ParticipantListsService } from './participant-lists.service';
import { ParticipantListsController } from './participant-lists.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Participant.name, schema: ParticipantSchema },
      { name: ParticipantList.name, schema: ParticipantListSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'sua-chave-secreta-aqui',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [ClientsController, ParticipantsController, ParticipantListsController],
  providers: [ClientsService, MailService, ParticipantsService, ParticipantListsService],
  exports: [ClientsService, ParticipantsService, ParticipantListsService],
})
export class ClientsModule {} 