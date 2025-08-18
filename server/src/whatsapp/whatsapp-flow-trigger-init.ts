import { WhatsAppFlowTriggerService } from './whatsapp-flow-trigger.service';

/**
 * 🚀 Inicializador do WhatsAppFlowTriggerService para uso global
 * Permite que os hooks do Mongoose acessem o service
 */
export function initializeWhatsAppFlowTrigger(service: WhatsAppFlowTriggerService) {
  // Tornar o service disponível globalmente para os hooks do Mongoose
  (global as any).whatsAppFlowTriggerService = service;
  
  console.log('✅ [HOOKS-INIT] WhatsAppFlowTriggerService inicializado globalmente');
}

/**
 * 🔧 Limpar referência global
 */
export function cleanupWhatsAppFlowTrigger() {
  delete (global as any).whatsAppFlowTriggerService;
  console.log('🧹 [HOOKS-INIT] WhatsAppFlowTriggerService limpo globalmente');
}
