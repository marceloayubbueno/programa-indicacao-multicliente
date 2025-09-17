// rewards-available.js - Gerenciamento de Recompensas Disponíveis

let allRewards = [];

// Função para obter API_URL de forma segura (seguindo padrão das outras páginas)
function getApiUrl() {
    return window.API_URL ||
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL :
           'http://localhost:3000/api');
}

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 [REWARDS-AVAILABLE] Inicializando página de recompensas disponíveis...');
    
    // Aguardar auth.js carregar antes de verificar auth (seguindo padrão das outras páginas)
    setTimeout(() => {
        try {
            // Verificar se checkAuth existe antes de chamar
            if (typeof checkAuth === 'function') {
                if (!checkAuth()) {
                    return;
                }
            } else {
                console.warn('⚠️ [REWARDS-AVAILABLE] checkAuth não disponível, usando verificação local...');
                if (!checkAuthAvailable()) {
                    return;
                }
            }
            
            // Carregar dados iniciais
            loadAvailableRewardsCards();
            
        } catch (error) {
            console.error('❌ [REWARDS-AVAILABLE] Erro na inicialização:', error);
        }
    }, 100);
});

// Verificar autenticação (usando função do auth.js)
function checkAuthAvailable() {
    const token = localStorage.getItem('clientToken');
    
    if (!token) {
        console.log('❌ [REWARDS-AVAILABLE] Usuário não autenticado');
        window.location.href = 'login.html';
        return false;
    }
    
    console.log('✅ [REWARDS-AVAILABLE] Usuário autenticado');
    return true;
}

