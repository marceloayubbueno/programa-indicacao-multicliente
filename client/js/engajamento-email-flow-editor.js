/**
 * Engajamento Email Flow Editor.js
 * Gerencia o editor visual de fluxos condicionais de e-mail
 */

class EmailFlowEditor {
    constructor() {
        this.clientId = localStorage.getItem('clientId');
        this.token = localStorage.getItem('clientToken');
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.draggedNode = null;
        this.isConnecting = false;
        this.connectionStart = null;
        this.init();
    }

    init() {
        this.setupDragAndDrop();
        this.setupCanvasEvents();
        this.loadExistingFlow();
    }

    /**
     * Configura drag and drop da paleta para o canvas
     */
    setupDragAndDrop() {
        const paletteItems = document.querySelectorAll('.palette-item');
        const canvas = document.getElementById('flowCanvas');

        paletteItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: item.dataset.type,
                    trigger: item.dataset.trigger,
                    condition: item.dataset.condition,
                    action: item.dataset.action
                }));
            });
        });

        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvas.style.borderColor = '#3B82F6';
        });

        canvas.addEventListener('dragleave', (e) => {
            canvas.style.borderColor = '#4B5563';
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            canvas.style.borderColor = '#4B5563';
            
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.createNode(data, x, y);
        });
    }

    /**
     * Configura eventos do canvas
     */
    setupCanvasEvents() {
        const canvas = document.getElementById('flowCanvas');
        
        canvas.addEventListener('click', (e) => {
            if (e.target === canvas) {
                this.deselectAll();
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (this.isConnecting && this.connectionStart) {
                this.updateConnectionPreview(e);
            }
        });
    }

    /**
     * Cria um novo nó no canvas
     */
    createNode(data, x, y) {
        const nodeId = 'node_' + Date.now();
        const node = {
            id: nodeId,
            type: data.type,
            data: data,
            x: x,
            y: y,
            properties: this.getDefaultProperties(data)
        };

        this.nodes.push(node);
        this.renderNode(node);
        this.saveFlow();
    }

    /**
     * Renderiza um nó no canvas
     */
    renderNode(node) {
        const canvas = document.getElementById('flowCanvas');
        const nodeElement = document.createElement('div');
        nodeElement.className = `flow-node ${node.type}`;
        nodeElement.id = node.id;
        nodeElement.style.position = 'absolute';
        nodeElement.style.left = node.x + 'px';
        nodeElement.style.top = node.y + 'px';
        nodeElement.style.zIndex = '10';

        const nodeContent = this.getNodeContent(node);
        nodeElement.innerHTML = nodeContent;

        // Adicionar eventos ao nó
        nodeElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(node);
        });

        nodeElement.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Botão esquerdo
                this.startNodeDrag(node, e);
            }
        });

        // Adicionar pontos de conexão
        this.addConnectionPoints(nodeElement, node);

        canvas.appendChild(nodeElement);
    }

    /**
     * Gera o conteúdo HTML de um nó
     */
    getNodeContent(node) {
        const icons = {
            trigger: 'fas fa-bolt',
            condition: 'fas fa-question-circle',
            action: 'fas fa-cog'
        };

        const colors = {
            trigger: 'text-green-400',
            condition: 'text-purple-400',
            action: 'text-orange-400'
        };

        const titles = {
            new_indicator: 'Novo Indicador',
            email_opened: 'E-mail Aberto',
            link_clicked: 'Link Clicado',
            has_referrals: 'Tem Indicações',
            days_since_signup: 'Dias desde Cadastro',
            email_engagement: 'Engajamento',
            send_email: 'Enviar E-mail',
            add_to_list: 'Adicionar à Lista',
            wait: 'Aguardar'
        };

        const title = titles[node.data.trigger || node.data.condition || node.data.action] || 'Nó';

        return `
            <div class="flex items-center mb-2">
                <i class="${icons[node.type]} ${colors[node.type]} mr-2"></i>
                <span class="font-medium text-white">${title}</span>
            </div>
            <div class="text-xs text-gray-400">
                ${this.getNodeDescription(node)}
            </div>
            <div class="mt-2 flex justify-between">
                <button onclick="editNodeProperties('${node.id}')" class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">
                    <i class="fas fa-edit mr-1"></i>Editar
                </button>
                <button onclick="deleteNode('${node.id}')" class="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">
                    <i class="fas fa-trash mr-1"></i>Excluir
                </button>
            </div>
        `;
    }

    /**
     * Retorna a descrição de um nó
     */
    getNodeDescription(node) {
        const descriptions = {
            new_indicator: 'Dispara quando um novo indicador é criado',
            email_opened: 'Dispara quando um e-mail é aberto',
            link_clicked: 'Dispara quando um link é clicado',
            has_referrals: 'Verifica se o indicador tem indicações',
            days_since_signup: 'Compara dias desde o cadastro',
            email_engagement: 'Baseado no engajamento com e-mails',
            send_email: 'Envia um e-mail personalizado',
            add_to_list: 'Adiciona o indicador a uma lista',
            wait: 'Aguarda um tempo específico'
        };

        return descriptions[node.data.trigger || node.data.condition || node.data.action] || 'Nó do fluxo';
    }

    /**
     * Adiciona pontos de conexão ao nó
     */
    addConnectionPoints(nodeElement, node) {
        const connectionPoints = document.createElement('div');
        connectionPoints.className = 'connection-points';
        connectionPoints.style.position = 'absolute';
        connectionPoints.style.top = '-10px';
        connectionPoints.style.left = '50%';
        connectionPoints.style.transform = 'translateX(-50%)';

        // Ponto de entrada (exceto para triggers)
        if (node.type !== 'trigger') {
            const inputPoint = document.createElement('div');
            inputPoint.className = 'connection-point input';
            inputPoint.style.width = '20px';
            inputPoint.style.height = '20px';
            inputPoint.style.background = '#6B7280';
            inputPoint.style.borderRadius = '50%';
            inputPoint.style.cursor = 'pointer';
            inputPoint.style.border = '2px solid #374151';
            inputPoint.onclick = () => this.startConnection(node, 'input');
            connectionPoints.appendChild(inputPoint);
        }

        // Ponto de saída (exceto para ações finais)
        if (node.type !== 'action' || node.data.action === 'wait') {
            const outputPoint = document.createElement('div');
            outputPoint.className = 'connection-point output';
            outputPoint.style.width = '20px';
            outputPoint.style.height = '20px';
            outputPoint.style.background = '#10B981';
            outputPoint.style.borderRadius = '50%';
            outputPoint.style.cursor = 'pointer';
            outputPoint.style.border = '2px solid #374151';
            outputPoint.style.position = 'absolute';
            outputPoint.style.bottom = '-10px';
            outputPoint.style.left = '50%';
            outputPoint.style.transform = 'translateX(-50%)';
            outputPoint.onclick = () => this.startConnection(node, 'output');
            connectionPoints.appendChild(outputPoint);
        }

        nodeElement.appendChild(connectionPoints);
    }

    /**
     * Inicia uma conexão
     */
    startConnection(node, type) {
        this.isConnecting = true;
        this.connectionStart = { node, type };
        
        // Adicionar classe visual ao ponto de conexão
        const connectionPoint = event.target;
        connectionPoint.style.background = '#3B82F6';
        connectionPoint.style.borderColor = '#3B82F6';
    }

    /**
     * Atualiza preview da conexão
     */
    updateConnectionPreview(e) {
        // Implementar preview visual da conexão
        // Por simplicidade, vamos apenas mostrar um cursor diferente
        document.body.style.cursor = 'crosshair';
    }

    /**
     * Seleciona um nó
     */
    selectNode(node) {
        this.deselectAll();
        this.selectedNode = node;
        
        const nodeElement = document.getElementById(node.id);
        nodeElement.classList.add('selected');
        
        this.showProperties(node);
    }

    /**
     * Deseleciona todos os nós
     */
    deselectAll() {
        document.querySelectorAll('.flow-node').forEach(node => {
            node.classList.remove('selected');
        });
        this.selectedNode = null;
        this.hideProperties();
    }

    /**
     * Mostra painel de propriedades
     */
    showProperties(node) {
        const panel = document.getElementById('propertiesPanel');
        const content = document.getElementById('propertiesContent');
        
        content.innerHTML = this.getPropertiesHTML(node);
        panel.classList.remove('hidden');
    }

    /**
     * Esconde painel de propriedades
     */
    hideProperties() {
        const panel = document.getElementById('propertiesPanel');
        panel.classList.add('hidden');
    }

    /**
     * Gera HTML das propriedades
     */
    getPropertiesHTML(node) {
        const properties = node.properties;
        let html = `<h4 class="text-white font-medium mb-4">${this.getNodeContent(node).split('<')[0]}</h4>`;

        if (node.type === 'action' && node.data.action === 'send_email') {
            html += `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Template de E-mail</label>
                        <select class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                            <option value="">Selecione um template</option>
                            <option value="welcome">E-mail de Boas-vindas</option>
                            <option value="campaign">Campanha</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Assunto</label>
                        <input type="text" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" placeholder="Assunto do e-mail">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Aguardar antes de enviar</label>
                        <input type="number" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" placeholder="0" min="0">
                        <span class="text-xs text-gray-400">minutos</span>
                    </div>
                </div>
            `;
        } else if (node.type === 'condition') {
            html += `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Condição</label>
                        <select class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                            <option value="equals">Igual a</option>
                            <option value="greater">Maior que</option>
                            <option value="less">Menor que</option>
                            <option value="contains">Contém</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Valor</label>
                        <input type="text" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" placeholder="Valor para comparação">
                    </div>
                </div>
            `;
        } else if (node.type === 'action' && node.data.action === 'wait') {
            html += `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Tempo de espera</label>
                        <input type="number" class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" placeholder="5" min="1">
                        <span class="text-xs text-gray-400">minutos</span>
                    </div>
                </div>
            `;
        }

        return html;
    }

    /**
     * Retorna propriedades padrão para um tipo de nó
     */
    getDefaultProperties(data) {
        const defaults = {
            trigger: {},
            condition: {
                operator: 'equals',
                value: ''
            },
            action: {
                template: '',
                subject: '',
                delay: 0
            }
        };

        return defaults[data.type] || {};
    }

    /**
     * Inicia arrastar nó
     */
    startNodeDrag(node, e) {
        this.draggedNode = node;
        const nodeElement = document.getElementById(node.id);
        
        const moveHandler = (e) => {
            if (this.draggedNode) {
                const canvas = document.getElementById('flowCanvas');
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                nodeElement.style.left = x + 'px';
                nodeElement.style.top = y + 'px';
                
                this.draggedNode.x = x;
                this.draggedNode.y = y;
            }
        };

        const upHandler = () => {
            this.draggedNode = null;
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
            this.saveFlow();
        };

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
    }

    /**
     * Salva o fluxo
     */
    saveFlow() {
        const flowData = {
            nodes: this.nodes,
            connections: this.connections,
            clientId: this.clientId,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('emailFlow', JSON.stringify(flowData));
        console.log('Fluxo salvo:', flowData);
    }

    /**
     * Carrega fluxo existente
     */
    loadExistingFlow() {
        const savedFlow = localStorage.getItem('emailFlow');
        if (savedFlow) {
            const flowData = JSON.parse(savedFlow);
            this.nodes = flowData.nodes || [];
            this.connections = flowData.connections || [];
            
            this.nodes.forEach(node => {
                this.renderNode(node);
            });
            
            console.log('Fluxo carregado:', flowData);
        }
    }

    /**
     * Limpa o canvas
     */
    clearCanvas() {
        if (confirm('Tem certeza que deseja limpar todo o fluxo?')) {
            this.nodes = [];
            this.connections = [];
            document.getElementById('flowCanvas').innerHTML = `
                <div class="text-center text-gray-500 py-20">
                    <i class="fas fa-arrow-left text-4xl mb-4"></i>
                    <p class="text-lg">Arraste elementos da paleta para criar seu fluxo</p>
                    <p class="text-sm">Comece com um gatilho e conecte as ações</p>
                </div>
            `;
            this.saveFlow();
        }
    }

    /**
     * Carrega template de fluxo
     */
    loadTemplate() {
        const template = {
            nodes: [
                {
                    id: 'node_1',
                    type: 'trigger',
                    data: { trigger: 'new_indicator' },
                    x: 100,
                    y: 100,
                    properties: {}
                },
                {
                    id: 'node_2',
                    type: 'action',
                    data: { action: 'send_email' },
                    x: 400,
                    y: 100,
                    properties: { template: 'welcome', subject: 'Bem-vindo!', delay: 0 }
                }
            ],
            connections: [
                {
                    from: 'node_1',
                    to: 'node_2',
                    type: 'success'
                }
            ]
        };

        this.nodes = template.nodes;
        this.connections = template.connections;
        
        document.getElementById('flowCanvas').innerHTML = '';
        this.nodes.forEach(node => {
            this.renderNode(node);
        });
        
        this.saveFlow();
    }
}

