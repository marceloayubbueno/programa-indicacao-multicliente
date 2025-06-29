// 🔧 PARTICIPANTS-FIXED.JS - VERSÃO CORRIGIDA

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

console.log('✅ PARTICIPANTS-FIXED.JS CARREGADO');

// ===== FUNÇÕES ESSENCIAIS =====

// Função para obter API URL
function getApiUrl() {
    return window.API_URL || 
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
           (window.location.hostname === 'localhost' ? 
            'http://localhost:3000/api' : 
            'https://programa-indicacao-multicliente-production.up.railway.app/api'));
}

// Função para trocar abas
function switchTab(tabName) {
    console.log('🔄 Trocando para aba:', tabName);
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
    const activeTab = document.getElementById('tab-' + tabName);
    const activeContent = document.getElementById('tab-content-' + tabName);
    const activeActions = document.getElementById('actions-' + tabName);
    
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
    
    console.log('✅ Aba', tabName, 'ativada');
}

// ===== FUNÇÕES PLACEHOLDER NECESSÁRIAS =====

function setTipoFiltro(tipo) {
    console.log('🔍 Filtro definido:', tipo);
}

function filterParticipants() {
    console.log('🔍 Filtrando participantes');
}

function toggleAllUsers() {
    console.log('🔍 Alternando seleção de usuários');
}

function showImportUsersModal() {
    console.log('📥 Mostrando modal de importação');
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeImportModal() {
    console.log('❌ Fechando modal de importação');
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showBulkListActions() {
    console.log('📋 Mostrando ações em lote');
}

function refreshStats() {
    console.log('📊 Atualizando estatísticas');
}

function exportStats() {
    console.log('📤 Exportando estatísticas');
}

function testScalableSystem() {
    console.log('🧪 Testando sistema escalável');
}

function toggleImportFields() {
    console.log('🔄 Alternando campos de importação');
}

function handleImport(event) {
    event.preventDefault();
    console.log('📥 Processando importação');
    alert('Funcionalidade em desenvolvimento');
    return false;
}

// ===== INICIALIZAÇÃO =====
console.log('✅ PARTICIPANTS-FIXED.JS CONFIGURADO COMPLETAMENTE');
