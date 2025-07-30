// Fluxos WhatsApp - Gestão de fluxos de mensagens
// Sistema multicliente - UX otimizada

class WhatsAppFlows {
    constructor() {
        this.clientId = null;
        this.flows = [];
        this.templates = [];
        this.currentFlow = null;
        this.triggerCounter = 1;
        this.messageCounter = 1;
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
            await this.loadFlows();
            await this.loadTemplates();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Inicializar formulário
            this.initializeForm();
            
        } catch (error) {
            console.error('Erro ao inicializar WhatsApp Flows:', error);
            this.showError('Erro ao carregar fluxos');
        }
    }

    async loadFlows() {
        try {
            // Mock data para desenvolvimento frontend
            this.flows = [
                {
                    id: 1,
                    name: 'Fluxo de Boas-vindas Indicadores',
                    type: 'indicator_flow',
                    description: 'Sequência de mensagens para novos indicadores',
                    status: 'active',
                    triggers: [
                        { event: 'indicator_joined', delay: 0, description: 'Indicador entra na campanha' }
                    ],
                    messages: [
                        { order: 1, templateId: 1, delay: 0, templateName: 'Boas-vindas Indicador' },
                        { order: 2, templateId: 2, delay: 30, templateName: 'Dicas de Indicação' }
                    ],
                    settings: {
                        maxMessagesPerDay: 100,
                        startTime: '09:00',
                        endTime: '18:00',
                        timezone: 'America/Sao_Paulo'
                    },
                    stats: {
                        totalExecutions: 45,
                        messagesSent: 90,
                        successRate: 98.5
                    },
                    createdAt: '2024-01-15T10:30:00Z'
                },
                {
                    id: 2,
                    name: 'Fluxo de Lembrete Leads',
                    type: 'lead_flow',
                    description: 'Lembretes para leads sobre benefícios',
                    status: 'active',
                    triggers: [
                        { event: 'lead_indicated', delay: 0, description: 'Lead é indicado' }
                    ],
                    messages: [
                        { order: 1, templateId: 3, delay: 0, templateName: 'Parabéns Lead' },
                        { order: 2, templateId: 4, delay: 60, templateName: 'Lembrete Benefícios' }
                    ],
                    settings: {
                        maxMessagesPerDay: 50,
                        startTime: '10:00',
                        endTime: '17:00',
                        timezone: 'America/Sao_Paulo'
                    },
                    stats: {
                        totalExecutions: 23,
                        messagesSent: 46,
                        successRate: 95.2
                    },
                    createdAt: '2024-01-14T15:45:00Z'
                }
            ];

            this.renderFlows();

        } catch (error) {
            console.error('Erro ao carregar fluxos:', error);
        }
    }

    async loadTemplates() {
        try {
            // Mock data para templates
            this.templates = [
                { id: 1, name: 'Boas-vindas Indicador', category: 'marketing' },
                { id: 2, name: 'Dicas de Indicação', category: 'utility' },
                { id: 3, name: 'Parabéns Lead', category: 'marketing' },
                { id: 4, name: 'Lembrete Benefícios', category: 'marketing' }
            ];

        } catch (error) {
            console.error('Erro ao carregar templates:', error);
        }
    }

    renderFlows() {
        const container = document.getElementById('flowsGrid');
        
        if (this.flows.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="bg-gray-800 rounded-xl p-8 max-w-md mx-auto">
                        <i class="fas fa-project-diagram text-6xl text-gray-500 mb-4"></i>
                        <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum fluxo criado</h3>
                        <p class="text-gray-400 mb-6">Crie seu primeiro fluxo de mensagens WhatsApp para automatizar o engajamento</p>
                        <button onclick="whatsappFlows.openCreateFlowModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                            <i class="fas fa-plus mr-2"></i>Criar Primeiro Fluxo
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const flowsHTML = this.flows.map(flow => `
            <div class="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700 hover:border-blue-500">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-100 mb-1">${flow.name}</h3>
                        <p class="text-gray-400 text-sm mb-2">${flow.description}</p>
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">${this.getFlowTypeText(flow.type)}</span>
                            <span class="px-2 py-1 ${flow.status === 'active' ? 'bg-green-500' : 'bg-gray-500'} text-white text-xs rounded-full">
                                ${flow.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="whatsappFlows.editFlow(${flow.id})" class="text-blue-400 hover:text-blue-300 p-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="whatsappFlows.previewFlow(${flow.id})" class="text-green-400 hover:text-green-300 p-2">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="whatsappFlows.toggleFlowStatus(${flow.id})" class="text-yellow-400 hover:text-yellow-300 p-2">
                            <i class="fas fa-power-off"></i>
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-400">${flow.stats.totalExecutions}</div>
                        <div class="text-xs text-gray-400">Execuções</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-400">${flow.stats.successRate}%</div>
                        <div class="text-xs text-gray-400">Taxa Sucesso</div>
                    </div>
                </div>

                <div class="space-y-2 mb-4">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-400">Triggers:</span>
                        <span class="text-gray-200">${flow.triggers.length}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-400">Mensagens:</span>
                        <span class="text-gray-200">${flow.messages.length}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-400">Criado:</span>
                        <span class="text-gray-200">${this.formatDate(flow.createdAt)}</span>
                    </div>
                </div>

                <div class="flex gap-2">
                    <button onclick="whatsappFlows.duplicateFlow(${flow.id})" class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 px-3 rounded-lg text-sm transition-colors">
                        <i class="fas fa-copy mr-1"></i>Duplicar
                    </button>
                    <button onclick="whatsappFlows.deleteFlow(${flow.id})" class="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = flowsHTML;
    }

    initializeForm() {
        // Adicionar primeiro trigger e mensagem por padrão
        this.addTrigger();
        this.addMessage();
    }

    addTrigger() {
        const container = document.getElementById('triggersContainer');
        const triggerHTML = `
            <div class="trigger-item bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-medium text-gray-200">Trigger #${this.triggerCounter}</h4>
                    <button type="button" onclick="whatsappFlows.removeTrigger(this)" class="text-red-400 hover:text-red-300">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-gray-300 text-sm font-medium mb-1">Evento</label>
                        <select name="triggerEvent[]" class="trigger-event w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" onchange="whatsappFlows.updateTriggerDescription(this)">
                            <option value="indicator_joined">Indicador entra na campanha</option>
                            <option value="lead_indicated">Lead é indicado</option>
                            <option value="reward_earned">Recompensa ganha</option>
                            <option value="lead_converted">Lead converte</option>
                            <option value="indicator_inactive">Indicador inativo</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-300 text-sm font-medium mb-1">Delay (minutos)</label>
                        <input type="number" name="triggerDelay[]" class="trigger-delay w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" value="0" min="0">
                    </div>
                </div>
                <div class="trigger-description mt-2">
                    <small class="text-gray-400">Descrição do evento será exibida aqui</small>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', triggerHTML);
        this.triggerCounter++;
        this.updateTriggerDescription(container.lastElementChild.querySelector('.trigger-event'));
    }

    addMessage() {
        const container = document.getElementById('messagesContainer');
        const messageHTML = `
            <div class="message-item bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-medium text-gray-200">Mensagem #${this.messageCounter}</h4>
                    <button type="button" onclick="whatsappFlows.removeMessage(this)" class="text-red-400 hover:text-red-300">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                        <label class="block text-gray-300 text-sm font-medium mb-1">Template</label>
                        <select name="messageTemplate[]" class="message-template w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            <option value="">Selecione um template...</option>
                            ${this.templates.map(template => `<option value="${template.id}">${template.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-300 text-sm font-medium mb-1">Delay após trigger (min)</label>
                        <input type="number" name="messageDelay[]" class="message-delay w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" value="0" min="0">
                    </div>
                </div>
                <div>
                    <label class="block text-gray-300 text-sm font-medium mb-1">Condições (Opcional)</label>
                    <textarea name="messageConditions[]" class="message-conditions w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" placeholder="Condições para enviar esta mensagem..."></textarea>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', messageHTML);
        this.messageCounter++;
    }

    removeTrigger(button) {
        button.closest('.trigger-item').remove();
    }

    removeMessage(button) {
        button.closest('.message-item').remove();
    }

    updateTriggerDescription(select) {
        const descriptions = {
            'indicator_joined': 'Dispara quando um novo indicador se registra na campanha',
            'lead_indicated': 'Dispara quando um lead é indicado por um indicador',
            'reward_earned': 'Dispara quando uma recompensa é ganha',
            'lead_converted': 'Dispara quando um lead completa uma conversão',
            'indicator_inactive': 'Dispara quando um indicador fica inativo por muito tempo'
        };
        
        const descriptionElement = select.closest('.trigger-item').querySelector('.trigger-description small');
        const selectedValue = select.value;
        descriptionElement.textContent = descriptions[selectedValue] || 'Descrição do evento será exibida aqui';
    }

    updateTriggerOptions() {
        const flowType = document.getElementById('flowType').value;
        const triggerSelects = document.querySelectorAll('.trigger-event');
        
        const options = {
            'indicator_flow': [
                { value: 'indicator_joined', text: 'Indicador entra na campanha' },
                { value: 'reward_earned', text: 'Recompensa ganha' },
                { value: 'indicator_inactive', text: 'Indicador inativo' }
            ],
            'lead_flow': [
                { value: 'lead_indicated', text: 'Lead é indicado' },
                { value: 'lead_converted', text: 'Lead converte' }
            ],
            'mixed_flow': [
                { value: 'indicator_joined', text: 'Indicador entra na campanha' },
                { value: 'lead_indicated', text: 'Lead é indicado' },
                { value: 'reward_earned', text: 'Recompensa ganha' },
                { value: 'lead_converted', text: 'Lead converte' },
                { value: 'indicator_inactive', text: 'Indicador inativo' }
            ]
        };
        
        triggerSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '';
            options[flowType].forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                if (option.value === currentValue) {
                    optionElement.selected = true;
                }
                select.appendChild(optionElement);
            });
            this.updateTriggerDescription(select);
        });
    }

    setupEventListeners() {
        // Busca em tempo real
        const searchInput = document.getElementById('searchFlows');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterFlows(e.target.value);
            });
        }

        // Filtros por tipo
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="filterByType"]')) {
                const type = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.filterByType(type);
            }
        });
    }

    filterFlows(searchTerm) {
        const filteredFlows = this.flows.filter(flow => 
            flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            flow.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderFilteredFlows(filteredFlows);
    }

    filterByType(type) {
        if (type === 'all') {
            this.renderFlows();
            return;
        }
        
        const filteredFlows = this.flows.filter(flow => flow.type === type);
        this.renderFilteredFlows(filteredFlows);
    }

    renderFilteredFlows(flows) {
        const container = document.getElementById('flowsGrid');
        
        if (flows.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="bg-gray-800 rounded-xl p-8 max-w-md mx-auto">
                        <i class="fas fa-search text-6xl text-gray-500 mb-4"></i>
                        <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum fluxo encontrado</h3>
                        <p class="text-gray-400">Tente ajustar os filtros ou criar um novo fluxo</p>
                    </div>
                </div>
            `;
            return;
        }

        // Reutilizar lógica de renderização
        this.flows = flows;
        this.renderFlows();
        this.flows = this.flows; // Restaurar lista original
    }

    // Métodos de modal
    openCreateFlowModal() {
        document.getElementById('modalTitle').textContent = 'Novo Fluxo WhatsApp';
        document.getElementById('flowModal').classList.remove('hidden');
        this.resetForm();
    }

    closeFlowModal() {
        document.getElementById('flowModal').classList.add('hidden');
        this.resetForm();
    }

    resetForm() {
        document.getElementById('flowForm').reset();
        document.getElementById('triggersContainer').innerHTML = '';
        document.getElementById('messagesContainer').innerHTML = '';
        this.triggerCounter = 1;
        this.messageCounter = 1;
        this.initializeForm();
    }

    // Métodos de ação
    async saveFlow() {
        try {
            const formData = new FormData(document.getElementById('flowForm'));
            const flowData = {
                name: formData.get('name'),
                type: formData.get('type'),
                description: formData.get('description'),
                triggers: this.collectTriggers(),
                messages: this.collectMessages(),
                settings: {
                    maxMessagesPerDay: parseInt(formData.get('maxMessagesPerDay')),
                    startTime: formData.get('startTime'),
                    endTime: formData.get('endTime'),
                    timezone: formData.get('timezone')
                }
            };

            // Validação
            if (!flowData.name || !flowData.type) {
                this.showError('Preencha todos os campos obrigatórios');
                return;
            }

            if (flowData.triggers.length === 0) {
                this.showError('Adicione pelo menos um trigger');
                return;
            }

            if (flowData.messages.length === 0) {
                this.showError('Adicione pelo menos uma mensagem');
                return;
            }

            // Mock save - em produção seria uma chamada API
            const newFlow = {
                id: Date.now(),
                ...flowData,
                status: 'active',
                stats: { totalExecutions: 0, messagesSent: 0, successRate: 0 },
                createdAt: new Date().toISOString()
            };

            this.flows.push(newFlow);
            this.renderFlows();
            this.closeFlowModal();
            this.showSuccess('Fluxo criado com sucesso!');

        } catch (error) {
            console.error('Erro ao salvar fluxo:', error);
            this.showError('Erro ao salvar fluxo');
        }
    }

    collectTriggers() {
        const triggers = [];
        const triggerItems = document.querySelectorAll('.trigger-item');
        
        triggerItems.forEach(item => {
            const event = item.querySelector('.trigger-event').value;
            const delay = parseInt(item.querySelector('.trigger-delay').value);
            
            if (event) {
                triggers.push({ event, delay });
            }
        });
        
        return triggers;
    }

    collectMessages() {
        const messages = [];
        const messageItems = document.querySelectorAll('.message-item');
        
        messageItems.forEach((item, index) => {
            const templateId = item.querySelector('.message-template').value;
            const delay = parseInt(item.querySelector('.message-delay').value);
            const conditions = item.querySelector('.message-conditions').value;
            
            if (templateId) {
                messages.push({
                    order: index + 1,
                    templateId: parseInt(templateId),
                    delay,
                    conditions: conditions || null
                });
            }
        });
        
        return messages;
    }

    editFlow(flowId) {
        const flow = this.flows.find(f => f.id === flowId);
        if (!flow) return;

        this.currentFlow = flow;
        document.getElementById('modalTitle').textContent = 'Editar Fluxo WhatsApp';
        this.populateForm(flow);
        document.getElementById('flowModal').classList.remove('hidden');
    }

    populateForm(flow) {
        document.getElementById('flowName').value = flow.name;
        document.getElementById('flowType').value = flow.type;
        document.getElementById('flowDescription').value = flow.description;
        document.getElementById('flowMaxMessages').value = flow.settings.maxMessagesPerDay;
        document.getElementById('flowStartTime').value = flow.settings.startTime;
        document.getElementById('flowEndTime').value = flow.settings.endTime;
        document.getElementById('flowTimezone').value = flow.settings.timezone;

        // Limpar containers
        document.getElementById('triggersContainer').innerHTML = '';
        document.getElementById('messagesContainer').innerHTML = '';

        // Adicionar triggers
        flow.triggers.forEach(trigger => {
            this.addTrigger();
            const lastTrigger = document.querySelector('.trigger-item:last-child');
            lastTrigger.querySelector('.trigger-event').value = trigger.event;
            lastTrigger.querySelector('.trigger-delay').value = trigger.delay;
            this.updateTriggerDescription(lastTrigger.querySelector('.trigger-event'));
        });

        // Adicionar mensagens
        flow.messages.forEach(message => {
            this.addMessage();
            const lastMessage = document.querySelector('.message-item:last-child');
            lastMessage.querySelector('.message-template').value = message.templateId;
            lastMessage.querySelector('.message-delay').value = message.delay;
            if (message.conditions) {
                lastMessage.querySelector('.message-conditions').value = message.conditions;
            }
        });
    }

    previewFlow(flowId) {
        const flow = this.flows.find(f => f.id === flowId);
        if (!flow) return;

        this.renderFlowPreview(flow);
        document.getElementById('flowPreviewModal').classList.remove('hidden');
    }

    renderFlowPreview(flow) {
        const container = document.getElementById('flowPreviewContent');
        
        const previewHTML = `
            <div class="space-y-6">
                <div class="bg-gray-700 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-gray-100 mb-2">${flow.name}</h3>
                    <p class="text-gray-400 text-sm">${flow.description}</p>
                    <div class="flex items-center gap-2 mt-2">
                        <span class="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">${this.getFlowTypeText(flow.type)}</span>
                        <span class="px-2 py-1 ${flow.status === 'active' ? 'bg-green-500' : 'bg-gray-500'} text-white text-xs rounded-full">
                            ${flow.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>

                <div class="flow-timeline space-y-4">
                    ${flow.triggers.map(trigger => `
                        <div class="timeline-item bg-gray-700 rounded-lg p-4 border-l-4 border-yellow-500">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-medium text-gray-200">Trigger: ${this.getTriggerText(trigger.event)}</h4>
                                <span class="text-xs text-gray-400">Delay: ${trigger.delay}min</span>
                            </div>
                            <p class="text-gray-400 text-sm">${this.getTriggerDescription(trigger.event)}</p>
                        </div>
                    `).join('')}

                    ${flow.messages.map(message => `
                        <div class="timeline-item bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500 ml-4">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-medium text-gray-200">Mensagem ${message.order}</h4>
                                <span class="text-xs text-gray-400">Delay: ${message.delay}min</span>
                            </div>
                            <p class="text-gray-400 text-sm">Template: ${this.getTemplateName(message.templateId)}</p>
                            ${message.conditions ? `<p class="text-gray-500 text-xs mt-1">Condições: ${message.conditions}</p>` : ''}
                        </div>
                    `).join('')}
                </div>

                <div class="bg-gray-700 rounded-lg p-4">
                    <h4 class="font-medium text-gray-200 mb-2">Configurações</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-400">Máximo/dia:</span>
                            <span class="text-gray-200 ml-2">${flow.settings.maxMessagesPerDay}</span>
                        </div>
                        <div>
                            <span class="text-gray-400">Horário:</span>
                            <span class="text-gray-200 ml-2">${flow.settings.startTime} - ${flow.settings.endTime}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = previewHTML;
    }

    closeFlowPreviewModal() {
        document.getElementById('flowPreviewModal').classList.add('hidden');
    }

    async testFlow() {
        this.showInfo('Funcionalidade de teste será implementada na próxima fase');
    }

    async duplicateFlow(flowId) {
        const flow = this.flows.find(f => f.id === flowId);
        if (!flow) return;

        const duplicatedFlow = {
            ...flow,
            id: Date.now(),
            name: `${flow.name} (Cópia)`,
            status: 'inactive',
            stats: { totalExecutions: 0, messagesSent: 0, successRate: 0 },
            createdAt: new Date().toISOString()
        };

        this.flows.push(duplicatedFlow);
        this.renderFlows();
        this.showSuccess('Fluxo duplicado com sucesso!');
    }

    async toggleFlowStatus(flowId) {
        const flow = this.flows.find(f => f.id === flowId);
        if (!flow) return;

        flow.status = flow.status === 'active' ? 'inactive' : 'active';
        this.renderFlows();
        this.showSuccess(`Fluxo ${flow.status === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
    }

    async deleteFlow(flowId) {
        if (!confirm('Tem certeza que deseja excluir este fluxo?')) return;

        this.flows = this.flows.filter(f => f.id !== flowId);
        this.renderFlows();
        this.showSuccess('Fluxo excluído com sucesso!');
    }

    // Métodos auxiliares
    getFlowTypeText(type) {
        const types = {
            'indicator_flow': 'Indicadores',
            'lead_flow': 'Leads',
            'mixed_flow': 'Misto'
        };
        return types[type] || 'Desconhecido';
    }

    getTriggerText(event) {
        const events = {
            'indicator_joined': 'Indicador entra na campanha',
            'lead_indicated': 'Lead é indicado',
            'reward_earned': 'Recompensa ganha',
            'lead_converted': 'Lead converte',
            'indicator_inactive': 'Indicador inativo'
        };
        return events[event] || event;
    }

    getTriggerDescription(event) {
        const descriptions = {
            'indicator_joined': 'Dispara quando um novo indicador se registra na campanha',
            'lead_indicated': 'Dispara quando um lead é indicado por um indicador',
            'reward_earned': 'Dispara quando uma recompensa é ganha',
            'lead_converted': 'Dispara quando um lead completa uma conversão',
            'indicator_inactive': 'Dispara quando um indicador fica inativo por muito tempo'
        };
        return descriptions[event] || 'Descrição não disponível';
    }

    getTemplateName(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        return template ? template.name : 'Template não encontrado';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
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
function openCreateFlowModal() {
    if (window.whatsappFlows) {
        window.whatsappFlows.openCreateFlowModal();
    }
}

function closeFlowModal() {
    if (window.whatsappFlows) {
        window.whatsappFlows.closeFlowModal();
    }
}

function closeFlowPreviewModal() {
    if (window.whatsappFlows) {
        window.whatsappFlows.closeFlowPreviewModal();
    }
}

function saveFlow() {
    if (window.whatsappFlows) {
        window.whatsappFlows.saveFlow();
    }
}

function testFlow() {
    if (window.whatsappFlows) {
        window.whatsappFlows.testFlow();
    }
}

function addTrigger() {
    if (window.whatsappFlows) {
        window.whatsappFlows.addTrigger();
    }
}

function addMessage() {
    if (window.whatsappFlows) {
        window.whatsappFlows.addMessage();
    }
}

function removeTrigger(button) {
    if (window.whatsappFlows) {
        window.whatsappFlows.removeTrigger(button);
    }
}

function removeMessage(button) {
    if (window.whatsappFlows) {
        window.whatsappFlows.removeMessage(button);
    }
}

function updateTriggerDescription(select) {
    if (window.whatsappFlows) {
        window.whatsappFlows.updateTriggerDescription(select);
    }
}

function updateTriggerOptions() {
    if (window.whatsappFlows) {
        window.whatsappFlows.updateTriggerOptions();
    }
}

function filterByType(type) {
    if (window.whatsappFlows) {
        window.whatsappFlows.filterByType(type);
    }
}

// Função de logout (reutilizada do sistema existente)
function logout() {
    if (window.auth) {
        window.auth.logout();
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar carregamento dos módulos necessários
    if (typeof window.auth !== 'undefined' && typeof window.apiClient !== 'undefined') {
        window.whatsappFlows = new WhatsAppFlows();
    } else {
        // Tentar novamente após um delay
        setTimeout(() => {
            if (typeof window.auth !== 'undefined' && typeof window.apiClient !== 'undefined') {
                window.whatsappFlows = new WhatsAppFlows();
            } else {
                console.error('Módulos necessários não carregados');
            }
        }, 1000);
    }
}); 