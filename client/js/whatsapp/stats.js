// Estatísticas WhatsApp - Gestão de estatísticas e relatórios
// Sistema multicliente - JWT Authentication

// Variáveis globais
let currentPeriod = 'week';
let currentPage = 1;
let logsPerPage = 10;
let logs = [];
let filteredLogs = [];

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    await initWhatsAppStats();
});

async function initWhatsAppStats() {
    try {
        // Verificar autenticação
        if (!checkAuth()) {
            return;
        }

        // Carregar dados iniciais
        await loadStatistics();
        await loadLogs();
        
        // Configurar eventos
        setupEventListeners();
        
        // Definir período inicial
        setPeriod('week');
        
    } catch (error) {
        console.error('Erro ao inicializar WhatsApp Stats:', error);
        showError('Erro ao carregar estatísticas');
    }
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function getToken() {
    return localStorage.getItem('clientToken');
}

async function loadStatistics() {
    try {
        // Mock data para desenvolvimento frontend
        const stats = {
            totalMessagesSent: 1250,
            successRate: 98.5,
            avgResponseTime: 2.3,
            activeFlows: 8,
            periodChange: {
                totalMessagesSent: 12,
                successRate: 2.1,
                avgResponseTime: -0.5,
                activeFlows: 2
            }
        };
        
        // Atualizar métricas principais
        updateMainMetrics(stats);
        
        // Atualizar gráficos
        updateCharts();
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        showError('Erro ao carregar estatísticas');
    }
}

async function loadLogs() {
    try {
        // Mock data para desenvolvimento frontend
        logs = [
            {
                id: '1',
                timestamp: '2024-01-15T15:30:00Z',
                event: 'message_sent',
                template: 'Boas-vindas',
                recipient: '+5511999999999',
                status: 'delivered',
                details: 'Mensagem entregue com sucesso'
            },
            {
                id: '2',
                timestamp: '2024-01-15T15:25:00Z',
                event: 'message_sent',
                template: 'Oferta Especial',
                recipient: '+5511888888888',
                status: 'failed',
                details: 'Número inválido'
            },
            {
                id: '3',
                timestamp: '2024-01-15T15:20:00Z',
                event: 'template_approved',
                template: 'Lembrete',
                recipient: '-',
                status: 'approved',
                details: 'Template aprovado pelo WhatsApp'
            },
            {
                id: '4',
                timestamp: '2024-01-15T15:15:00Z',
                event: 'message_sent',
                template: 'Boas-vindas',
                recipient: '+5511777777777',
                status: 'delivered',
                details: 'Mensagem entregue com sucesso'
            },
            {
                id: '5',
                timestamp: '2024-01-15T15:10:00Z',
                event: 'message_sent',
                template: 'Oferta Especial',
                recipient: '+5511666666666',
                status: 'delivered',
                details: 'Mensagem entregue com sucesso'
            }
        ];
        
        filteredLogs = [...logs];
        renderLogs();
        
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        showError('Erro ao carregar logs');
    }
}

function setupEventListeners() {
    // Event listeners para filtros e controles
    const logFilter = document.getElementById('logFilter');
    if (logFilter) {
        logFilter.addEventListener('change', filterLogs);
    }
}

function updateMainMetrics(stats) {
    // Atualizar cards de métricas principais
    document.getElementById('totalMessagesSent').textContent = stats.totalMessagesSent.toLocaleString();
    document.getElementById('successRate').textContent = stats.successRate + '%';
    document.getElementById('avgResponseTime').textContent = stats.avgResponseTime + 's';
    document.getElementById('activeFlows').textContent = stats.activeFlows;
    
    // Atualizar indicadores de mudança
    updateChangeIndicators(stats.periodChange);
}

function updateChangeIndicators(changes) {
    // Atualizar indicadores de mudança nos cards
    const indicators = document.querySelectorAll('[id$="Change"]');
    indicators.forEach(indicator => {
        const metric = indicator.id.replace('Change', '');
        const change = changes[metric];
        
        if (change > 0) {
            indicator.innerHTML = `
                <i class="fas fa-arrow-up text-sm"></i>
                <span class="text-sm">+${change}${metric === 'successRate' || metric === 'avgResponseTime' ? '%' : ''}</span>
            `;
            indicator.className = 'text-green-400';
        } else if (change < 0) {
            indicator.innerHTML = `
                <i class="fas fa-arrow-down text-sm"></i>
                <span class="text-sm">${change}${metric === 'successRate' || metric === 'avgResponseTime' ? '%' : ''}</span>
            `;
            indicator.className = 'text-red-400';
        } else {
            indicator.innerHTML = `
                <i class="fas fa-minus text-sm"></i>
                <span class="text-sm">0%</span>
            `;
            indicator.className = 'text-gray-400';
        }
    });
}

function updateCharts() {
    // Atualizar gráficos (mock data)
    // Em produção, isso seria integrado com uma biblioteca de gráficos como Chart.js
    
    // Gráfico de mensagens por dia
    const dailyData = [60, 80, 45, 90, 70, 30, 20]; // Mock data
    
    // Gráfico de performance por template
    const templateData = [
        { name: 'Boas-vindas', percentage: 45, count: 562 },
        { name: 'Oferta Especial', percentage: 32, count: 400 },
        { name: 'Lembrete', percentage: 23, count: 288 }
    ];
    
    // Atualizar gráfico de performance por template
    updateTemplatePerformanceChart(templateData);
}

function updateTemplatePerformanceChart(data) {
    const container = document.querySelector('.space-y-4');
    if (!container) return;
    
    container.innerHTML = '';
    
    data.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'flex items-center justify-between';
        
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];
        const colorIndex = data.indexOf(item) % colors.length;
        
        itemElement.innerHTML = `
            <div class="flex items-center">
                <div class="w-3 h-3 ${colors[colorIndex]} rounded-full mr-3"></div>
                <span class="text-gray-300 text-sm">${item.name}</span>
            </div>
            <div class="text-right">
                <div class="text-gray-200 font-medium">${item.percentage}%</div>
                <div class="text-gray-500 text-xs">${item.count} mensagens</div>
            </div>
        `;
        
        container.appendChild(itemElement);
    });
}

