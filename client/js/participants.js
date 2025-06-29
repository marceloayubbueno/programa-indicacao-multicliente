// 🔧 PARTICIPANTS.JS MÍNIMO E FUNCIONAL - SEM DUPLICAÇÕES

// ===== VARIÁVEIS GLOBAIS - DECLARAÇÃO ÚNICA =====
let currentTab = 'lists';
let participants = [];
let lists = [];
let currentPage = 1;
let pageSize = 25;
let totalParticipants = 0;
let totalPages = 1;
let tipoFiltro = 'todos';
let isLoading = false;
let currentFilters = {};

console.log('✅ PARTICIPANTS.JS MÍNIMO CARREGADO');

// ===== FUNÇÕES ESSENCIAIS =====

// Função para obter API URL
function getApiUrl() {
    return window.API_URL || 
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
           (window.location.hostname === 'localhost' ? 
            'http://localhost:3000/api' : 
            'https://programa-indicacao-multicliente-production.up.railway.app/api'));
}

// Função para exibir notificações
function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    // TODO: Implementar sistema de notificação visual
}

// Função para carregar participantes
async function loadParticipants(page = 1, filters = {}) {
    console.log('🔄 Carregando participantes...');
    
    if (isLoading) {
        console.log('⏳ Já carregando...');
        return;
    }
    
    try {
        isLoading = true;
        
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        if (!token || !clientId) {
            console.error('❌ Token ou clientId não encontrado');
            return;
        }
        
        const url = `${getApiUrl()}/participants?clientId=${clientId}&limit=1000`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        participants = data.participants || [];
        totalParticipants = participants.length;
        
        console.log(`✅ ${participants.length} participantes carregados`);
        
        // Atualizar interface se existir
        if (typeof displayParticipants === 'function') {
            displayParticipants();
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar participantes:', error);
        showNotification('Erro ao carregar participantes', 'error');
    } finally {
        isLoading = false;
    }
}

// Função para carregar listas
async function loadLists(forDisplayInTab = false) {
    console.log('🔄 Carregando listas...');
    
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        if (!token || !clientId) {
            console.error('❌ Token ou clientId não encontrado');
            return;
        }
        
        const url = `${getApiUrl()}/participant-lists?clientId=${clientId}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        lists = await response.json();
        console.log(`✅ ${lists.length} listas carregadas`);
        
        // Atualizar interface se existir
        if (typeof refreshListsDisplay === 'function') {
            refreshListsDisplay();
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar listas:', error);
        showNotification('Erro ao carregar listas', 'error');
    }
}

// Função para trocar abas
function switchTab(tabName) {
    console.log(`🔄 Trocando para aba: ${tabName}`);
    currentTab = tabName;
    
    // Remover classe active de todas as abas
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-700', 'text-gray-300');
    });
    
    // Esconder todo o conteúdo das abas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Esconder todas as ações contextuais
    document.querySelectorAll('[id^="actions-"]').forEach(action => {
        action.classList.add('hidden');
    });
    
    // Ativar aba selecionada
    const activeTab = document.getElementById(`tab-${tabName}`);
    const activeContent = document.getElementById(`tab-content-${tabName}`);
    const activeActions = document.getElementById(`actions-${tabName}`);
    
    if (activeTab) {
        activeTab.classList.add('active', 'bg-blue-600', 'text-white');
        activeTab.classList.remove('bg-gray-700', 'text-gray-300');
    }
    
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }
    
    if (activeActions) {
        activeActions.classList.remove('hidden');
        activeActions.classList.add('flex');
    }
    
    // Carregar dados da aba
    if (tabName === 'lists') {
        loadLists(true);
    } else if (tabName === 'users') {
        loadParticipants();
    }
}

// Função placeholder para displayParticipants
function displayParticipants() {
    console.log('📊 Exibindo participantes...');
    const tbody = document.getElementById('participantsList');
    if (tbody) {
        if (participants.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-8">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-users text-4xl text-gray-400 mb-4"></i>
                            <p class="text-xl text-gray-300 mb-2">Nenhum participante encontrado</p>
                            <p class="text-sm text-gray-500">Importe participantes ou crie novos</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = participants.map(p => `
                <tr>
                    <td class="px-4 py-2"><input type="checkbox" /></td>
                    <td class="px-4 py-2">${p.name || 'N/A'}</td>
                    <td class="px-4 py-2">${p.email || 'N/A'}</td>
                    <td class="px-4 py-2">${(p.lists || []).length} listas</td>
                    <td class="px-4 py-2">${p.campaignName || 'N/A'}</td>
                    <td class="px-4 py-2">${p.tipo || 'participante'}</td>
                    <td class="px-4 py-2">-</td>
                    <td class="px-4 py-2">${p.status || 'ativo'}</td>
                    <td class="px-4 py-2">-</td>
                </tr>
            `).join('');
        }
    }
}

// Função placeholder para refreshListsDisplay
function refreshListsDisplay() {
    console.log('📊 Exibindo listas...');
    const container = document.getElementById('listsContainer');
    if (container) {
        if (lists.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-list text-4xl text-blue-400 mb-4"></i>
                    <p class="text-xl text-gray-300 mb-2">Nenhuma lista encontrada</p>
                    <p class="text-sm text-gray-500">Crie uma nova lista para organizar participantes</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-list text-4xl text-blue-400 mb-4"></i>
                    <p class="text-xl text-gray-300 mb-2">${lists.length} listas encontradas</p>
                    <p class="text-sm text-gray-500">Sistema funcionando normalmente</p>
                </div>
            `;
        }
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM carregado - inicializando sistema...');
    
    // Carregar dados iniciais
    setTimeout(() => {
        loadLists();
        if (currentTab === 'users') {
            loadParticipants();
        }
    }, 1000);
});

console.log('✅ PARTICIPANTS.JS MÍNIMO CONFIGURADO'); 