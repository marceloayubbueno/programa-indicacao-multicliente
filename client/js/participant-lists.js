// Variáveis globais
let selectedParticipants = new Set();
let currentPage = 1;
const itemsPerPage = 10;
let lists = [];
let participants = [];
let listFilter = 'todas'; // 'todas', 'participante', 'indicador', 'influenciador', 'mista', 'campanha'

// Funções de inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadLists();
    loadParticipants();
    const newListBtn = document.querySelector('button[onclick="showNewListModal()"]');
    if (newListBtn) {
        newListBtn.onclick = () => window.location.href = 'editar-lista.html';
    }
});

// Funções do Modal
function showNewListModal() {
    document.getElementById('newListModal').style.display = 'flex';
    loadParticipantsForList();
}

function closeNewListModal() {
    document.getElementById('newListModal').style.display = 'none';
    document.getElementById('newListForm').reset();
    selectedParticipants.clear();
    updateSelectedParticipantsList();
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modals = [
        'newListModal',
        'importModal',
        'manageParticipantsModal',
        'deleteConfirmationModal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            if (modalId === 'newListModal') {
                closeNewListModal();
            } else if (modalId === 'importModal') {
                closeImportModal();
            } else if (modalId === 'manageParticipantsModal') {
                closeManageParticipantsModal();
            } else if (modalId === 'deleteConfirmationModal') {
                closeDeleteConfirmationModal();
            }
        }
    });
}

// Funções de gerenciamento de listas
async function loadLists() {
    const token = localStorage.getItem('clientToken');
    const clientId = localStorage.getItem('clientId');
    if (!token || !clientId) {
        showNotification('Erro de autenticação. Faça login novamente.', 'error');
        return;
    }
    
    // Mostrar loading
    showLoadingState(true);
    
    try {
        const response = await fetch(`${API_URL}/participant-lists?clientId=${clientId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Erro ao carregar listas');
        }
        lists = await response.json();
        displayLists();
        // Atualizar estatísticas do dashboard
        if (typeof updateListsStats === 'function') {
            updateListsStats();
        }
    } catch (error) {
        console.error(error);
        showNotification(error.message || 'Erro ao carregar listas', 'error');
    } finally {
        showLoadingState(false);
    }
}

function showLoadingState(show) {
    const tbody = document.getElementById('listsList');
    
    if (show) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-12">
                    <div class="flex flex-col items-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
                        <p class="text-gray-400">Carregando listas...</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

async function displayLists() {
    const tbody = document.getElementById('listsList');
    tbody.innerHTML = '';
    
    if (!lists || lists.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data text-center py-12">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-list-ul text-4xl text-gray-500 mb-4"></i>
                        <p class="text-xl text-gray-400 mb-2">Nenhuma lista encontrada</p>
                        <p class="text-sm text-gray-500">Crie sua primeira lista para organizar seus participantes</p>
                        <button onclick="showNewListModal()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-plus mr-2"></i>Criar Lista
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const filteredLists = filterListsBySearch();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const listsToShow = filteredLists.slice(startIndex, endIndex);
    
    for (const list of listsToShow) {
        let participantsCount = 0;
        let participantsData = [];
        
        try {
            const token = localStorage.getItem('clientToken');
            const resp = await fetch(`${API_URL}/participant-lists/${list._id || list.id}/participants/count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                participantsCount = data.count;
            }
            
            // Buscar alguns participantes para preview
            if (participantsCount > 0) {
                const participantsResp = await fetch(`${API_URL}/participant-lists/${list._id || list.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (participantsResp.ok) {
                    const listData = await participantsResp.json();
                    participantsData = listData.participants || [];
                }
            }
        } catch (e) { 
            console.warn('Erro ao carregar dados da lista:', e);
        }
        
        // Determinar tipo e cor
        let tipoInfo = getTipoInfo(list.tipo);
        
        // Status da lista
        let statusInfo = getStatusInfo(list.status);
        
        // Informações da campanha
        let campaignInfo = list.campaignName 
            ? `<span class="text-blue-400 font-medium">${list.campaignName}</span>`
            : '<span class="text-gray-500">-</span>';
            
        if (list.campaignId) {
            campaignInfo += ' <i class="fas fa-link text-xs text-blue-400 ml-1" title="Vinculada à campanha"></i>';
        }
        
        // Preview de participantes
        let participantsPreview = '';
        if (participantsData.length > 0) {
            const preview = participantsData.slice(0, 3);
            participantsPreview = `
                <div class="flex -space-x-2 mt-1" title="Preview dos participantes">
                    ${preview.map(p => `
                        <div class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium border-2 border-gray-900">
                            ${p.name ? p.name.charAt(0).toUpperCase() : '?'}
                        </div>
                    `).join('')}
                    ${participantsData.length > 3 ? `
                        <div class="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white font-medium border-2 border-gray-900">
                            +${participantsData.length - 3}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-800 transition-colors';
        tr.innerHTML = `
            <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg ${tipoInfo.bgColor} flex items-center justify-center">
                        <i class="${tipoInfo.icon} text-white"></i>
                    </div>
                    <div>
                        <div class="font-semibold text-gray-100">${list.name}</div>
                        <div class="text-sm text-gray-400">${list.description || 'Sem descrição'}</div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                    <span class="text-lg font-bold text-white">${participantsCount}</span>
                    <span class="text-sm text-gray-400">participantes</span>
                </div>
                ${participantsPreview}
            </td>
            <td class="px-4 py-4">
                <div class="text-sm text-gray-300">${new Date(list.createdAt).toLocaleDateString('pt-BR')}</div>
                <div class="text-xs text-gray-500">${getRelativeTime(list.createdAt)}</div>
            </td>
            <td class="px-4 py-4">${campaignInfo}</td>
            <td class="px-4 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoInfo.badgeClass}">
                    <i class="${tipoInfo.icon} mr-1"></i>
                    ${tipoInfo.label}
                </span>
            </td>
            <td class="px-4 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.badgeClass}">
                    <i class="${statusInfo.icon} mr-1"></i>
                    ${statusInfo.label}
                </span>
            </td>
            <td class="px-4 py-4">
                <div class="flex items-center gap-1">
                    <button onclick="viewListDetails('${list._id || list.id}')" class="btn-icon text-blue-400 hover:bg-blue-500/10" title="Ver Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="window.location.href='editar-lista.html?id=${list._id || list.id}'" class="btn-icon text-gray-400 hover:bg-gray-500/10" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                    <button onclick="manageParticipants('${list._id || list.id}')" class="btn-icon text-green-400 hover:bg-green-500/10" title="Gerenciar Participantes">
                    <i class="fas fa-users"></i>
                </button>
                    <button onclick="duplicateList('${list._id || list.id}')" class="btn-icon text-purple-400 hover:bg-purple-500/10" title="Duplicar Lista">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button onclick="exportList('${list._id || list.id}')" class="btn-icon text-yellow-400 hover:bg-yellow-500/10" title="Exportar">
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="deleteList('${list._id || list.id}')" class="btn-icon text-red-400 hover:bg-red-500/10" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    }
    
    updatePagination(filteredLists.length);
}

function setTipoListaFiltro(tipo) {
    listFilter = tipo;
    
    // Atualizar aparência dos botões de filtro
    const filterButtons = ['filter-todas', 'filter-participante', 'filter-indicador', 'filter-influenciador', 'filter-mista', 'filter-campanha'];
    
    filterButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            const isActive = buttonId === `filter-${tipo}`;
            
            // Remover classes antigas
            button.classList.remove('bg-blue-600', 'text-white', 'bg-gray-700', 'text-gray-200');
            
            // Aplicar classes apropriadas
            if (isActive) {
                button.classList.add('bg-blue-600', 'text-white');
            } else {
                button.classList.add('bg-gray-700', 'text-gray-200');
            }
        }
    });
    
    displayLists();
}

