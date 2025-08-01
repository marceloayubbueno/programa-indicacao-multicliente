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
        
        // Inicializar formulário
        initializeForm();
        
    } catch (error) {
        console.error('Erro ao inicializar WhatsApp Flows:', error);
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
                status: 'draft',
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
    const searchInput = document.getElementById('searchFlows');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterFlows();
        });
    }
}

function initializeForm() {
    // Reset do formulário
    const form = document.getElementById('flowForm');
    if (form) {
        form.reset();
    }
    
    // Limpar containers
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
    }
    
    messageCounter = 1;
}

function renderFlows() {
    const grid = document.getElementById('flowsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    flows.forEach(flow => {
        const card = createFlowCard(flow);
        grid.appendChild(card);
    });
}

function createFlowCard(flow) {
    const card = document.createElement('div');
    card.className = 'bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors';
    
    const statusColor = flow.status === 'active' ? 'text-green-400' : 'text-yellow-400';
    const statusText = flow.status === 'active' ? 'Ativo' : 'Rascunho';
    
    card.innerHTML = `
        <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-100 mb-2">${flow.name}</h3>
                <p class="text-gray-400 text-sm mb-3">${flow.description}</p>
                <div class="flex items-center gap-4 text-sm">
                    <span class="text-blue-400">
                        <i class="fas fa-users mr-1"></i>${getTargetAudienceText(flow.targetAudience)}
                    </span>
                    <span class="${statusColor}">
                        <i class="fas fa-circle mr-1"></i>${statusText}
                    </span>
                    <span class="text-gray-500">
                        <i class="fas fa-comments mr-1"></i>${flow.messages.length} mensagens
                    </span>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="editFlow('${flow.id}')" class="text-blue-400 hover:text-blue-300 p-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteFlow('${flow.id}')" class="text-red-400 hover:text-red-300 p-2">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="flex justify-between items-center">
            <span class="text-gray-500 text-sm">
                Criado em ${new Date(flow.createdAt).toLocaleDateString('pt-BR')}
            </span>
            <button onclick="toggleFlowStatus('${flow.id}')" 
                    class="px-3 py-1 rounded-lg text-sm transition-colors ${flow.status === 'active' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}">
                ${flow.status === 'active' ? 'Desativar' : 'Ativar'}
            </button>
        </div>
    `;
    
    return card;
}

function getTargetAudienceText(audience) {
    switch(audience) {
        case 'indicators': return 'Indicadores';
        case 'leads': return 'Leads';
        case 'mixed': return 'Misto';
        default: return audience;
    }
}

function filterFlows() {
    const searchTerm = document.getElementById('searchFlows').value.toLowerCase();
    const filteredFlows = flows.filter(flow => 
        flow.name.toLowerCase().includes(searchTerm) ||
        flow.description.toLowerCase().includes(searchTerm)
    );
    
    renderFilteredFlows(filteredFlows);
}

function filterByType(type) {
    let filteredFlows = flows;
    
    if (type !== 'all') {
        filteredFlows = flows.filter(flow => flow.targetAudience === type);
    }
    
    renderFilteredFlows(filteredFlows);
}

function renderFilteredFlows(filteredFlows) {
    const grid = document.getElementById('flowsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    filteredFlows.forEach(flow => {
        const card = createFlowCard(flow);
        grid.appendChild(card);
    });
}

function openCreateFlowModal() {
    currentFlow = null;
    document.getElementById('modalTitle').textContent = 'Novo Fluxo WhatsApp';
    document.getElementById('flowModal').classList.remove('hidden');
    initializeForm();
}

function closeFlowModal() {
    document.getElementById('flowModal').classList.add('hidden');
    currentFlow = null;
    initializeForm();
}

function addMessage() {
    const container = document.getElementById('messagesContainer');
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

function updateTriggerOptions() {
    const targetAudience = document.getElementById('flowTargetAudience').value;
    const messageDivs = document.querySelectorAll('[id^="message-"]');
    
    messageDivs.forEach(div => {
        const triggerSelect = div.querySelector('select[name="trigger"]');
        if (triggerSelect) {
            triggerSelect.innerHTML = '<option value="">Selecione um gatilho</option>';
            
            if (targetAudience === 'indicators' || targetAudience === 'mixed') {
                triggerSelect.innerHTML += '<option value="indicator_joined">Indicador se juntou</option>';
                triggerSelect.innerHTML += '<option value="reward_earned">Recompensa ganha</option>';
            }
            
            if (targetAudience === 'leads' || targetAudience === 'mixed') {
                triggerSelect.innerHTML += '<option value="lead_indicated">Lead foi indicado</option>';
                triggerSelect.innerHTML += '<option value="lead_converted">Lead foi convertido</option>';
            }
        }
    });
}

async function saveFlow() {
    try {
        const formData = new FormData(document.getElementById('flowForm'));
        const flowData = {
            name: formData.get('name'),
            description: formData.get('description'),
            targetAudience: formData.get('targetAudience'),
            messages: []
        };
        
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
                
                flowData.messages.push(message);
            }
        });
        
        if (flowData.messages.length === 0) {
            showError('Adicione pelo menos uma mensagem ao fluxo');
            return;
        }
        
        // Mock save - em produção seria uma chamada API
        if (currentFlow) {
            // Editar fluxo existente
            const index = flows.findIndex(f => f.id === currentFlow);
            if (index !== -1) {
                flows[index] = { ...flows[index], ...flowData };
            }
        } else {
            // Criar novo fluxo
            const newFlow = {
                id: Date.now().toString(),
                ...flowData,
                status: 'draft',
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

function editFlow(flowId) {
    const flow = flows.find(f => f.id === flowId);
    if (!flow) return;
    
    currentFlow = flowId;
    document.getElementById('modalTitle').textContent = 'Editar Fluxo WhatsApp';
    
    // Preencher formulário
    document.getElementById('flowName').value = flow.name;
    document.getElementById('flowDescription').value = flow.description;
    document.getElementById('flowTargetAudience').value = flow.targetAudience;
    
    // Limpar e recriar mensagens
    const container = document.getElementById('messagesContainer');
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
    
    document.getElementById('flowModal').classList.remove('hidden');
}

function deleteFlow(flowId) {
    if (confirm('Tem certeza que deseja excluir este fluxo?')) {
        flows = flows.filter(f => f.id !== flowId);
        renderFlows();
        showSuccess('Fluxo excluído com sucesso!');
    }
}

function toggleFlowStatus(flowId) {
    const flow = flows.find(f => f.id === flowId);
    if (flow) {
        flow.status = flow.status === 'active' ? 'draft' : 'active';
        renderFlows();
        showSuccess(`Fluxo ${flow.status === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
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