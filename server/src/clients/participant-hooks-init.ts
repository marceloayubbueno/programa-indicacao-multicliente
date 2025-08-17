import { ParticipantHooksService } from './participant-hooks.service';

/**
 * 🚀 Inicializador do ParticipantHooksService para uso global
 * Permite que os hooks do Mongoose acessem o service
 */
export function initializeParticipantHooks(service: ParticipantHooksService) {
  // Tornar o service disponível globalmente para os hooks do Mongoose
  (global as any).participantHooksService = service;
  
  console.log('✅ [HOOKS-INIT] ParticipantHooksService inicializado globalmente');
}

/**
 * 🔧 Limpar referência global
 */
export function cleanupParticipantHooks() {
  delete (global as any).participantHooksService;
  console.log('🧹 [HOOKS-INIT] ParticipantHooksService limpo globalmente');
}