function filterListsBySearch() {
    const searchTerm = document.getElementById('searchList').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    return lists.filter(list => {
        const matchesSearch = list.name.toLowerCase().includes(searchTerm) || 
                            (list.description && list.description.toLowerCase().includes(searchTerm));
        const matchesStatus = !statusFilter || list.status === statusFilter;
        const matchesDate = !dateFilter || new Date(list.createdAt).toISOString().split('T')[0] === dateFilter;
        
        // Aplicar filtro por tipo de lista
        let matchesType = true;
        if (listFilter !== 'todas') {
            if (listFilter === 'campanha') {
                matchesType = !!list.campaignId;
            } else {
                matchesType = list.tipo === listFilter;
            }
        }
        
        return matchesSearch && matchesStatus && matchesDate && matchesType;
    });
}

// Funções de gerenciamento de participantes
function loadParticipants() {
    const storedParticipants = localStorage.getItem('participants');
    participants = storedParticipants ? JSON.parse(storedParticipants) : [];
}

async function manageParticipants(listId) {
    const list = lists.find(l => (l._id || l.id) === listId);
    if (!list) return;

    const token = localStorage.getItem('clientToken');
    const clientId = localStorage.getItem('clientId');
    
    if (!token || !clientId) {
        showNotification('Erro de autenticação. Faça login novamente.', 'error');
        return;
    }

    // Mostrar loading
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.id = 'manageParticipantsModal';
    
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-2xl mx-4">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-gray-100">Gerenciar Participantes - ${list.name}</h2>
                <button class="text-2xl text-gray-400 hover:text-gray-200" onclick="closeManageParticipantsModal()">&times;</button>
            </div>
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mr-3"></div>
                <span class="text-gray-300">Carregando participantes...</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    try {
        // Carregar todos os participantes do cliente
        const participantsResponse = await fetch(`${API_URL}/participants?clientId=${clientId}&limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!participantsResponse.ok) {
            throw new Error('Erro ao carregar participantes');
        }
        
        const participantsData = await participantsResponse.json();
        const allParticipants = participantsData.participants || [];
        
        // Carregar dados completos da lista para ver quais participantes já estão nela
        const listResponse = await fetch(`${API_URL}/participant-lists/${listId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!listResponse.ok) {
            throw new Error('Erro ao carregar dados da lista');
        }
        
        const listData = await listResponse.json();
        const listParticipantIds = (listData.participants || []).map(p => (p._id || p.id || p).toString());
        
        // Atualizar o modal com a interface completa
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-2xl mx-4">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-gray-100">Gerenciar Participantes - ${list.name}</h2>
                    <button class="text-2xl text-gray-400 hover:text-gray-200" onclick="closeManageParticipantsModal()">&times;</button>
                </div>
                
                <!-- Estatísticas -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-gray-700 rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-blue-400">${allParticipants.length}</div>
                        <div class="text-sm text-gray-300">Total Disponível</div>
                    </div>
                    <div class="bg-gray-700 rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-green-400" id="selectedCountDisplay">${listParticipantIds.length}</div>
                        <div class="text-sm text-gray-300">Na Lista</div>
                    </div>
                </div>
                
                <!-- Busca -->
                <div class="mb-4">
                    <div class="relative">
                    <input type="text" id="participantSearchInput" 
                           placeholder="Buscar participantes..." 
                               onkeyup="filterParticipantsInModal()"
                               class="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500">
                        <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                </div>
                
                <!-- Ações em lote -->
                <div class="flex items-center justify-between mb-4 p-3 bg-gray-700 rounded-lg">
                    <span class="text-gray-300 text-sm">
                        <span id="selectedCount">${listParticipantIds.length}</span> de ${allParticipants.length} participantes selecionados
                    </span>
                    <div class="flex gap-2">
                        <button onclick="toggleAllParticipants()" class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                            <i class="fas fa-check-square mr-1"></i>Alternar Todos
                        </button>
                        <button onclick="selectOnlyActive()" class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                            <i class="fas fa-user-check mr-1"></i>Só Ativos
                        </button>
                    </div>
                </div>
                
                <!-- Lista de participantes -->
                <div class="max-h-96 overflow-y-auto border border-gray-700 rounded-lg">
                    <div id="modalParticipantsList" class="space-y-1 p-2">
                        ${allParticipants.map(participant => {
                            const isSelected = listParticipantIds.includes((participant._id || participant.id).toString());
                            const statusColor = participant.status === 'ativo' ? 'text-green-400' : 'text-red-400';
                            const tipoInfo = getTipoInfo(participant.tipo);
                            
                            return `
                                <div class="participant-item p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                                    <label class="flex items-center gap-3 cursor-pointer w-full">
                                        <input type="checkbox" 
                                               value="${participant._id || participant.id}"
                                               ${isSelected ? 'checked' : ''}
                                               onchange="toggleParticipantInList('${participant._id || participant.id}', '${listId}', this.checked)"
                                               class="w-4 h-4 text-blue-600 border-gray-600 rounded focus:ring-blue-500">
                                        
                                        <div class="w-8 h-8 rounded-full ${tipoInfo.bgColor} flex items-center justify-center text-sm text-white font-medium">
                                            ${participant.name ? participant.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2">
                                                <span class="participant-name font-medium text-gray-100">${participant.name}</span>
                                                <span class="px-2 py-0.5 text-xs rounded-full ${tipoInfo.badgeClass}">
                                                    ${tipoInfo.label}
                                                </span>
                                                <i class="fas fa-circle text-xs ${statusColor}" title="Status: ${participant.status}"></i>
                                            </div>
                                            <div class="participant-email text-sm text-gray-400">${participant.email}</div>
                                            ${participant.phone ? `<div class="text-xs text-gray-500">${participant.phone}</div>` : ''}
                                </div>
                            </label>
                        </div>
                            `;
                        }).join('')}
                </div>
            </div>
                
                <div class="flex justify-end mt-6">
                    <button class="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition-colors" onclick="closeManageParticipantsModal()">
                        Fechar
                    </button>
            </div>
        </div>
    `;
    
    } catch (error) {
        console.error('Erro ao carregar participantes:', error);
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-md mx-4">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-100">Erro</h2>
                    <button class="text-2xl text-gray-400 hover:text-gray-200" onclick="closeManageParticipantsModal()">&times;</button>
                </div>
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <p class="text-gray-300 mb-4">${error.message}</p>
                    <button onclick="closeManageParticipantsModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        `;
    }
}

function closeManageParticipantsModal() {
    const modal = document.getElementById('manageParticipantsModal');
    if (modal) {
        modal.remove();
    }
}

function filterParticipantsInModal() {
    const searchTerm = document.getElementById('participantSearchInput').value.toLowerCase();
    const items = document.querySelectorAll('#modalParticipantsList .participant-item');
    
    items.forEach(item => {
        const name = item.querySelector('.participant-name').textContent.toLowerCase();
        const email = item.querySelector('.participant-email').textContent.toLowerCase();
        
        const matchesSearch = name.includes(searchTerm) || email.includes(searchTerm);
        item.style.display = matchesSearch ? 'block' : 'none';
    });
    
    // Atualizar contadores após filtro
    setTimeout(() => {
        updateParticipantCounts();
    }, 100);
}

async function toggleParticipantInList(participantId, listId, checked) {
    const token = localStorage.getItem('clientToken');
    if (!token) {
        showNotification('Token não encontrado. Faça login novamente.', 'error');
        return;
    }
    
    const endpoint = checked
        ? `${API_URL}/participant-lists/${listId}/add-participant/${participantId}`
        : `${API_URL}/participant-lists/${listId}/remove-participant/${participantId}`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Erro ao atualizar lista');
        }
        
        // Atualizar contadores
        updateParticipantCounts();
        
        // Mostrar feedback visual sutil
        const checkbox = document.querySelector(`input[value="${participantId}"]`);
        if (checkbox) {
            const participantItem = checkbox.closest('.participant-item');
            participantItem.classList.add(checked ? 'bg-green-600' : 'bg-red-600');
            setTimeout(() => {
                participantItem.classList.remove('bg-green-600', 'bg-red-600');
            }, 300);
        }
        
        // Recarregar listas para atualizar a tabela principal
        loadLists();
        
    } catch (error) {
        console.error(error);
        showNotification(error.message || 'Erro ao atualizar lista', 'error');
        
        // Reverter checkbox em caso de erro
        const checkbox = document.querySelector(`input[value="${participantId}"]`);
        if (checkbox) {
            checkbox.checked = !checked;
        }
    }
}

