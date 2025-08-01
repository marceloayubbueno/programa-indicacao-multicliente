// Fluxos WhatsApp - Gestão de fluxos de mensagens
// Sistema multicliente - JWT Authentication

// Variáveis globais
let flows = [];
let templates = [];
let currentFlow = null;
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
        
    } catch (error) {
        console.error('Erro ao inicializar Fluxos:', error);
        showError('Erro ao carregar fluxos');
    }
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function getToken() {
    return localStorage.getItem('clientToken');
}

async function loadFlows() {
    try {
        // Mock data para desenvolvimento frontend
        flows = [
            {
                id: '1',
                name: 'Fluxo de Boas-vindas Indicadores',
                description: 'Fluxo para novos indicadores',
                targetAudience: 'indicators',
                messages: [
                    {
                        id: '1',
                        templateId: '1',
                        templateName: 'Boas-vindas',
                        trigger: 'indicator_joined',
                        delay: 0,
                        order: 1
                    },
                    {
                        id: '2',
                        templateId: '2',
                        templateName: 'Dicas de Indicação',
                        trigger: 'indicator_joined',
                        delay: 3600, // 1 hora
                        order: 2
                    }
                ],
                status: 'active',
                createdAt: '2024-01-15T10:00:00Z'
            },
            {
                id: '2',
                name: 'Fluxo de Conversão Leads',
                description: 'Fluxo para converter leads',
                targetAudience: 'leads',
                messages: [
                    {
                        id: '3',
                        templateId: '3',
                        templateName: 'Oferta Especial',
                        trigger: 'lead_indicated',
                        delay: 1800, // 30 minutos
                        order: 1
                    }
                ],
                status: 'active',
                createdAt: '2024-01-16T14:30:00Z'
            }
        ];
        
        renderFlows();
    } catch (error) {
        console.error('Erro ao carregar fluxos:', error);
        showError('Erro ao carregar fluxos');
    }
}

async function loadTemplates() {
    try {
        // Mock data para desenvolvimento frontend
        templates = [
            {
                id: '1',
                name: 'Boas-vindas',
                category: 'marketing',
                content: 'Olá {{name}}! Bem-vindo ao nosso programa de indicações!'
            },
            {
                id: '2',
                name: 'Dicas de Indicação',
                category: 'utility',
                content: 'Dica: Compartilhe seu link pessoal nas redes sociais!'
            },
            {
                id: '3',
                name: 'Oferta Especial',
                category: 'marketing',
                content: 'Oferta especial para você: {{discount}}% de desconto!'
            }
        ];
    } catch (error) {
        console.error('Erro ao carregar templates:', error);
        showError('Erro ao carregar templates');
    }
}

function setupEventListeners() {
    // Busca
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterFlows();
        });
    }

    // Filtros
    const audienceFilter = document.getElementById('filter-audience');
    const statusFilter = document.getElementById('filter-status');
    
    if (audienceFilter) {
        audienceFilter.addEventListener('change', filterFlows);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterFlows);
    }
}

