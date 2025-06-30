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
                console.log('🔄 Carregando listas...');
                const data = await window.apiClient.getParticipantLists();
                
                // 🔍 DIAGNÓSTICO LISTAS - Dados vindos do backend
                console.log('🔍 LISTAS BACKEND - Dados recebidos:', {
                    listsCount: Array.isArray(data) ? data.length : 0,
                    isArray: Array.isArray(data),
                    rawData: data,
                    listsSample: Array.isArray(data) ? data.slice(0, 2).map(list => ({
                        id: list._id,
                        name: list.name,
                        hasParticipantsField: !!list.participants,
                        participantsCount: list.participants?.length || 'undefined',
                        participantsType: typeof list.participants
                    })) : 'NOT_ARRAY'
                });
                
                this.lists = Array.isArray(data) ? data : [];
                console.log(`✅ ${this.lists.length} listas carregadas`);
                
                await this.displayLists();
                this.populateListFilter();
            } catch (error) {
                console.error('❌ Erro ao carregar listas:', error);
                this.lists = [];
            }
        },
        
        populateListFilter() {
            const listFilter = document.getElementById('listFilter');
            if (!listFilter) return;
            
            // 🔍 H1 - DIAGNÓSTICO FILTRO: Verificar população do filtro
            console.log('🔍 H1 - DIAGNÓSTICO FILTRO:', {
                listsManagerLists: this.lists?.length || 0,
                listFilterElement: !!document.getElementById('listFilter'),
                existingOptions: document.getElementById('listFilter')?.options?.length || 0,
                listsData: this.lists?.map(l => ({ id: l._id, name: l.name })) || []
            });
            
            // Limpar opções existentes (exceto "Todas as listas")
            const options = listFilter.querySelectorAll('option:not([value=""])');
            options.forEach(option => option.remove());
            
            // Adicionar opções das listas
            this.lists.forEach(list => {
                const option = document.createElement('option');
                option.value = list._id;
                option.textContent = list.name;
                listFilter.appendChild(option);
            });
            
            // 🔍 H1 - DIAGNÓSTICO FILTRO: Verificar após população
            console.log('🔍 H1 - FILTRO APÓS POPULAÇÃO:', {
                finalOptionsCount: listFilter.options.length,
                optionsValues: Array.from(listFilter.options).map(opt => ({ value: opt.value, text: opt.textContent }))
            });
            
            console.log(`✅ Filtro de listas atualizado com ${this.lists.length} opções`);
        },
        async displayLists() {
            const container = document.getElementById('listsContainer');
            if (!container) return;
            
            // Contar participantes para cada lista
            await this.updateParticipantCounts();
            
            if (this.lists.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="8" class="px-4 py-12 text-center">
                            <div class="flex flex-col items-center">
                                <i class="fas fa-list-ul text-4xl text-gray-600 mb-4"></i>
                                <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhuma lista encontrada</h3>
                                <p class="text-gray-500 mb-6">Crie sua primeira lista para organizar participantes</p>
                                <button onclick="window.location.href='editar-lista.html'" 
                                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    <i class="fas fa-plus mr-2"></i>Criar Nova Lista
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                container.innerHTML = this.lists.map(list => this.createListRow(list)).join('');
            }
            
            // Atualizar contadores
            this.updateListCounters();
        },
        
        createListRow(list) {
            const participantCount = list.participants?.length || 0;
            const description = list.description || 'Sem descrição';
            const tipo = list.tipo || 'participante';
            const campaignName = list.campaignName || 'Nenhuma campanha';
            const createdDate = new Date(list.createdAt).toLocaleDateString('pt-BR');
            
            return `
                <tr class="hover:bg-gray-800 transition-colors">
                    <td class="px-4 py-3">
                        <input type="checkbox" value="${list._id}" 
                               class="list-checkbox rounded border-gray-600 text-blue-600"
                               onchange="handleListCheckboxChange('${list._id}', this.checked)">
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-sm text-white font-medium">
                                ${list.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="font-medium text-gray-100">${list.name}</div>
                                <div class="text-sm text-gray-400">ID: ${list._id}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="text-sm text-gray-300 max-w-xs truncate" title="${description}">
                            ${description}
                        </div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <i class="fas fa-tag mr-1"></i>
                            ${tipo}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${participantCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                <i class="fas fa-users mr-1"></i>
                                ${participantCount}
                            </span>
                            ${participantCount > 0 ? 
                                `<button onclick="viewListParticipants('${list._id}', '${list.name.replace(/'/g, '\\\'')}')" 
                                         class="text-blue-400 hover:text-blue-300 transition-colors text-xs" 
                                         title="Ver participantes">
                                    <i class="fas fa-eye"></i>
                                </button>` : 
                                ''
                            }
                        </div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="text-sm text-gray-300">
                            ${campaignName}
                        </div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="text-sm text-gray-400">
                            ${createdDate}
                        </div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <button onclick="viewListParticipants('${list._id}', '${list.name.replace(/'/g, '\\\'')}')" 
                                    class="text-green-400 hover:text-green-300 transition-colors" 
                                    title="Ver Participantes">
                                <i class="fas fa-users"></i>
                            </button>
                            <button onclick="editList('${list._id}')" 
                                    class="text-blue-400 hover:text-blue-300 transition-colors" 
                                    title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="manageListParticipants('${list._id}')" 
                                    class="text-purple-400 hover:text-purple-300 transition-colors" 
                                    title="Gerenciar Participantes">
                                <i class="fas fa-cog"></i>
                            </button>
                            <button onclick="deleteList('${list._id}')" 
                                    class="text-red-400 hover:text-red-300 transition-colors" 
                                    title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        },
        
        async updateParticipantCounts() {
            try {
                // 🔍 DIAGNÓSTICO CONTAGEM - Início
                console.log('🔍 CONTAGEM - Iniciando contagem de participantes para listas:', this.lists.map(l => ({ id: l._id, name: l.name })));
                
                // 🚀 CORREÇÃO ALTERNATIVA: Tentar usar dados da própria lista primeiro
                let useAlternativeMethod = false;
                this.lists.forEach(list => {
                    if (list.participants && Array.isArray(list.participants)) {
                        list.participantsCount = list.participants.length;
                        console.log(`✅ CONTAGEM ALTERNATIVA - Lista "${list.name}": ${list.participantsCount} participantes (do campo participants da lista)`);
                        useAlternativeMethod = true;
                    } else {
                        console.log(`⚠️ CONTAGEM ALTERNATIVA - Lista "${list.name}": sem campo participants, usando API`);
                    }
                });
                
                // Se todas as listas têm dados no campo participants, não precisamos fazer chamadas à API
                if (useAlternativeMethod && this.lists.every(l => l.participants && Array.isArray(l.participants))) {
                    console.log('✅ CONTAGEM ALTERNATIVA - Usando dados das próprias listas, evitando chamadas de API desnecessárias');
                    console.log('🔍 CONTAGEM ALTERNATIVA - Resultado final:', this.lists.map(l => ({
                        name: l.name,
                        id: l._id,
                        count: l.participantsCount || 0
                    })));
                    return;
                }
                
                // 🔧 MÉTODO ORIGINAL: Para cada lista, buscar participantes associados via API
                console.log('🔧 CONTAGEM ORIGINAL - Usando chamadas de API para contagem');
                const promises = this.lists.map(async (list) => {
                    try {
                        console.log(`🔍 CONTAGEM - Buscando participantes para lista "${list.name}" (ID: ${list._id})`);
                        
                        const participants = await window.apiClient.getParticipants({ 
                            listId: list._id,
                            limit: 1000 
                        });
                        
                        // 🔍 DIAGNÓSTICO CONTAGEM - Resultado por lista
                        console.log(`🔍 CONTAGEM - Lista "${list.name}":`, {
                            listId: list._id,
                            participantsRetornados: participants.participants?.length || 0,
                            totalFromAPI: participants.total || 'undefined',
                            participantsSample: participants.participants?.slice(0, 2).map(p => ({ id: p._id, name: p.name })) || []
                        });
                        
                        list.participants = participants.participants || [];
                        list.participantsCount = list.participants.length;
                        
                        console.log(`✅ CONTAGEM - Lista "${list.name}" atualizada: ${list.participantsCount} participantes`);
                        
                    } catch (error) {
                        console.warn(`❌ CONTAGEM - Erro ao contar participantes da lista ${list.name}:`, error);
                        list.participants = [];
                        list.participantsCount = 0;
                    }
                });
                
                await Promise.all(promises);
                
                // 🔍 DIAGNÓSTICO CONTAGEM - Resultado final
                console.log('🔍 CONTAGEM - Resultado final:', this.lists.map(l => ({
                    name: l.name,
                    id: l._id,
                    count: l.participantsCount || 0
                })));
                
                console.log('✅ Contagem de participantes atualizada para todas as listas');
            } catch (error) {
                console.error('❌ Erro ao atualizar contagens:', error);
            }
        },
        
        updateListCounters() {
            const totalLists = this.lists.length;
            const totalParticipants = this.lists.reduce((sum, list) => sum + (list.participantsCount || 0), 0);
            
            const listsCountEl = document.querySelector('.lists-count');
            const participantsCountEl = document.querySelector('.total-participants-count');
            
            if (listsCountEl) {
                listsCountEl.textContent = `${totalLists} lista${totalLists !== 1 ? 's' : ''}`;
            }
            
            if (participantsCountEl) {
                participantsCountEl.textContent = `${totalParticipants} participante${totalParticipants !== 1 ? 's' : ''} total`;
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

async function viewListParticipants(listId, listName) {
    console.log(`🔍 Visualizando participantes da lista: ${listName} (ID: ${listId})`);
    
    try {
        // 🎯 AJUSTE FINO - Limpar todos os filtros antes de aplicar o filtro da lista
        console.log('🎯 AJUSTE FINO - Limpando filtros existentes');
        
        // Limpar filtros de interface
        const statusFilter = document.getElementById('statusFilter');
        const emailFilter = document.getElementById('emailFilter');
        const listFilter = document.getElementById('listFilter');
        
        if (statusFilter) statusFilter.value = '';
        if (emailFilter) emailFilter.value = '';
        
        // Resetar botões de tipo
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-gray-700', 'text-gray-200');
        });
        
        // Ativar filtro "Todos"
        const todosFilter = document.getElementById('filter-todos');
        if (todosFilter) {
            todosFilter.classList.add('bg-blue-600', 'text-white');
            todosFilter.classList.remove('bg-gray-700', 'text-gray-200');
        }
        
        // 🎯 TROCAR PARA ABA DE USUÁRIOS PRIMEIRO
        switchTab('users');
        
        // 🎯 AGUARDAR CARREGAMENTO DA ABA
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 🎯 AJUSTE FINO - Aplicar APENAS filtro da lista selecionada
        console.log(`🎯 AJUSTE FINO - Aplicando filtro exclusivo da lista: ${listName} (${listId})`);
        
        if (participantsManager) {
            // Limpar filtros do manager
            participantsManager.currentFilters = {};
            
            // Aplicar APENAS o filtro da lista
            await participantsManager.applyFilters({ 
                listId: listId,
                // Garantir que outros filtros estão vazios
                status: '',
                email: '',
                tipo: ''
            });
        }
        
        // 🎯 ATUALIZAR DROPDOWN DE LISTA
        if (listFilter) {
            // Verificar se a opção já existe
            let option = listFilter.querySelector(`option[value="${listId}"]`);
            if (!option) {
                option = document.createElement('option');
                option.value = listId;
                option.textContent = listName;
                listFilter.appendChild(option);
            }
            listFilter.value = listId;
        }
        
        // 🎯 VERIFICAR RESULTADO
        const participants = await window.apiClient.getParticipants({ 
            listId: listId,
            limit: 1000 
        });
        
        console.log(`🎯 AJUSTE FINO - Participantes encontrados para lista "${listName}":`, participants.participants?.length || 0);
        
        // 🎯 FEEDBACK CLARO AO USUÁRIO
        const count = participants.participants?.length || 0;
        if (count > 0) {
            showNotification(`✅ Exibindo ${count} participante${count !== 1 ? 's' : ''} da lista "${listName}"`, 'success');
        } else {
            showNotification(`⚠️ A lista "${listName}" não possui participantes`, 'warning');
        }
        
        console.log(`✅ Filtro aplicado com sucesso para a lista: ${listName}`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar participantes da lista:', error);
        showNotification(`❌ Erro ao carregar participantes da lista "${listName}"`, 'error');
    }
}

async function manageListParticipants(listId) {
    // Implementar modal de gerenciamento de participantes
    const list = listsManager.lists.find(l => l._id === listId);
    if (!list) return;
    
    showNotification(`Gerenciamento de participantes da lista "${list.name}" em desenvolvimento`, 'info');
    // TODO: Implementar modal completo de gerenciamento
}

function handleListCheckboxChange(listId, checked) {
    const list = listsManager.lists.find(l => l._id === listId);
    if (list) {
        list.selected = checked;
    }
    
    updateBulkListActions();
}

function toggleAllLists() {
    const selectAll = document.getElementById('selectAllLists');
    const checkboxes = document.querySelectorAll('.list-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
        const listId = checkbox.value;
        handleListCheckboxChange(listId, selectAll.checked);
    });
}

function updateBulkListActions() {
    const selectedCount = listsManager.lists.filter(l => l.selected).length;
    const bulkActions = document.getElementById('bulkListActions');
    
    if (bulkActions) {
        bulkActions.style.display = selectedCount > 0 ? 'block' : 'none';
    }
    
    console.log(`${selectedCount} listas selecionadas`);
}

async function refreshLists() {
    console.log('🔄 Atualizando listas...');
    if (listsManager) {
        await listsManager.loadLists();
    }
    showNotification('Listas atualizadas!', 'success');
}

async function exportLists() {
    try {
        const data = {
            timestamp: new Date().toISOString(),
            lists: listsManager.lists.map(list => ({
                id: list._id,
                name: list.name,
                description: list.description,
                tipo: list.tipo,
                participantCount: list.participantsCount || 0,
                createdAt: list.createdAt,
                campaignName: list.campaignName
            }))
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `listas-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('Listas exportadas com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao exportar listas:', error);
        showNotification('Erro ao exportar listas', 'error');
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
    
    // 🔍 H2 - DIAGNÓSTICO FILTROS ENVIADOS
    console.log('🔍 H2 - FILTROS ENVIADOS FRONTEND:', {
        filters: filters,
        listIdFilter: filters.listId,
        hasListId: !!filters.listId,
        statusFilter: filters.status,
        emailFilter: filters.email,
        participantsManagerExists: !!participantsManager
    });
    
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
    
    // Usar sistema de notificação do helpers se disponível
    if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
        window.showNotification(message, type);
    } else {
        // Fallback: notificação simples
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-300 ${getNotificationColor(type)}`;
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="${getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white/80 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return 'bg-green-600';
        case 'error': return 'bg-red-600';
        case 'warning': return 'bg-yellow-600';
        default: return 'bg-blue-600';
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        default: return 'fas fa-info-circle';
    }
}

// ===== EXPORTAR FUNÇÕES IMEDIATAMENTE =====
window.switchTab = switchTab;
window.setTipoFiltro = setTipoFiltro;
window.filterParticipants = filterParticipants;
window.editList = editList;
window.deleteList = deleteList;
window.loadStatistics = loadStatistics;
window.viewListParticipants = viewListParticipants;
window.manageListParticipants = manageListParticipants;
window.handleListCheckboxChange = handleListCheckboxChange;
window.toggleAllLists = toggleAllLists;
window.refreshLists = refreshLists;
window.exportLists = exportLists;

console.log('✅ Funções globais exportadas:', {
    switchTab: typeof window.switchTab,
    setTipoFiltro: typeof window.setTipoFiltro,
    filterParticipants: typeof window.filterParticipants,
    viewListParticipants: typeof window.viewListParticipants,
    toggleAllLists: typeof window.toggleAllLists
});

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