// Funções globais
let flowEditor;

function saveFlow() {
    if (flowEditor) {
        flowEditor.saveFlow();
        alert('Fluxo salvo com sucesso!');
    }
}

function testFlow() {
    alert('Funcionalidade de teste será implementada na próxima fase!');
}

function clearCanvas() {
    if (flowEditor) {
        flowEditor.clearCanvas();
    }
}

function loadTemplate() {
    if (flowEditor) {
        flowEditor.loadTemplate();
    }
}

function editNodeProperties(nodeId) {
    const node = flowEditor.nodes.find(n => n.id === nodeId);
    if (node) {
        flowEditor.selectNode(node);
    }
}

function deleteNode(nodeId) {
    if (confirm('Tem certeza que deseja excluir este nó?')) {
        flowEditor.nodes = flowEditor.nodes.filter(n => n.id !== nodeId);
        flowEditor.connections = flowEditor.connections.filter(c => c.from !== nodeId && c.to !== nodeId);
        
        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
            nodeElement.remove();
        }
        
        flowEditor.saveFlow();
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (!localStorage.getItem('clientToken') || !localStorage.getItem('clientId')) {
        window.location.href = 'login.html';
        return;
    }

    // Inicializar editor
    flowEditor = new EmailFlowEditor();
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailFlowEditor;
} 