// Engajamento WhatsApp - Funcionalidades principais
// Sistema multicliente - Padrão do sistema

class WhatsAppEngagement {
    constructor() {
        this.clientId = null;
        this.templates = [];
        this.flows = [];
        this.stats = {
            activeTemplates: 0,
            configuredFlows: 0,
            sentMessages: 0,
            deliveryRate: 0
        };
        this.init();
    }

    async init() {
        try {
            // Verificar autenticação
            if (!window.auth || !window.auth.isAuthenticated()) {
                window.location.href = 'login.html';
                return;
            }

            // Obter dados do cliente
            this.clientId = window.auth.getClientId();
            
            // Carregar dados iniciais
            await this.loadDashboardData();
            
            // Configurar eventos
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Erro ao inicializar WhatsApp Engagement:', error);
            this.showError('Erro ao carregar dados do dashboard');
        }
    }

    async loadDashboardData() {
        try {
            // Carregar estatísticas
            await this.loadStats();
            
            // Carregar templates recentes
            await this.loadRecentTemplates();
            
            // Carregar fluxos ativos
            await this.loadActiveFlows();
            
            // Carregar atividade recente
            await this.loadRecentActivity();
            
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        }
    }

    async loadStats() {
        try {
            // Mock data para desenvolvimento frontend
            this.stats = {
                activeTemplates: 3,
                configuredFlows: 2,
                sentMessages: 1250,
                deliveryRate: 98.5
            };

            // Atualizar UI
            document.getElementById('activeTemplates').textContent = this.stats.activeTemplates;
            document.getElementById('configuredFlows').textContent = this.stats.configuredFlows;
            document.getElementById('sentMessages').textContent = this.stats.sentMessages.toLocaleString();
            document.getElementById('deliveryRate').textContent = this.stats.deliveryRate + '%';

        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    async loadRecentTemplates() {
        try {
            // Mock data para desenvolvimento frontend
            this.templates = [
                {
                    id: 1,
                    name: 'Boas-vindas Indicador',
                    category: 'marketing',
                    status: 'approved',
                    createdAt: '2024-01-15T10:30:00Z'
                },
                {
                    id: 2,
                    name: 'Lembrete Lead',
                    category: 'utility',
                    status: 'pending',
                    createdAt: '2024-01-14T15:45:00Z'
                },
                {
                    id: 3,
                    name: 'Recompensa Ganha',
                    category: 'marketing',
                    status: 'approved',
                    createdAt: '2024-01-13T09:20:00Z'
                }
            ];

            this.renderRecentTemplates();

        } catch (error) {
            console.error('Erro ao carregar templates recentes:', error);
        }
    }

    async loadActiveFlows() {
        try {
            // Mock data para desenvolvimento frontend
            this.flows = [
                {
                    id: 1,
                    name: 'Fluxo Indicadores',
                    type: 'indicator_flow',
                    status: 'active',
                    messagesCount: 3,
                    executions: 45
                },
                {
                    id: 2,
                    name: 'Fluxo Leads',
                    type: 'lead_flow',
                    status: 'active',
                    messagesCount: 2,
                    executions: 23
                }
            ];

            this.renderActiveFlows();

        } catch (error) {
            console.error('Erro ao carregar fluxos ativos:', error);
        }
    }

    async loadRecentActivity() {
        try {
            // Mock data para desenvolvimento frontend
            const activities = [
                {
                    id: 1,
                    type: 'template_created',
                    message: 'Template "Boas-vindas Indicador" criado',
                    timestamp: '2024-01-15T10:30:00Z',
                    icon: 'fas fa-envelope',
                    color: 'text-blue-400'
                },
                {
                    id: 2,
                    type: 'flow_activated',
                    message: 'Fluxo "Fluxo Indicadores" ativado',
                    timestamp: '2024-01-15T09:15:00Z',
                    icon: 'fas fa-project-diagram',
                    color: 'text-green-500'
                },
                {
                    id: 3,
                    type: 'message_sent',
                    message: '50 mensagens enviadas via fluxo',
                    timestamp: '2024-01-15T08:45:00Z',
                    icon: 'fas fa-paper-plane',
                    color: 'text-purple-500'
                }
            ];

            this.renderRecentActivity(activities);

        } catch (error) {
            console.error('Erro ao carregar atividade recente:', error);
        }
    }

    renderRecentTemplates() {
        const container = document.getElementById('recentTemplates');
        
        if (this.templates.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <p>Nenhum template criado ainda</p>
                </div>
            `;
            return;
        }

        const templatesHTML = this.templates.slice(0, 3).map(template => `
            <div class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer" onclick="whatsappEngagement.viewTemplate(${template.id})">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-medium text-gray-100">${template.name}</h4>
                    <span class="text-xs px-2 py-1 rounded-full ${this.getStatusColor(template.status)}">
                        ${this.getStatusText(template.status)}
                    </span>
                </div>
                <p class="text-gray-400 text-sm mb-2">${this.getCategoryText(template.category)}</p>
                <p class="text-gray-500 text-xs">${this.formatDate(template.createdAt)}</p>
            </div>
        `).join('');

        container.innerHTML = templatesHTML;
    }

    renderActiveFlows() {
        const container = document.getElementById('activeFlows');
        
        if (this.flows.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-project-diagram text-4xl mb-2"></i>
                    <p>Nenhum fluxo configurado ainda</p>
                </div>
            `;
            return;
        }

        const flowsHTML = this.flows.slice(0, 3).map(flow => `
            <div class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer" onclick="whatsappEngagement.viewFlow(${flow.id})">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-medium text-gray-100">${flow.name}</h4>
                    <span class="text-xs px-2 py-1 rounded-full bg-green-500 text-white">
                        Ativo
                    </span>
                </div>
                <p class="text-gray-400 text-sm mb-2">${this.getFlowTypeText(flow.type)}</p>
                <div class="flex justify-between text-xs text-gray-500">
                    <span>${flow.messagesCount} mensagens</span>
                    <span>${flow.executions} execuções</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = flowsHTML;
    }

    renderRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-clock text-4xl mb-2"></i>
                    <p>Nenhuma atividade recente</p>
                </div>
            `;
            return;
        }

        const activitiesHTML = activities.map(activity => `
            <div class="flex items-center gap-4 p-4 bg-gray-700 rounded-lg">
                <div class="flex-shrink-0">
                    <i class="${activity.icon} ${activity.color} text-xl"></i>
                </div>
                <div class="flex-1">
                    <p class="text-gray-100 text-sm">${activity.message}</p>
                    <p class="text-gray-500 text-xs">${this.formatDate(activity.timestamp)}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = activitiesHTML;
    }

    getStatusColor(status) {
        const colors = {
            'draft': 'bg-gray-500 text-white',
            'pending': 'bg-yellow-500 text-white',
            'approved': 'bg-green-500 text-white',
            'rejected': 'bg-red-500 text-white'
        };
        return colors[status] || 'bg-gray-500 text-white';
    }

    getStatusText(status) {
        const texts = {
            'draft': 'Rascunho',
            'pending': 'Pendente',
            'approved': 'Aprovado',
            'rejected': 'Rejeitado'
        };
        return texts[status] || 'Desconhecido';
    }

    getCategoryText(category) {
        const categories = {
            'marketing': 'Marketing',
            'utility': 'Utility',
            'authentication': 'Authentication'
        };
        return categories[category] || 'Outro';
    }

    getFlowTypeText(type) {
        const types = {
            'indicator_flow': 'Fluxo para Indicadores',
            'lead_flow': 'Fluxo para Leads',
            'mixed_flow': 'Fluxo Misto'
        };
        return types[type] || 'Fluxo';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            return 'Agora mesmo';
        } else if (diffInHours < 24) {
            return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `Há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
        }
    }

    setupEventListeners() {
        // Event listeners para modais
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }
        });

