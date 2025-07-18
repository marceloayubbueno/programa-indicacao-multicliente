/**
 * Engajamento Email Marketing.js
 * Gerencia a funcionalidade de E-mail Marketing e templates
 */

class EmailMarketingManager {
    constructor() {
        this.clientId = localStorage.getItem('clientId');
        this.token = localStorage.getItem('clientToken');
        this.init();
    }

    async init() {
        try {
            await this.loadWelcomeEmailData();
            await this.loadCampaignData();
            await this.loadEmailLists();
            await this.loadRecentActivity();
        } catch (error) {
            console.error('Erro ao inicializar Email Marketing:', error);
        }
    }

    /**
     * Carrega dados do e-mail de boas-vindas
     */
    async loadWelcomeEmailData() {
        try {
            // Mock data - será substituído por API real
            const mockData = {
                status: 'ativo',
                emailsToday: 5,
                openRate: 78.5,
                lastUpdate: '2024-01-15T14:30:00Z'
            };

            // Atualizar UI
            document.getElementById('welcomeEmailsToday').textContent = mockData.emailsToday;
            document.getElementById('welcomeOpenRate').textContent = mockData.openRate + '%';
            document.getElementById('welcomeLastUpdate').textContent = this.formatDate(mockData.lastUpdate);

        } catch (error) {
            console.error('Erro ao carregar dados do e-mail de boas-vindas:', error);
        }
    }

    /**
     * Carrega dados das campanhas
     */
    async loadCampaignData() {
        try {
            // Mock data - será substituído por API real
            const mockData = {
                activeCampaigns: 2,
                totalCampaigns: 8,
                lastCampaign: '2024-01-14T10:00:00Z',
                avgOpenRate: 65.2
            };

            // Atualizar UI
            document.getElementById('activeCampaignsCount').textContent = mockData.activeCampaigns;
            document.getElementById('totalCampaigns').textContent = mockData.totalCampaigns;
            document.getElementById('lastCampaignDate').textContent = this.formatDate(mockData.lastCampaign);
            document.getElementById('avgOpenRate').textContent = mockData.avgOpenRate + '%';

        } catch (error) {
            console.error('Erro ao carregar dados das campanhas:', error);
        }
    }

    /**
     * Carrega listas de indicadores do cliente logado
     */
    async loadEmailLists() {
        try {
            console.log('🔄 Carregando listas de indicadores...');
            
            // Buscar listas do backend
            const response = await fetch(`${window.APP_CONFIG?.API_URL || '/api'}/participant-lists`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar listas: ${response.status}`);
            }

            const lists = await response.json();
            console.log('📋 Listas recebidas do backend:', lists);

            // Filtrar apenas listas de indicadores
            const indicatorLists = lists.filter(list => 
                list.tipo === 'indicador' || 
                list.type === 'indicador' ||
                list.name.toLowerCase().includes('indicador')
            );

            console.log('🎯 Listas de indicadores filtradas:', indicatorLists);

            // Transformar dados para o formato esperado
            const formattedLists = indicatorLists.map(list => ({
                id: list._id,
                name: list.name,
                count: list.participantCount || list.participants?.length || 0,
                type: list.tipo || 'indicador',
                lastActivity: list.updatedAt || list.createdAt || new Date().toISOString(),
                description: list.description || '',
                campaignId: list.campaignId,
                campaignName: list.campaignName
            }));

            this.renderEmailLists(formattedLists);

        } catch (error) {
            console.error('Erro ao carregar listas de e-mail:', error);
            
            // Fallback para mock data em caso de erro
            const mockLists = [
                {
                    id: '1',
                    name: 'Indicadores Ativos',
                    count: 25,
                    type: 'indicador',
                    lastActivity: '2024-01-15T12:00:00Z'
                },
                {
                    id: '2',
                    name: 'Novos Indicadores',
                    count: 8,
                    type: 'indicador',
                    lastActivity: '2024-01-15T14:30:00Z'
                }
            ];

            this.renderEmailLists(mockLists);
        }
    }

    /**
     * Renderiza listas de e-mail
     */
    renderEmailLists(lists) {
        const container = document.getElementById('emailLists');
        if (!container) return;

        if (lists.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-users text-gray-500 text-4xl mb-4"></i>
                    <p class="text-gray-400 mb-2">Nenhuma lista de indicadores encontrada</p>
                    <p class="text-sm text-gray-500">Crie indicadores primeiro para aparecerem aqui</p>
                </div>
            `;
            return;
        }

        container.innerHTML = lists.map(list => `
            <div class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-white">${list.name}</h4>
                    <span class="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                        ${list.count} indicadores
                    </span>
                </div>
                
                ${list.description ? `<p class="text-sm text-gray-400 mb-2">${list.description}</p>` : ''}
                
                <div class="space-y-2 mb-3">
                    <div class="flex items-center text-xs text-gray-500">
                        <i class="fas fa-tag mr-1"></i>
                        <span>Tipo: ${list.type}</span>
                    </div>
                    ${list.campaignName ? `
                        <div class="flex items-center text-xs text-gray-500">
                            <i class="fas fa-rocket mr-1"></i>
                            <span>Campanha: ${list.campaignName}</span>
                        </div>
                    ` : ''}
                    <div class="flex items-center text-xs text-gray-500">
                        <i class="fas fa-clock mr-1"></i>
                        <span>Atualizado: ${this.formatDate(list.lastActivity)}</span>
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <button onclick="selectList('${list.id}')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors">
                        <i class="fas fa-envelope mr-1"></i>Enviar E-mail
                    </button>
                    <button onclick="viewListDetails('${list.id}')" class="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm transition-colors">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Carrega atividade recente
     */
    async loadRecentActivity() {
        try {
            // Mock data - será substituído por API real
            const mockActivity = [
                {
                    type: 'welcome_sent',
                    description: 'E-mail de boas-vindas enviado',
                    recipient: 'joao@exemplo.com',
                    time: '2 min atrás',
                    icon: 'fa-paper-plane',
                    color: 'text-blue-400'
                },
                {
                    type: 'campaign_created',
                    description: 'Nova campanha criada',
                    name: 'Promoção Especial',
                    time: '1 hora atrás',
                    icon: 'fa-bullhorn',
                    color: 'text-purple-400'
                },
                {
                    type: 'email_opened',
                    description: 'E-mail aberto',
                    recipient: 'maria@exemplo.com',
                    time: '3 horas atrás',
                    icon: 'fa-eye',
                    color: 'text-green-400'
                },
                {
                    type: 'link_clicked',
                    description: 'Link clicado',
                    recipient: 'pedro@exemplo.com',
                    time: '5 horas atrás',
                    icon: 'fa-mouse-pointer',
                    color: 'text-orange-400'
                }
            ];

            this.renderRecentActivity(mockActivity);

        } catch (error) {
            console.error('Erro ao carregar atividade recente:', error);
        }
    }

    /**
     * Renderiza atividade recente
     */
    renderRecentActivity(activities) {
        const container = document.getElementById('recentEmailActivity');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="flex items-center justify-between py-2 border-b border-gray-700">
                <div class="flex items-center">
                    <i class="fas ${activity.icon} ${activity.color} mr-3"></i>
                    <div>
                        <p class="text-white">${activity.description}</p>
                        <p class="text-sm text-gray-400">
                            ${activity.recipient ? `Por: ${activity.recipient}` : ''}
                            ${activity.name ? `Campanha: ${activity.name}` : ''}
                        </p>
                    </div>
                </div>
                <span class="text-sm text-gray-400">${activity.time}</span>
            </div>
        `).join('');
    }

    /**
     * Formata data para exibição
     */
    formatDate(dateString) {
        if (!dateString || dateString === 'Nunca') return 'Nunca';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `${diffMins} min atrás`;
        } else if (diffHours < 24) {
            return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
        } else if (diffDays < 7) {
            return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
        } else {
            return date.toLocaleDateString('pt-BR');
        }
    }

