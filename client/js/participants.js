/**
 * 🎯 PARTICIPANTS.JS - ORQUESTRADOR PRINCIPAL
 * Versão: 2.0 - Integração completa com ParticipantsManager
 * Capacidade: 10.000+ usuários com sistema escalável
 */

// ===== CONFIGURAÇÃO GLOBAL =====
let currentTab = 'lists';
let isInitialized = false;

// ===== INSTÂNCIAS DOS MANAGERS =====
let participantsManager = null;
let listsManager = null;

console.log('🚀 PARTICIPANTS.JS v2.0 - Orquestrador Principal');

// ===== INICIALIZAÇÃO DOS MANAGERS =====
function initializeManagers() {
    if (isInitialized) return;
    
    console.log('🔧 Inicializando managers...');
    
    // Inicializar ParticipantsManager
    if (typeof ParticipantsManager !== 'undefined') {
        participantsManager = new ParticipantsManager();
        console.log('✅ ParticipantsManager inicializado');
    } else {
        console.error('❌ ParticipantsManager não encontrado');
    }
    
    // Inicializar ListsManager (será implementado se necessário)
    listsManager = {
        lists: [],
        async loadLists() {
            try {
                const data = await window.apiClient.getParticipantLists();
                this.lists = Array.isArray(data) ? data : [];
                console.log(`✅ ${this.lists.length} listas carregadas`);
                this.displayLists();
                return this.lists;
            } catch (error) {
                console.error('❌ Erro ao carregar listas:', error);
                this.lists = [];
                this.displayLists();
            }
        },
        displayLists() {
            const container = document.getElementById('listsContainer');
            if (!container) return;
            
            if (this.lists.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <div class="max-w-md mx-auto">
                            <i class="fas fa-list-ul text-6xl text-gray-600 mb-6"></i>
                            <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhuma lista encontrada</h3>
                            <p class="text-gray-500 mb-6">Crie sua primeira lista para organizar participantes</p>
                            <button onclick="window.location.href='editar-lista.html'" 
                                    class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <i class="fas fa-plus mr-2"></i>Criar Nova Lista
                            </button>
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${this.lists.map(list => `
                            <div class="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                                <div class="flex items-center justify-between mb-3">
                                    <h3 class="text-lg font-semibold text-gray-100">${list.name}</h3>
                                    <div class="flex items-center gap-2">
                                        <button onclick="editList('${list._id}')" 
                                                class="text-blue-400 hover:text-blue-300 transition-colors">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="deleteList('${list._id}')" 
                                                class="text-red-400 hover:text-red-300 transition-colors">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <p class="text-gray-400 text-sm mb-4">${list.description || 'Sem descrição'}</p>
                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-gray-500">
                                        <i class="fas fa-users mr-1"></i>
                                        ${list.participantsCount || 0} participantes
                                    </span>
                                    <span class="text-xs text-gray-600">
                                        ${new Date(list.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }
    };
    
    isInitialized = true;
    console.log('✅ Managers inicializados com sucesso');
}

// ===== SISTEMA DE ABAS =====
function switchTab(tabName) {
    console.log(`🔄 Trocando para aba: ${tabName}`);
    currentTab = tabName;
    
    // Atualizar interface das abas
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-700', 'text-gray-300');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
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
    loadTabData(tabName);
}

// ===== CARREGAMENTO DE DADOS POR ABA =====
async function loadTabData(tabName) {
    if (!isInitialized) {
        initializeManagers();
    }
    
    switch (tabName) {
        case 'lists':
            if (listsManager) {
                await listsManager.loadLists();
            }
            break;
            
        case 'users':
            if (participantsManager) {
                await participantsManager.loadParticipants({
                    page: 1,
                    limit: 25,
                    forceRefresh: false
                });
            }
            break;
            
        case 'stats':
            await loadStatistics();
            break;
    }
}

// ===== ESTATÍSTICAS =====
async function loadStatistics() {
    try {
        const [participants, lists] = await Promise.all([
            window.apiClient.getParticipants({ limit: 10000 }),
            window.apiClient.getParticipantLists()
        ]);
        
        const stats = {
            totalUsers: participants.total || 0,
            activeUsers: participants.participants?.filter(p => p.status === 'ativo').length || 0,
            totalLists: Array.isArray(lists) ? lists.length : 0,
            recentActivity: participants.participants?.filter(p => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(p.createdAt) > weekAgo;
            }).length || 0
        };
        
        updateStatisticsDisplay(stats);
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
    }
}

function updateStatisticsDisplay(stats) {
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('activeUsers').textContent = stats.activeUsers;
    document.getElementById('totalLists').textContent = stats.totalLists;
    document.getElementById('recentActivity').textContent = stats.recentActivity;
}

// ===== AÇÕES DE LISTAS =====
async function editList(listId) {
    window.location.href = `editar-lista.html?id=${listId}`;
}

async function deleteList(listId) {
    const confirmed = confirm('Tem certeza que deseja excluir esta lista?\n\nEsta ação não pode ser desfeita.');
    if (!confirmed) return;
    
    try {
        await window.apiClient.deleteParticipantList(listId);
        showNotification('Lista excluída com sucesso!', 'success');
        await listsManager.loadLists();
    } catch (error) {
        console.error('❌ Erro ao excluir lista:', error);
        showNotification('Erro ao excluir lista', 'error');
    }
}

// ===== FILTROS DE USUÁRIOS =====
function setTipoFiltro(tipo) {
    // Atualizar interface dos filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-700', 'text-gray-200');
    });
    
    const activeFilter = document.getElementById(`filter-${tipo}`);
    if (activeFilter) {
        activeFilter.classList.add('bg-blue-600', 'text-white');
        activeFilter.classList.remove('bg-gray-700', 'text-gray-200');
    }
    
    // Aplicar filtro via ParticipantsManager
    if (participantsManager) {
        participantsManager.filterByType(tipo === 'todos' ? '' : tipo);
    }
}

async function filterParticipants() {
    if (!participantsManager) return;
    
    const filters = {
        status: document.getElementById('statusFilter')?.value || '',
        listId: document.getElementById('listFilter')?.value || '',
        email: document.getElementById('emailFilter')?.value || ''
    };
    
    await participantsManager.applyFilters(filters);
}

// ===== BUSCA =====
function setupSearch() {
    const searchLists = document.getElementById('searchLists');
    const searchUsers = document.getElementById('searchUsers');
    
    if (searchLists) {
        searchLists.addEventListener('input', debounce(async (e) => {
            const term = e.target.value.trim();
            if (listsManager) {
                // Implementar busca de listas se necessário
                await listsManager.loadLists();
            }
        }, 300));
    }
    
    if (searchUsers) {
        searchUsers.addEventListener('input', debounce(async (e) => {
            const term = e.target.value.trim();
            if (participantsManager) {
                await participantsManager.search(term);
            }
        }, 300));
    }
}

// ===== UTILITÁRIOS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    // TODO: Implementar sistema de notificação visual
}

// ===== FUNÇÕES GLOBAIS PARA COMPATIBILIDADE =====
window.switchTab = switchTab;
window.setTipoFiltro = setTipoFiltro;
window.filterParticipants = filterParticipants;
window.editList = editList;
window.deleteList = deleteList;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM carregado - inicializando sistema v2.0...');
    
    // Aguardar carregamento completo dos módulos
    setTimeout(() => {
        initializeManagers();
        setupSearch();
        
        // Carregar aba inicial
        switchTab(currentTab);
        
        console.log('✅ Sistema inicializado com sucesso!');
    }, 500);
});

console.log('✅ PARTICIPANTS.JS v2.0 CONFIGURADO'); 