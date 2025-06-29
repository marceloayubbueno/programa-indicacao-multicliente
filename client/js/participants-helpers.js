/**
 * 🔧 PARTICIPANTS HELPERS - Funções auxiliares para Central de Participantes
 * Complementa o sistema principal com funcionalidades extras
 */

// ===== FUNÇÕES DE MODAL =====
function showImportUsersModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ===== FUNÇÕES DE IMPORTAÇÃO =====
function toggleImportFields() {
    const importType = document.getElementById('importType')?.value;
    const mappingDiv = document.getElementById('importMapping');
    
    if (importType && mappingDiv) {
        mappingDiv.innerHTML = `
            <p class="text-sm text-gray-400 mb-2">Mapeamento para ${importType.toUpperCase()}:</p>
            <div class="grid grid-cols-2 gap-2 text-xs">
                <span>Nome:</span><span>Coluna A</span>
                <span>Email:</span><span>Coluna B</span>
                <span>Telefone:</span><span>Coluna C (opcional)</span>
            </div>
        `;
    }
}

async function handleImport(event) {
    event.preventDefault();
    
    const formData = new FormData();
    const fileInput = document.getElementById('importFile');
    const listName = document.getElementById('listNameImport').value;
    const listDescription = document.getElementById('listDescriptionImport').value;
    const updateExisting = document.getElementById('importUpdate').checked;
    
    if (!fileInput.files[0] || !listName.trim()) {
        alert('Por favor, selecione um arquivo e digite o nome da lista.');
        return false;
    }
    
    try {
        // Simular importação (implementar integração real com backend)
        const importData = {
            listName: listName.trim(),
            listDescription: listDescription.trim(),
            updateExisting,
            fileName: fileInput.files[0].name
        };
        
        console.log('📤 Importando dados:', importData);
        
        // TODO: Implementar chamada real para API de importação
        // await window.apiClient.importParticipants(importData);
        
        closeImportModal();
        showNotification('Importação iniciada com sucesso!', 'success');
        
        // Recarregar dados
        if (window.participantsManager) {
            await window.participantsManager.loadParticipants({ forceRefresh: true });
        }
        
    } catch (error) {
        console.error('❌ Erro na importação:', error);
        showNotification('Erro na importação: ' + error.message, 'error');
    }
    
    return false;
}

// ===== FUNÇÕES DE AÇÕES EM LOTE =====
function showBulkListActions() {
    const modal = createBulkActionsModal();
    document.body.appendChild(modal);
}

function createBulkActionsModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-md">
            <h3 class="text-lg font-semibold text-gray-100 mb-4">Ações em Lote - Listas</h3>
            <div class="space-y-3">
                <button onclick="bulkDeleteLists()" class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <i class="fas fa-trash mr-2"></i>Excluir Listas Selecionadas
                </button>
                <button onclick="bulkExportLists()" class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <i class="fas fa-download mr-2"></i>Exportar Listas
                </button>
                <button onclick="bulkArchiveLists()" class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <i class="fas fa-archive mr-2"></i>Arquivar Listas
                </button>
            </div>
            <div class="flex justify-end mt-4">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        class="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    return modal;
}

// ===== FUNÇÕES DE ESTATÍSTICAS =====
function refreshStats() {
    if (typeof loadStatistics === 'function') {
        loadStatistics();
        showNotification('Estatísticas atualizadas!', 'success');
    }
}

function exportStats() {
    // Implementar exportação de estatísticas
    const statsData = {
        timestamp: new Date().toISOString(),
        totalUsers: document.getElementById('totalUsers')?.textContent || '0',
        activeUsers: document.getElementById('activeUsers')?.textContent || '0',
        totalLists: document.getElementById('totalLists')?.textContent || '0',
        recentActivity: document.getElementById('recentActivity')?.textContent || '0'
    };
    
    const dataStr = JSON.stringify(statsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `stats-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Relatório exportado com sucesso!', 'success');
}

// ===== FUNÇÕES DE SELEÇÃO =====
function toggleAllUsers() {
    const selectAll = document.getElementById('selectAllUsers');
    const checkboxes = document.querySelectorAll('.user-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
    
    updateBulkActionsVisibility();
}

function updateBulkActionsVisibility() {
    const selectedCount = document.querySelectorAll('.user-checkbox:checked').length;
    const bulkActions = document.getElementById('bulkActions');
    
    if (bulkActions) {
        bulkActions.style.display = selectedCount > 0 ? 'block' : 'none';
    }
}

// ===== SISTEMA DE NOTIFICAÇÕES =====
function showNotification(message, type = 'info') {
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
    
    // Auto remover após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
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

// ===== FUNÇÕES PARA TESTES DE SISTEMA ESCALÁVEL =====
function testScalableSystem() {
    console.log('🧪 Testando Sistema Escalável...');
    
    if (window.participantsManager) {
        const debugInfo = window.participantsManager.getDebugInfo?.() || {};
        console.log('📊 Debug Info:', debugInfo);
        
        showNotification('Sistema testado - verifique o console', 'info');
    } else {
        showNotification('ParticipantsManager não encontrado', 'error');
    }
}

// ===== EXPORTAR FUNÇÕES GLOBALMENTE =====
// ===== EXPORTAR TODAS AS FUNÇÕES =====
Object.assign(window, {
    showImportUsersModal,
    closeImportModal, 
    toggleImportFields,
    handleImport,
    showBulkListActions,
    refreshStats,
    exportStats,
    toggleAllUsers,
    testScalableSystem,
    showNotification,
    updateBulkActionsVisibility
});

// ===== SISTEMA DE PAGINAÇÃO ESCALÁVEL =====
window.PaginationSystem = {
    pageCache: new Map(),
    
    // Simular sistema de cache para até 10.000 usuários
    getPageData(page, itemsPerPage = 25) {
        const cacheKey = `page_${page}_${itemsPerPage}`;
        return this.pageCache.get(cacheKey) || null;
    },
    
    setPageData(page, itemsPerPage, data) {
        const cacheKey = `page_${page}_${itemsPerPage}`;
        this.pageCache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        
        // Limitar cache a 50 páginas para economizar memória
        if (this.pageCache.size > 50) {
            const firstKey = this.pageCache.keys().next().value;
            this.pageCache.delete(firstKey);
        }
    },
    
    clear() {
        this.pageCache.clear();
        console.log('🧹 Cache de paginação limpo');
    }
};

// ===== FUNÇÃO DE TESTE COMPLETO =====
function testScalableSystem() {
    console.log('🧪 Testando Sistema Escalável...');
    
    const systemInfo = {
        participantsManager: !!window.participantsManager,
        apiClient: !!window.apiClient,
        dataAdapter: !!window.DataAdapter,
        paginationCache: window.PaginationSystem?.pageCache?.size || 0,
        timestamp: new Date().toISOString()
    };
    
    console.log('📊 Estado do Sistema:', systemInfo);
    
    if (window.participantsManager?.getDebugInfo) {
        console.log('📊 ParticipantsManager Debug:', window.participantsManager.getDebugInfo());
    }
    
    showNotification('Sistema testado - verifique o console', 'info');
}

console.log('🔧 Participants Helpers v2.0 carregado'); 