function renderFlows() {
    const container = document.getElementById('flows-list');
    if (!container) return;

    if (flows.length === 0) {
        container.innerHTML = `
            <div class="p-6 text-center text-gray-400">
                <i class="fas fa-project-diagram text-6xl text-gray-500 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum fluxo criado</h3>
                <p class="text-gray-400 mb-6">Crie seu primeiro fluxo de mensagens WhatsApp</p>
                <button onclick="openCreateFlowModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                    <i class="fas fa-plus mr-2"></i>Criar Primeiro Fluxo
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-750 border-b border-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fluxo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Público-Alvo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mensagens</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Criado</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    ${flows.map(flow => `
                        <tr class="hover:bg-gray-750 transition-colors">
                            <td class="px-6 py-4">
                                <div class="text-sm font-medium text-gray-100">${flow.name}</div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs font-medium bg-blue-900 text-blue-300 rounded-full">
                                    ${getTargetAudienceText(flow.targetAudience)}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(flow.status)}">
                                    ${getStatusText(flow.status)}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-gray-400">${flow.messages.length}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-gray-400">${formatDate(flow.createdAt)}</span>
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex items-center space-x-2">
                                    <button onclick="editFlow('${flow.id}')" class="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteFlow('${flow.id}')" class="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" title="Excluir">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function getTargetAudienceText(audience) {
    switch(audience) {
        case 'indicators': return 'Indicadores';
        case 'leads': return 'Leads';
        case 'mixed': return 'Misto';
        default: return audience;
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'active': return 'bg-green-900 text-green-300';
        case 'inactive': return 'bg-gray-700 text-gray-300';
        default: return 'bg-gray-700 text-gray-300';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'active': return 'Ativo';
        case 'inactive': return 'Inativo';
        default: return status;
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function filterFlows() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const audienceFilter = document.getElementById('filter-audience')?.value || '';
    const statusFilter = document.getElementById('filter-status')?.value || '';
    
    const filteredFlows = flows.filter(flow => {
        const matchesSearch = flow.name.toLowerCase().includes(searchTerm) ||
                            flow.description.toLowerCase().includes(searchTerm);
        const matchesAudience = !audienceFilter || flow.targetAudience === audienceFilter;
        const matchesStatus = !statusFilter || flow.status === statusFilter;
        
        return matchesSearch && matchesAudience && matchesStatus;
    });
    
    renderFilteredFlows(filteredFlows);
}

function renderFilteredFlows(filteredFlows) {
    const container = document.getElementById('flows-list');
    if (!container) return;

    if (filteredFlows.length === 0) {
        container.innerHTML = `
            <div class="p-6 text-center text-gray-400">
                <i class="fas fa-search text-6xl text-gray-500 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum fluxo encontrado</h3>
                <p class="text-gray-400">Tente ajustar os filtros de busca</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-750 border-b border-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fluxo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Público-Alvo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mensagens</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Criado</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    ${filteredFlows.map(flow => `
                        <tr class="hover:bg-gray-750 transition-colors">
                            <td class="px-6 py-4">
                                <div class="text-sm font-medium text-gray-100">${flow.name}</div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs font-medium bg-blue-900 text-blue-300 rounded-full">
                                    ${getTargetAudienceText(flow.targetAudience)}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(flow.status)}">
                                    ${getStatusText(flow.status)}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-gray-400">${flow.messages.length}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-gray-400">${formatDate(flow.createdAt)}</span>
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex items-center space-x-2">
                                    <button onclick="editFlow('${flow.id}')" class="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteFlow('${flow.id}')" class="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" title="Excluir">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function openCreateFlowModal() {
    currentFlow = null;
    document.getElementById('modal-title').textContent = 'Novo Fluxo';
    document.getElementById('flow-modal').classList.remove('hidden');
    resetForm();
}

function closeFlowModal() {
    document.getElementById('flow-modal').classList.add('hidden');
    currentFlow = null;
    resetForm();
}

function resetForm() {
    document.getElementById('flow-form').reset();
    const container = document.getElementById('messages-container');
    if (container) {
        container.innerHTML = '';
    }
    messageCounter = 1;
}

function addMessage() {
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    // Verificar limite de 10 mensagens
    const currentMessages = container.children.length;
    if (currentMessages >= 10) {
        showError('Máximo de 10 mensagens por fluxo');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'bg-gray-700 rounded-lg p-4 border border-gray-600';
    messageDiv.id = `message-${messageCounter}`;
    
    messageDiv.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <h4 class="text-gray-200 font-medium">Mensagem ${messageCounter}</h4>
            <button type="button" onclick="removeMessage(${messageCounter})" class="text-red-400 hover:text-red-300">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
                <label class="block text-gray-300 text-sm font-medium mb-1">Template</label>
                <select name="templateId" required class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Selecione um template</option>
                    ${templates.map(template => `<option value="${template.id}">${template.name}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-gray-300 text-sm font-medium mb-1">Gatilho</label>
                <select name="trigger" required class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Selecione um gatilho</option>
                    <option value="indicator_joined">Indicador se juntou</option>
                    <option value="lead_indicated">Lead foi indicado</option>
                    <option value="lead_converted">Lead foi convertido</option>
                    <option value="reward_earned">Recompensa ganha</option>
                </select>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-gray-300 text-sm font-medium mb-1">Tipo de Envio</label>
                <select name="sendType" onchange="toggleSendOptions(${messageCounter})" class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="delay">Atraso após gatilho</option>
                    <option value="date">Data específica</option>
                </select>
            </div>
            <div id="sendOptions-${messageCounter}">
                <label class="block text-gray-300 text-sm font-medium mb-1">Atraso (segundos)</label>
                <input type="number" name="delay" value="0" min="0" class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    messageCounter++;
}

function removeMessage(messageId) {
    const messageDiv = document.getElementById(`message-${messageId}`);
    if (messageDiv) {
        messageDiv.remove();
    }
}

function toggleSendOptions(messageId) {
    const sendType = document.querySelector(`#message-${messageId} select[name="sendType"]`).value;
    const optionsDiv = document.getElementById(`sendOptions-${messageId}`);
    
    if (sendType === 'date') {
        optionsDiv.innerHTML = `
            <label class="block text-gray-300 text-sm font-medium mb-1">Data e Hora</label>
            <input type="datetime-local" name="scheduledDate" class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
        `;
    } else {
        optionsDiv.innerHTML = `
            <label class="block text-gray-300 text-sm font-medium mb-1">Atraso (segundos)</label>
            <input type="number" name="delay" value="0" min="0" class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
        `;
    }
}

function editFlow(flowId) {
    const flow = flows.find(f => f.id === flowId);
    if (!flow) return;
    
    currentFlow = flowId;
    document.getElementById('modal-title').textContent = 'Editar Fluxo';
    
    // Preencher formulário
    document.getElementById('flow-name').value = flow.name;
    document.getElementById('flow-audience').value = flow.targetAudience;
    document.getElementById('flow-description').value = flow.description || '';
    
    // Limpar e recriar mensagens
    const container = document.getElementById('messages-container');
    container.innerHTML = '';
    messageCounter = 1;
    
    flow.messages.forEach(message => {
        addMessage();
        const messageDiv = document.getElementById(`message-${messageCounter - 1}`);
        
        // Preencher dados da mensagem
        messageDiv.querySelector('select[name="templateId"]').value = message.templateId;
        messageDiv.querySelector('select[name="trigger"]').value = message.trigger;
        
        if (message.scheduledDate) {
            messageDiv.querySelector('select[name="sendType"]').value = 'date';
            toggleSendOptions(messageCounter - 1);
            messageDiv.querySelector('input[name="scheduledDate"]').value = new Date(message.scheduledDate).toISOString().slice(0, 16);
        } else {
            messageDiv.querySelector('input[name="delay"]').value = message.delay || 0;
        }
    });
    
    document.getElementById('flow-modal').classList.remove('hidden');
}

async function saveFlow() {
    try {
        const formData = {
            name: document.getElementById('flow-name').value,
            targetAudience: document.getElementById('flow-audience').value,
            description: document.getElementById('flow-description').value,
            messages: []
        };
        
        if (!formData.name || !formData.targetAudience) {
            showError('Preencha todos os campos obrigatórios');
            return;
        }
        
        // Coletar mensagens
        const messageDivs = document.querySelectorAll('[id^="message-"]');
        messageDivs.forEach((div, index) => {
            const templateId = div.querySelector('select[name="templateId"]').value;
            const trigger = div.querySelector('select[name="trigger"]').value;
            const sendType = div.querySelector('select[name="sendType"]').value;
            
            if (templateId && trigger) {
                const message = {
                    id: (index + 1).toString(),
                    templateId: templateId,
                    trigger: trigger,
                    order: index + 1
                };
                
                if (sendType === 'date') {
                    const scheduledDate = div.querySelector('input[name="scheduledDate"]').value;
                    if (scheduledDate) {
                        message.scheduledDate = new Date(scheduledDate).toISOString();
                    }
                } else {
                    const delay = div.querySelector('input[name="delay"]').value;
                    message.delay = parseInt(delay) || 0;
                }
                
                formData.messages.push(message);
            }
        });
        
        if (formData.messages.length === 0) {
            showError('Adicione pelo menos uma mensagem ao fluxo');
            return;
        }
        
        // Mock save - em produção seria uma chamada API
        if (currentFlow) {
            // Editar fluxo existente
            const index = flows.findIndex(f => f.id === currentFlow);
            if (index !== -1) {
                flows[index] = { ...flows[index], ...formData };
            }
        } else {
            // Criar novo fluxo
            const newFlow = {
                id: Date.now().toString(),
                ...formData,
                status: 'active',
                createdAt: new Date().toISOString()
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

function deleteFlow(flowId) {
    if (confirm('Tem certeza que deseja excluir este fluxo?')) {
        flows = flows.filter(f => f.id !== flowId);
        renderFlows();
        showSuccess('Fluxo excluído com sucesso!');
    }
}

function showSuccess(message) {
    // Implementar notificação de sucesso
    alert(message);
}

function showError(message) {
    // Implementar notificação de erro
    alert('Erro: ' + message);
} 