// Estado global
let currentLeads = [];
let currentPage = 1;
let totalPages = 1;
const leadsPerPage = 20;

// Mapeamento de status para exibição
const statusConfig = {
    'novo': { icon: 'fa-star', color: 'yellow', label: 'Novo' },
    'contatado': { icon: 'fa-phone', color: 'orange', label: 'Contatado' },
    'qualificado': { icon: 'fa-check-circle', color: 'blue', label: 'Qualificado' },
    'convertido': { icon: 'fa-trophy', color: 'green', label: 'Convertido' },
    'perdido': { icon: 'fa-times-circle', color: 'red', label: 'Perdido' }
};

// Função principal para carregar leads
async function loadLeadsFromBackend() {
    try {
        const response = await fetch('http://localhost:3000/api/referrals');
        const data = await response.json();
        
        if (data.success) {
            currentLeads = data.data.map(lead => ({
                ...lead,
                // Mapear status antigo para novo sistema
                leadStatus: mapOldStatusToNew(lead.status)
            }));
            updateStatistics();
            renderLeadsTable(currentLeads);
            populateFilters();
        } else {
            currentLeads = [];
            renderLeadsTable([]);
        }
    } catch (err) {
        console.error('Erro ao carregar leads:', err);
        currentLeads = [];
        renderLeadsTable([]);
    }
}

// Mapear status antigo para novo sistema
function mapOldStatusToNew(oldStatus) {
    switch(oldStatus?.toLowerCase()) {
        case 'pendente': return 'novo';
        case 'aprovada': return 'convertido';
        case 'rejeitada': return 'perdido';
        default: return 'novo';
    }
}

// Atualizar estatísticas do dashboard
function updateStatistics() {
    const total = currentLeads.length;
    const newLeads = currentLeads.filter(l => l.leadStatus === 'novo').length;
    const contacted = currentLeads.filter(l => l.leadStatus === 'contatado').length;
    const converted = currentLeads.filter(l => l.leadStatus === 'convertido').length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    document.getElementById('totalLeads').textContent = total;
    document.getElementById('newLeads').textContent = newLeads;
    document.getElementById('contactedLeads').textContent = contacted;
    document.getElementById('convertedLeads').textContent = converted;
    document.getElementById('conversionRate').textContent = conversionRate + '%';
}

