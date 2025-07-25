/**
 * 🔧 CONFIGURAÇÃO CENTRALIZADA DO ADMIN
 * Arquivo que centraliza todas as configurações da área administrativa
 * 
 * Este arquivo é responsável por:
 * - Detectar automaticamente o ambiente (development/production)
 * - Centralizar URLs e configurações por ambiente
 * - Expor configurações via window.ADMIN_CONFIG
 * - Manter compatibilidade com arquivos existentes
 */

// 🌍 Configuração de ambiente
const ENV = {
    development: {
        API_URL: 'http://localhost:3000/api',
        ADMIN_URL: 'http://localhost:5501/admin',
        CLIENT_URL: 'http://localhost:5501'
    },
    production: {
        API_URL: 'https://programa-indicacao-multicliente-production.up.railway.app/api',
        ADMIN_URL: 'https://app.virallead.com.br/admin',
        CLIENT_URL: 'https://app.virallead.com.br'
    }
};

// 🔧 Detectar ambiente automaticamente
function detectEnvironment() {
    const hostname = window.location.hostname;
    
    // Se estiver em localhost, é development
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')) {
        return 'development';
    }
    
    // Caso contrário, é production
    return 'production';
}

// 📦 Configuração ativa baseada no ambiente
const CURRENT_ENV = detectEnvironment();
const config = ENV[CURRENT_ENV];

// 🌐 Exportar configurações
window.ADMIN_CONFIG = {
    // URLs principais
    API_URL: config.API_URL,
    ADMIN_URL: config.ADMIN_URL,
    CLIENT_URL: config.CLIENT_URL,
    
    // Configurações gerais
    ENVIRONMENT: CURRENT_ENV,
    VERSION: '1.0.0',
    
    // Configurações de API
    DEFAULT_PAGE_SIZE: 25,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    
    // Timeouts
    REQUEST_TIMEOUT: 30000, // 30 segundos
    CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutos
    
    // Configurações de validação
    MIN_PASSWORD_LENGTH: 8,
    MAX_CLIENTS_PER_PAGE: 50,
    
    // Logs
    DEBUG_MODE: CURRENT_ENV === 'development',
    
    // Mensagens padronizadas
    MESSAGES: {
        ERROR_GENERIC: 'Ocorreu um erro inesperado. Tente novamente.',
        ERROR_NETWORK: 'Erro de conexão. Verifique sua internet.',
        ERROR_UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
        SUCCESS_SAVE: 'Dados salvos com sucesso!',
        SUCCESS_DELETE: 'Item excluído com sucesso!',
        CONFIRM_DELETE: 'Tem certeza que deseja excluir este item?',
        CONFIRM_ACTION: 'Tem certeza que deseja executar esta ação?'
    }
};

// 🎯 Função helper para logs condicionais
window.adminDebugLog = function(message, data = null) {
    if (window.ADMIN_CONFIG.DEBUG_MODE) {
        console.log(`[ADMIN-DEBUG] ${message}`, data || '');
    }
};

// 🚨 Função helper para logs de erro
window.adminErrorLog = function(message, error = null) {
    console.error(`[ADMIN-ERROR] ${message}`, error || '');
};

// ✅ Função helper para logs de sucesso
window.adminSuccessLog = function(message, data = null) {
    if (window.ADMIN_CONFIG.DEBUG_MODE) {
        console.log(`[ADMIN-SUCCESS] ${message}`, data || '');
    }
};

// 📋 Mostrar configuração atual no console (apenas em desenvolvimento)
if (CURRENT_ENV === 'development') {
    console.log('🔧 Configuração do Admin:', {
        environment: CURRENT_ENV,
        api_url: config.API_URL,
        admin_url: config.ADMIN_URL,
        debug_mode: true
    });
}

// 🔄 Compatibilidade com arquivos existentes
// Exporta API_URL para compatibilidade com arquivos antigos que ainda usam window.API_URL
window.API_URL = config.API_URL;

// 🎯 Função helper para obter URL da API
window.getApiUrl = function() {
    return window.ADMIN_CONFIG.API_URL;
}; 