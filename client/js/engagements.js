/**
 * Engagements.js - E-mail Marketing
 * Gerencia a funcionalidade de E-mail Marketing e engajamento
 */

class EngagementsManager {
    constructor() {
        this.clientId = localStorage.getItem('clientId');
        this.token = localStorage.getItem('clientToken');
        this.init();
    }

    async init() {
        try {
            await this.loadDashboardData();
            await this.loadWelcomeEmailConfig();
            await this.loadRecentActivity();
        } catch (error) {
            console.error('Erro ao inicializar Engagements:', error);
        }
    }

    /**
     * Carrega dados do dashboard
     */
    async loadDashboardData() {
        try {
            // Mock data por enquanto - será substituído por API real
            const mockData = {
                totalEmails: 1250,
                openRate: 68.5,
                clickRate: 12.3,
                conversionRate: 8.7,
                activeFlows: 3,
                totalTemplates: 5,
                activeIndicators: 45,
                recentActivity: [
                    {
                        type: 'email_sent',
                        message: 'E-mail de boas-vindas enviado para João Silva',
                        time: '2 minutos atrás',
                        icon: 'fa-paper-plane',
                        color: 'text-blue-400'
                    },
                    {
                        type: 'flow_triggered',
                        message: 'Fluxo "Novo Indicador" ativado para Maria Santos',
                        time: '15 minutos atrás',
                        icon: 'fa-bolt',
                        color: 'text-green-400'
                    },
                    {
                        type: 'template_created',
                        message: 'Template "Campanha Black Friday" criado',
                        time: '1 hora atrás',
                        icon: 'fa-file-alt',
                        color: 'text-purple-400'
                    }
                ]
            };

            // Atualizar UI
            document.getElementById('totalEmails').textContent = mockData.totalEmails.toLocaleString();
            document.getElementById('openRate').textContent = mockData.openRate + '%';
            document.getElementById('clickRate').textContent = mockData.clickRate + '%';
            document.getElementById('activeIndicators').textContent = mockData.activeIndicators;

            // Renderizar atividade recente
            this.renderRecentActivity(mockData.recentActivity);

        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        }
    }

    /**
     * Carrega configuração do e-mail de boas-vindas
     */
    async loadWelcomeEmailConfig() {
        try {
            // Mock data - será substituído por API real
            const mockConfig = {
                status: 'ativo',
                emailsToday: 3,
                lastSent: '2024-01-15T10:30:00Z'
            };

            // Atualizar UI
            document.getElementById('welcomeEmailsToday').textContent = mockConfig.emailsToday;

        } catch (error) {
            console.error('Erro ao carregar configuração do e-mail de boas-vindas:', error);
        }
    }

    /**
     * Carrega atividade recente
     */
    async loadRecentActivity() {
        try {
            // Mock data - será substituído por API real
            const mockActivity = [
                {
                    type: 'sent',
                    description: 'E-mail de boas-vindas enviado',
                    recipient: 'joao@exemplo.com',
                    time: '2 min atrás',
                    icon: 'fa-paper-plane',
                    color: 'text-blue-400'
                },
                {
                    type: 'opened',
                    description: 'E-mail aberto',
                    recipient: 'maria@exemplo.com',
                    time: '5 min atrás',
                    icon: 'fa-eye',
                    color: 'text-green-400'
                },
                {
                    type: 'clicked',
                    description: 'Link clicado',
                    recipient: 'pedro@exemplo.com',
                    time: '10 min atrás',
                    icon: 'fa-mouse-pointer',
                    color: 'text-purple-400'
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
        const container = document.getElementById('recentActivity');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="flex items-center justify-between py-3 border-b border-gray-700 hover:bg-gray-800 transition-colors">
                <div class="flex items-center">
                    <i class="fas ${activity.icon} ${activity.color} mr-3 text-lg"></i>
                    <div>
                        <p class="text-white font-medium">${activity.message}</p>
                        <p class="text-sm text-gray-400">${activity.type.replace('_', ' ').toUpperCase()}</p>
                    </div>
                </div>
                <span class="text-sm text-gray-400">${activity.time}</span>
            </div>
        `).join('');
    }

    /**
     * Configura e-mail de boas-vindas
     */
    configureWelcomeEmail() {
        window.location.href = 'engajamento-email-template-editor.html?type=welcome';
    }

    /**
     * Cria nova campanha de e-mail
     */
    createEmailCampaign() {
        window.location.href = 'engajamento-email-template-editor.html?type=campaign';
    }

    /**
     * Ativa/desativa e-mail de boas-vindas
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
function configureWelcomeEmail() {
    if (window.engagementsManager) {
        window.engagementsManager.configureWelcomeEmail();
    }
}

function createEmailCampaign() {
    if (window.engagementsManager) {
        window.engagementsManager.createEmailCampaign();
    }
}

function toggleWelcomeEmail() {
    if (window.engagementsManager) {
        window.engagementsManager.toggleWelcomeEmail();
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
    window.engagementsManager = new EngagementsManager();
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EngagementsManager;
} 