// Templates WhatsApp - Gestão de templates de mensagens
// Sistema multicliente - UX otimizada

class WhatsAppTemplates {
    constructor() {
        this.clientId = null;
        this.templates = [];
        this.currentTemplate = null;
        this.categories = ['marketing', 'utility', 'authentication'];
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
            await this.loadTemplates();
            
            // Configurar eventos
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Erro ao inicializar WhatsApp Templates:', error);
            this.showError('Erro ao carregar templates');
        }
    }

    async loadTemplates() {
        try {
            // Mock data para desenvolvimento frontend
            this.templates = [
                {
                    id: 1,
                    name: 'Boas-vindas Indicador',
                    category: 'marketing',
                    language: 'pt_BR',
                    status: 'approved',
                    content: 'Olá {{1}}, bem-vindo ao nosso programa de indicação! 🎉\n\nVocê pode ganhar recompensas indicando amigos. Quer saber como?',
                    variables: ['nome'],
                    mediaType: null,
                    mediaUrl: null,
                    createdAt: '2024-01-15T10:30:00Z',
                    updatedAt: '2024-01-15T10:30:00Z'
                },
                {
                    id: 2,
                    name: 'Dicas de Indicação',
                    category: 'utility',
                    language: 'pt_BR',
                    status: 'pending',
                    content: '💡 Dica do dia: Compartilhe seu link pessoal nas redes sociais!\n\nSeu link: {{1}}\n\nIndicações hoje: {{2}}',
                    variables: ['link_pessoal', 'indicacoes_hoje'],
                    mediaType: null,
                    mediaUrl: null,
                    createdAt: '2024-01-14T15:45:00Z',
                    updatedAt: '2024-01-14T15:45:00Z'
                },
                {
                    id: 3,
                    name: 'Parabéns Lead',
                    category: 'marketing',
                    language: 'pt_BR',
                    status: 'approved',
                    content: 'Parabéns {{1}}! 🎊\n\nVocê foi indicado por {{2}} e pode ganhar um bônus especial!\n\nAcesse: {{3}}',
                    variables: ['nome_lead', 'nome_indicador', 'link_bonus'],
                    mediaType: 'image',
                    mediaUrl: 'https://example.com/bonus-image.jpg',
                    createdAt: '2024-01-13T09:20:00Z',
                    updatedAt: '2024-01-13T09:20:00Z'
                }
            ];

            this.renderTemplates();

        } catch (error) {
            console.error('Erro ao carregar templates:', error);
        }
    }

    renderTemplates() {
        const container = document.getElementById('templatesGrid');
        
        if (this.templates.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="bg-gray-800 rounded-xl p-8 max-w-md mx-auto">
                        <i class="fas fa-envelope text-6xl text-gray-500 mb-4"></i>
                        <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum template criado</h3>
                        <p class="text-gray-400 mb-6">Crie seu primeiro template de mensagem WhatsApp</p>
                        <button onclick="whatsappTemplates.openCreateTemplateModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                            <i class="fas fa-plus mr-2"></i>Criar Primeiro Template
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const templatesHTML = this.templates.map(template => `
            <div class="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700 hover:border-blue-500">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-100 mb-1">${template.name}</h3>
                        <p class="text-gray-400 text-sm mb-2">${this.truncateContent(template.content)}</p>
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">${this.getCategoryText(template.category)}</span>
                            <span class="px-2 py-1 ${this.getStatusColor(template.status)} text-white text-xs rounded-full">
                                ${this.getStatusText(template.status)}
                            </span>
                            ${template.mediaType ? `<span class="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">${template.mediaType}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="whatsappTemplates.editTemplate(${template.id})" class="text-blue-400 hover:text-blue-300 p-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="whatsappTemplates.previewTemplate(${template.id})" class="text-green-400 hover:text-green-300 p-2">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="whatsappTemplates.duplicateTemplate(${template.id})" class="text-yellow-400 hover:text-yellow-300 p-2">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button onclick="whatsappTemplates.deleteTemplate(${template.id})" class="text-red-400 hover:text-red-300 p-2">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <div class="space-y-2 mb-4">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-400">Variáveis:</span>
                        <span class="text-gray-200">${template.variables.length}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-400">Idioma:</span>
                        <span class="text-gray-200">${template.language.toUpperCase()}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-400">Criado:</span>
                        <span class="text-gray-200">${this.formatDate(template.createdAt)}</span>
                    </div>
                </div>

                <div class="flex gap-2">
                    <button onclick="whatsappTemplates.submitForApproval(${template.id})" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm transition-colors">
                        <i class="fas fa-check mr-1"></i>Enviar Aprovação
                    </button>
                    <button onclick="whatsappTemplates.testTemplate(${template.id})" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm transition-colors">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = templatesHTML;
    }

    setupEventListeners() {
        // Busca em tempo real
        const searchInput = document.getElementById('searchTemplates');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTemplates(e.target.value);
            });
        }

        // Filtros por categoria
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="filterByCategory"]')) {
                const category = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.filterByCategory(category);
            }
        });
    }

    filterTemplates(searchTerm) {
        const filteredTemplates = this.templates.filter(template => 
            template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderFilteredTemplates(filteredTemplates);
    }

    filterByCategory(category) {
        if (category === 'all') {
            this.renderTemplates();
            return;
        }
        
        const filteredTemplates = this.templates.filter(template => template.category === category);
        this.renderFilteredTemplates(filteredTemplates);
    }

    renderFilteredTemplates(templates) {
        const container = document.getElementById('templatesGrid');
        
        if (templates.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="bg-gray-800 rounded-xl p-8 max-w-md mx-auto">
                        <i class="fas fa-search text-6xl text-gray-500 mb-4"></i>
                        <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum template encontrado</h3>
                        <p class="text-gray-400">Tente ajustar os filtros ou criar um novo template</p>
                    </div>
                </div>
            `;
            return;
        }

        // Reutilizar lógica de renderização
        this.templates = templates;
        this.renderTemplates();
        this.templates = this.templates; // Restaurar lista original
    }

    // Métodos de modal
    openCreateTemplateModal() {
        document.getElementById('modalTitle').textContent = 'Novo Template WhatsApp';
        document.getElementById('templateModal').classList.remove('hidden');
        this.resetForm();
    }

    closeTemplateModal() {
        document.getElementById('templateModal').classList.add('hidden');
        this.resetForm();
    }

    resetForm() {
        document.getElementById('templateForm').reset();
        document.getElementById('templateContent').value = '';
        document.getElementById('templateVariables').innerHTML = '';
        this.currentTemplate = null;
    }

    // Métodos de ação
    async saveTemplate() {
        try {
            const formData = new FormData(document.getElementById('templateForm'));
            const templateData = {
                name: formData.get('name'),
                category: formData.get('category'),
                language: formData.get('language'),
                content: formData.get('content'),
                variables: this.collectVariables(),
                mediaType: formData.get('mediaType') || null,
                mediaUrl: formData.get('mediaUrl') || null
            };

            // Validação
            if (!templateData.name || !templateData.content) {
                this.showError('Preencha todos os campos obrigatórios');
                return;
            }

            if (templateData.content.length > 1024) {
                this.showError('Mensagem muito longa (máximo 1024 caracteres)');
                return;
            }

            // Mock save - em produção seria uma chamada API
            if (this.currentTemplate) {
                // Editar template existente
                const index = this.templates.findIndex(t => t.id === this.currentTemplate.id);
                if (index !== -1) {
                    this.templates[index] = {
                        ...this.currentTemplate,
                        ...templateData,
                        updatedAt: new Date().toISOString()
                    };
                }
            } else {
                // Criar novo template
                const newTemplate = {
                    id: Date.now(),
                    ...templateData,
                    status: 'draft',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                this.templates.push(newTemplate);
            }

            this.renderTemplates();
            this.closeTemplateModal();
            this.showSuccess(this.currentTemplate ? 'Template atualizado com sucesso!' : 'Template criado com sucesso!');

        } catch (error) {
            console.error('Erro ao salvar template:', error);
            this.showError('Erro ao salvar template');
        }
    }

    collectVariables() {
        const variables = [];
        const variableInputs = document.querySelectorAll('.variable-input');
        variableInputs.forEach(input => {
            if (input.value.trim()) {
                variables.push(input.value.trim());
            }
        });
        return variables;
    }

    editTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        this.currentTemplate = template;
        document.getElementById('modalTitle').textContent = 'Editar Template WhatsApp';
        this.populateForm(template);
        document.getElementById('templateModal').classList.remove('hidden');
    }

    populateForm(template) {
        document.getElementById('templateName').value = template.name;
        document.getElementById('templateCategory').value = template.category;
        document.getElementById('templateLanguage').value = template.language;
        document.getElementById('templateContent').value = template.content;
        document.getElementById('templateMediaType').value = template.mediaType || '';
        document.getElementById('templateMediaUrl').value = template.mediaUrl || '';

        // Preencher variáveis
        this.renderVariables(template.variables);
    }

    renderVariables(variables) {
        const container = document.getElementById('templateVariables');
        container.innerHTML = '';
        
        variables.forEach((variable, index) => {
            this.addVariableInput(variable);
        });
    }

    addVariableInput(value = '') {
        const container = document.getElementById('templateVariables');
        const variableHTML = `
            <div class="variable-item flex items-center gap-2">
                <input type="text" class="variable-input flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                       value="${value}" placeholder="Nome da variável">
                <button type="button" onclick="whatsappTemplates.removeVariable(this)" class="text-red-400 hover:text-red-300">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', variableHTML);
    }

    removeVariable(button) {
        button.closest('.variable-item').remove();
    }

    previewTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        this.renderTemplatePreview(template);
        document.getElementById('templatePreviewModal').classList.remove('hidden');
    }

    renderTemplatePreview(template) {
        const container = document.getElementById('templatePreviewContent');
        
        const previewHTML = `
            <div class="space-y-6">
                <div class="bg-gray-700 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-gray-100 mb-2">${template.name}</h3>
                    <div class="flex items-center gap-2 mb-3">
                        <span class="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">${this.getCategoryText(template.category)}</span>
                        <span class="px-2 py-1 ${this.getStatusColor(template.status)} text-white text-xs rounded-full">
                            ${this.getStatusText(template.status)}
                        </span>
                        <span class="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">${template.language.toUpperCase()}</span>
                    </div>
                </div>

                <div class="bg-gray-700 rounded-lg p-4">
                    <h4 class="font-medium text-gray-200 mb-2">Mensagem</h4>
                    <div class="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                        <p class="text-gray-100 whitespace-pre-wrap">${template.content}</p>
                        ${template.mediaType && template.mediaUrl ? `
                            <div class="mt-3">
                                <span class="text-gray-400 text-sm">Mídia: ${template.mediaType}</span>
                                <div class="mt-2">
                                    <img src="${template.mediaUrl}" alt="Preview" class="max-w-full h-auto rounded-lg" onerror="this.style.display='none'">
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="bg-gray-700 rounded-lg p-4">
                    <h4 class="font-medium text-gray-200 mb-2">Variáveis</h4>
                    <div class="space-y-2">
                        ${template.variables.map((variable, index) => `
                            <div class="flex items-center gap-2">
                                <span class="text-gray-400 text-sm">\${${index + 1}}:</span>
                                <span class="text-gray-200">${variable}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-gray-700 rounded-lg p-4">
                    <h4 class="font-medium text-gray-200 mb-2">Informações</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-400">Criado:</span>
                            <span class="text-gray-200 ml-2">${this.formatDate(template.createdAt)}</span>
                        </div>
                        <div>
                            <span class="text-gray-400">Atualizado:</span>
                            <span class="text-gray-200 ml-2">${this.formatDate(template.updatedAt)}</span>
                        </div>
                        <div>
                            <span class="text-gray-400">Caracteres:</span>
                            <span class="text-gray-200 ml-2">${template.content.length}/1024</span>
                        </div>
                        <div>
                            <span class="text-gray-400">Variáveis:</span>
                            <span class="text-gray-200 ml-2">${template.variables.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = previewHTML;
    }

    closeTemplatePreviewModal() {
        document.getElementById('templatePreviewModal').classList.add('hidden');
    }

    async duplicateTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        const duplicatedTemplate = {
            ...template,
            id: Date.now(),
            name: `${template.name} (Cópia)`,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.templates.push(duplicatedTemplate);
        this.renderTemplates();
        this.showSuccess('Template duplicado com sucesso!');
    }

    async deleteTemplate(templateId) {
        if (!confirm('Tem certeza que deseja excluir este template?')) return;

        this.templates = this.templates.filter(t => t.id !== templateId);
        this.renderTemplates();
        this.showSuccess('Template excluído com sucesso!');
    }

    async submitForApproval(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        template.status = 'pending';
        this.renderTemplates();
        this.showSuccess('Template enviado para aprovação!');
    }

    async testTemplate(templateId) {
        this.showInfo('Funcionalidade de teste será implementada na próxima fase');
    }

    // Métodos auxiliares
    truncateContent(content, maxLength = 100) {
        return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    }

    getCategoryText(category) {
        const categories = {
            'marketing': 'Marketing',
            'utility': 'Utility',
            'authentication': 'Authentication'
        };
        return categories[category] || 'Desconhecido';
    }

    getStatusText(status) {
        const statuses = {
            'draft': 'Rascunho',
            'pending': 'Pendente',
            'approved': 'Aprovado',
            'rejected': 'Rejeitado'
        };
        return statuses[status] || status;
    }

    getStatusColor(status) {
        const colors = {
            'draft': 'bg-gray-500',
            'pending': 'bg-yellow-500',
            'approved': 'bg-green-500',
            'rejected': 'bg-red-500'
        };
        return colors[status] || 'bg-gray-500';
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
function openCreateTemplateModal() {
    if (window.whatsappTemplates) {
        window.whatsappTemplates.openCreateTemplateModal();
    }
}

function closeTemplateModal() {
    if (window.whatsappTemplates) {
        window.whatsappTemplates.closeTemplateModal();
    }
}

function closeTemplatePreviewModal() {
    if (window.whatsappTemplates) {
        window.whatsappTemplates.closeTemplatePreviewModal();
    }
}

function saveTemplate() {
    if (window.whatsappTemplates) {
        window.whatsappTemplates.saveTemplate();
    }
}

function addVariableInput() {
    if (window.whatsappTemplates) {
        window.whatsappTemplates.addVariableInput();
    }
}

function removeVariable(button) {
    if (window.whatsappTemplates) {
        window.whatsappTemplates.removeVariable(button);
    }
}

function filterByCategory(category) {
    if (window.whatsappTemplates) {
        window.whatsappTemplates.filterByCategory(category);
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
        window.whatsappTemplates = new WhatsAppTemplates();
    } else {
        // Tentar novamente após um delay
        setTimeout(() => {
            if (typeof window.auth !== 'undefined' && typeof window.apiClient !== 'undefined') {
                window.whatsappTemplates = new WhatsAppTemplates();
            } else {
                console.error('Módulos necessários não carregados');
            }
        }, 1000);
    }
}); 