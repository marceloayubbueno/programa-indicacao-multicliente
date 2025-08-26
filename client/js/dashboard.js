// Verificar se o cliente está logado
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isClientLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
    }
}

// Função de logout
function logout() {
    localStorage.removeItem('isClientLoggedIn');
    localStorage.removeItem('clientEmail');
    window.location.href = 'login.html';
}

// Variáveis globais para os gráficos
let campaignChart = null;
let conversionChart = null;

// Carregar dados do dashboard
async function loadDashboardData() {
    try {
        console.log('Carregando dados do dashboard do cliente...');
        
        // Buscar dados mockados (substituir por API real posteriormente)
        const data = await fetchClientDashboardData();
        
        updateDashboardCards(data);
        createCampaignChart(data.campaignReferrals);
        createConversionChart(data.conversionData);
        
        console.log('Dashboard carregado com sucesso!');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showErrorMessage();
    }
}

// Simular busca de dados (substituir por API real)
async function fetchClientDashboardData() {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
        activeCampaigns: 3,
        totalParticipants: 150,
        totalReferrals: 45,
        totalRewards: 2250.75,
        campaignReferrals: [12, 18, 15, 22, 19, 25],
        conversionData: {
            'Convertidas': 28,
            'Pendentes': 12,
            'Canceladas': 5
        }
    };
}

// Função para atualizar os cards do dashboard
function updateDashboardCards(data) {
    // Atualizar o nome do cliente
    const clientEmail = localStorage.getItem('clientEmail');
    const clientNameEl = document.getElementById('clientName');
    if (clientNameEl && clientEmail) {
        clientNameEl.textContent = clientEmail.split('@')[0];
    }
    
    // Atualizar Campanhas Ativas
    const activeCampaignsEl = document.getElementById('activeCampaigns');
    if (activeCampaignsEl) {
        animateValue(activeCampaignsEl, 0, data.activeCampaigns, 1200);
    }
    
    // Atualizar Total de Participantes
    const totalParticipantsEl = document.getElementById('totalParticipants');
    if (totalParticipantsEl) {
        animateValue(totalParticipantsEl, 0, data.totalParticipants, 1500);
    }
    
    // Atualizar Total de Indicações
    const totalReferralsEl = document.getElementById('totalReferrals');
    if (totalReferralsEl) {
        animateValue(totalReferralsEl, 0, data.totalReferrals, 1000);
    }
    
    // Atualizar Recompensas Pagas
    const totalRewardsEl = document.getElementById('totalRewards');
    if (totalRewardsEl) {
        animateRevenue(totalRewardsEl, 0, data.totalRewards, 1800);
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

// Função para criar o gráfico de indicações por campanha
function createCampaignChart(data) {
    const ctx = document.getElementById('campaignChart');
    if (!ctx) return;

    // Destruir o gráfico anterior se existir
    if (campaignChart) {
        campaignChart.destroy();
    }

    campaignChart = new Chart(ctx, {
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

// Função para criar o gráfico de conversão
function createConversionChart(data) {
    const ctx = document.getElementById('conversionChart');
    if (!ctx) return;

    // Destruir o gráfico anterior se existir
    if (conversionChart) {
        conversionChart.destroy();
    }

    conversionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#34D399', // emerald-400 (Convertidas)
                    '#F59E0B', // amber-500 (Pendentes)
                    '#EF4444'  // red-500 (Canceladas)
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
    const cards = document.querySelectorAll('[id^="active"], [id^="total"]');
    cards.forEach(card => {
        if (card) {
            card.textContent = 'Erro';
            card.style.color = '#EF4444'; // red-500
        }
    });
}

// Função para controlar o submenu
function toggleSubmenu(event) {
    event.preventDefault();
    const menuItem = event.target.closest('.has-submenu');
    if (menuItem) {
        menuItem.classList.toggle('active');
    }
}

// Inicializar o dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboardData();
});

// Redimensionar gráficos quando janela é redimensionada
window.addEventListener('resize', () => {
    if (campaignChart) campaignChart.resize();
    if (conversionChart) conversionChart.resize();
}); 