// Função para atualizar contadores no modal
function updateParticipantCounts() {
    const checkboxes = document.querySelectorAll('#modalParticipantsList input[type="checkbox"]');
    const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const totalCount = checkboxes.length;
    
    const selectedCountElement = document.getElementById('selectedCount');
    const selectedCountDisplayElement = document.getElementById('selectedCountDisplay');
    
    if (selectedCountElement) {
        selectedCountElement.textContent = selectedCount;
    }
    if (selectedCountDisplayElement) {
        selectedCountDisplayElement.textContent = selectedCount;
    }
}

// Função para alternar todos os participantes
function toggleAllParticipants() {
    const checkboxes = document.querySelectorAll('#modalParticipantsList input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked !== !allChecked) {
            checkbox.checked = !allChecked;
            checkbox.dispatchEvent(new Event('change'));
        }
    });
}

// Função para selecionar apenas participantes ativos
function selectOnlyActive() {
    const checkboxes = document.querySelectorAll('#modalParticipantsList input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        const participantItem = checkbox.closest('.participant-item');
        const statusIcon = participantItem.querySelector('.fas.fa-circle');
        const isActive = statusIcon && statusIcon.classList.contains('text-green-400');
        
        if (checkbox.checked !== isActive) {
            checkbox.checked = isActive;
            checkbox.dispatchEvent(new Event('change'));
        }
    });
}

// Funções de seleção de participantes
function toggleParticipant(id, name) {
    if (selectedParticipants.has(id)) {
        selectedParticipants.delete(id);
    } else {
        selectedParticipants.add(id);
    }
    
    updateSelectedParticipantsList();
    updateSelectedCount();
}

function updateSelectedParticipantsList() {
    const selectedList = document.getElementById('selectedParticipantsList');
    if (!selectedList) return;
    
    selectedList.innerHTML = '';
    
    const participants = JSON.parse(localStorage.getItem('participants') || '[]');
    
    selectedParticipants.forEach(id => {
        const participant = participants.find(p => p.id === id);
        if (participant) {
            const tag = document.createElement('div');
            tag.className = 'selected-participant-tag';
            tag.innerHTML = `
                <span>${participant.name}</span>
                <span class="remove-participant" onclick="toggleParticipant(${id})">&times;</span>
            `;
            selectedList.appendChild(tag);
        }
    });
}

function updateSelectedCount() {
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
        countElement.textContent = `${selectedParticipants.size} selecionados`;
    }
}

// Funções de paginação
function changePage(direction) {
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'next') {
        const totalPages = Math.ceil(lists.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
        }
    }
    displayLists();
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pageInfo = document.querySelector('.page-info');
    if (pageInfo) {
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    }
    
    const prevButton = document.querySelector('.pagination button:first-child');
    const nextButton = document.querySelector('.pagination button:last-child');
    if (prevButton) prevButton.disabled = currentPage === 1;
    if (nextButton) nextButton.disabled = currentPage === totalPages;
}

// Funções de busca
function searchLists() {
    currentPage = 1;
    displayLists();
}

