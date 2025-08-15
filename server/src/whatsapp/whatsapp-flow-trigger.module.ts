import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppFlowTriggerService } from './whatsapp-flow-trigger.service';
import { WhatsAppFlowTriggerController } from './whatsapp-flow-trigger.controller';
import { WhatsAppFlow, WhatsAppFlowSchema } from './entities/whatsapp-flow.schema';
import { WhatsAppQueueModule } from './whatsapp-queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppFlow.name, schema: WhatsAppFlowSchema },
    ]),
    WhatsAppQueueModule, // Para usar o WhatsAppQueueService
  ],
  controllers: [WhatsAppFlowTriggerController],
  providers: [WhatsAppFlowTriggerService],
  exports: [WhatsAppFlowTriggerService], // Exportar para uso em outros módulos
})
export class WhatsAppFlowTriggerModule {}
