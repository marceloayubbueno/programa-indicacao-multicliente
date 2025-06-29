// 🚨 CORREÇÃO EMERGENCIAL: Resolver travamento da Central de Participantes

console.log('🚨 CORREÇÃO EMERGENCIAL CARREGADA');

// Desativar auto-inicializações problemáticas
if (typeof autoFixOrphanParticipants !== 'undefined') {
    window.autoFixOrphanParticipants = function() {
        console.log('⚠️ autoFixOrphanParticipants desativada');
        return Promise.resolve(true);
    };
}

// Limpar intervalos que podem estar rodando
const highestId = window.setTimeout(() => {}, 0);
for (let i = 0; i < highestId; i++) {
    window.clearTimeout(i);
    window.clearInterval(i);
}

// Força reload limpo
window.emergencyReload = async function() {
    try {
        console.log('🔄 EMERGENCY RELOAD INICIADO');
        
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        if (!token || !clientId) {
            console.log('❌ Credenciais não encontradas');
            window.location.href = '/client/pages/login.html';
            return;
        }
        
        // Função segura para obter URL da API
        const apiUrl = window.API_URL || 'https://programa-indicacao-multicliente-production.up.railway.app/api';
        
        // Carregar listas primeiro
        try {
            const listsRes = await fetch(`${apiUrl}/participant-lists?clientId=${clientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (listsRes.ok) {
                const lists = await listsRes.json();
                console.log(`✅ ${lists.length} listas carregadas`);
                
                // Atualizar interface se estiver na aba de listas
                if (document.getElementById('listsContent')) {
                    document.getElementById('listsContent').innerHTML = 'Carregando...';
                }
            }
        } catch (error) {
            console.error('❌ Erro ao carregar listas:', error);
        }
        
        // Carregar participantes
        try {
            const participantsRes = await fetch(`${apiUrl}/participants?clientId=${clientId}&limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (participantsRes.ok) {
                const data = await participantsRes.json();
                const participants = data.participants || [];
                console.log(`✅ ${participants.length} participantes carregados`);
                
                // Remover "Carregando listas..." se ainda estiver aparecendo
                const loadingElements = document.querySelectorAll('*');
                loadingElements.forEach(el => {
                    if (el.textContent && el.textContent.includes('Carregando listas')) {
                        el.style.display = 'none';
                    }
                });
            }
        } catch (error) {
            console.error('❌ Erro ao carregar participantes:', error);
        }
        
        console.log('✅ EMERGENCY RELOAD CONCLUÍDO');
        
    } catch (error) {
        console.error('❌ Erro crítico no emergency reload:', error);
    }
};

// Executar reload emergencial
setTimeout(window.emergencyReload, 1000); 