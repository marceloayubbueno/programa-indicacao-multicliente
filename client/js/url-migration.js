/**
 * 🔄 MIGRAÇÃO DE URLS - Substitui URLs hardcodadas por configuração centralizada
 * Este arquivo deve ser incluído ANTES de outros scripts para garantir compatibilidade
 */

(function() {
    'use strict';
    
    // 🔧 Função para substituir URLs hardcodadas
    function migrateHardcodedUrls() {
        // URLs antigas que precisam ser substituídas
        const oldUrls = [
            'https://programa-indicacao-multicliente-production.up.railway.app',
            'https://programa-indicacao-multicliente-production.up.railway.app/api'
        ];
        
        // Função para substituir URLs em strings
        function replaceUrls(text) {
            if (typeof text !== 'string') return text;
            
            let result = text;
            oldUrls.forEach(oldUrl => {
                if (oldUrl.includes('/api')) {
                    result = result.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
                        () => window.APP_CONFIG?.API_URL || 'http://localhost:3000/api');
                } else {
                    result = result.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
                        () => window.APP_CONFIG?.CLIENT_URL || 'http://localhost:5501');
                }
            });
            return result;
        }
        
        // Substituir URLs em variáveis globais
        if (window.API_URL && oldUrls.some(url => window.API_URL.includes(url))) {
            window.API_URL = window.APP_CONFIG?.API_URL || 'http://localhost:3000/api';
        }
        
        if (window.API_BASE_URL && oldUrls.some(url => window.API_BASE_URL.includes(url))) {
            window.API_BASE_URL = window.APP_CONFIG?.API_URL || 'http://localhost:3000/api';
        }
        
        // Log de migração
        if (window.APP_CONFIG?.DEBUG_MODE) {
            console.log('🔄 Migração de URLs executada');
        }
    }
    
    // 🚀 Executar migração quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', migrateHardcodedUrls);
    } else {
        migrateHardcodedUrls();
    }
    
    // 🔄 Executar também quando APP_CONFIG estiver disponível
    const checkConfig = setInterval(() => {
        if (window.APP_CONFIG) {
            migrateHardcodedUrls();
            clearInterval(checkConfig);
        }
    }, 100);
    
})();
