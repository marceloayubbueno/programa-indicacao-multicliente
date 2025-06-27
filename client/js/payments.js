// Estado global da página de pagamentos
let currentRewards = [];
let filteredRewards = [];
let currentTab = 'pending';
let currentPagePayments = 1;
let totalPagesPayments = 1;
const rewardsPerPage = 15;

// Configuração de status e tipos
const rewardStatusConfig = {
    'pending': { icon: 'fa-clock', color: 'yellow', label: 'Pendente Aprovação' },
    'approved': { icon: 'fa-check', color: 'blue', label: 'Aprovada para Pagamento' },
    'paid': { icon: 'fa-credit-card', color: 'green', label: 'Pago' },
    'rejected': { icon: 'fa-times', color: 'red', label: 'Rejeitada' },
    'cancelled': { icon: 'fa-ban', color: 'gray', label: 'Cancelada' }
};

const rewardTypeConfig = {
    'fixed': { label: 'Valor Fixo', icon: 'fa-coins' },
    'percentage': { label: 'Percentual', icon: 'fa-percentage' },
    'monthly': { label: 'Fixo Mensal', icon: 'fa-calendar-alt' }
};

const paymentMethodConfig = {
    'pix': { label: 'PIX', icon: 'fa-mobile-alt', color: 'green' },
    'discount': { label: 'Desconto', icon: 'fa-percent', color: 'blue' },
    'voucher': { label: 'Vale/Cupom', icon: 'fa-ticket-alt', color: 'purple' },
    'discount_link': { label: 'Link Desconto', icon: 'fa-link', color: 'orange' }
};

// Inicialização da página
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadRewardsFromBackend();
    switchTab('pending');
});

// Carregar recompensas do backend
async function loadRewardsFromBackend() {
    console.log('[H4] 🔍 DIAGNÓSTICO - loadRewardsFromBackend iniciado');
    
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        console.log('[H4] 🔍 DIAGNÓSTICO - Token exists:', !!token);
        console.log('[H4] 🔍 DIAGNÓSTICO - ClientId:', clientId);
        console.log('[H4] 🔍 DIAGNÓSTICO - Token preview:', token ? token.substring(0, 20) + '...' : 'null');
        
        // Verificar se há autenticação
        if (!token || !clientId) {
            console.log('[H4] ❌ DIAGNÓSTICO - Sem token ou clientId');
            currentRewards = [];
            return;
        }
        
        // Construir URL com clientId
        // 🌍 USAR CONFIGURAÇÃO DINÂMICA
    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                  (window.location.hostname === 'localhost' ? 
                   'http://localhost:3000/api' : 
                   'https://programa-indicacao-multicliente-production.up.railway.app/api');
    const url = `${apiUrl}/referrals/payments?clientId=${clientId}`;
        console.log('[H4] 🔍 DIAGNÓSTICO - URL da requisição:', url);
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        console.log('[H4] 🔍 DIAGNÓSTICO - Headers enviados:', headers);
        
        const response = await fetch(url, { headers });
        console.log('[H4] 🔍 DIAGNÓSTICO - Response status:', response.status);
        console.log('[H4] 🔍 DIAGNÓSTICO - Response ok:', response.ok);
        
        const data = await response.json();
        console.log('[H4] 🔍 DIAGNÓSTICO - Response data:', data);
        
        if (data.success) {
            currentRewards = data.data || [];
            console.log('[H4] ✅ DIAGNÓSTICO - Recompensas carregadas:', currentRewards.length);
            updateFinancialStatistics();
            populateFiltersPayments();
            renderCurrentTab();
        } else {
            currentRewards = [];
            console.error('[H4] ❌ DIAGNÓSTICO - API retornou erro:', data.message);
        }
    } catch (error) {
        console.error('[H4] ❌ DIAGNÓSTICO - Erro na requisição:', error);
        currentRewards = [];
    }
}

// Atualizar estatísticas financeiras
function updateFinancialStatistics() {
    const pending = currentRewards.filter(r => r.rewardStatus === 'pending');
    const approved = currentRewards.filter(r => r.rewardStatus === 'approved');
    const paid = currentRewards.filter(r => r.rewardStatus === 'paid');
    
    const totalToPay = approved.reduce((sum, r) => sum + (r.rewardValue || 0), 0);
    const monthlyPaid = paid
        .filter(r => isCurrentMonth(r.paidAt))
        .reduce((sum, r) => sum + (r.rewardValue || 0), 0);
    const activeIndicators = new Set(currentRewards.map(r => r.indicatorId)).size;

    document.getElementById('totalToPay').textContent = formatCurrency(totalToPay);
    document.getElementById('pendingRewards').textContent = pending.length;
    document.getElementById('monthlyPaid').textContent = formatCurrency(monthlyPaid);
    document.getElementById('activeIndicators').textContent = activeIndicators;
}

