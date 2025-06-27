// Configuração da API
// 🌍 CONFIGURAÇÃO DINÂMICA: usar config.js quando disponível
const API_URL = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
               (window.location.hostname === 'localhost' ? 
                'http://localhost:3000/api' : 
                'https://programa-indicacao-multicliente-production.up.railway.app/api');

// Carregar dados da página ao iniciar
document.addEventListener('DOMContentLoaded', async () => {
    const linkIndicador = window.location.pathname.split('/').pop();
    await loadIndicationPage(linkIndicador);
});

// Carregar dados da página de indicação
async function loadIndicationPage(linkIndicador) {
    try {
        const response = await fetch(`${API_URL}/clients/indication/${linkIndicador}`);
        
        if (!response.ok) {
            throw new Error('Página não encontrada');
        }

        const client = await response.json();
        
        // Aplicar configurações visuais
        document.documentElement.style.setProperty('--primary-color', client.configuracaoDivulgação.paginaVendas.cores.primaria);
        document.documentElement.style.setProperty('--secondary-color', client.configuracaoDivulgação.paginaVendas.cores.secundaria);
        document.documentElement.style.setProperty('--success-color', client.configuracaoDivulgação.paginaVendas.cta.cor);

        // Preencher conteúdo
        document.getElementById('pageTitle').textContent = client.configuracaoDivulgação.paginaVendas.titulo;
        document.getElementById('pageDescription').textContent = client.configuracaoDivulgação.paginaVendas.descricao;
        document.getElementById('submitButton').textContent = client.configuracaoDivulgação.paginaVendas.cta.texto;

        // Preencher benefícios
        const benefitsList = document.getElementById('benefitsList');
        benefitsList.innerHTML = '';
        
        const benefitIcons = [
            'fa-gift',
            'fa-star',
            'fa-trophy',
            'fa-handshake',
            'fa-chart-line',
            'fa-users'
        ];

        client.configuracaoDivulgação.paginaVendas.beneficios.forEach((benefit, index) => {
            const icon = benefitIcons[index % benefitIcons.length];
            const benefitCard = document.createElement('div');
            benefitCard.className = 'benefit-card';
            benefitCard.innerHTML = `
                <i class="fas ${icon}"></i>
                <h3>${benefit}</h3>
            `;
            benefitsList.appendChild(benefitCard);
        });

        // Armazenar ID do cliente para uso no formulário
        window.clientId = client._id;
    } catch (error) {
        console.error('Erro ao carregar página:', error);
        showError('Página não encontrada ou indisponível no momento.');
    }
}

// Manipular envio do formulário
async function handleSubmit(event) {
    event.preventDefault();

    const formData = {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        empresa: document.getElementById('empresa').value.trim(),
        cargo: document.getElementById('cargo').value.trim(),
        clienteId: window.clientId
    };

    try {
        const response = await fetch(`${API_URL}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Erro ao enviar formulário');
        }

        showSuccess('Cadastro realizado com sucesso! Em breve entraremos em contato.');
        document.getElementById('indicationForm').reset();
    } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        showError('Erro ao enviar formulário. Por favor, tente novamente.');
    }
}

// Mostrar mensagem de sucesso
function showSuccess(message) {
    // Implementar toast ou notificação de sucesso
    alert(message);
}

// Mostrar mensagem de erro
function showError(message) {
    // Implementar toast ou notificação de erro
    alert(message);
} 