        // Event listeners para botões de ação
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="create-template"]')) {
                this.createTemplate();
            } else if (e.target.matches('[data-action="create-flow"]')) {
                this.createFlow();
            } else if (e.target.matches('[data-action="configure-whatsapp"]')) {
                this.configureWhatsApp();
            }
        });
    }

    // Métodos de navegação
    viewTemplate(templateId) {
        // Implementar visualização de template
        console.log('Visualizar template:', templateId);
        this.showInfo('Funcionalidade de visualização de template será implementada na próxima fase');
    }

    viewFlow(flowId) {
        // Implementar visualização de fluxo
        console.log('Visualizar fluxo:', flowId);
        this.showInfo('Funcionalidade de visualização de fluxo será implementada na próxima fase');
    }

    viewAllTemplates() {
        // Implementar navegação para lista completa de templates
        console.log('Ver todos os templates');
        this.showInfo('Funcionalidade de lista completa de templates será implementada na próxima fase');
    }

    viewAllFlows() {
        // Implementar navegação para lista completa de fluxos
        console.log('Ver todos os fluxos');
        this.showInfo('Funcionalidade de lista completa de fluxos será implementada na próxima fase');
    }

    // Métodos de criação
    createTemplate() {
        // Implementar criação de template
        console.log('Criar novo template');
        this.showInfo('Funcionalidade de criação de template será implementada na próxima fase');
    }

    createFlow() {
        // Implementar criação de fluxo
        console.log('Criar novo fluxo');
        this.showInfo('Funcionalidade de criação de fluxo será implementada na próxima fase');
    }

    configureWhatsApp() {
        // Implementar configuração do WhatsApp
        console.log('Configurar WhatsApp');
        this.showInfo('Funcionalidade de configuração do WhatsApp será implementada na próxima fase');
    }

    // Métodos de modal
    openTemplatesModal() {
        document.getElementById('templatesModal').classList.remove('hidden');
    }

    closeTemplatesModal() {
        document.getElementById('templatesModal').classList.add('hidden');
    }

    openFlowsModal() {
        document.getElementById('flowsModal').classList.remove('hidden');
    }

    closeFlowsModal() {
        document.getElementById('flowsModal').classList.add('hidden');
    }

    openConfigModal() {
        document.getElementById('configModal').classList.remove('hidden');
    }

    closeConfigModal() {
        document.getElementById('configModal').classList.add('hidden');
    }

    closeAllModals() {
        this.closeTemplatesModal();
        this.closeFlowsModal();
        this.closeConfigModal();
    }

    // Métodos de notificação
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Implementar sistema de notificações
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Criar notificação temporária
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-600 text-white' :
            type === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Funções globais para compatibilidade com onclick
