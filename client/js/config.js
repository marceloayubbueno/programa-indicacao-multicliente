/**
 * 🔧 CONFIGURAÇÃO CENTRALIZADA DO CLIENT
 * Arquivo que centraliza todas as configurações do sistema
 * 
 * Este arquivo é responsável por:
 * - Detectar automaticamente o ambiente (development/production)
 * - Centralizar URLs e configurações por ambiente
 * - Expor configurações via window.APP_CONFIG
 * - Manter compatibilidade com arquivos existentes
 */

// 🌍 Configuração de ambiente
const ENV = {
    development: {
        API_URL: 'http://localhost:3000',
        CLIENT_URL: 'http://localhost:5501',
        REFERRAL_BASE_URL: 'http://localhost:3000/indicacao'
    },
    production: {
        API_URL: 'https://programa-indicacao-multicliente-production.up.railway.app',
        CLIENT_URL: 'https://app.virallead.com.br',
        REFERRAL_BASE_URL: 'https://lp.virallead.com.br/indicacao'
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
window.APP_CONFIG = {
    // URLs principais
    API_URL: config.API_URL,
    CLIENT_URL: config.CLIENT_URL,
    REFERRAL_BASE_URL: config.REFERRAL_BASE_URL,
    
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
    MAX_PARTICIPANTS_PER_IMPORT: 1000,
    
    // Logs
    DEBUG_MODE: CURRENT_ENV === 'development',
    
    // Mensagens padronizadas
    MESSAGES: {
        ERROR_GENERIC: 'Ocorreu um erro inesperado. Tente novamente.',
        ERROR_NETWORK: 'Erro de conexão. Verifique sua internet.',
        ERROR_UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
        SUCCESS_SAVE: 'Dados salvos com sucesso!',
        SUCCESS_DELETE: 'Item excluído com sucesso!',
        CONFIRM_DELETE: 'Tem certeza que deseja excluir este item?'
    }
};

// 🎯 Função helper para logs condicionais
window.debugLog = function(message, data = null) {
    if (window.APP_CONFIG.DEBUG_MODE) {
        console.log(`[DEBUG] ${message}`, data || '');
    }
};

// 🚨 Função helper para logs de erro
window.errorLog = function(message, error = null) {
    console.error(`[ERROR] ${message}`, error || '');
};

// ✅ Função helper para logs de sucesso
window.successLog = function(message, data = null) {
    if (window.APP_CONFIG.DEBUG_MODE) {
        console.log(`[SUCCESS] ${message}`, data || '');
    }
};

// 🔧 Função helper para obter URL da API (compatibilidade)
window.getApiUrl = function(endpoint = '') {
    return window.APP_CONFIG.API_URL + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);
};

// 🔧 Função helper para obter URL de indicação (compatibilidade)
window.getReferralUrl = function(endpoint = '') {
    return window.APP_CONFIG.REFERRAL_BASE_URL + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);
};

// 📋 Mostrar configuração atual no console (apenas em desenvolvimento)
if (window.APP_CONFIG.DEBUG_MODE) {
    console.log('🔧 APP_CONFIG carregado:', window.APP_CONFIG);
    console.log('🌍 Ambiente detectado:', window.APP_CONFIG.ENVIRONMENT);
    console.log('🚀 API URL:', window.APP_CONFIG.API_URL);
} 