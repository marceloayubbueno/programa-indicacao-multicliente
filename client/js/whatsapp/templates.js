// Templates WhatsApp - Gestão de templates de mensagens
// Sistema multicliente - JWT Authentication

// Variáveis globais
let templates = [];
let currentTemplate = null;
const categories = ['marketing', 'utility', 'authentication'];

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    await initTemplates();
});

async function initTemplates() {
    try {
        // Verificar autenticação
        if (!checkAuth()) {
            return;
        }

        // Carregar dados iniciais
        await loadTemplates();
        
        // Configurar eventos
        setupEventListeners();
        
    } catch (error) {
        console.error('Erro ao inicializar WhatsApp Templates:', error);
        showError('Erro ao carregar templates');
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

        renderTemplates();

    } catch (error) {
        console.error('Erro ao carregar templates:', error);
    }
}

function renderTemplates() {
    const container = document.getElementById('templatesGrid');
    
    if (templates.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="bg-gray-800 rounded-xl p-8 max-w-md mx-auto">
                    <i class="fas fa-envelope text-6xl text-gray-500 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum template criado</h3>
                    <p class="text-gray-400 mb-6">Crie seu primeiro template de mensagem WhatsApp</p>
                    <button onclick="openCreateTemplateModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                        <i class="fas fa-plus mr-2"></i>Criar Primeiro Template
                    </button>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="col-span-full">
            <div class="bg-gray-800 rounded-xl border border-gray-700">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-750 border-b border-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Template</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Categoria</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Variáveis</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Criado</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-700">
                            ${templates.map(template => `
                                <tr class="hover:bg-gray-750 transition-colors">
                                    <td class="px-6 py-4">
                                        <div>
                                            <div class="text-sm font-medium text-gray-100">${template.name}</div>
                                            <div class="text-sm text-gray-400 mt-1 max-w-xs truncate">${template.content}</div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-blue-900 text-blue-300 rounded-full">
                                            ${getCategoryText(template.category)}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(template.status)}">
                                            ${getStatusText(template.status)}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="text-sm text-gray-400">${template.variables?.length || 0}</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="text-sm text-gray-400">${formatDate(template.createdAt)}</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center space-x-2">
                                            <button onclick="editTemplate('${template.id}')" class="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors" title="Editar">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="deleteTemplate('${template.id}')" class="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" title="Excluir">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function setupEventListeners() {
    // Busca
    const searchInput = document.getElementById('searchTemplates');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTemplates(e.target.value);
        });
    }
}

function filterTemplates(searchTerm) {
    const filtered = templates.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    renderFilteredTemplates(filtered);
}

function filterByCategory(category) {
    const filtered = category === 'all' 
        ? templates 
        : templates.filter(template => template.category === category);
    renderFilteredTemplates(filtered);
}

function renderFilteredTemplates(filteredTemplates) {
    const container = document.getElementById('templatesGrid');
    
    if (filteredTemplates.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="bg-gray-800 rounded-xl p-8 max-w-md mx-auto">
                    <i class="fas fa-search text-6xl text-gray-500 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum template encontrado</h3>
                    <p class="text-gray-400">Tente ajustar os filtros de busca</p>
                </div>
            </div>
        `;
        return;
    }

    const templatesHTML = filteredTemplates.map(template => `
        <div class="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                        <h3 class="text-lg font-semibold text-gray-100">${template.name}</h3>
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(template.status)}">
                            ${getStatusText(template.status)}
                        </span>
                        <span class="px-2 py-1 text-xs font-medium bg-blue-900 text-blue-300 rounded-full">
                            ${getCategoryText(template.category)}
                        </span>
                    </div>
                    <p class="text-gray-400 mb-3 line-clamp-2">${template.content}</p>
                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                        <span><i class="fas fa-language mr-1"></i>${template.language}</span>
                        <span><i class="fas fa-calendar mr-1"></i>${formatDate(template.createdAt)}</span>
                        <span><i class="fas fa-tags mr-1"></i>${template.variables?.length || 0} variáveis</span>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="editTemplate('${template.id}')" class="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTemplate('${template.id}')" class="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = templatesHTML;
}

function openCreateTemplateModal() {
    currentTemplate = null;
    resetForm();
    document.getElementById('templateModal').classList.remove('hidden');
}

function closeTemplateModal() {
    document.getElementById('templateModal').classList.add('hidden');
    resetForm();
}

function resetForm() {
    document.getElementById('templateForm').reset();
    currentTemplate = null;
    document.getElementById('templateVariables').value = '';
}

async function saveTemplate() {
    try {
        const token = getToken();
        if (!token) {
            showError('Token não encontrado');
            return;
        }

        const formData = new FormData(document.getElementById('templateForm'));
        const templateData = {
            name: formData.get('name'),
            category: formData.get('category'),
            language: formData.get('language'),
            content: formData.get('body'),
            footer: formData.get('footer'),
            variables: collectVariables()
        };

        // Mock - em produção seria uma chamada para a API
        if (currentTemplate) {
            // Editar template existente
            const index = templates.findIndex(t => t.id === currentTemplate.id);
            if (index !== -1) {
                templates[index] = { ...templates[index], ...templateData, updatedAt: new Date().toISOString() };
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
            templates.push(newTemplate);
        }

        renderTemplates();
        closeTemplateModal();
        showSuccess(currentTemplate ? 'Template atualizado com sucesso!' : 'Template criado com sucesso!');

    } catch (error) {
        console.error('Erro ao salvar template:', error);
        showError('Erro ao salvar template');
    }
}

function collectVariables() {
    const variablesInput = document.getElementById('templateVariables');
    return variablesInput.value.split(',').map(v => v.trim()).filter(v => v);
}

function editTemplate(templateId) {
    const template = templates.find(t => t.id == templateId);
    if (!template) {
        showError('Template não encontrado');
        return;
    }

    currentTemplate = template;
    populateForm(template);
    document.getElementById('templateModal').classList.remove('hidden');
}

function populateForm(template) {
    document.getElementById('templateName').value = template.name;
    document.getElementById('templateCategory').value = template.category;
    document.getElementById('templateLanguage').value = template.language;
    document.getElementById('templateBody').value = template.content;
    document.getElementById('templateFooter').value = template.footer || '';
    document.getElementById('templateVariables').value = template.variables?.join(', ') || '';
}

function previewTemplate(templateId) {
    const template = templates.find(t => t.id == templateId);
    if (!template) {
        showError('Template não encontrado');
        return;
    }

    renderTemplatePreview(template);
    document.getElementById('templatePreviewModal').classList.remove('hidden');
}

function renderTemplatePreview(template) {
    const container = document.getElementById('templatePreviewContent');
    
    let previewContent = template.content;
    
    // Substituir variáveis por valores de exemplo
    if (template.variables) {
        template.variables.forEach((variable, index) => {
            const exampleValue = getExampleValue(variable);
            previewContent = previewContent.replace(new RegExp(`{{${index + 1}}}`, 'g'), exampleValue);
        });
    }

    container.innerHTML = `
        <div class="bg-gray-800 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-100">${template.name}</h3>
                <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(template.status)}">
                    ${getStatusText(template.status)}
                </span>
            </div>
            
            <div class="bg-gray-700 rounded-lg p-4 mb-4">
                <div class="flex items-center mb-2">
                    <i class="fab fa-whatsapp text-green-400 mr-2"></i>
                    <span class="text-sm text-gray-400">Preview da mensagem</span>
                </div>
                <div class="text-gray-100 whitespace-pre-wrap">${previewContent}</div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-gray-400">Categoria:</span>
                    <span class="text-gray-200 ml-2">${getCategoryText(template.category)}</span>
                </div>
                <div>
                    <span class="text-gray-400">Idioma:</span>
                    <span class="text-gray-200 ml-2">${template.language}</span>
                </div>
                <div>
                    <span class="text-gray-400">Variáveis:</span>
                    <span class="text-gray-200 ml-2">${template.variables?.length || 0}</span>
                </div>
                <div>
                    <span class="text-gray-400">Criado em:</span>
                    <span class="text-gray-200 ml-2">${formatDate(template.createdAt)}</span>
                </div>
            </div>
        </div>
    `;
}

function getExampleValue(variable) {
    const examples = {
        'nome': 'João Silva',
        'empresa': 'Minha Empresa',
        'link': 'https://exemplo.com/indicacao/123',
        'recompensa': 'R$ 50,00',
        'link_pessoal': 'https://exemplo.com/joao123',
        'indicacoes_hoje': '3',
        'nome_lead': 'Maria Santos',
        'nome_indicador': 'João Silva',
        'link_bonus': 'https://exemplo.com/bonus/456'
    };
    return examples[variable] || `[${variable}]`;
}

function closeTemplatePreviewModal() {
    document.getElementById('templatePreviewModal').classList.add('hidden');
}

async function duplicateTemplate(templateId) {
    try {
        const template = templates.find(t => t.id == templateId);
        if (!template) {
            showError('Template não encontrado');
            return;
        }

        const duplicatedTemplate = {
            ...template,
            id: Date.now(),
            name: `${template.name} (Cópia)`,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        templates.push(duplicatedTemplate);
        renderTemplates();
        showSuccess('Template duplicado com sucesso!');

    } catch (error) {
        console.error('Erro ao duplicar template:', error);
        showError('Erro ao duplicar template');
    }
}

async function deleteTemplate(templateId) {
    if (!confirm('Tem certeza que deseja excluir este template?')) {
        return;
    }

    try {
        templates = templates.filter(t => t.id != templateId);
        renderTemplates();
        showSuccess('Template excluído com sucesso!');

    } catch (error) {
        console.error('Erro ao excluir template:', error);
        showError('Erro ao excluir template');
    }
}

async function submitForApproval(templateId) {
    try {
        const template = templates.find(t => t.id == templateId);
        if (!template) {
            showError('Template não encontrado');
            return;
        }

        template.status = 'pending';
        template.updatedAt = new Date().toISOString();
        
        renderTemplates();
        showSuccess('Template enviado para aprovação!');

    } catch (error) {
        console.error('Erro ao enviar para aprovação:', error);
        showError('Erro ao enviar para aprovação');
    }
}

async function testTemplate(templateId) {
    showInfo('Funcionalidade de teste será implementada em breve');
}

function truncateContent(content, maxLength = 100) {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
}

function getCategoryText(category) {
    const categories = {
        'marketing': 'Marketing',
        'utility': 'Utilitário',
        'authentication': 'Autenticação'
    };
    return categories[category] || category;
}

function getStatusText(status) {
    const statuses = {
        'draft': 'Rascunho',
        'pending': 'Pendente',
        'approved': 'Aprovado',
        'rejected': 'Rejeitado'
    };
    return statuses[status] || status;
}

function getStatusColor(status) {
    const colors = {
        'draft': 'bg-gray-700 text-gray-300',
        'pending': 'bg-yellow-900 text-yellow-300',
        'approved': 'bg-green-900 text-green-300',
        'rejected': 'bg-red-900 text-red-300'
    };
    return colors[status] || 'bg-gray-700 text-gray-300';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
window.openCreateTemplateModal = openCreateTemplateModal;
window.closeTemplateModal = closeTemplateModal;
window.closeTemplatePreviewModal = closeTemplatePreviewModal;
window.saveTemplate = saveTemplate;
window.addVariableInput = function() {
    const container = document.getElementById('variablesContainer');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
    input.placeholder = 'Nome da variável';
    container.appendChild(input);
};
window.removeVariable = function(button) {
    button.parentElement.remove();
};
window.filterByCategory = filterByCategory; 