function openTemplatesModal() {
    if (window.whatsappEngagement) {
        window.whatsappEngagement.openTemplatesModal();
    }
}

function closeTemplatesModal() {
    if (window.whatsappEngagement) {
        window.whatsappEngagement.closeTemplatesModal();
    }
}

function openFlowsModal() {
    if (window.whatsappEngagement) {
        window.whatsappEngagement.openFlowsModal();
    }
}

function closeFlowsModal() {
    if (window.whatsappEngagement) {
        window.whatsappEngagement.closeFlowsModal();
    }
}

function openConfigModal() {
    if (window.whatsappEngagement) {
        window.whatsappEngagement.openConfigModal();
    }
}

function closeConfigModal() {
    if (window.whatsappEngagement) {
        window.whatsappEngagement.closeConfigModal();
    }
}

function viewAllTemplates() {
    if (window.whatsappEngagement) {
        window.whatsappEngagement.viewAllTemplates();
    }
}

function viewAllFlows() {
    if (window.whatsappEngagement) {
        window.whatsappEngagement.viewAllFlows();
    }
}

// Funções do menu (reutilizadas do sistema existente)
function toggleEngagementEmailMenu() {
    const menu = document.getElementById('engagementEmailMenu');
    const arrow = document.getElementById('engagementEmailArrow');
    
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

function logout() {
    if (window.auth) {
        window.auth.logout();
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar carregamento dos módulos necessários
    if (typeof window.auth !== 'undefined' && typeof window.apiClient !== 'undefined') {
        window.whatsappEngagement = new WhatsAppEngagement();
    } else {
        // Tentar novamente após um delay
        setTimeout(() => {
            if (typeof window.auth !== 'undefined' && typeof window.apiClient !== 'undefined') {
                window.whatsappEngagement = new WhatsAppEngagement();
            } else {
                console.error('Módulos necessários não carregados');
            }
        }, 1000);
    }
}); 