// Função para visualizar participantes de uma lista
function viewParticipants(listId) {
    const lists = JSON.parse(localStorage.getItem('participantLists') || '[]');
    const list = lists.find(l => l.id === listId || l._id === listId);
    if (list) {
        const participants = JSON.parse(localStorage.getItem('participants') || '[]');
        const listParticipants = participants.filter(p => list.participants && list.participants.includes(p.id || p._id));
        // Remove modal anterior se existir
        const oldModal = document.getElementById('viewParticipantsModal');
        if (oldModal) oldModal.remove();
        // Cria modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40';
        modal.id = 'viewParticipantsModal';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-xl p-8 shadow-lg w-full max-w-2xl relative flex flex-col items-center mx-auto">
                <div class="flex items-center justify-between w-full mb-4">
                    <h2 class="text-xl font-bold text-gray-100">Participantes da Lista: ${list.name}</h2>
                    <button class="text-2xl text-gray-400 hover:text-gray-200" onclick="document.getElementById('viewParticipantsModal').remove()">&times;</button>
                </div>
                <div class="w-full mb-2 text-gray-300 text-sm">Total: <span class="font-semibold">${listParticipants.length}</span> participante${listParticipants.length !== 1 ? 's' : ''}</div>
                <div class="w-full max-h-96 overflow-y-auto">
                    <table class="min-w-full divide-y divide-gray-700">
                        <thead class="bg-gray-700">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Nome</th>
                                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">E-mail</th>
                            </tr>
                        </thead>
                        <tbody class="bg-gray-900 divide-y divide-gray-800">
                            ${listParticipants.map(p => `
                                <tr>
                                    <td class="px-4 py-2">${p.name}</td>
                                    <td class="px-4 py-2">${p.email}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="flex items-center justify-end w-full mt-4">
                    <button class="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 shadow hover:bg-gray-600 transition-colors" onclick="document.getElementById('viewParticipantsModal').remove()">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Funções de edição e exclusão
async function editList(listId) {
    const token = localStorage.getItem('clientToken');
    if (!token) {
        showNotification('Token não encontrado. Faça login novamente.', 'error');
        return;
    }
    try {
        // Buscar dados da lista
        const response = await fetch(`${API_URL}/participant-lists/${listId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erro ao buscar lista');
        const list = await response.json();
        // Preencher modal de edição
        document.getElementById('listName').value = list.name;
        document.getElementById('listDescription').value = list.description || '';
        // Exibir modal
        showNewListModal();
        // Substituir handler do formulário para salvar edição
        const form = document.getElementById('newListForm');
        form.onsubmit = async function(event) {
            event.preventDefault();
            const updatedList = {
                name: document.getElementById('listName').value,
                description: document.getElementById('listDescription').value
            };
            try {
                const patchResp = await fetch(`${API_URL}/participant-lists/${listId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedList)
                });
                if (!patchResp.ok) {
                    const errData = await patchResp.json();
                    throw new Error(errData.message || 'Erro ao atualizar lista');
                }
                showNotification('Lista atualizada com sucesso!', 'success');
                closeNewListModal();
                loadLists();
            } catch (error) {
                console.error(error);
                showNotification(error.message || 'Erro ao atualizar lista', 'error');
            }
            return false;
        };
    } catch (error) {
        console.error(error);
        showNotification(error.message || 'Erro ao editar lista', 'error');
    }
}

function deleteList(listId) {
    const list = lists.find(l => l.id === listId || l._id === listId);
    if (!list) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'deleteConfirmationModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Confirmar Exclusão</h2>
                <button class="close-btn" onclick="closeDeleteConfirmationModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Você tem certeza que deseja excluir a lista <strong>${list.name}</strong>?</p>
                <p class="warning-text">Esta ação não pode ser desfeita e removerá a lista de todos os participantes associados.</p>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeDeleteConfirmationModal()">Cancelar</button>
                <button type="button" class="btn-danger" onclick="confirmDeleteList('${listId}')">Excluir Lista</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeDeleteConfirmationModal() {
    const modal = document.getElementById('deleteConfirmationModal');
    if (modal) {
        modal.remove();
    }
}

async function confirmDeleteList(listId) {
    const token = localStorage.getItem('clientToken');
    if (!token) {
        showNotification('Token não encontrado. Faça login novamente.', 'error');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/participant-lists/${listId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Erro ao excluir lista');
        }
        showNotification('Lista excluída com sucesso!', 'success');
        closeDeleteConfirmationModal();
        loadLists();
    } catch (error) {
        console.error(error);
        showNotification(error.message || 'Erro ao excluir lista', 'error');
    }
}

// Funções de importação
function showImportModal() {
    const modal = document.getElementById('importModal');
    if (!modal) {
        console.error('Modal de importação não encontrado');
        return;
    }
    
    // Resetar o formulário e limpar o mapeamento
    const form = document.getElementById('importForm');
    const mappingContainer = document.getElementById('importMapping');
    
    if (form) form.reset();
    if (mappingContainer) mappingContainer.innerHTML = '';
    
    // Exibir o modal
    modal.style.display = 'block';
    
    // Garantir que o input de arquivo aceite ambos os tipos inicialmente
    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.accept = '.xlsx,.csv';
    }
}

function closeImportModal() {
    const modal = document.getElementById('importModal');
    if (!modal) {
        console.error('Modal de importação não encontrado');
        return;
    }
    
    // Resetar o formulário e limpar o mapeamento
    const form = document.getElementById('importForm');
    const mappingContainer = document.getElementById('importMapping');
    
    if (form) form.reset();
    if (mappingContainer) mappingContainer.innerHTML = '';
    
    // Esconder o modal
    modal.style.display = 'none';
}

function toggleImportFields() {
    const importType = document.getElementById('importType').value;
    const importFile = document.getElementById('importFile');
    
    if (!importFile) return;
    
    if (importType === 'excel') {
        importFile.accept = '.xlsx';
    } else if (importType === 'csv') {
        importFile.accept = '.csv';
    } else {
        importFile.accept = '.xlsx,.csv';
    }
}

function handleImport(event) {
    event.preventDefault();
    const importType = document.getElementById('importType');
    const importFile = document.getElementById('importFile');
    const importUpdate = document.getElementById('importUpdate');
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    if (!importType || !importFile || !importUpdate) {
        console.error(new Error('Erro: Campos de importação não encontrados.'));
        return false;
    }
    const file = importFile.files[0];
    if (!file) {
        console.error(new Error('Por favor, selecione um arquivo para importar.'));
        return false;
    }
    submitButton.disabled = true;
    submitButton.textContent = 'Importando...';
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            let participants = [];
            if (importType.value === 'excel') {
                participants = parseExcelFile(e.target.result);
            } else if (importType.value === 'csv') {
                participants = parseCSVFile(e.target.result);
            }
            if (participants.length > 0) {
                const clientId = localStorage.getItem('clientId');
                const token = localStorage.getItem('clientToken');
                if (!clientId || !token) {
                    console.error(new Error('Erro de autenticação. Faça login novamente.'));
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                    return;
                }
                // Garantir que todos os campos obrigatórios estejam presentes
                let hasError = false;
                let missingFields = [];
                participants = participants.map((p, idx) => {
                    const name = (p.name || '').trim();
                    const email = (p.email || '').trim();
                    const phone = (p.phone || p.telefone || '').toString().trim();
                    if (!name || !email || !phone) {
                        hasError = true;
                        missingFields.push(`Linha ${idx + 2}: Nome, Email ou Telefone ausente.`);
                    }
                    return {
                        ...p,
                        name,
                        email,
                        phone,
                        clientId
                    };
                });
                if (hasError) {
                    console.error(new Error('Importação cancelada. Corrija os seguintes problemas antes de tentar novamente:\n' + missingFields.join('\n')));
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                    return;
                }
                // 🔍 DIAGNÓSTICO: Log detalhado do processo de importação
                console.log('🔍 [IMPORT-START] Iniciando importação de participantes:');
                console.log('🔍 [IMPORT-DATA] ClientId:', clientId);
                console.log('🔍 [IMPORT-DATA] Quantidade de participantes:', participants.length);
                console.log('🔍 [IMPORT-DATA] Participantes:', participants.map(p => ({ name: p.name, email: p.email })));
                console.log('🔍 [IMPORT-FLOW] Chamando /participants/import SEM listId');
                
                // Enviar participantes para o backend
                const importResp = await fetch(`${API_URL}/participants/import`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ clientId, participants })
                });
                if (!importResp.ok) {
                    const data = await importResp.json();
                    throw new Error(data.message || 'Erro ao importar participantes');
                }
                
                // 🔍 DIAGNÓSTICO: Verificar resposta da importação
                const importData = await importResp.json();
                console.log('🔍 [IMPORT-RESPONSE] Status da importação:', importResp.status);
                console.log('🔍 [IMPORT-RESPONSE] Dados retornados:', importData);
                console.log('🔍 [IMPORT-RESPONSE] Participantes criados:', importData.participantsCreated || 'indefinido');
                console.log('🔍 [IMPORT-RESPONSE] Total processados:', importData.totalProcessed || 'indefinido');
                
                // 🔍 DIAGNÓSTICO: Buscar participantes importados
                const emails = participants.map(p => p.email);
                console.log('🔍 [SEARCH-START] Buscando participantes recém-importados:');
                console.log('🔍 [SEARCH-EMAILS] Emails para buscar:', emails);
                
                const searchResp = await fetch(`${API_URL}/participants?clientId=${clientId}&limit=1000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const allData = await searchResp.json();
                console.log('🔍 [SEARCH-RESULT] Status da busca:', searchResp.status);
                console.log('🔍 [SEARCH-RESULT] Total participantes no cliente:', allData.participants?.length);
                
                const importedParticipants = (allData.participants || []).filter(p => emails.includes(p.email));
                console.log('🔍 [FILTER-RESULT] Participantes encontrados por email:', importedParticipants.length);
                console.log('🔍 [FILTER-RESULT] Participantes detalhados:', importedParticipants.map(p => ({ 
                    id: p._id, 
                    email: p.email, 
                    lists: p.lists?.length || 0,
                    listsIds: p.lists?.map(l => l._id || l) || []
                })));
                
                // 🆕 CORREÇÃO: Permitir criar lista mesmo se alguns participantes falharam
                // A lista será criada e os participantes válidos serão adicionados
                const listName = document.getElementById('listNameImport').value;
                const listDescription = document.getElementById('listDescriptionImport').value;
                const listTipo = document.getElementById('listTipoImport').value;
                
                if (!listTipo) {
                    console.error(new Error('Selecione o tipo da lista.'));
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                    return;
                }
                
                // 🔍 DIAGNÓSTICO: Preparação para criação da lista
                const participantIds = importedParticipants
                    .map(p => p._id || p.id)
                    .filter(id => id); // Remove IDs undefined/null
                
                console.log('🔍 [LIST-PREP] Preparando criação da lista:');
                console.log('🔍 [LIST-PREP] Nome da lista:', listName);
                console.log('🔍 [LIST-PREP] Tipo da lista:', listTipo);
                console.log('🔍 [LIST-PREP] IDs para associar:', participantIds);
                console.log('🔍 [LIST-PREP] Quantidade a associar:', participantIds.length);
                
                // 🔍 DIAGNÓSTICO: Verificar se todos os participantes têm listas vazias
                importedParticipants.forEach((p, idx) => {
                    console.log(`🔍 [PARTICIPANT-${idx + 1}] ${p.email}:`, {
                        id: p._id,
                        listsCount: p.lists?.length || 0,
                        lists: p.lists?.map(l => l._id || l) || []
                    });
                });
                
                // Criar a lista
                console.log('🔍 [LIST-CREATE] Chamando API para criar lista...');
                const listResp = await fetch(`${API_URL}/participant-lists`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: listName,
                        description: listDescription,
                        tipo: listTipo,
                        clientId,
                        participants: participantIds // IDs validados
                    })
                });
                
                console.log('🔍 [LIST-RESPONSE] Status da criação:', listResp.status);
                
                if (!listResp.ok) {
                    const data = await listResp.json();
                    console.log('🔍 [LIST-ERROR] Erro na criação:', data);
                    throw new Error(data.message || 'Erro ao criar lista');
                }
                
                const listData = await listResp.json();
                console.log('🔍 [LIST-SUCCESS] Lista criada com sucesso:', {
                    listId: listData._id || listData.id,
                    name: listData.name,
                    participantsAssociated: participantIds.length
                });
                
                // Mensagem de sucesso personalizada baseada no resultado
                if (participantIds.length === 0) {
                    showNotification(`Lista "${listName}" criada, mas nenhum participante foi associado. Verifique o formato do arquivo ou contate o suporte.`, 'warning');
                } else if (participantIds.length === participants.length) {
                    showNotification(`✅ Importação completa! ${participants.length} participantes importados e associados à lista "${listName}".`, 'success');
                } else {
                    showNotification(`⚠️ Lista "${listName}" criada com ${participantIds.length} de ${participants.length} participantes associados.`, 'warning');
                }
                
                closeImportModal();
                loadLists();
                loadParticipants();
            } else {
                console.error(new Error('Nenhum participante encontrado no arquivo. Verifique se o arquivo está no formato correto.'));
            }
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            showNotification(error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    };
    reader.onerror = function() {
        console.error(new Error('Erro ao ler o arquivo. Tente novamente.'));
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    };
    try {
        if (importType.value === 'excel') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        console.error(new Error('Erro ao ler o arquivo. Verifique se o arquivo não está corrompido.'));
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
    return false;
}

// Funções auxiliares
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveLists() {
    localStorage.setItem('participantLists', JSON.stringify(lists));
}

function loadParticipantsForList() {
    const participantsList = document.getElementById('participantsForList');
    participantsList.innerHTML = '';
    const tipoSelecionado = document.getElementById('listTipo') ? document.getElementById('listTipo').value : '';
    let participantesFiltrados = participants;
    if (tipoSelecionado && tipoSelecionado !== 'mista') {
        participantesFiltrados = participants.filter(p => p.tipo === tipoSelecionado);
    }
    participantesFiltrados.forEach(participant => {
        const div = document.createElement('div');
        div.className = 'participant-item';
        div.innerHTML = `
            <input type="checkbox" id="participant_${participant.id}" value="${participant.id}">
            <label for="participant_${participant.id}">
                <span class="participant-name">${participant.name}</span>
                <span class="participant-email">${participant.email}</span>
            </label>
        `;
        participantsList.appendChild(div);
    });
}

function filterParticipantsForList() {
    const searchTerm = document.getElementById('participantSearchInput').value.toLowerCase();
    const tipoSelecionado = document.getElementById('listTipo') ? document.getElementById('listTipo').value : '';
    const items = document.querySelectorAll('.participant-item');
    items.forEach(item => {
        const name = item.querySelector('.participant-name').textContent.toLowerCase();
        const email = item.querySelector('.participant-email').textContent.toLowerCase();
        let show = (!searchTerm || name.includes(searchTerm) || email.includes(searchTerm));
        if (tipoSelecionado && tipoSelecionado !== 'mista') {
            // Só mostrar se o participante for do tipo selecionado
            const participantId = item.querySelector('input[type="checkbox"]').value;
            const participant = participants.find(p => p.id === participantId);
            if (!participant || participant.tipo !== tipoSelecionado) {
                show = false;
            }
        }
        item.style.display = show ? 'flex' : 'none';
    });
}

// Atualizar participantes ao trocar o tipo da lista
const tipoSelect = document.getElementById('listTipo');
if (tipoSelect) {
    tipoSelect.addEventListener('change', () => {
        loadParticipantsForList();
        filterParticipantsForList();
    });
}

async function handleNewList(event) {
    event.preventDefault();
    const token = localStorage.getItem('clientToken');
    const clientId = localStorage.getItem('clientId');
    if (!token || !clientId) {
        showNotification('Erro de autenticação. Faça login novamente.', 'error');
        return false;
    }
    const name = document.getElementById('listName').value.trim();
    const description = document.getElementById('listDescription').value.trim();
    const tipo = document.getElementById('listTipo').value;
    const status = document.getElementById('listStatus').value;
    const participantsArray = Array.from(selectedParticipants);
    if (!name || !tipo) {
        showNotification('Preencha todos os campos obrigatórios.', 'error');
        return false;
    }
    try {
        const response = await fetch(`${API_URL}/participant-lists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                description,
                tipo,
                status,
                clientId,
                participants: participantsArray
            })
        });
        if (!response.ok) {
            throw new Error('Erro ao criar lista');
        }
        showNotification('Lista criada com sucesso!', 'success');
        closeNewListModal();
        loadLists();
    } catch (error) {
        console.error(error);
        showNotification(error.message || 'Erro ao criar lista', 'error');
    }
    return false;
}

// Adicionar evento de busca de participantes
const participantSearch = document.getElementById('participantSearch');
if (participantSearch) {
    participantSearch.addEventListener('input', () => {
        const searchTerm = participantSearch.value.toLowerCase();
        const items = document.querySelectorAll('.participant-item');
        
        items.forEach(item => {
            const name = item.querySelector('.participant-name').textContent.toLowerCase();
            const email = item.querySelector('.participant-email').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || email.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// Verificar parâmetros da URL ao carregar a página
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const listId = urlParams.get('list');
    
    if (listId) {
        const list = lists.find(l => l.id === listId);
        if (list) {
            manageParticipants(listId);
        }
    }
});

function parseExcelFile(data) {
    try {
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
        // Mapear cabeçalhos flexíveis
        const mapField = (row, keys) => {
            for (const key of keys) {
                if (row[key] !== undefined) return row[key];
            }
            return '';
        };
        return jsonData
            .map(row => ({
                name: mapField(row, ['name', 'nome', 'Nome', 'NOME']),
                email: mapField(row, ['email', 'e-mail', 'E-mail', 'EMAIL', 'E-MAIL']),
                phone: mapField(row, ['phone', 'telefone', 'Telefone', 'PHONE', 'TELEFONE'])
            }))
            .filter(p => p.name && p.email && p.phone);
    } catch (error) {
        console.error('Erro ao processar arquivo Excel:', error);
        throw new Error('Erro ao processar arquivo Excel. Verifique se o arquivo está no formato correto.');
    }
}

function parseCSVFile(data) {
    try {
        const lines = data.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        // Mapear índices dos campos flexíveis
        const idxName = headers.findIndex(h => ['name', 'nome', 'Nome', 'NOME'].includes(h));
        const idxEmail = headers.findIndex(h => ['email', 'e-mail', 'E-mail', 'EMAIL', 'E-MAIL'].includes(h));
        const idxPhone = headers.findIndex(h => ['phone', 'telefone', 'Telefone', 'PHONE', 'TELEFONE'].includes(h));
        return lines.slice(1)
            .map(line => {
                const values = line.split(',').map(v => v.trim());
                return {
                    name: idxName !== -1 ? values[idxName] : '',
                    email: idxEmail !== -1 ? values[idxEmail] : '',
                    phone: idxPhone !== -1 ? values[idxPhone] : ''
                };
            })
            .filter(p => p.name && p.email && p.phone);
    } catch (error) {
        console.error('Erro ao processar arquivo CSV:', error);
        throw new Error('Erro ao processar arquivo CSV. Verifique se o arquivo está no formato correto.');
    }
}

function saveImportedParticipants(newParticipants, updateExisting) {
    const storedParticipants = JSON.parse(localStorage.getItem('participants') || '[]');
    const existingEmails = new Set(storedParticipants.map(p => p.email.toLowerCase()));
    
    const participantsToSave = newParticipants.map(participant => {
        const existingIndex = storedParticipants.findIndex(p => 
            p.email.toLowerCase() === participant.email.toLowerCase()
        );
        
        if (existingIndex !== -1) {
            if (updateExisting) {
                // Atualizar participante existente
                return {
                    ...storedParticipants[existingIndex],
                    ...participant,
                    id: storedParticipants[existingIndex].id // Manter o ID original
                };
            }
            return storedParticipants[existingIndex]; // Manter o participante original
        }
        
        return participant;
    });
    
    // Adicionar novos participantes
    const finalParticipants = [
        ...storedParticipants.filter(p => 
            !newParticipants.some(np => 
                np.email.toLowerCase() === p.email.toLowerCase()
            )
        ),
        ...participantsToSave
    ];
    
    localStorage.setItem('participants', JSON.stringify(finalParticipants));
}

function showNotification(message, type = 'info') {
    // Remover notificações anteriores
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    // Definir cores e ícones baseados no tipo
    const config = {
        success: {
            bgColor: 'bg-green-500',
            textColor: 'text-white',
            icon: 'fas fa-check-circle',
            borderColor: 'border-green-600'
        },
        error: {
            bgColor: 'bg-red-500',
            textColor: 'text-white',
            icon: 'fas fa-exclamation-circle',
            borderColor: 'border-red-600'
        },
        warning: {
            bgColor: 'bg-yellow-500',
            textColor: 'text-gray-900',
            icon: 'fas fa-exclamation-triangle',
            borderColor: 'border-yellow-600'
        },
        info: {
            bgColor: 'bg-blue-500',
            textColor: 'text-white',
            icon: 'fas fa-info-circle',
            borderColor: 'border-blue-600'
        }
    };
    
    const typeConfig = config[type] || config.info;
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-[1000] ${typeConfig.bgColor} ${typeConfig.textColor} px-6 py-4 rounded-lg shadow-lg border-l-4 ${typeConfig.borderColor} max-w-md transform translate-x-full transition-transform duration-300 ease-out`;
    
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="${typeConfig.icon} text-lg"></i>
            <div class="flex-1">
                <p class="font-medium">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 ${typeConfig.textColor} hover:opacity-70 transition-opacity">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remover após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Funções auxiliares para melhor UX
function getTipoInfo(tipo) {
    switch ((tipo || '').toLowerCase()) {
        case 'participante':
            return {
                label: 'Participante',
                icon: 'fas fa-user',
                bgColor: 'bg-blue-500',
                badgeClass: 'bg-blue-100 text-blue-800'
            };
        case 'indicador':
            return {
                label: 'Indicador',
                icon: 'fas fa-share-alt',
                bgColor: 'bg-green-500',
                badgeClass: 'bg-green-100 text-green-800'
            };
        case 'influenciador':
            return {
                label: 'Influenciador',
                icon: 'fas fa-star',
                bgColor: 'bg-purple-500',
                badgeClass: 'bg-purple-100 text-purple-800'
            };
        case 'mista':
            return {
                label: 'Mista',
                icon: 'fas fa-users',
                bgColor: 'bg-orange-500',
                badgeClass: 'bg-orange-100 text-orange-800'
            };
        default:
            return {
                label: tipo || 'Indefinido',
                icon: 'fas fa-question',
                bgColor: 'bg-gray-500',
                badgeClass: 'bg-gray-100 text-gray-800'
            };
    }
}

function getStatusInfo(status) {
    switch ((status || 'active').toLowerCase()) {
        case 'active':
            return {
                label: 'Ativa',
                icon: 'fas fa-check-circle',
                badgeClass: 'bg-green-100 text-green-800'
            };
        case 'inactive':
            return {
                label: 'Inativa',
                icon: 'fas fa-pause-circle',
                badgeClass: 'bg-red-100 text-red-800'
            };
        case 'draft':
            return {
                label: 'Rascunho',
                icon: 'fas fa-edit',
                badgeClass: 'bg-yellow-100 text-yellow-800'
            };
        default:
            return {
                label: 'Desconhecido',
                icon: 'fas fa-question-circle',
                badgeClass: 'bg-gray-100 text-gray-800'
            };
    }
}

function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
}

// Nova função para ver detalhes da lista
async function viewListDetails(listId) {
    const list = lists.find(l => (l._id || l.id) === listId);
    if (!list) return;

    // Carregar participantes da lista
    let participantsData = [];
    try {
        const token = localStorage.getItem('clientToken');
        const response = await fetch(`${API_URL}/participant-lists/${listId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const listData = await response.json();
            participantsData = listData.participants || [];
        }
    } catch (error) {
        console.error('Erro ao carregar participantes:', error);
    }

    // Estatísticas
    const stats = {
        total: participantsData.length,
        ativos: participantsData.filter(p => p.status === 'ativo').length,
        indicadores: participantsData.filter(p => p.tipo === 'indicador').length,
        recentes: participantsData.filter(p => {
            const date = new Date(p.createdAt);
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return date > sevenDaysAgo;
        }).length
    };

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.id = 'listDetailsModal';
    
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto mx-4">
            <div class="flex items-start justify-between mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg ${getTipoInfo(list.tipo).bgColor} flex items-center justify-center">
                        <i class="${getTipoInfo(list.tipo).icon} text-white text-lg"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-100">${list.name}</h2>
                        <p class="text-gray-400">${list.description || 'Sem descrição'}</p>
                    </div>
                </div>
                <button class="text-2xl text-gray-400 hover:text-gray-200" onclick="document.getElementById('listDetailsModal').remove()">&times;</button>
            </div>
            
            <!-- Estatísticas -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-gray-700 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-blue-400">${stats.total}</div>
                    <div class="text-sm text-gray-300">Total</div>
                </div>
                <div class="bg-gray-700 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-green-400">${stats.ativos}</div>
                    <div class="text-sm text-gray-300">Ativos</div>
                </div>
                <div class="bg-gray-700 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-purple-400">${stats.indicadores}</div>
                    <div class="text-sm text-gray-300">Indicadores</div>
                </div>
                <div class="bg-gray-700 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-yellow-400">${stats.recentes}</div>
                    <div class="text-sm text-gray-300">Recentes</div>
                </div>
            </div>
            
            <!-- Informações da Lista -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-gray-700 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-gray-100 mb-3">Informações Gerais</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Tipo:</span>
                            <span class="text-gray-100">${getTipoInfo(list.tipo).label}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Status:</span>
                            <span class="text-gray-100">${getStatusInfo(list.status).label}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Criada em:</span>
                            <span class="text-gray-100">${new Date(list.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Campanha:</span>
                            <span class="text-gray-100">${list.campaignName || 'Não vinculada'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-700 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-gray-100 mb-3">Ações Rápidas</h3>
                    <div class="space-y-2">
                        <button onclick="manageParticipants('${listId}')" class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-users mr-2"></i>Gerenciar Participantes
                        </button>
                        <button onclick="duplicateList('${listId}')" class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <i class="fas fa-copy mr-2"></i>Duplicar Lista
                        </button>
                        <button onclick="exportList('${listId}')" class="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                            <i class="fas fa-download mr-2"></i>Exportar Lista
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Lista de Participantes -->
            <div class="bg-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-gray-100 mb-3">Participantes</h3>
                <div class="max-h-64 overflow-y-auto">
                    ${participantsData.length > 0 ? `
                        <div class="space-y-2">
                            ${participantsData.map(participant => `
                                <div class="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm text-white font-medium">
                                            ${participant.name ? participant.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <div class="text-gray-100 font-medium">${participant.name}</div>
                                            <div class="text-gray-400 text-sm">${participant.email}</div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="px-2 py-1 text-xs rounded-full ${participant.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                            ${participant.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                        </span>
                                        ${participant.tipo ? `
                                            <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                ${participant.tipo.charAt(0).toUpperCase() + participant.tipo.slice(1)}
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-8 text-gray-400">
                            <i class="fas fa-users text-4xl mb-4 opacity-50"></i>
                            <p>Nenhum participante nesta lista</p>
                        </div>
                    `}
                </div>
            </div>
            
            <div class="flex justify-end mt-6">
                <button class="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition-colors" onclick="document.getElementById('listDetailsModal').remove()">
                    Fechar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Função para duplicar lista
async function duplicateList(listId) {
    const list = lists.find(l => (l._id || l.id) === listId);
    if (!list) return;

    const newName = prompt(`Digite o nome para a cópia da lista "${list.name}":`, `${list.name} - Cópia`);
    if (!newName) return;

    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        // Carregar dados completos da lista original
        const originalResponse = await fetch(`${API_URL}/participant-lists/${listId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!originalResponse.ok) {
            throw new Error('Erro ao carregar lista original');
        }
        
        const originalData = await originalResponse.json();
        
        // Criar nova lista com dados duplicados
        const duplicateData = {
            name: newName,
            description: `Cópia de: ${originalData.description || originalData.name}`,
            tipo: originalData.tipo,
            status: 'active',
            clientId: clientId,
            participants: originalData.participants || []
        };
        
        const response = await fetch(`${API_URL}/participant-lists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(duplicateData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao duplicar lista');
        }
        
        showNotification('Lista duplicada com sucesso!', 'success');
        loadLists(); // Recarregar listas
        
    } catch (error) {
        console.error('Erro ao duplicar lista:', error);
        showNotification(error.message || 'Erro ao duplicar lista', 'error');
    }
}

// Função para exportar lista
async function exportList(listId) {
    const list = lists.find(l => (l._id || l.id) === listId);
    if (!list) return;

    try {
        const token = localStorage.getItem('clientToken');
        
        // Carregar dados completos da lista
        const response = await fetch(`${API_URL}/participant-lists/${listId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar dados da lista');
        }
        
        const listData = await response.json();
        const participants = listData.participants || [];
        
        if (participants.length === 0) {
            showNotification('Lista não possui participantes para exportar', 'warning');
            return;
        }
        
        // Preparar dados para CSV
        const csvData = participants.map(participant => ({
            'Nome': participant.name || '',
            'Email': participant.email || '',
            'Telefone': participant.phone || '',
            'Tipo': participant.tipo || '',
            'Status': participant.status || '',
            'Data de Criação': participant.createdAt ? new Date(participant.createdAt).toLocaleDateString('pt-BR') : ''
        }));
        
        // Converter para CSV
        const headers = Object.keys(csvData[0]);
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        // Download do arquivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${list.name.replace(/[^a-zA-Z0-9]/g, '_')}_participantes.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Lista exportada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar lista:', error);
        showNotification(error.message || 'Erro ao exportar lista', 'error');
    }
}

// Funções de busca e filtros aprimorados
function clearSearch() {
    document.getElementById('searchList').value = '';
    searchLists();
}

function applyQuickFilter() {
    const filter = document.getElementById('quickFilter').value;
    
    switch (filter) {
        case 'with-participants':
            // Filtrar listas que têm participantes
            break;
        case 'empty':
            // Filtrar listas vazias
            break;
        case 'campaign':
            setTipoListaFiltro('campanha');
            return;
        case 'recent':
            // Filtrar listas criadas nos últimos 7 dias
            break;
        default:
            setTipoListaFiltro('todas');
            return;
    }
    
    displayLists();
}

function toggleActionsMenu() {
    const menu = document.getElementById('actionsMenu');
    menu.classList.toggle('hidden');
    
    // Fechar menu ao clicar fora
    if (!menu.classList.contains('hidden')) {
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!document.getElementById('actionsMenuBtn').contains(e.target) && 
                    !menu.contains(e.target)) {
                    menu.classList.add('hidden');
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }
}

async function refreshLists() {
    showNotification('Atualizando listas...', 'info');
    await loadLists();
    showNotification('Listas atualizadas com sucesso!', 'success');
}

async function exportAllLists() {
    if (!lists || lists.length === 0) {
        showNotification('Não há listas para exportar', 'warning');
        return;
    }
    
    try {
        // Preparar dados de todas as listas
        const csvData = lists.map(list => ({
            'Nome': list.name || '',
            'Descrição': list.description || '',
            'Tipo': getTipoInfo(list.tipo).label || '',
            'Status': getStatusInfo(list.status).label || '',
            'Campanha': list.campaignName || '',
            'Data de Criação': list.createdAt ? new Date(list.createdAt).toLocaleDateString('pt-BR') : ''
        }));
        
        // Converter para CSV
        const headers = Object.keys(csvData[0]);
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        // Download do arquivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `todas_listas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Todas as listas exportadas com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar listas:', error);
        showNotification('Erro ao exportar listas', 'error');
    }
}

function showBulkActions() {
    showNotification('Funcionalidade de ações em lote em desenvolvimento', 'info');
    // TODO: Implementar ações em lote como:
    // - Marcar múltiplas listas
    // - Excluir múltiplas listas
    // - Alterar status de múltiplas listas
    // - Mover para campanha
} 