// Verificar se a data é do mês atual
function isCurrentMonth(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

// Popular filtros
function populateFiltersPayments() {
    // Filtro de indicadores
    const indicators = [...new Set(currentRewards.map(r => r.indicatorName).filter(Boolean))];
    const indicatorSelect = document.getElementById('indicatorFilter');
    indicatorSelect.innerHTML = '<option value="">Todos</option>';
    indicators.forEach(indicator => {
        const option = document.createElement('option');
        option.value = indicator;
        option.textContent = indicator;
        indicatorSelect.appendChild(option);
    });

    // Filtro de campanhas
    const campaigns = [...new Set(currentRewards.map(r => r.campaignName).filter(Boolean))];
    const campaignSelect = document.getElementById('campaignFilter');
    campaignSelect.innerHTML = '<option value="">Todas</option>';
    campaigns.forEach(campaign => {
        const option = document.createElement('option');
        option.value = campaign;
        option.textContent = campaign;
        campaignSelect.appendChild(option);
    });
}

// Alternar entre abas
function switchTab(tabName) {
    currentTab = tabName;
    currentPagePayments = 1;
    
    // Atualizar aparência das abas
    document.querySelectorAll('[id^="tab-"]').forEach(tab => {
        tab.className = 'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-400 hover:text-gray-200';
    });
    
    document.getElementById(`tab-${tabName}`).className = 'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-green-600 text-white';
    
    renderCurrentTab();
}

// Renderizar aba atual
function renderCurrentTab() {
    let dataToShow = [];
    
    switch (currentTab) {
        case 'pending':
            dataToShow = currentRewards.filter(r => r.rewardStatus === 'pending');
            break;
        case 'approved':
            dataToShow = currentRewards.filter(r => r.rewardStatus === 'approved');
            break;
        case 'history':
            dataToShow = currentRewards.filter(r => ['paid', 'rejected', 'cancelled'].includes(r.rewardStatus));
            break;
    }
    
    filteredRewards = applyFilters(dataToShow);
    renderRewardsTable(filteredRewards);
}

// Aplicar filtros
function applyFilters(data) {
    const indicatorFilter = document.getElementById('indicatorFilter').value;
    const campaignFilter = document.getElementById('campaignFilter').value;
    const rewardTypeFilter = document.getElementById('rewardTypeFilter').value;
    const dateFromFilter = document.getElementById('dateFromFilter').value;
    const dateToFilter = document.getElementById('dateToFilter').value;

    return data.filter(reward => {
        if (indicatorFilter && reward.indicatorName !== indicatorFilter) return false;
        if (campaignFilter && reward.campaignName !== campaignFilter) return false;
        if (rewardTypeFilter && reward.rewardType !== rewardTypeFilter) return false;
        if (dateFromFilter && reward.createdAt < dateFromFilter) return false;
        if (dateToFilter && reward.createdAt > dateToFilter) return false;
        return true;
    });
}

// Renderizar tabela de recompensas
function renderRewardsTable(rewards) {
    const tabContent = document.getElementById('tabContent');
    
    if (!rewards || rewards.length === 0) {
        tabContent.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-inbox text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400 text-lg">Nenhuma recompensa encontrada</p>
            </div>
        `;
        return;
    }

    // Implementar paginação
    const startIndex = (currentPagePayments - 1) * rewardsPerPage;
    const endIndex = startIndex + rewardsPerPage;
    const paginatedRewards = rewards.slice(startIndex, endIndex);
    
    totalPagesPayments = Math.ceil(rewards.length / rewardsPerPage);
    updatePaginationUIPayments();

    let tableHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-700">
                <thead class="bg-gray-800">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Indicador</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Lead/Origem</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Campanha</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Tipo</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Valor</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Status</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Data</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-gray-900 divide-y divide-gray-700">
    `;

    paginatedRewards.forEach(reward => {
        const status = rewardStatusConfig[reward.rewardStatus] || rewardStatusConfig['pending'];
        const type = rewardTypeConfig[reward.rewardType] || rewardTypeConfig['fixed'];
        const paymentMethod = reward.paymentMethod ? paymentMethodConfig[reward.paymentMethod] : null;
        
        const statusBadge = `<span class="px-2 py-1 text-xs rounded-full bg-${status.color}-500/20 text-${status.color}-400">
            <i class="fas ${status.icon} mr-1"></i>${status.label}
        </span>`;
        
        // ✅ NOVO: Usar rewardCategory em vez de rewardType para mostrar se é indicação ou conversão
        const isConversion = reward.rewardCategory === 'Recompensa por Conversão';
        const categoryIcon = isConversion ? 'fa-trophy' : 'fa-handshake';
        const categoryColor = isConversion ? 'orange' : 'blue';
        
        const typeBadge = `<span class="px-2 py-1 text-xs rounded-full bg-${categoryColor}-500/20 text-${categoryColor}-400">
            <i class="fas ${categoryIcon} mr-1"></i>${reward.rewardCategory || 'Recompensa por Indicação'}
        </span>`;

        let actionsHTML = '';
        if (currentTab === 'pending') {
            actionsHTML = `
                <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-green-400 hover:text-green-300 mr-1" 
                        onclick="showApprovalModal('${reward._id}')" title="Aprovar">
                    <i class="fas fa-check"></i>
                </button>
                <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-red-400 hover:text-red-300 mr-1" 
                        onclick="rejectRewardDirect('${reward._id}')" title="Rejeitar">
                    <i class="fas fa-times"></i>
                </button>
            `;
        } else if (currentTab === 'approved') {
            actionsHTML = `
                <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-green-400 hover:text-green-300 mr-1" 
                        onclick="showPaymentModal('${reward._id}')" title="Processar Pagamento">
                    <i class="fas fa-credit-card"></i>
                </button>
            `;
        }

        actionsHTML += `
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-blue-400 hover:text-blue-300" 
                    onclick="showRewardDetails('${reward._id}')" title="Ver Detalhes">
                <i class="fas fa-eye"></i>
            </button>
        `;

        tableHTML += `
            <tr class="hover:bg-gray-800 transition-colors">
                <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-green-400 text-sm"></i>
                        </div>
                        <div>
                            <div class="text-sm font-medium text-gray-200">${reward.indicatorName || 'N/A'}</div>
                            <div class="text-xs text-gray-400">${reward.indicatorEmail || ''}</div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm">
                        <div class="font-medium text-gray-200">${reward.leadName || 'N/A'}</div>
                        <div class="text-xs text-gray-400">${reward.leadEmail || ''}</div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">
                        <i class="fas fa-rocket mr-1"></i>${reward.campaignName || 'N/A'}
                    </span>
                </td>
                <td class="px-4 py-3">${typeBadge}</td>
                <td class="px-4 py-3">
                    <span class="text-lg font-semibold text-yellow-400">${formatCurrency(reward.rewardValue || 0)}</span>
                    ${paymentMethod ? `<div class="text-xs text-gray-400 mt-1">
                        <i class="fas ${paymentMethod.icon} mr-1"></i>${paymentMethod.label}
                    </div>` : ''}
                </td>
                <td class="px-4 py-3">${statusBadge}</td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-300">
                        <div><i class="fas fa-calendar text-gray-400 mr-1"></i>${formatDate(reward.createdAt)}</div>
                        ${reward.paidAt ? `<div class="text-xs text-green-400 mt-1">
                            <i class="fas fa-check mr-1"></i>Pago: ${formatDate(reward.paidAt)}
                        </div>` : ''}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                        ${actionsHTML}
                    </div>
                </td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table></div>';
    tabContent.innerHTML = tableHTML;
}

// Atualizar interface de paginação
function updatePaginationUIPayments() {
    document.getElementById('pageInfoPayments').textContent = `Página ${currentPagePayments} de ${totalPagesPayments}`;
    document.getElementById('prevPagePayments').disabled = currentPagePayments <= 1;
    document.getElementById('nextPagePayments').disabled = currentPagePayments >= totalPagesPayments;
}

// Funções de paginação
function changePagePayments(direction) {
    if (direction === 'prev' && currentPagePayments > 1) {
        currentPagePayments--;
    } else if (direction === 'next' && currentPagePayments < totalPagesPayments) {
        currentPagePayments++;
    }
    renderRewardsTable(filteredRewards);
}

// Filtrar recompensas
function filterRewards() {
    currentPagePayments = 1;
    renderCurrentTab();
}

// Modais e ações
function showApprovalModal(rewardId) {
    const reward = currentRewards.find(r => r._id === rewardId);
    if (!reward) return;

    document.getElementById('approvalIndicator').textContent = reward.indicatorName || 'N/A';
    document.getElementById('approvalLead').textContent = reward.leadName || 'N/A';
    document.getElementById('approvalCampaign').textContent = reward.campaignName || 'N/A';
    document.getElementById('approvalValue').textContent = formatCurrency(reward.rewardValue || 0);
    document.getElementById('approvalNotes').value = '';
    
    document.getElementById('approvalModal').dataset.rewardId = rewardId;
    document.getElementById('approvalModal').classList.remove('hidden');
}

function closeApprovalModal() {
    document.getElementById('approvalModal').classList.add('hidden');
}

async function confirmApproval() {
    const rewardId = document.getElementById('approvalModal').dataset.rewardId;
    const notes = document.getElementById('approvalNotes').value;

    try {
        // 🌍 USAR CONFIGURAÇÃO DINÂMICA
        const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                      (window.location.hostname === 'localhost' ? 
                       'http://localhost:3000/api' : 
                       'https://programa-indicacao-multicliente-production.up.railway.app/api');
        const response = await fetch(`${apiUrl}/referrals/${rewardId}/approve-reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes })
        });

        const result = await response.json();
        if (result.success) {
            closeApprovalModal();
            loadRewardsFromBackend();
            alert('Recompensa aprovada com sucesso!');
        } else {
            alert('Erro ao aprovar recompensa: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao aprovar recompensa:', error);
        alert('Erro ao aprovar recompensa. Tente novamente.');
    }
}

