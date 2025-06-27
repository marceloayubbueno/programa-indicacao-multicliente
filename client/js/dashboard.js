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

// Carregar dados do dashboard
function loadDashboardData() {
    // Aqui você faria uma chamada para a API para buscar os dados reais
    // Por enquanto, vamos usar dados mockados
    const mockData = {
        activeCampaigns: 3,
        totalParticipants: 150,
        totalReferrals: 45,
        totalRewards: 2250
    };

    // Atualizar o nome do cliente
    const clientEmail = localStorage.getItem('clientEmail');
    const clientNameEl = document.getElementById('clientName');
    if (clientNameEl && clientEmail) {
        clientNameEl.textContent = clientEmail.split('@')[0];
    }

    // Atualizar os números nos cards
    document.querySelectorAll('.card .number').forEach(card => {
        const title = card.parentElement.querySelector('h3').textContent;
        switch(title) {
            case 'Campanhas Ativas':
                card.textContent = mockData.activeCampaigns;
                break;
            case 'Total de Participantes':
                card.textContent = mockData.totalParticipants;
                break;
            case 'Indicações Recebidas':
                card.textContent = mockData.totalReferrals;
                break;
            case 'Recompensas Pagas':
                card.textContent = `R$ ${mockData.totalRewards.toLocaleString('pt-BR')}`;
                break;
        }
    });

    // Aqui você implementaria a lógica para os gráficos
    // Por exemplo, usando uma biblioteca como Chart.js
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