// Verificar autenticação é feito pelo auth.js
// Não precisamos duplicar essa lógica aqui

// Variáveis globais para os gráficos
let monthlyChart = null;
let plansChart = null;

// Função para carregar os dados do dashboard
async function loadDashboardData() {
    try {
        console.log('Carregando dados do dashboard administrativo...');
        
        // Aqui você faria chamadas à API para obter os dados reais
        // Por enquanto, vamos usar dados mockados reais
        const data = await fetchDashboardData();
        
        updateDashboardCards(data);
        createMonthlyChart(data.monthlyReferrals);
        createPlansChart(data.planDistribution);
        
        console.log('Dashboard carregado com sucesso!');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showErrorMessage();
    }
}

// Simular busca de dados (substituir por API real)
async function fetchDashboardData() {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
        totalClients: 157,
        activeCampaigns: 23,
        totalReferrals: 1247,
        monthlyRevenue: 25340.75,
        monthlyReferrals: [145, 189, 156, 203, 178, 234],
        planDistribution: {
            'Starter': 42,
            'Professional': 58,
            'Enterprise': 27,
            'Premium': 15
        }
    };
}

// Função para atualizar os cards do dashboard
function updateDashboardCards(data) {
    // Atualizar Total de Clientes
    const totalClientsEl = document.getElementById('totalClients');
    if (totalClientsEl) {
        animateValue(totalClientsEl, 0, data.totalClients, 1500);
    }
    
    // Atualizar Campanhas Ativas
    const activeCampaignsEl = document.getElementById('activeCampaigns');
    if (activeCampaignsEl) {
        animateValue(activeCampaignsEl, 0, data.activeCampaigns, 1200);
    }
    
    // Atualizar Total de Indicações
    const totalReferralsEl = document.getElementById('totalReferrals');
    if (totalReferralsEl) {
        animateValue(totalReferralsEl, 0, data.totalReferrals, 2000);
    }
    
    // Atualizar Receita Mensal
    const monthlyRevenueEl = document.getElementById('monthlyRevenue');
    if (monthlyRevenueEl) {
        animateRevenue(monthlyRevenueEl, 0, data.monthlyRevenue, 1800);
    }
}

// Função para animar valores numéricos
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString('pt-BR');
    }, 16);
}

// Função para animar valor de receita
function animateRevenue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = `R$ ${current.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        })}`;
    }, 16);
}

// Função para criar o gráfico mensal com tema escuro
function createMonthlyChart(data) {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;

    // Destruir o gráfico anterior se existir
    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{
                label: 'Indicações',
                data: data,
                borderColor: '#60A5FA', // blue-400
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#60A5FA',
                pointBorderColor: '#1F2937', // gray-800
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#374151', // gray-700
                        borderColor: '#4B5563' // gray-600
                    },
                    ticks: {
                        color: '#9CA3AF' // gray-400
                    }
                },
                y: {
                    grid: {
                        color: '#374151', // gray-700
                        borderColor: '#4B5563' // gray-600
                    },
                    ticks: {
                        color: '#9CA3AF' // gray-400
                    }
                }
            }
        }
    });
}

// Função para criar o gráfico de distribuição de planos com tema escuro
function createPlansChart(data) {
    const ctx = document.getElementById('plansChart');
    if (!ctx) return;

    // Destruir o gráfico anterior se existir
    if (plansChart) {
        plansChart.destroy();
    }

    plansChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#60A5FA', // blue-400
                    '#34D399', // emerald-400
                    '#F59E0B', // amber-500
                    '#A78BFA'  // violet-400
                ],
                borderColor: '#1F2937', // gray-800
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#D1D5DB', // gray-300
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            }
        }
    });
}

// Função para mostrar mensagem de erro
function showErrorMessage() {
    const cards = document.querySelectorAll('[id^="total"], [id^="active"], [id^="monthly"]');
    cards.forEach(card => {
        if (card) {
            card.textContent = 'Erro';
            card.style.color = '#EF4444'; // red-500
        }
    });
}

// Função para logout
function handleLogout() {
    if (confirm('Tem certeza que deseja sair do painel administrativo?')) {
        // Limpar dados de autenticação admin
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        
        // Redirecionar para login admin
        window.location.href = 'login.html';
    }
}

// Função para atualizar dados em tempo real (opcional)
function startRealTimeUpdates() {
    setInterval(() => {
        // Aqui você pode fazer polling da API para atualizações
        console.log('Verificando atualizações...');
    }, 30000); // A cada 30 segundos
}

// Inicializar o dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard administrativo inicializando...');
    
    // Carregar dados iniciais
    loadDashboardData();
    
    // Iniciar atualizações em tempo real (opcional)
    // startRealTimeUpdates();
    
    // Adicionar eventos de clique se necessário
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Adicionar listeners para interações futuras
    // Por exemplo, refresh manual dos dados
    const refreshBtn = document.querySelector('[data-refresh]');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadDashboardData();
        });
    }
}

// Redimensionar gráficos quando janela é redimensionada
window.addEventListener('resize', () => {
    if (monthlyChart) monthlyChart.resize();
    if (plansChart) plansChart.resize();
}); 