async function rejectReward() {
    const rewardId = document.getElementById('approvalModal').dataset.rewardId;
    const notes = document.getElementById('approvalNotes').value;

    if (!notes.trim()) {
        alert('Por favor, informe o motivo da rejeição.');
        return;
    }

    try {
        // 🌍 USAR CONFIGURAÇÃO DINÂMICA
        const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                      (window.location.hostname === 'localhost' ? 
                       'http://localhost:3000/api' : 
                       'https://programa-indicacao-multicliente-production.up.railway.app/api');
        const response = await fetch(`${apiUrl}/referrals/${rewardId}/reject-reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes })
        });

        const result = await response.json();
        if (result.success) {
            closeApprovalModal();
            loadRewardsFromBackend();
            alert('Recompensa rejeitada.');
        } else {
            alert('Erro ao rejeitar recompensa: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao rejeitar recompensa:', error);
        alert('Erro ao rejeitar recompensa. Tente novamente.');
    }
}

function showPaymentModal(rewardId) {
    const reward = currentRewards.find(r => r._id === rewardId);
    if (!reward) return;

    document.getElementById('paymentIndicator').textContent = reward.indicatorName || 'N/A';
    document.getElementById('paymentValue').textContent = formatCurrency(reward.rewardValue || 0);
    document.getElementById('paymentMethod').value = 'pix';
    document.getElementById('paymentReference').value = '';
    document.getElementById('paymentNotes').value = '';
    
    document.getElementById('paymentModal').dataset.rewardId = rewardId;
    document.getElementById('paymentModal').classList.remove('hidden');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
}

async function confirmPayment() {
    const rewardId = document.getElementById('paymentModal').dataset.rewardId;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const reference = document.getElementById('paymentReference').value;
    const notes = document.getElementById('paymentNotes').value;

    if (!reference.trim()) {
        alert('Por favor, informe a referência/ID da transação.');
        return;
    }

    try {
        // 🌍 USAR CONFIGURAÇÃO DINÂMICA
        const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                      (window.location.hostname === 'localhost' ? 
                       'http://localhost:3000/api' : 
                       'https://programa-indicacao-multicliente-production.up.railway.app/api');
        const response = await fetch(`${apiUrl}/referrals/${rewardId}/process-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentMethod,
                reference,
                notes
            })
        });

        const result = await response.json();
        if (result.success) {
            closePaymentModal();
            loadRewardsFromBackend();
            alert('Pagamento processado com sucesso!');
        } else {
            alert('Erro ao processar pagamento: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        alert('Erro ao processar pagamento. Tente novamente.');
    }
}

