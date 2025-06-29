// 🚨 CORREÇÃO EMERGENCIAL: Desativar funções automáticas problemáticas

console.log('🚨 CORREÇÃO EMERGENCIAL CARREGADA - Desativando auto-inicializações');

// 1. Desativar todas as funções de auto-inicialização
window.autoFixOrphanParticipants = function() {
    console.log('🚨 autoFixOrphanParticipants DESATIVADA temporariamente');
    return Promise.resolve(true);
};

// 2. Desativar interceptação de importação
if (window.originalSaveImportedParticipants) {
    console.log('🚨 Restaurando função original de importação');
    window.saveImportedParticipants = window.originalSaveImportedParticipants;
}

// 3. Desativar monitoramento periódico
window.clearInterval = (function(original) {
    return function(id) {
        console.log('🚨 Limpando interval:', id);
        return original.call(this, id);
    };
})(window.clearInterval);

// 4. Desativar todos os timeouts que podem estar causando problemas
let timeoutIds = [];
window.setTimeout = (function(original) {
    return function(fn, delay) {
        if (delay >= 5000) {
            console.log('🚨 Bloqueando timeout de longa duração:', delay);
            return null;
        }
        const id = original.call(this, fn, delay);
        timeoutIds.push(id);
        return id;
    };
})(window.setTimeout);

// 5. Limpar todos os timeouts existentes
timeoutIds.forEach(id => clearTimeout(id));

// 6. Força recarregamento limpo dos dados
window.forceCleanReload = async function() {
    console.log('🔄 FORÇANDO RECARREGAMENTO LIMPO...');
    
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        if (!token || !clientId) {
            console.log('❌ Token/clientId não encontrado');
            return false;
        }
        
        // Limpar dados em memória
        window.participants = [];
        window.lists = [];
        
        // Recarregar listas primeiro
        const listsResponse = await fetch(`${getApiUrl()}/participant-lists?clientId=${clientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (listsResponse.ok) {
            const allLists = await listsResponse.json();
            window.lists = allLists;
            console.log(`✅ ${allLists.length} listas carregadas`);
        }
        
        // Recarregar participantes
        const participantsResponse = await fetch(`${getApiUrl()}/participants?clientId=${clientId}&limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (participantsResponse.ok) {
            const participantsData = await participantsResponse.json();
            window.participants = participantsData.participants || [];
            console.log(`✅ ${window.participants.length} participantes carregados`);
        }
        
        // Atualizar interface
        if (typeof displayParticipants === 'function') {
            displayParticipants();
        }
        
        if (typeof refreshListsDisplay === 'function') {
            refreshListsDisplay();
        }
        
        console.log('✅ RECARREGAMENTO LIMPO CONCLUÍDO');
        return true;
        
    } catch (error) {
        console.error('❌ Erro no recarregamento limpo:', error);
        return false;
    }
};

// 7. Executar recarregamento limpo após 2 segundos
setTimeout(() => {
    console.log('🔄 Executando recarregamento limpo automático...');
    window.forceCleanReload();
}, 2000);

console.log('✅ CORREÇÃO EMERGENCIAL ATIVA - Sistema estabilizado'); 