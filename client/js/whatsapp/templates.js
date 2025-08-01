// Templates WhatsApp - Gestão de templates de mensagens
// Sistema multicliente - JWT Authentication

// Variáveis globais
let templates = [];
let currentTemplate = null;

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
        console.error('Erro ao inicializar Templates:', error);
        showError('Erro ao carregar templates');
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

async function loadTemplates() {
    try {
        // Mock data para desenvolvimento frontend
        templates = [
            {
                id: '1',
                name: 'Boas-vindas Indicador',
                category: 'marketing',
                content: 'Olá {{1}}, bem-vindo ao nosso programa de indicação! Você pode ganhar recompensas indicando amigos. Quer saber como?',
                status: 'active',
                variables: ['nome'],
                createdAt: '2024-01-15T10:00:00Z'
            },
            {
                id: '2',
                name: 'Dicas de Indicação',
                category: 'utility',
                content: 'Dica do dia: Compartilhe seu link pessoal nas redes sociais! Seu link: {{1}} Indicações hoje: {{2}}',
                status: 'active',
                variables: ['link', 'indicacoes'],
                createdAt: '2024-01-16T14:30:00Z'
            },
            {
                id: '3',
                name: 'Parabéns Lead',
                category: 'marketing',
                content: 'Parabéns {{1}}! Você foi indicado por {{2}} e ganhou {{3}} de desconto!',
                status: 'active',
                variables: ['nome', 'indicador', 'desconto'],
                createdAt: '2024-01-17T09:15:00Z'
            }
        ];
        
        renderTemplates();
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
            filterTemplates();
        });
    }

    // Filtros
    const categoryFilter = document.getElementById('filter-category');
    const statusFilter = document.getElementById('filter-status');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterTemplates);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTemplates);
    }
}

function renderTemplates() {
    const container = document.getElementById('templates-list');
    if (!container) return;

    if (templates.length === 0) {
        container.innerHTML = `
            <div class="p-6 text-center text-gray-400">
                <i class="fas fa-envelope text-6xl text-gray-500 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum template criado</h3>
                <p class="text-gray-400 mb-6">Crie seu primeiro template de mensagem WhatsApp</p>
                <button onclick="openCreateTemplateModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                    <i class="fas fa-plus mr-2"></i>Criar Primeiro Template
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
                                <div class="text-sm font-medium text-gray-100">${template.name}</div>
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
    `;
}

function getCategoryText(category) {
    switch(category) {
        case 'marketing': return 'Marketing';
        case 'utility': return 'Utility';
        case 'authentication': return 'Authentication';
        default: return category;
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

function filterTemplates() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('filter-category')?.value || '';
    const statusFilter = document.getElementById('filter-status')?.value || '';
    
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm) ||
                            template.content.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || template.category === categoryFilter;
        const matchesStatus = !statusFilter || template.status === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    renderFilteredTemplates(filteredTemplates);
}

function renderFilteredTemplates(filteredTemplates) {
    const container = document.getElementById('templates-list');
    if (!container) return;

    if (filteredTemplates.length === 0) {
        container.innerHTML = `
            <div class="p-6 text-center text-gray-400">
                <i class="fas fa-search text-6xl text-gray-500 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum template encontrado</h3>
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
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Template</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Categoria</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Variáveis</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Criado</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    ${filteredTemplates.map(template => `
                        <tr class="hover:bg-gray-750 transition-colors">
                            <td class="px-6 py-4">
                                <div class="text-sm font-medium text-gray-100">${template.name}</div>
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
    `;
}

function openCreateTemplateModal() {
    currentTemplate = null;
    document.getElementById('modal-title').textContent = 'Novo Template';
    document.getElementById('template-modal').classList.remove('hidden');
    resetForm();
}

function closeTemplateModal() {
    document.getElementById('template-modal').classList.add('hidden');
    currentTemplate = null;
    resetForm();
}

function resetForm() {
    document.getElementById('template-form').reset();
}

function editTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    currentTemplate = templateId;
    document.getElementById('modal-title').textContent = 'Editar Template';
    
    // Preencher formulário
    document.getElementById('template-name').value = template.name;
    document.getElementById('template-category').value = template.category;
    document.getElementById('template-body').value = template.content;
    document.getElementById('template-footer').value = template.footer || '';
    document.getElementById('template-variables').value = template.variables?.join(',') || '';
    
    document.getElementById('template-modal').classList.remove('hidden');
}

async function saveTemplate() {
    try {
        const formData = {
            name: document.getElementById('template-name').value,
            category: document.getElementById('template-category').value,
            content: document.getElementById('template-body').value,
            footer: document.getElementById('template-footer').value,
            variables: document.getElementById('template-variables').value.split(',').map(v => v.trim()).filter(v => v)
        };
        
        if (!formData.name || !formData.category || !formData.content) {
            showError('Preencha todos os campos obrigatórios');
            return;
        }
        
        // Mock save - em produção seria uma chamada API
        if (currentTemplate) {
            // Editar template existente
            const index = templates.findIndex(t => t.id === currentTemplate);
            if (index !== -1) {
                templates[index] = { ...templates[index], ...formData };
            }
        } else {
            // Criar novo template
            const newTemplate = {
                id: Date.now().toString(),
                ...formData,
                status: 'active',
                createdAt: new Date().toISOString()
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

function deleteTemplate(templateId) {
    if (confirm('Tem certeza que deseja excluir este template?')) {
        templates = templates.filter(t => t.id !== templateId);
        renderTemplates();
        showSuccess('Template excluído com sucesso!');
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