// Carregar cards de recompensas disponíveis
function loadAvailableRewardsCards() {
    console.log('📋 [REWARDS-AVAILABLE] Carregando cards de recompensas disponíveis...');
    
    const cardsContainer = document.getElementById('availableRewardsCards');
    
    const rewardTypes = [
        {
            id: 'pontos',
            name: 'Pontos',
            description: 'Sistema de pontos acumulativos',
            usage: 'Geração do lead ou conversão',
            icon: 'fas fa-star',
            color: 'bg-yellow-500',
            bgColor: 'bg-gray-800'
        },
        {
            id: 'pix',
            name: 'PIX',
            description: 'Pagamento instantâneo via PIX',
            usage: 'Geração do lead ou conversão',
            icon: 'fas fa-mobile-alt',
            color: 'bg-green-500',
            bgColor: 'bg-gray-800'
        },
        {
            id: 'desconto',
            name: 'Desconto em %',
            description: 'Desconto percentual na mensalidade',
            usage: 'Geração do lead ou conversão',
            icon: 'fas fa-percentage',
            color: 'bg-purple-500',
            bgColor: 'bg-gray-800'
        },
        {
            id: 'desconto_valor_financeiro',
            name: 'Desconto em Valor',
            description: 'Desconto em valor fixo (R$) na mensalidade',
            usage: 'Geração do lead ou conversão',
            icon: 'fas fa-money-bill-wave',
            color: 'bg-emerald-500',
            bgColor: 'bg-gray-800'
        },
        {
            id: 'valor_fixo',
            name: 'Valor Fixo',
            description: 'Valor financeiro fixo para indicadores',
            usage: 'Usado fixamente em indicadores',
            icon: 'fas fa-dollar-sign',
            color: 'bg-blue-500',
            bgColor: 'bg-gray-800'
        },
        {
            id: 'valor_percentual',
            name: 'Valor % Percentual',
            description: 'Comissionamento variável por produto',
            usage: 'Ajustado no momento da conversão',
            icon: 'fas fa-chart-pie',
            color: 'bg-red-500',
            bgColor: 'bg-gray-800'
        },
        {
            id: 'desconto_recorrente',
            name: 'Desconto Recorrente',
            description: 'Desconto percentual permanente',
            usage: 'Aplicado mensalmente enquanto ativo',
            icon: 'fas fa-sync-alt',
            color: 'bg-indigo-500',
            bgColor: 'bg-gray-800'
        },
        // TEMPORARIAMENTE INATIVADO - Cashback
        // {
        //     id: 'cashback',
        //     name: 'Cashback',
        //     description: 'Devolução de parte do valor gasto',
        //     usage: 'Após conversão do cliente indicado',
        //     icon: 'fas fa-undo',
        //     color: 'bg-orange-500',
        //     bgColor: 'bg-gray-800'
        // },
        // TEMPORARIAMENTE INATIVADO - Crédito Digital
        // {
        //     id: 'credito_digital',
        //     name: 'Crédito Digital',
        //     description: 'Crédito virtual para produtos/serviços',
        //     usage: 'Geração do lead ou conversão',
        //     icon: 'fas fa-credit-card',
        //     color: 'bg-teal-500',
        //     bgColor: 'bg-gray-800'
        // },
        // TEMPORARIAMENTE INATIVADO - Produto/Serviço Grátis
        // {
        //     id: 'produto_gratis',
        //     name: 'Produto/Serviço Grátis',
        //     description: 'Acesso gratuito a produtos específicos',
        //     usage: 'Geração do lead ou conversão',
        //     icon: 'fas fa-gift',
        //     color: 'bg-pink-500',
        //     bgColor: 'bg-gray-800'
        // },
        {
            id: 'comissao_recorrente',
            name: 'Comissão Recorrente',
            description: 'Comissão mensal enquanto cliente ativo',
            usage: 'Mensalmente enquanto cliente ativo',
            icon: 'fas fa-coins',
            color: 'bg-amber-500',
            bgColor: 'bg-gray-800'
        },
        // TEMPORARIAMENTE INATIVADO - Bônus por Volume
        // {
        //     id: 'bonus_volume',
        //     name: 'Bônus por Volume',
        //     description: 'Bônus adicional baseado no número de indicações',
        //     usage: 'Acumulativo por período',
        //     icon: 'fas fa-chart-bar',
        //     color: 'bg-violet-500',
        //     bgColor: 'bg-gray-800'
        // },
        // TEMPORARIAMENTE INATIVADO - Desconto Progressivo
        // {
        //     id: 'desconto_progressivo',
        //     name: 'Desconto Progressivo',
        //     description: 'Desconto que aumenta com indicações',
        //     usage: 'Aplicado nas próximas compras',
        //     icon: 'fas fa-trending-up',
        //     color: 'bg-sky-500',
        //     bgColor: 'bg-gray-800'
        // },
        // TEMPORARIAMENTE INATIVADO - Vale-Presente
        // {
        //     id: 'vale_presente',
        //     name: 'Vale-Presente',
        //     description: 'Vales para Amazon, iFood, Uber, etc.',
        //     usage: 'Geração do lead ou conversão',
        //     icon: 'fas fa-ticket-alt',
        //     color: 'bg-lime-500',
        //     bgColor: 'bg-gray-800'
        // },
        // TEMPORARIAMENTE INATIVADO - Por Valor da Conversão
        // {
        //     id: 'valor_conversao',
        //     name: 'Por Valor da Conversão',
        //     description: 'Bônus baseado no valor da primeira compra',
        //     usage: 'Após primeira compra do cliente indicado',
        //     icon: 'fas fa-shopping-cart',
        //     color: 'bg-neutral-500',
        //     bgColor: 'bg-gray-800'
        // },
        // TEMPORARIAMENTE INATIVADO - Por Meta
        // {
        //     id: 'meta',
        //     name: 'Por Meta',
        //     description: 'Bônus por atingir metas específicas',
        //     usage: 'Após atingir meta definida',
        //     icon: 'fas fa-bullseye',
        //     color: 'bg-blue-600',
        //     bgColor: 'bg-gray-800'
        // }
    ];
    
    cardsContainer.innerHTML = '';
    
    rewardTypes.forEach(type => {
        const card = document.createElement('div');
        card.className = `bg-gray-800 rounded-lg border border-gray-700 px-3 py-4 text-center hover:border-gray-600 transition-colors cursor-pointer`;
        card.onclick = () => filterByType(type.id);
        
        card.innerHTML = `
            <div class="w-8 h-8 ${type.color} rounded-full flex items-center justify-center mx-auto mb-2">
                <i class="${type.icon} text-white text-sm"></i>
            </div>
            <h3 class="text-sm font-semibold text-gray-100 mb-1">${type.name}</h3>
            <p class="text-xs text-gray-400 mb-1">${type.description}</p>
            <p class="text-xs text-blue-400 font-medium">${type.usage}</p>
        `;
        
        cardsContainer.appendChild(card);
    });
    
    console.log('✅ [REWARDS-AVAILABLE] Cards de recompensas carregados');
}



// Filtrar por tipo (clique no card) - navega para editor com tipo pré-selecionado
function filterByType(type) {
    console.log(`🔍 [REWARDS-AVAILABLE] Tipo selecionado: ${type}`);
    // Navega para página de criação com o tipo específico pré-selecionado
    window.location.href = `reward-type-editor.html?type=${type}`;
}

// Funções do menu (copiadas de outras páginas)
function toggleWhatsAppMenu() {
    const menu = document.getElementById('whatsappMenu');
    const arrow = document.getElementById('whatsappArrow');
    
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        arrow.style.transform = 'rotate(90deg)';
    } else {
        menu.classList.add('hidden');
        arrow.style.transform = 'rotate(0deg)';
    }
}

function toggleFinanceMenu() {
    const menu = document.getElementById('financeMenu');
    const arrow = document.getElementById('financeArrow');
    
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        arrow.style.transform = 'rotate(90deg)';
    } else {
        menu.classList.add('hidden');
        arrow.style.transform = 'rotate(0deg)';
    }
}

function toggleSettingsMenu() {
    const menu = document.getElementById('settingsMenu');
    const arrow = document.getElementById('settingsArrow');
    
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        arrow.style.transform = 'rotate(90deg)';
    } else {
        menu.classList.add('hidden');
        arrow.style.transform = 'rotate(0deg)';
    }
}