function setPeriod(period) {
    currentPeriod = period;
    
    // Atualizar botões
    const buttons = document.querySelectorAll('[onclick^="setPeriod"]');
    buttons.forEach(button => {
        button.className = 'px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors';
    });
    
    const activeButton = document.querySelector(`[onclick="setPeriod('${period}')"]`);
    if (activeButton) {
        activeButton.className = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors';
    }
    
    // Mostrar/ocultar filtro personalizado
    const customPeriod = document.getElementById('customPeriod');
    if (period === 'custom') {
        customPeriod.classList.remove('hidden');
    } else {
        customPeriod.classList.add('hidden');
    }
    
    // Carregar dados do período
    loadPeriodData(period);
}

function loadPeriodData(period) {
    // Mock - em produção seria uma chamada API
    console.log(`Carregando dados do período: ${period}`);
    
    // Simular carregamento de dados
    setTimeout(() => {
        loadStatistics();
        loadLogs();
    }, 500);
}

function applyCustomPeriod() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showError('Selecione as datas inicial e final');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showError('A data inicial deve ser menor que a data final');
        return;
    }
    
    // Aplicar filtro de período personalizado
    loadPeriodData('custom');
}

function filterLogs() {
    const filter = document.getElementById('logFilter').value;
    
    if (filter === 'all') {
        filteredLogs = [...logs];
    } else {
        filteredLogs = logs.filter(log => log.event === filter);
    }
    
    currentPage = 1;
    renderLogs();
}

