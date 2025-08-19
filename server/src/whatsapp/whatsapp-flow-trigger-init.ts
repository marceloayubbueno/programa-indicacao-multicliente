import { WhatsAppFlowTriggerService } from './whatsapp-flow-trigger.service';

/**
 * 🚀 Inicializador do WhatsAppFlowTriggerService para uso global
 * Permite que os hooks do Mongoose acessem o service
 */
export function initializeWhatsAppFlowTrigger(service: WhatsAppFlowTriggerService) {
  (global as any).whatsAppFlowTriggerService = service;
}

/**
 * 🔧 Limpar referência global
 */
export function cleanupWhatsAppFlowTrigger() {
  delete (global as any).whatsAppFlowTriggerService;
}