    /**
     * Alterna status do e-mail de boas-vindas
     */
    async toggleWelcomeEmail() {
        try {
            const statusElement = document.getElementById('welcomeEmailStatus');
            const currentStatus = statusElement.textContent;
            const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
            
            // Mock API call
            await this.simulateApiCall();
            
            // Atualizar UI
            statusElement.textContent = newStatus;
            statusElement.className = newStatus === 'Ativo' 
                ? 'px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400'
                : 'px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400';

        } catch (error) {
            console.error('Erro ao alternar status do e-mail de boas-vindas:', error);
        }
    }

    /**
     * Simula chamada de API (será substituído por API real)
     */
    async simulateApiCall() {
        return new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Funções globais para uso nos botões
function editWelcomeTemplate() {
    window.location.href = 'engajamento-email-template-editor.html?type=welcome';
}

function previewWelcomeEmail() {
    window.location.href = 'engajamento-email-template-editor.html?type=welcome&preview=true';
}

function createNewCampaign() {
    window.location.href = 'engajamento-email-template-editor.html?type=campaign';
}

function viewAllCampaigns() {
    window.location.href = 'engajamento-email-campaigns.html';
}

function selectList(listId) {
    console.log('Lista selecionada para e-mail:', listId);
    // Redirecionar para editor de template com a lista selecionada
    window.location.href = `engajamento-email-template-editor.html?type=campaign&listId=${listId}`;
}

function viewListDetails(listId) {
    console.log('Visualizando detalhes da lista:', listId);
    // Redirecionar para página de detalhes da lista
    window.location.href = `participants.html?listId=${listId}`;
}

function createWelcomeEmail() {
    window.location.href = 'engajamento-email-template-editor.html?type=welcome';
}

function createEmailCampaign() {
    window.location.href = 'engajamento-email-template-editor.html?type=campaign';
}

function createEmailFlow() {
    window.location.href = 'engajamento-email-flow-editor.html';
}

function backToEngagements() {
    window.location.href = 'engagements.html';
}

function refreshLists() {
    if (window.emailMarketingManager) {
        window.emailMarketingManager.loadEmailLists();
    }
}

function toggleWelcomeEmail() {
    if (window.emailMarketingManager) {
        window.emailMarketingManager.toggleWelcomeEmail();
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (!localStorage.getItem('clientToken') || !localStorage.getItem('clientId')) {
        window.location.href = 'login.html';
        return;
    }

    // Inicializar manager
    window.emailMarketingManager = new EmailMarketingManager();
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailMarketingManager;
} 