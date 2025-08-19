import { WhatsAppFlowTriggerService } from './whatsapp-flow-trigger.service';

/**
 * 🚀 Inicializador do WhatsAppFlowTriggerService para uso global
 * Permite que os hooks do Mongoose acessem o service
 */
export function initializeWhatsAppFlowTrigger(service: WhatsAppFlowTriggerService) {
  console.log('🚀 [HOOKS-INIT] Iniciando inicialização do WhatsAppFlowTriggerService...');
  console.log('🔧 [HOOKS-INIT] Service recebido:', !!service);
  console.log('🔧 [HOOKS-INIT] Service constructor:', service.constructor.name);
  
  // Tornar o service disponível globalmente para os hooks do Mongoose
  (global as any).whatsAppFlowTriggerService = service;
  
  console.log('✅ [HOOKS-INIT] WhatsAppFlowTriggerService inicializado globalmente');
  console.log('🔍 [HOOKS-INIT] global.whatsAppFlowTriggerService:', !!(global as any).whatsAppFlowTriggerService);
  
  // Verificar se o service tem o método triggerLeadIndicated
  if (service && typeof (service as any).triggerLeadIndicated === 'function') {
    console.log('✅ [HOOKS-INIT] Método triggerLeadIndicated encontrado no service');
  } else {
    console.log('❌ [HOOKS-INIT] Método triggerLeadIndicated NÃO encontrado no service');
  }
}

/**
 * 🔧 Limpar referência global
 */
export function cleanupWhatsAppFlowTrigger() {
  delete (global as any).whatsAppFlowTriggerService;
  console.log('🧹 [HOOKS-INIT] WhatsAppFlowTriggerService limpo globalmente');
}