function showRewardDetails(rewardId) {
    const reward = currentRewards.find(r => r._id === rewardId);
    if (!reward) return;

    const content = document.getElementById('rewardDetailsContent');
    content.innerHTML = `
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div><span class="text-gray-400">Indicador:</span> <span class="text-green-400">${reward.indicatorName || 'N/A'}</span></div>
            <div><span class="text-gray-400">Email:</span> <span class="text-gray-200">${reward.indicatorEmail || 'N/A'}</span></div>
            <div><span class="text-gray-400">Lead:</span> <span class="text-blue-400">${reward.leadName || 'N/A'}</span></div>
            <div><span class="text-gray-400">Email Lead:</span> <span class="text-gray-200">${reward.leadEmail || 'N/A'}</span></div>
            <div><span class="text-gray-400">Campanha:</span> <span class="text-purple-400">${reward.campaignName || 'N/A'}</span></div>
            <div><span class="text-gray-400">Tipo:</span> <span class="text-blue-400">${reward.rewardCategory || 'Recompensa por Indicação'}</span></div>
            <div><span class="text-gray-400">Valor:</span> <span class="text-yellow-400 text-lg font-bold">${formatCurrency(reward.rewardValue || 0)}</span></div>
            <div><span class="text-gray-400">Status:</span> <span class="text-${rewardStatusConfig[reward.rewardStatus]?.color || 'gray'}-400">${rewardStatusConfig[reward.rewardStatus]?.label || 'N/A'}</span></div>
        </div>
        
        ${reward.rewardStatus === 'paid' ? `
            <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                <h4 class="text-green-400 font-semibold mb-2">Informações do Pagamento</h4>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><span class="text-gray-400">Método:</span> <span class="text-green-400">${paymentMethodConfig[reward.paymentMethod]?.label || 'N/A'}</span></div>
                    <div><span class="text-gray-400">Data:</span> <span class="text-gray-200">${formatDate(reward.paidAt)}</span></div>
                    <div><span class="text-gray-400">Referência:</span> <span class="text-gray-200">${reward.paymentReference || 'N/A'}</span></div>
                </div>
                ${reward.paymentNotes ? `<div class="mt-2"><span class="text-gray-400">Observações:</span> <span class="text-gray-200">${reward.paymentNotes}</span></div>` : ''}
            </div>
        ` : ''}
        
        <div class="text-xs text-gray-400">
            <div>Criado em: ${formatDate(reward.createdAt)}</div>
            ${reward.updatedAt ? `<div>Atualizado em: ${formatDate(reward.updatedAt)}</div>` : ''}
        </div>
    `;
    
    document.getElementById('rewardDetailsModal').classList.remove('hidden');
}

