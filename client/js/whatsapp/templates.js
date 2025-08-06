// Templates WhatsApp - Gestão de templates de mensagens
// Sistema multicliente - JWT Authentication

// Variáveis globais
let templates = [];
let globalTemplates = [];
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
        await loadGlobalTemplates();
        
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
        const response = await fetch(`${API_BASE_URL}/client/whatsapp/templates`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (result.success) {
            templates = result.data;
            renderTemplates();
        } else {
            showError(result.message || 'Erro ao carregar templates');
        }
    } catch (error) {
        console.error('Erro ao carregar templates:', error);
        showError('Erro ao carregar templates');
    }
}

async function loadGlobalTemplates() {
    try {
        const response = await fetch(`${API_BASE_URL}/client/whatsapp/templates/global`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (result.success) {
            globalTemplates = result.data;
        } else {
            console.error('Erro ao carregar templates globais:', result.message);
        }
    } catch (error) {
        console.error('Erro ao carregar templates globais:', error);
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
    const templatesList = document.getElementById('templates-list');
    if (!templatesList) return;

    if (templates.length === 0) {
        templatesList.innerHTML = `
            <div class="p-6 text-center text-gray-400">
                <i class="fas fa-file-alt text-4xl mb-4"></i>
                <p class="text-lg font-semibold mb-2">Nenhum template encontrado</p>
                <p class="text-sm">Crie seu primeiro template ou use um dos templates de exemplo</p>
            </div>
        `;
        return;
    }

    const templatesHTML = templates.map(template => `
        <div class="p-6 hover:bg-gray-750 transition-colors">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h4 class="text-lg font-semibold text-gray-100">${template.name}</h4>
                        <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(template.status)}">
                            ${getStatusText(template.status)}
                        </span>
                        <span class="px-2 py-1 text-xs rounded-full bg-blue-900 text-blue-300">
                            ${getCategoryText(template.category)}
                        </span>
                    </div>
                    <p class="text-gray-400 text-sm mb-3 line-clamp-2">${template.content.body}</p>
                    <div class="flex items-center gap-4 text-xs text-gray-500">
                        <span><i class="fas fa-calendar mr-1"></i>${formatDate(template.createdAt)}</span>
                        ${template.variables && template.variables.length > 0 ? 
                            `<span><i class="fas fa-tags mr-1"></i>${template.variables.length} variáveis</span>` : 
                            ''
                        }
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="editTemplate('${template._id}')" class="p-2 text-blue-400 hover:bg-blue-900 rounded-lg transition-colors" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="duplicateTemplate('${template._id}')" class="p-2 text-green-400 hover:bg-green-900 rounded-lg transition-colors" title="Duplicar">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button onclick="deleteTemplate('${template._id}')" class="p-2 text-red-400 hover:bg-red-900 rounded-lg transition-colors" title="Deletar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    templatesList.innerHTML = templatesHTML;
}

function getCategoryText(category) {
    const categories = {
        'marketing': 'Marketing',
        'utility': 'Utility',
        'authentication': 'Authentication',
        'indicadores': 'Indicadores',
        'leads': 'Leads',
        'geral': 'Geral'
    };
    return categories[category] || category;
}

function getStatusColor(status) {
    const colors = {
        'active': 'bg-green-900 text-green-300',
        'inactive': 'bg-gray-700 text-gray-300',
        'draft': 'bg-yellow-900 text-yellow-300',
        'pending': 'bg-blue-900 text-blue-300',
        'approved': 'bg-green-900 text-green-300',
        'rejected': 'bg-red-900 text-red-300'
    };
    return colors[status] || 'bg-gray-700 text-gray-300';
}

function getStatusText(status) {
    const texts = {
        'active': 'Ativo',
        'inactive': 'Inativo',
        'draft': 'Rascunho',
        'pending': 'Pendente',
        'approved': 'Aprovado',
        'rejected': 'Rejeitado'
    };
    return texts[status] || status;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function filterTemplates() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('filter-category')?.value || '';
    const statusFilter = document.getElementById('filter-status')?.value || '';

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = !searchTerm || 
            template.name.toLowerCase().includes(searchTerm) ||
            template.content.body.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !categoryFilter || template.category === categoryFilter;
        const matchesStatus = !statusFilter || template.status === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    renderFilteredTemplates(filteredTemplates);
}

function renderFilteredTemplates(filteredTemplates) {
    const templatesList = document.getElementById('templates-list');
    if (!templatesList) return;

    if (filteredTemplates.length === 0) {
        templatesList.innerHTML = `
            <div class="p-6 text-center text-gray-400">
                <i class="fas fa-search text-4xl mb-4"></i>
                <p class="text-lg font-semibold mb-2">Nenhum template encontrado</p>
                <p class="text-sm">Tente ajustar os filtros ou criar um novo template</p>
            </div>
        `;
        return;
    }

    const templatesHTML = filteredTemplates.map(template => `
        <div class="p-6 hover:bg-gray-750 transition-colors">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h4 class="text-lg font-semibold text-gray-100">${template.name}</h4>
                        <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(template.status)}">
                            ${getStatusText(template.status)}
                        </span>
                        <span class="px-2 py-1 text-xs rounded-full bg-blue-900 text-blue-300">
                            ${getCategoryText(template.category)}
                        </span>
                    </div>
                    <p class="text-gray-400 text-sm mb-3 line-clamp-2">${template.content.body}</p>
                    <div class="flex items-center gap-4 text-xs text-gray-500">
                        <span><i class="fas fa-calendar mr-1"></i>${formatDate(template.createdAt)}</span>
                        ${template.variables && template.variables.length > 0 ? 
                            `<span><i class="fas fa-tags mr-1"></i>${template.variables.length} variáveis</span>` : 
                            ''
                        }
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="editTemplate('${template._id}')" class="p-2 text-blue-400 hover:bg-blue-900 rounded-lg transition-colors" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="duplicateTemplate('${template._id}')" class="p-2 text-green-400 hover:bg-green-900 rounded-lg transition-colors" title="Duplicar">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button onclick="deleteTemplate('${template._id}')" class="p-2 text-red-400 hover:bg-red-900 rounded-lg transition-colors" title="Deletar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    templatesList.innerHTML = templatesHTML;
}

function openCreateTemplateModal() {
    currentTemplate = null;
    document.getElementById('modal-title').textContent = 'Novo Template';
    resetForm();
    document.getElementById('template-modal').classList.remove('hidden');
}

function closeTemplateModal() {
    document.getElementById('template-modal').classList.add('hidden');
    resetForm();
}

function resetForm() {
    document.getElementById('template-form').reset();
    currentTemplate = null;
}

function editTemplate(templateId) {
    currentTemplate = templates.find(t => t._id === templateId);
    if (!currentTemplate) return;

    document.getElementById('modal-title').textContent = 'Editar Template';
    document.getElementById('template-name').value = currentTemplate.name;
    document.getElementById('template-category').value = currentTemplate.category;
    document.getElementById('template-body').value = currentTemplate.content.body;
    document.getElementById('template-footer').value = currentTemplate.content.footer || '';
    document.getElementById('template-variables').value = currentTemplate.variables ? currentTemplate.variables.join(',') : '';

    document.getElementById('template-modal').classList.remove('hidden');
}

async function saveTemplate() {
    try {
        const formData = {
            name: document.getElementById('template-name').value,
            category: document.getElementById('template-category').value,
            language: 'pt_BR',
            content: {
                body: document.getElementById('template-body').value,
                footer: document.getElementById('template-footer').value || undefined
            },
            variables: document.getElementById('template-variables').value ? 
                document.getElementById('template-variables').value.split(',').map(v => v.trim()) : []
        };

        const url = currentTemplate ? 
            `${API_BASE_URL}/client/whatsapp/templates/${currentTemplate._id}` :
            `${API_BASE_URL}/client/whatsapp/templates`;

        const method = currentTemplate ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showSuccess(result.message || 'Template salvo com sucesso');
            closeTemplateModal();
            await loadTemplates();
        } else {
            showError(result.message || 'Erro ao salvar template');
        }
    } catch (error) {
        console.error('Erro ao salvar template:', error);
        showError('Erro ao salvar template');
    }
}

async function deleteTemplate(templateId) {
    if (!confirm('Tem certeza que deseja deletar este template?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/client/whatsapp/templates/${templateId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            showSuccess(result.message || 'Template deletado com sucesso');
            await loadTemplates();
        } else {
            showError(result.message || 'Erro ao deletar template');
        }
    } catch (error) {
        console.error('Erro ao deletar template:', error);
        showError('Erro ao deletar template');
    }
}

async function duplicateTemplate(templateId) {
    try {
        const response = await fetch(`${API_BASE_URL}/client/whatsapp/templates/${templateId}/duplicate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            showSuccess(result.message || 'Template duplicado com sucesso');
            await loadTemplates();
        } else {
            showError(result.message || 'Erro ao duplicar template');
        }
    } catch (error) {
        console.error('Erro ao duplicar template:', error);
        showError('Erro ao duplicar template');
    }
}

function showSuccess(message) {
    // Implementar notificação de sucesso
    console.log('Sucesso:', message);
    alert(message);
}

function showError(message) {
    // Implementar notificação de erro
    console.error('Erro:', message);
    alert('Erro: ' + message);
} 
} 