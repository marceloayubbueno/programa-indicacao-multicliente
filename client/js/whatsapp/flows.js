// Fluxos WhatsApp - Gestão de fluxos de mensagens
// Sistema multicliente - JWT Authentication

// Variáveis globais
let flows = [];
let templates = [];
let currentFlow = null;
let triggerCounter = 1;
let messageCounter = 1;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    await initWhatsAppFlows();
});

async function initWhatsAppFlows() {
    try {
        // Verificar autenticação
        if (!checkAuth()) {
            return;
        }

        // Carregar dados iniciais
        await loadFlows();
        await loadTemplates();
        
        // Configurar eventos
        setupEventListeners();
        
        // Inicializar formulário
        initializeForm();
        
    } catch (error) {
        console.error('Erro ao inicializar WhatsApp Flows:', error);
        showError('Erro ao carregar fluxos');
    }
}

async function loadFlows() {
    try {
        const token = getToken();
        if (!token) {
            console.error('Token não encontrado');
            return;
        }

        // Mock data para desenvolvimento frontend
        flows = [
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

        renderFlows();

    } catch (error) {
        console.error('Erro ao carregar fluxos:', error);
    }
}

async function loadTemplates() {
    try {
        const token = getToken();
        if (!token) {
            console.error('Token não encontrado');
            return;
        }

        // Mock data para desenvolvimento frontend
        templates = [
            { id: 1, name: 'Boas-vindas Indicador', status: 'approved' },
            { id: 2, name: 'Dicas de Indicação', status: 'approved' },
            { id: 3, name: 'Parabéns Lead', status: 'approved' },
            { id: 4, name: 'Lembrete Benefícios', status: 'approved' }
        ];

    } catch (error) {
        console.error('Erro ao carregar templates:', error);
    }
}

function renderFlows() {
    const container = document.getElementById('flowsGrid');
    
    if (flows.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="bg-gray-800 rounded-xl p-8 max-w-md mx-auto">
                    <i class="fas fa-project-diagram text-6xl text-gray-500 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum fluxo criado</h3>
                    <p class="text-gray-400 mb-6">Crie seu primeiro fluxo de mensagens WhatsApp</p>
                    <button onclick="openCreateFlowModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                        <i class="fas fa-plus mr-2"></i>Criar Primeiro Fluxo
                    </button>
                </div>
            </div>
        `;
        return;
    }

    const flowsHTML = flows.map(flow => `
        <div class="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                        <h3 class="text-lg font-semibold text-gray-100">${flow.name}</h3>
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(flow.status)}">
                            ${getStatusText(flow.status)}
                        </span>
                        <span class="px-2 py-1 text-xs font-medium bg-blue-900 text-blue-300 rounded-full">
                            ${getFlowTypeText(flow.type)}
                        </span>
                    </div>
                    <p class="text-gray-400 mb-3">${flow.description}</p>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                        <div>
                            <span class="font-medium">Triggers:</span>
                            <span class="ml-1">${flow.triggers.length}</span>
                        </div>
                        <div>
                            <span class="font-medium">Mensagens:</span>
                            <span class="ml-1">${flow.messages.length}</span>
                        </div>
                        <div>
                            <span class="font-medium">Execuções:</span>
                            <span class="ml-1">${flow.stats.totalExecutions}</span>
                        </div>
                        <div>
                            <span class="font-medium">Taxa de Sucesso:</span>
                            <span class="ml-1">${flow.stats.successRate}%</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4 text-xs text-gray-500">
                        <span><i class="fas fa-calendar mr-1"></i>${formatDate(flow.createdAt)}</span>
                        <span><i class="fas fa-clock mr-1"></i>${flow.settings.startTime} - ${flow.settings.endTime}</span>
                    </div>
                </div>
                
                <div class="flex items-center space-x-2">
                    <button onclick="editFlow('${flow.id}')" class="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="toggleFlowStatus('${flow.id}')" class="p-2 ${flow.status === 'active' ? 'text-yellow-400 hover:bg-yellow-900/20' : 'text-green-400 hover:bg-green-900/20'} rounded-lg transition-colors">
                        <i class="fas fa-${flow.status === 'active' ? 'pause' : 'play'}"></i>
                    </button>
                    <button onclick="deleteFlow('${flow.id}')" class="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = flowsHTML;
}

function initializeForm() {
    // Resetar contadores
    triggerCounter = 1;
    messageCounter = 1;
    
    // Limpar formulário
    resetForm();
    
    // Adicionar primeiro trigger e mensagem
    addTrigger();
    addMessage();
}

function addTrigger() {
    const container = document.getElementById('triggersContainer');
    const triggerHTML = `
        <div class="trigger-item bg-gray-700 rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-medium text-gray-200">Trigger ${triggerCounter}</h4>
                <button type="button" onclick="removeTrigger(this)" class="text-red-400 hover:text-red-300">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-300 text-sm font-medium mb-2">Evento</label>
                    <select class="trigger-event w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" onchange="updateTriggerDescription(this)">
                        <option value="">Selecione um evento</option>
                        <option value="indicator_joined">Indicador entra na campanha</option>
                        <option value="lead_indicated">Lead é indicado</option>
                        <option value="lead_converted">Lead converte</option>
                        <option value="reward_earned">Recompensa ganha</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-300 text-sm font-medium mb-2">Delay (minutos)</label>
                    <input type="number" min="0" value="0" class="trigger-delay w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            <div class="mt-3">
                <p class="text-sm text-gray-400 trigger-description">Selecione um evento para ver a descrição</p>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', triggerHTML);
    triggerCounter++;
}

function addMessage() {
    const container = document.getElementById('messagesContainer');
    const messageHTML = `
        <div class="message-item bg-gray-700 rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-medium text-gray-200">Mensagem ${messageCounter}</h4>
                <button type="button" onclick="removeMessage(this)" class="text-red-400 hover:text-red-300">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-gray-300 text-sm font-medium mb-2">Template</label>
                    <select class="message-template w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecione um template</option>
                        ${templates.map(template => `
                            <option value="${template.id}">${template.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-gray-300 text-sm font-medium mb-2">Delay (minutos)</label>
                    <input type="number" min="0" value="0" class="message-delay w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-gray-300 text-sm font-medium mb-2">Ordem</label>
                    <input type="number" min="1" value="${messageCounter}" class="message-order w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', messageHTML);
    messageCounter++;
}

function removeTrigger(button) {
    button.closest('.trigger-item').remove();
}

function removeMessage(button) {
    button.closest('.message-item').remove();
}

function updateTriggerDescription(select) {
    const descriptionElement = select.closest('.trigger-item').querySelector('.trigger-description');
    const event = select.value;
    descriptionElement.textContent = getTriggerDescription(event);
}

function updateTriggerOptions() {
    // Atualizar opções de triggers baseado no tipo de fluxo
    const flowType = document.getElementById('flowType').value;
    const triggerEvents = document.querySelectorAll('.trigger-event');
    
    triggerEvents.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Selecione um evento</option>';
        
        if (flowType === 'indicator_flow') {
            select.innerHTML += `
                <option value="indicator_joined">Indicador entra na campanha</option>
                <option value="reward_earned">Recompensa ganha</option>
            `;
        } else if (flowType === 'lead_flow') {
            select.innerHTML += `
                <option value="lead_indicated">Lead é indicado</option>
                <option value="lead_converted">Lead converte</option>
            `;
        } else {
            select.innerHTML += `
                <option value="indicator_joined">Indicador entra na campanha</option>
                <option value="lead_indicated">Lead é indicado</option>
                <option value="lead_converted">Lead converte</option>
                <option value="reward_earned">Recompensa ganha</option>
            `;
        }
        
        select.value = currentValue;
        updateTriggerDescription(select);
    });
}

function setupEventListeners() {
    // Busca
    const searchInput = document.getElementById('searchFlows');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterFlows(e.target.value);
        });
    }
    
    // Mudança de tipo de fluxo
    const flowTypeSelect = document.getElementById('flowType');
    if (flowTypeSelect) {
        flowTypeSelect.addEventListener('change', updateTriggerOptions);
    }
}

function filterFlows(searchTerm) {
    const filtered = flows.filter(flow => 
        flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flow.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    renderFilteredFlows(filtered);
}

function filterByType(type) {
    const filtered = type === 'all' 
        ? flows 
        : flows.filter(flow => flow.type === type);
    renderFilteredFlows(filtered);
}

function renderFilteredFlows(filteredFlows) {
    const container = document.getElementById('flowsGrid');
    
    if (filteredFlows.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="bg-gray-800 rounded-xl p-8 max-w-md mx-auto">
                    <i class="fas fa-search text-6xl text-gray-500 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum fluxo encontrado</h3>
                    <p class="text-gray-400">Tente ajustar os filtros de busca</p>
                </div>
            </div>
        `;
        return;
    }

    const flowsHTML = filteredFlows.map(flow => `
        <div class="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                        <h3 class="text-lg font-semibold text-gray-100">${flow.name}</h3>
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(flow.status)}">
                            ${getStatusText(flow.status)}
                        </span>
                        <span class="px-2 py-1 text-xs font-medium bg-blue-900 text-blue-300 rounded-full">
                            ${getFlowTypeText(flow.type)}
                        </span>
                    </div>
                    <p class="text-gray-400 mb-3">${flow.description}</p>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                        <div>
                            <span class="font-medium">Triggers:</span>
                            <span class="ml-1">${flow.triggers.length}</span>
                        </div>
                        <div>
                            <span class="font-medium">Mensagens:</span>
                            <span class="ml-1">${flow.messages.length}</span>
                        </div>
                        <div>
                            <span class="font-medium">Execuções:</span>
                            <span class="ml-1">${flow.stats.totalExecutions}</span>
                        </div>
                        <div>
                            <span class="font-medium">Taxa de Sucesso:</span>
                            <span class="ml-1">${flow.stats.successRate}%</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4 text-xs text-gray-500">
                        <span><i class="fas fa-calendar mr-1"></i>${formatDate(flow.createdAt)}</span>
                        <span><i class="fas fa-clock mr-1"></i>${flow.settings.startTime} - ${flow.settings.endTime}</span>
                    </div>
                </div>
                
                <div class="flex items-center space-x-2">
                    <button onclick="editFlow('${flow.id}')" class="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="toggleFlowStatus('${flow.id}')" class="p-2 ${flow.status === 'active' ? 'text-yellow-400 hover:bg-yellow-900/20' : 'text-green-400 hover:bg-green-900/20'} rounded-lg transition-colors">
                        <i class="fas fa-${flow.status === 'active' ? 'pause' : 'play'}"></i>
                    </button>
                    <button onclick="deleteFlow('${flow.id}')" class="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = flowsHTML;
}

function openCreateFlowModal() {
    currentFlow = null;
    resetForm();
    document.getElementById('flowModal').classList.remove('hidden');
}

function closeFlowModal() {
    document.getElementById('flowModal').classList.add('hidden');
    resetForm();
}

function resetForm() {
    document.getElementById('flowForm').reset();
    currentFlow = null;
    
    // Limpar containers
    document.getElementById('triggersContainer').innerHTML = '';
    document.getElementById('messagesContainer').innerHTML = '';
    
    // Resetar contadores
    triggerCounter = 1;
    messageCounter = 1;
    
    // Adicionar primeiro trigger e mensagem
    addTrigger();
    addMessage();
}

async function saveFlow() {
    try {
        const token = getToken();
        if (!token) {
            showError('Token não encontrado');
            return;
        }

        const formData = new FormData(document.getElementById('flowForm'));
        const flowData = {
            name: formData.get('name'),
            type: formData.get('type'),
            description: formData.get('description'),
            triggers: collectTriggers(),
            messages: collectMessages(),
            settings: {
                maxMessagesPerDay: parseInt(formData.get('maxMessagesPerDay')),
                startTime: formData.get('startTime'),
                endTime: formData.get('endTime'),
                timezone: formData.get('timezone')
            }
        };

        // Validações
        if (!flowData.name || !flowData.type) {
            showError('Nome e tipo são obrigatórios');
            return;
        }

        if (flowData.triggers.length === 0) {
            showError('Adicione pelo menos um trigger');
            return;
        }

        if (flowData.messages.length === 0) {
            showError('Adicione pelo menos uma mensagem');
            return;
        }

        // Mock - em produção seria uma chamada para a API
        if (currentFlow) {
            // Editar fluxo existente
            const index = flows.findIndex(f => f.id === currentFlow.id);
            if (index !== -1) {
                flows[index] = { ...flows[index], ...flowData, updatedAt: new Date().toISOString() };
            }
        } else {
            // Criar novo fluxo
            const newFlow = {
                id: Date.now(),
                ...flowData,
                status: 'draft',
                stats: {
                    totalExecutions: 0,
                    messagesSent: 0,
                    successRate: 0
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            flows.push(newFlow);
        }

        renderFlows();
        closeFlowModal();
        showSuccess(currentFlow ? 'Fluxo atualizado com sucesso!' : 'Fluxo criado com sucesso!');

    } catch (error) {
        console.error('Erro ao salvar fluxo:', error);
        showError('Erro ao salvar fluxo');
    }
}

function collectTriggers() {
    const triggers = [];
    const triggerItems = document.querySelectorAll('.trigger-item');
    
    triggerItems.forEach(item => {
        const event = item.querySelector('.trigger-event').value;
        const delay = parseInt(item.querySelector('.trigger-delay').value) || 0;
        
        if (event) {
            triggers.push({
                event,
                delay,
                description: getTriggerDescription(event)
            });
        }
    });
    
    return triggers;
}

function collectMessages() {
    const messages = [];
    const messageItems = document.querySelectorAll('.message-item');
    
    messageItems.forEach((item, index) => {
        const templateId = item.querySelector('.message-template').value;
        const delay = parseInt(item.querySelector('.message-delay').value) || 0;
        const order = parseInt(item.querySelector('.message-order').value) || (index + 1);
        
        if (templateId) {
            const template = templates.find(t => t.id == templateId);
            messages.push({
                order,
                templateId: parseInt(templateId),
                delay,
                templateName: template ? template.name : 'Template não encontrado'
            });
        }
    });
    
    return messages.sort((a, b) => a.order - b.order);
}

function editFlow(flowId) {
    const flow = flows.find(f => f.id == flowId);
    if (!flow) {
        showError('Fluxo não encontrado');
        return;
    }

    currentFlow = flow;
    populateForm(flow);
    document.getElementById('flowModal').classList.remove('hidden');
}

function populateForm(flow) {
    document.getElementById('flowName').value = flow.name;
    document.getElementById('flowType').value = flow.type;
    document.getElementById('flowDescription').value = flow.description;
    document.getElementById('maxMessagesPerDay').value = flow.settings.maxMessagesPerDay;
    document.getElementById('startTime').value = flow.settings.startTime;
    document.getElementById('endTime').value = flow.settings.endTime;
    document.getElementById('timezone').value = flow.settings.timezone;
    
    // Limpar containers
    document.getElementById('triggersContainer').innerHTML = '';
    document.getElementById('messagesContainer').innerHTML = '';
    
    // Resetar contadores
    triggerCounter = 1;
    messageCounter = 1;
    
    // Adicionar triggers
    flow.triggers.forEach(trigger => {
        addTrigger();
        const lastTrigger = document.querySelector('.trigger-item:last-child');
        lastTrigger.querySelector('.trigger-event').value = trigger.event;
        lastTrigger.querySelector('.trigger-delay').value = trigger.delay;
        updateTriggerDescription(lastTrigger.querySelector('.trigger-event'));
    });
    
    // Adicionar mensagens
    flow.messages.forEach(message => {
        addMessage();
        const lastMessage = document.querySelector('.message-item:last-child');
        lastMessage.querySelector('.message-template').value = message.templateId;
        lastMessage.querySelector('.message-delay').value = message.delay;
        lastMessage.querySelector('.message-order').value = message.order;
    });
    
    // Atualizar opções de triggers
    updateTriggerOptions();
}

function previewFlow(flowId) {
    const flow = flows.find(f => f.id == flowId);
    if (!flow) {
        showError('Fluxo não encontrado');
        return;
    }

    renderFlowPreview(flow);
    document.getElementById('flowPreviewModal').classList.remove('hidden');
}

function renderFlowPreview(flow) {
    const container = document.getElementById('flowPreviewContent');
    
    container.innerHTML = `
        <div class="bg-gray-800 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-100">${flow.name}</h3>
                <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(flow.status)}">
                    ${getStatusText(flow.status)}
                </span>
            </div>
            
            <p class="text-gray-400 mb-6">${flow.description}</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="text-md font-semibold text-gray-200 mb-3">Triggers</h4>
                    <div class="space-y-2">
                        ${flow.triggers.map(trigger => `
                            <div class="bg-gray-700 rounded-lg p-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-gray-200">${getTriggerText(trigger.event)}</span>
                                    <span class="text-xs text-gray-400">${trigger.delay}min</span>
                                </div>
                                <p class="text-xs text-gray-400 mt-1">${trigger.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <h4 class="text-md font-semibold text-gray-200 mb-3">Mensagens</h4>
                    <div class="space-y-2">
                        ${flow.messages.map(message => `
                            <div class="bg-gray-700 rounded-lg p-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-gray-200">${message.templateName}</span>
                                    <span class="text-xs text-gray-400">Ordem: ${message.order}</span>
                                </div>
                                <p class="text-xs text-gray-400 mt-1">Delay: ${message.delay} minutos</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="mt-6 pt-4 border-t border-gray-700">
                <h4 class="text-md font-semibold text-gray-200 mb-3">Configurações</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-400">Limite diário:</span>
                        <span class="text-gray-200 ml-2">${flow.settings.maxMessagesPerDay} mensagens</span>
                    </div>
                    <div>
                        <span class="text-gray-400">Horário:</span>
                        <span class="text-gray-200 ml-2">${flow.settings.startTime} - ${flow.settings.endTime}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function closeFlowPreviewModal() {
    document.getElementById('flowPreviewModal').classList.add('hidden');
}

async function testFlow() {
    showInfo('Funcionalidade de teste será implementada em breve');
}

async function duplicateFlow(flowId) {
    try {
        const flow = flows.find(f => f.id == flowId);
        if (!flow) {
            showError('Fluxo não encontrado');
            return;
        }

        const duplicatedFlow = {
            ...flow,
            id: Date.now(),
            name: `${flow.name} (Cópia)`,
            status: 'draft',
            stats: {
                totalExecutions: 0,
                messagesSent: 0,
                successRate: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        flows.push(duplicatedFlow);
        renderFlows();
        showSuccess('Fluxo duplicado com sucesso!');

    } catch (error) {
        console.error('Erro ao duplicar fluxo:', error);
        showError('Erro ao duplicar fluxo');
    }
}

async function toggleFlowStatus(flowId) {
    try {
        const flow = flows.find(f => f.id == flowId);
        if (!flow) {
            showError('Fluxo não encontrado');
            return;
        }

        flow.status = flow.status === 'active' ? 'paused' : 'active';
        flow.updatedAt = new Date().toISOString();
        
        renderFlows();
        showSuccess(`Fluxo ${flow.status === 'active' ? 'ativado' : 'pausado'} com sucesso!`);

    } catch (error) {
        console.error('Erro ao alterar status do fluxo:', error);
        showError('Erro ao alterar status do fluxo');
    }
}

async function deleteFlow(flowId) {
    if (!confirm('Tem certeza que deseja excluir este fluxo?')) {
        return;
    }

    try {
        flows = flows.filter(f => f.id != flowId);
        renderFlows();
        showSuccess('Fluxo excluído com sucesso!');

    } catch (error) {
        console.error('Erro ao excluir fluxo:', error);
        showError('Erro ao excluir fluxo');
    }
}

function getFlowTypeText(type) {
    const types = {
        'indicator_flow': 'Indicadores',
        'lead_flow': 'Leads',
        'mixed_flow': 'Misto'
    };
    return types[type] || type;
}

function getTriggerText(event) {
    const events = {
        'indicator_joined': 'Indicador entra na campanha',
        'lead_indicated': 'Lead é indicado',
        'lead_converted': 'Lead converte',
        'reward_earned': 'Recompensa ganha'
    };
    return events[event] || event;
}

function getTriggerDescription(event) {
    const descriptions = {
        'indicator_joined': 'Dispara quando um novo indicador se cadastra na campanha',
        'lead_indicated': 'Dispara quando um lead é indicado por um indicador',
        'lead_converted': 'Dispara quando um lead completa uma ação (compra, cadastro, etc.)',
        'reward_earned': 'Dispara quando um indicador ganha uma recompensa'
    };
    return descriptions[event] || 'Selecione um evento para ver a descrição';
}

function getTemplateName(templateId) {
    const template = templates.find(t => t.id == templateId);
    return template ? template.name : 'Template não encontrado';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function getStatusText(status) {
    const statuses = {
        'draft': 'Rascunho',
        'active': 'Ativo',
        'paused': 'Pausado',
        'archived': 'Arquivado'
    };
    return statuses[status] || status;
}

function getStatusColor(status) {
    const colors = {
        'draft': 'bg-gray-700 text-gray-300',
        'active': 'bg-green-900 text-green-300',
        'paused': 'bg-yellow-900 text-yellow-300',
        'archived': 'bg-red-900 text-red-300'
    };
    return colors[status] || 'bg-gray-700 text-gray-300';
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showInfo(message) {
    showNotification(message, 'info');
}

function showNotification(message, type = 'info') {
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
    
    const colors = {
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
        info: 'bg-blue-600 text-white'
    };
    
    notification.className += ` ${colors[type]}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Funções globais para compatibilidade com HTML
window.openCreateFlowModal = openCreateFlowModal;
window.closeFlowModal = closeFlowModal;
window.closeFlowPreviewModal = closeFlowPreviewModal;
window.saveFlow = saveFlow;
window.testFlow = testFlow;
window.addTrigger = addTrigger;
window.addMessage = addMessage;
window.removeTrigger = removeTrigger;
window.removeMessage = removeMessage;
window.updateTriggerDescription = updateTriggerDescription;
window.updateTriggerOptions = updateTriggerOptions;
window.filterByType = filterByType; 