function closeRewardDetailsModal() {
    document.getElementById('rewardDetailsModal').classList.add('hidden');
}

// Funções utilitárias
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

// Exportar dados
function exportPayments() {
    const dataToExport = applyFilters(currentRewards);
    
    const csv = [
        ['Indicador', 'Email Indicador', 'Lead', 'Email Lead', 'Campanha', 'Tipo', 'Valor', 'Status', 'Método Pagamento', 'Data Criação', 'Data Pagamento'].join(','),
        ...dataToExport.map(reward => [
            reward.indicatorName || '',
            reward.indicatorEmail || '',
            reward.leadName || '',
            reward.leadEmail || '',
            reward.campaignName || '',
            reward.rewardCategory || 'Recompensa por Indicação',
            reward.rewardValue || 0,
            rewardStatusConfig[reward.rewardStatus]?.label || '',
            reward.paymentMethod ? paymentMethodConfig[reward.paymentMethod]?.label || '' : '',
            formatDate(reward.createdAt),
            formatDate(reward.paidAt)
        ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `recompensas_${currentTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Processamento em lote
function processPaymentsBatch() {
    const approvedRewards = currentRewards.filter(r => r.rewardStatus === 'approved');
    
    if (approvedRewards.length === 0) {
        alert('Não há recompensas aprovadas para processar.');
        return;
    }
    
    if (confirm(`Deseja processar ${approvedRewards.length} pagamentos em lote via PIX?`)) {
        // Implementar processamento em lote
        alert('Funcionalidade de processamento em lote será implementada em breve.');
    }
} 