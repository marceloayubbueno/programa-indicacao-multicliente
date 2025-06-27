import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LPIndicadoresService } from './lp-indicadores.service';
import { LPIndicadoresController } from './lp-indicadores.controller';
import { LPIndicadores, LPIndicadoresSchema } from './entities/lp-indicadores.schema';
import { Participant, ParticipantSchema } from '../clients/entities/participant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LPIndicadores.name, schema: LPIndicadoresSchema },
      { name: Participant.name, schema: ParticipantSchema }
    ])
  ],
  controllers: [LPIndicadoresController],
  providers: [LPIndicadoresService],
  exports: [LPIndicadoresService]
})
export class LPIndicadoresModule {} 