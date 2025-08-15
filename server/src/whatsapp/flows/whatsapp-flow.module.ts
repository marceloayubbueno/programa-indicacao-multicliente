import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppFlowService } from './whatsapp-flow.service';
import { WhatsAppFlow, WhatsAppFlowSchema } from '../entities/whatsapp-flow.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppFlow.name, schema: WhatsAppFlowSchema }
    ])
  ],
  providers: [WhatsAppFlowService],
  exports: [WhatsAppFlowService]
})
export class WhatsAppFlowModule {}
