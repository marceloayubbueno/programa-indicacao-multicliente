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
  constructor(private readonly whatsAppFlowTriggerService: WhatsAppFlowTriggerService) {
    console.log('🚀 [MODULE-DEBUG] WhatsAppFlowTriggerModule constructor chamado!');
    console.log('🔧 [MODULE-DEBUG] whatsAppFlowTriggerService injetado:', !!this.whatsAppFlowTriggerService);
  }

  onModuleInit() {
    console.log('🚀 [MODULE-DEBUG] WhatsAppFlowTriggerModule onModuleInit() chamado!');
    try {
      // Inicializar o service globalmente para os hooks do Mongoose
      initializeWhatsAppFlowTrigger(this.whatsAppFlowTriggerService);
      console.log('✅ [MODULE-DEBUG] WhatsAppFlowTriggerModule inicializado com sucesso!');
    } catch (error) {
      console.error('❌ [MODULE-DEBUG] Erro ao inicializar WhatsAppFlowTriggerModule:', error);
      console.error('❌ [MODULE-DEBUG] Stack trace:', error.stack);
    }
  }

  onModuleDestroy() {
    console.log('🧹 [MODULE-DEBUG] WhatsAppFlowTriggerModule onModuleDestroy() chamado!');
    try {
      // Limpar referência global
      cleanupWhatsAppFlowTrigger();
      console.log('✅ [MODULE-DEBUG] WhatsAppFlowTriggerModule limpo com sucesso!');
    } catch (error) {
      console.error('❌ [MODULE-DEBUG] Erro ao limpar WhatsAppFlowTriggerModule:', error);
    }
  }
}