// Renderizar tabela de leads
function renderLeadsTable(leads) {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!leads || !leads.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-400">Nenhum lead encontrado.</td></tr>';
        return;
    }

    // Implementar paginação
    const startIndex = (currentPage - 1) * leadsPerPage;
    const endIndex = startIndex + leadsPerPage;
    const paginatedLeads = leads.slice(startIndex, endIndex);
    
    totalPages = Math.ceil(leads.length / leadsPerPage);
    updatePaginationUI();

    paginatedLeads.forEach(lead => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-800 transition-colors';
        
        const status = statusConfig[lead.leadStatus] || statusConfig['novo'];
        const statusBadge = `<span class="px-2 py-1 text-xs rounded-full bg-${status.color}-500/20 text-${status.color}-400">
            <i class="fas ${status.icon} mr-1"></i>${status.label}
        </span>`;
        
        const sourceIcon = {
            'link': 'fa-link',
            'landing-page': 'fa-globe',
            'manual': 'fa-user-plus'
        }[lead.referralSource] || 'fa-question';
            
        tr.innerHTML = `
            <td class="px-4 py-3">
                <div class="text-sm">
                    <div class="font-medium text-gray-200">${lead.leadName || '-'}</div>
                    ${lead.leadCompany ? `<div class="text-xs text-gray-400">${lead.leadCompany}</div>` : ''}
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="text-sm text-gray-300">
                    <div><i class="fas fa-envelope text-gray-400 mr-1"></i>${lead.leadEmail || '-'}</div>
                    <div><i class="fas fa-phone text-gray-400 mr-1"></i>${lead.leadPhone || '-'}</div>
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-blue-400 text-sm"></i>
                    </div>
                    <span class="text-sm font-medium text-gray-200">${lead.indicatorName || '-'}</span>
                </div>
            </td>
            <td class="px-4 py-3">
                    <span class="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">
                    <i class="fas fa-rocket mr-1"></i>${lead.campaignName || '-'}
                </span>
            </td>
            <td class="px-4 py-3">
                <span class="text-sm text-gray-300">
                    <i class="fas ${sourceIcon} text-gray-400 mr-1"></i>
                    ${lead.referralSource === 'landing-page' ? 'LP' : 
                      lead.referralSource === 'link' ? 'Link' : 'Manual'}
                    </span>
            </td>
            <td class="px-4 py-3">
                <div class="text-sm text-gray-300">
                    <i class="fas fa-calendar text-gray-400 mr-1"></i>
                    ${formatDate(lead.createdAt)}
                </div>
            </td>
            <td class="px-4 py-3">${statusBadge}</td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                    <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-blue-400 hover:text-blue-300" 
                            onclick="viewLeadDetails('${lead._id}')" 
                            title="Ver detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${lead.leadStatus !== 'convertido' ? `
                        <div class="relative group">
                            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-300" 
                                    title="Alterar status">
                                <i class="fas fa-edit"></i>
                            </button>
                            <div class="absolute right-0 top-8 bg-gray-700 rounded-lg shadow-lg p-2 hidden group-hover:block z-10 min-w-32">
                                <button class="block w-full text-left px-2 py-1 text-xs hover:bg-gray-600 rounded" 
                                        onclick="updateLeadStatus('${lead._id}', 'contatado')">
                                    <i class="fas fa-phone mr-1"></i>Contatado
                                </button>
                                <button class="block w-full text-left px-2 py-1 text-xs hover:bg-gray-600 rounded" 
                                        onclick="updateLeadStatus('${lead._id}', 'qualificado')">
                                    <i class="fas fa-check-circle mr-1"></i>Qualificado
                                </button>
                                <button class="block w-full text-left px-2 py-1 text-xs hover:bg-gray-600 rounded" 
                                        onclick="showConversionModal('${lead._id}')">
                                    <i class="fas fa-trophy mr-1"></i>Convertido
                        </button>
                                <button class="block w-full text-left px-2 py-1 text-xs hover:bg-gray-600 rounded text-red-400" 
                                        onclick="updateLeadStatus('${lead._id}', 'perdido')">
                                    <i class="fas fa-times-circle mr-1"></i>Perdido
                        </button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Atualizar interface de paginação
function updatePaginationUI() {
    document.getElementById('pageInfo').textContent = `Página ${currentPage} de ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

// Funções de paginação
function changePage(direction) {
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
    }
    renderLeadsTable(getFilteredLeads());
}

// Funções de modal
function showConversionModal(leadId) {
    const lead = currentLeads.find(l => l._id === leadId);
    if (!lead) return;

    document.getElementById('conversionLeadName').textContent = lead.leadName;
    document.getElementById('conversionIndicator').textContent = lead.indicatorName || 'N/A';
    document.getElementById('conversionValue').value = '';
    document.getElementById('conversionNotes').value = '';
    
    // Armazenar ID do lead para uso posterior
    document.getElementById('conversionModal').dataset.leadId = leadId;
    document.getElementById('conversionModal').classList.remove('hidden');
}

function closeConversionModal() {
    document.getElementById('conversionModal').classList.add('hidden');
}

async function confirmConversion() {
    const leadId = document.getElementById('conversionModal').dataset.leadId;
    const value = document.getElementById('conversionValue').value;
    const notes = document.getElementById('conversionNotes').value;

    if (!value || parseFloat(value) <= 0) {
        alert('Por favor, informe um valor válido para a conversão.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/referrals/${leadId}/mark-conversion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversionValue: parseFloat(value),
                notes: notes
            })
        });

        const result = await response.json();
        
        if (result.success) {
            closeConversionModal();
            loadLeadsFromBackend(); // Recarregar dados
            alert('Lead marcado como convertido! Recompensa gerada para aprovação.');
        } else {
            alert('Erro ao marcar conversão: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao marcar conversão:', error);
        alert('Erro ao marcar conversão. Tente novamente.');
    }
}

function viewLeadDetails(leadId) {
    const lead = currentLeads.find(l => l._id === leadId);
    if (!lead) return;

    const details = document.getElementById('leadDetails');
    details.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div><span class="text-gray-400">Nome:</span> <span class="text-gray-200">${lead.leadName || '-'}</span></div>
            <div><span class="text-gray-400">Email:</span> <span class="text-gray-200">${lead.leadEmail || '-'}</span></div>
            <div><span class="text-gray-400">Telefone:</span> <span class="text-gray-200">${lead.leadPhone || '-'}</span></div>
            <div><span class="text-gray-400">Indicador:</span> <span class="text-gray-200">${lead.indicatorName || '-'}</span></div>
            <div><span class="text-gray-400">Campanha:</span> <span class="text-gray-200">${lead.campaignName || '-'}</span></div>
            <div><span class="text-gray-400">Origem:</span> <span class="text-gray-200">${lead.referralSource || '-'}</span></div>
            <div><span class="text-gray-400">Status:</span> <span class="text-gray-200">${statusConfig[lead.leadStatus]?.label || '-'}</span></div>
            <div><span class="text-gray-400">Data:</span> <span class="text-gray-200">${formatDate(lead.createdAt)}</span></div>
        </div>
    `;
    
    document.getElementById('leadModal').classList.remove('hidden');
}

function closeLeadModal() {
    document.getElementById('leadModal').classList.add('hidden');
}

// Atualizar status do lead
async function updateLeadStatus(leadId, newStatus) {
    try {
        const response = await fetch(`http://localhost:3000/api/referrals/${leadId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();
        
        if (result.success) {
            loadLeadsFromBackend(); // Recarregar dados
        } else {
            alert('Erro ao atualizar status: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        alert('Erro ao atualizar status. Tente novamente.');
    }
}

// Funções de filtro
function populateFilters() {
    // Popular filtro de campanhas
    const campaigns = [...new Set(currentLeads.map(l => l.campaignName).filter(Boolean))];
    const campaignSelect = document.getElementById('campaignFilter');
    campaignSelect.innerHTML = '<option value="">Todas</option>';
    campaigns.forEach(campaign => {
        const option = document.createElement('option');
        option.value = campaign;
        option.textContent = campaign;
        campaignSelect.appendChild(option);
    });

    // Popular filtro de indicadores
    const indicators = [...new Set(currentLeads.map(l => l.indicatorName).filter(Boolean))];
    const indicatorSelect = document.getElementById('indicatorFilter');
    indicatorSelect.innerHTML = '<option value="">Todos</option>';
    indicators.forEach(indicator => {
        const option = document.createElement('option');
        option.value = indicator;
        option.textContent = indicator;
        indicatorSelect.appendChild(option);
    });
}

function getFilteredLeads() {
    const campaignFilter = document.getElementById('campaignFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const indicatorFilter = document.getElementById('indicatorFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    const searchTerm = document.getElementById('searchLead').value.toLowerCase();

    return currentLeads.filter(lead => {
        if (campaignFilter && lead.campaignName !== campaignFilter) return false;
        if (statusFilter && lead.leadStatus !== statusFilter) return false;
        if (indicatorFilter && lead.indicatorName !== indicatorFilter) return false;
        if (dateFilter && !lead.createdAt?.startsWith(dateFilter)) return false;
        if (searchTerm && !(
            (lead.leadName || '').toLowerCase().includes(searchTerm) ||
            (lead.leadEmail || '').toLowerCase().includes(searchTerm) ||
            (lead.leadPhone || '').toLowerCase().includes(searchTerm)
        )) return false;
        
        return true;
    });
}

function filterLeads() {
    currentPage = 1; // Reset para primeira página
    const filteredLeads = getFilteredLeads();
    renderLeadsTable(filteredLeads);
    updateStatistics();
}

function searchLeads() {
    filterLeads();
}

// Função de exportação
function exportLeads() {
    const filteredLeads = getFilteredLeads();
    
    const csv = [
        ['Nome', 'Email', 'Telefone', 'Indicador', 'Campanha', 'Origem', 'Status', 'Data'].join(','),
        ...filteredLeads.map(lead => [
            lead.leadName || '',
            lead.leadEmail || '',
            lead.leadPhone || '',
            lead.indicatorName || '',
            lead.campaignName || '',
            lead.referralSource || '',
            statusConfig[lead.leadStatus]?.label || '',
            formatDate(lead.createdAt)
        ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Função utilitária para formatar datas
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadLeadsFromBackend();
    
    // Adicionar listener para busca em tempo real
    document.getElementById('searchLead').addEventListener('input', function() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => filterLeads(), 300);
    });
}); 