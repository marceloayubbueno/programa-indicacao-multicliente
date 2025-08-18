import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppFlowTriggerService } from './whatsapp-flow-trigger.service';
import { WhatsAppFlowTriggerController } from './whatsapp-flow-trigger.controller';
import { WhatsAppFlow, WhatsAppFlowSchema } from './entities/whatsapp-flow.schema';
import { WhatsAppTemplate, WhatsAppTemplateSchema } from './entities/whatsapp-template.schema';
import { WhatsAppQueueModule } from './whatsapp-queue.module';
import { initializeWhatsAppFlowTrigger, cleanupWhatsAppFlowTrigger } from './whatsapp-flow-trigger-init';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppFlow.name, schema: WhatsAppFlowSchema },
      { name: WhatsAppTemplate.name, schema: WhatsAppTemplateSchema },
    ]),
    WhatsAppQueueModule,
  ],
  controllers: [WhatsAppFlowTriggerController],
  providers: [WhatsAppFlowTriggerService],
  exports: [WhatsAppFlowTriggerService],
})
export class WhatsAppFlowTriggerModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly whatsAppFlowTriggerService: WhatsAppFlowTriggerService) {}

  onModuleInit() {
    // Inicializar o service globalmente para os hooks do Mongoose
    initializeWhatsAppFlowTrigger(this.whatsAppFlowTriggerService);
  }

  onModuleDestroy() {
    // Limpar referência global
    cleanupWhatsAppFlowTrigger();
  }
}