function renderLogs() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;
    
    // Calcular paginação
    const startIndex = (currentPage - 1) * logsPerPage;
    const endIndex = startIndex + logsPerPage;
    const pageLogs = filteredLogs.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    pageLogs.forEach(log => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700 hover:bg-gray-700';
        
        const statusColor = getStatusColor(log.status);
        const eventIcon = getEventIcon(log.event);
        
        row.innerHTML = `
            <td class="py-3 px-4 text-gray-300">${new Date(log.timestamp).toLocaleString('pt-BR')}</td>
            <td class="py-3 px-4">
                <div class="flex items-center">
                    <i class="${eventIcon} mr-2"></i>
                    <span class="text-gray-300">${getEventText(log.event)}</span>
                </div>
            </td>
            <td class="py-3 px-4 text-gray-300">${log.template}</td>
            <td class="py-3 px-4 text-gray-300">${log.recipient}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
                    ${getStatusText(log.status)}
                </span>
            </td>
            <td class="py-3 px-4 text-gray-400 text-sm">${log.details}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Atualizar paginação
    updatePagination();
}

function getStatusColor(status) {
    switch(status) {
        case 'delivered': return 'bg-green-600 text-green-100';
        case 'failed': return 'bg-red-600 text-red-100';
        case 'approved': return 'bg-blue-600 text-blue-100';
        case 'pending': return 'bg-yellow-600 text-yellow-100';
        default: return 'bg-gray-600 text-gray-100';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'delivered': return 'Entregue';
        case 'failed': return 'Falhou';
        case 'approved': return 'Aprovado';
        case 'pending': return 'Pendente';
        default: return status;
    }
}

function getEventIcon(event) {
    switch(event) {
        case 'message_sent': return 'fas fa-paper-plane text-blue-400';
        case 'message_delivered': return 'fas fa-check-circle text-green-400';
        case 'message_failed': return 'fas fa-exclamation-triangle text-red-400';
        case 'template_approved': return 'fas fa-thumbs-up text-green-400';
        default: return 'fas fa-info-circle text-gray-400';
    }
}

function getEventText(event) {
    switch(event) {
        case 'message_sent': return 'Mensagem Enviada';
        case 'message_delivered': return 'Mensagem Entregue';
        case 'message_failed': return 'Mensagem Falhou';
        case 'template_approved': return 'Template Aprovado';
        default: return event;
    }
}

function updatePagination() {
    const totalLogs = filteredLogs.length;
    const totalPages = Math.ceil(totalLogs / logsPerPage);
    const start = (currentPage - 1) * logsPerPage + 1;
    const end = Math.min(currentPage * logsPerPage, totalLogs);
    
    document.getElementById('showingStart').textContent = start;
    document.getElementById('showingEnd').textContent = end;
    document.getElementById('totalLogs').textContent = totalLogs;
    
    // Habilitar/desabilitar botões de navegação
    const prevButton = document.querySelector('[onclick="previousPage()"]');
    const nextButton = document.querySelector('[onclick="nextPage()"]');
    
    if (prevButton) {
        prevButton.disabled = currentPage === 1;
        prevButton.className = currentPage === 1 
            ? 'px-3 py-1 bg-gray-800 text-gray-500 rounded-lg cursor-not-allowed'
            : 'px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors';
    }
    
    if (nextButton) {
        nextButton.disabled = currentPage === totalPages;
        nextButton.className = currentPage === totalPages
            ? 'px-3 py-1 bg-gray-800 text-gray-500 rounded-lg cursor-not-allowed'
            : 'px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors';
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderLogs();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderLogs();
    }
}

async function refreshStats() {
    try {
        // Mostrar indicador de carregamento
        const refreshButton = document.querySelector('[onclick="refreshStats()"]');
        const originalText = refreshButton.innerHTML;
        refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Atualizando...';
        refreshButton.disabled = true;
        
        // Recarregar dados
        await loadStatistics();
        await loadLogs();
        
        // Restaurar botão
        refreshButton.innerHTML = originalText;
        refreshButton.disabled = false;
        
        showSuccess('Estatísticas atualizadas com sucesso!');
        
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        showError('Erro ao atualizar estatísticas');
        
        // Restaurar botão em caso de erro
        const refreshButton = document.querySelector('[onclick="refreshStats()"]');
        refreshButton.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Atualizar';
        refreshButton.disabled = false;
    }
}

function exportReport() {
    try {
        // Mock - em produção seria uma chamada API para gerar relatório
        const reportData = {
            period: currentPeriod,
            stats: {
                totalMessagesSent: document.getElementById('totalMessagesSent').textContent,
                successRate: document.getElementById('successRate').textContent,
                avgResponseTime: document.getElementById('avgResponseTime').textContent,
                activeFlows: document.getElementById('activeFlows').textContent
            },
            logs: filteredLogs
        };
        
        // Simular download do relatório
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `whatsapp-report-${currentPeriod}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        showSuccess('Relatório exportado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao exportar relatório:', error);
        showError('Erro ao exportar relatório');
    }
}

function showSuccess(message) {
    // Implementar notificação de sucesso
    alert(message);
}

function showError(message) {
    // Implementar notificação de erro
    alert('Erro: ' + message);
} 