// Variáveis globais
let apiClient;
let selectedListIds = [];
let selectedParticipantIds = [];
let allParticipants = [];
let allLists = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    checkAuth();
    
    // Inicializar API Client
    if (typeof APIClient !== 'undefined') {
        window.apiClient = new APIClient();
        apiClient = window.apiClient;
        console.log('[BULK-SEND] API Client inicializado');
    } else {
        console.error('[BULK-SEND] APIClient não encontrado');
        return;
    }
    
    // Carregar dados iniciais
    loadTemplates();
    loadParticipantLists();
    
    // Configurar eventos
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Template selection
    const templateSelect = document.getElementById('templateSelect');
    if (templateSelect) {
        templateSelect.addEventListener('change', onTemplateChange);
        
        // Adicionar funcionalidade para recarregar em caso de erro
        templateSelect.addEventListener('click', function() {
            if (this.innerHTML.includes('Erro ao carregar')) {
                console.log('[BULK-SEND] Tentativa de recarregar templates...');
                loadTemplates();
            }
        });
    }
    
    // Participant search
    const participantSearch = document.getElementById('participantSearch');
    if (participantSearch) {
        participantSearch.addEventListener('input', searchParticipants);
    }
    
    // Form fields
    const emailSubject = document.getElementById('emailSubject');
    const senderName = document.getElementById('senderName');
    
    if (emailSubject) emailSubject.addEventListener('input', validateForm);
    if (senderName) senderName.addEventListener('input', validateForm);
}

// Carregar templates
async function loadTemplates() {
    const select = document.getElementById('templateSelect');
    
    try {
        console.log('[BULK-SEND] Carregando templates...');
        
        // Mostrar loading
        if (select) {
            select.innerHTML = '<option value="">Carregando templates...</option>';
            select.disabled = true;
        }
        
        const response = await apiClient.getEmailTemplates();
        
        // Verificar se a resposta é válida
        if (!response || typeof response !== 'object') {
            throw new Error('Resposta inválida da API');
        }
        
        const templates = response.templates || [];
        console.log('[BULK-SEND] Total de templates recebidos:', templates.length);
        
        // Filtrar apenas templates de campanha ativos
        const campaignTemplates = templates.filter(template => {
            const isValid = template && 
                           template._id && 
                           template.name && 
                           template.type === 'campaign' && 
                           template.status === 'active';
            
            if (!isValid) {
                console.log('[BULK-SEND] Template ignorado:', template);
            }
            
            return isValid;
        });
        
        console.log('[BULK-SEND] Templates de campanha válidos:', campaignTemplates.length);
        
        if (select) {
            select.disabled = false;
            
            if (campaignTemplates.length === 0) {
                select.innerHTML = '<option value="">Nenhum template de campanha ativo encontrado</option>';
                console.warn('[BULK-SEND] Nenhum template de campanha disponível');
            } else {
                select.innerHTML = '<option value="">Selecione um template...</option>';
                
                campaignTemplates.forEach(template => {
                    const option = document.createElement('option');
                    option.value = template._id;
                    option.textContent = template.name;
                    option.title = `Tipo: ${template.type} | Status: ${template.status}`;
                    select.appendChild(option);
                });
                
                console.log('[BULK-SEND] Templates carregados com sucesso');
            }
        }
        
    } catch (error) {
        console.error('[BULK-SEND] Erro ao carregar templates:', error);
        
        if (select) {
            select.disabled = false;
            select.innerHTML = '<option value="">Erro ao carregar templates - Clique para tentar novamente</option>';
        }
        
        // Mostrar erro visual
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Erro ao carregar templates';
            statusMessage.className = 'text-red-400';
        }
    }
}

// Carregar listas de participantes
async function loadParticipantLists() {
    try {
        console.log('[BULK-SEND] Carregando listas de participantes...');
        allLists = await apiClient.getParticipantLists();
        console.log('[BULK-SEND] Listas carregadas:', allLists.length);
        
        renderLists();
    } catch (error) {
        console.error('[BULK-SEND] Erro ao carregar listas:', error);
        const container = document.getElementById('listsContainer');
        if (container) {
            container.innerHTML = '<p class="text-red-400">Erro ao carregar listas</p>';
        }
    }
}

// Renderizar listas
function renderLists() {
    const container = document.getElementById('listsContainer');
    if (!container) return;
    
    if (allLists.length === 0) {
        container.innerHTML = '<p class="text-gray-400">Nenhuma lista encontrada</p>';
        return;
    }
    
    container.innerHTML = '';
    
    allLists.forEach(list => {
        const listElement = document.createElement('div');
        listElement.className = 'flex items-center justify-between p-3 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors';
        
        const isSelected = selectedListIds.includes(list._id);
        
        listElement.innerHTML = `
            <div class="flex items-center">
                <input type="checkbox" 
                       id="list_${list._id}" 
                       ${isSelected ? 'checked' : ''}
                       onchange="toggleList('${list._id}')"
                       class="mr-3 h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500">
                <div>
                    <div class="text-gray-100 font-medium">${list.name}</div>
                    <div class="text-gray-400 text-sm">${list.participantCount || 0} participantes</div>
                </div>
            </div>
            <div class="text-xs text-gray-400 uppercase">${list.tipo || 'participante'}</div>
        `;
        
        container.appendChild(listElement);
    });
}

// Buscar participantes
async function searchParticipants() {
    const searchTerm = document.getElementById('participantSearch').value.trim();
    const resultsContainer = document.getElementById('participantsSearchResults');
    
    if (!resultsContainer) return;
    
    if (searchTerm.length < 2) {
        resultsContainer.innerHTML = '<p class="text-gray-400">Digite pelo menos 2 caracteres para buscar...</p>';
        return;
    }
    
    try {
        console.log('[BULK-SEND] Buscando participantes:', searchTerm);
        const response = await apiClient.getParticipants({ search: searchTerm, limit: 10 });
        allParticipants = response.participants || [];
        
        renderParticipants();
    } catch (error) {
        console.error('[BULK-SEND] Erro ao buscar participantes:', error);
        resultsContainer.innerHTML = '<p class="text-red-400">Erro ao buscar participantes</p>';
    }
}

// Renderizar participantes
function renderParticipants() {
    const container = document.getElementById('participantsSearchResults');
    if (!container) return;
    
    if (allParticipants.length === 0) {
        container.innerHTML = '<p class="text-gray-400">Nenhum participante encontrado</p>';
        return;
    }
    
    container.innerHTML = '';
    
    allParticipants.forEach(participant => {
        const participantElement = document.createElement('div');
        participantElement.className = 'flex items-center justify-between p-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors';
        
        const isSelected = selectedParticipantIds.includes(participant._id);
        
        participantElement.innerHTML = `
            <div class="flex items-center">
                <input type="checkbox" 
                       id="participant_${participant._id}" 
                       ${isSelected ? 'checked' : ''}
                       onchange="toggleParticipant('${participant._id}')"
                       class="mr-3 h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500">
                <div>
                    <div class="text-gray-100 text-sm">${participant.name}</div>
                    <div class="text-gray-400 text-xs">${participant.email}</div>
                </div>
            </div>
        `;
        
        container.appendChild(participantElement);
    });
}

// Toggle lista
function toggleList(listId) {
    const index = selectedListIds.indexOf(listId);
    
    if (index === -1) {
        selectedListIds.push(listId);
    } else {
        selectedListIds.splice(index, 1);
    }
    
    updateCounters();
    validateForm();
}

// Toggle participante
function toggleParticipant(participantId) {
    const index = selectedParticipantIds.indexOf(participantId);
    
    if (index === -1) {
        selectedParticipantIds.push(participantId);
    } else {
        selectedParticipantIds.splice(index, 1);
    }
    
    updateCounters();
    validateForm();
}

// Atualizar contadores
function updateCounters() {
    document.getElementById('selectedLists').textContent = selectedListIds.length;
    document.getElementById('selectedIndividuals').textContent = selectedParticipantIds.length;
    
    // Calcular total estimado (aproximado)
    let totalEstimated = selectedParticipantIds.length;
    selectedListIds.forEach(listId => {
        const list = allLists.find(l => l._id === listId);
        if (list) {
            totalEstimated += list.participantCount || 0;
        }
    });
    
    document.getElementById('totalRecipients').textContent = totalEstimated;
}

// Validar formulário
function validateForm() {
    const templateId = document.getElementById('templateSelect').value;
    const subject = document.getElementById('emailSubject').value.trim();
    const senderName = document.getElementById('senderName').value.trim();
    const hasRecipients = selectedListIds.length > 0 || selectedParticipantIds.length > 0;
    
    const isValid = templateId && subject && senderName && hasRecipients;
    
    const sendButton = document.getElementById('sendButton');
    const statusMessage = document.getElementById('statusMessage');
    
    if (sendButton) {
        sendButton.disabled = !isValid;
    }
    
    if (statusMessage) {
        if (isValid) {
            statusMessage.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Pronto para enviar!';
            statusMessage.className = 'text-green-400';
        } else {
            // Se template foi selecionado, manter o feedback positivo do template
            if (templateId && !statusMessage.innerHTML.includes('Template')) {
                let message = 'Pendente: ';
                let missing = [];
                
                if (!subject) missing.push('assunto');
                if (!senderName) missing.push('remetente');
                if (!hasRecipients) missing.push('destinatários');
                
                if (missing.length > 0) {
                    message += missing.join(', ');
                    statusMessage.innerHTML = `<i class="fas fa-info-circle mr-2"></i>${message}`;
                    statusMessage.className = 'text-yellow-400';
                }
            } else if (!templateId) {
                statusMessage.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>Selecione um template para continuar';
                statusMessage.className = 'text-gray-400';
            }
        }
    }
}

// Limpar seleções
function clearSelections() {
    selectedListIds = [];
    selectedParticipantIds = [];
    
    // Limpar checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Limpar busca
    document.getElementById('participantSearch').value = '';
    document.getElementById('participantsSearchResults').innerHTML = '<p class="text-gray-400">Digite para buscar participantes...</p>';
    
    updateCounters();
    validateForm();
}

// Event handler para mudança de template
function onTemplateChange() {
    const templateSelect = document.getElementById('templateSelect');
    const selectedTemplateId = templateSelect.value;
    
    if (selectedTemplateId) {
        const selectedTemplate = templateSelect.options[templateSelect.selectedIndex];
        console.log('[BULK-SEND] Template selecionado:', {
            id: selectedTemplateId,
            name: selectedTemplate.textContent
        });
        
        // Feedback visual de que template foi selecionado
        templateSelect.classList.remove('border-gray-500');
        templateSelect.classList.add('border-green-500');
        
        // Atualizar status message
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.innerHTML = `<i class="fas fa-check-circle mr-2 text-green-400"></i>Template "${selectedTemplate.textContent}" selecionado`;
            statusMessage.className = 'text-green-400';
        }
    } else {
        // Remover feedback visual se nenhum template selecionado
        templateSelect.classList.remove('border-green-500');
        templateSelect.classList.add('border-gray-500');
    }
    
    validateForm();
}

// Enviar emails em massa
async function sendBulkEmail() {
    const sendButton = document.getElementById('sendButton');
    const originalText = sendButton.innerHTML;
    
    try {
        // Validar dados
        const templateId = document.getElementById('templateSelect').value;
        const subject = document.getElementById('emailSubject').value.trim();
        const senderName = document.getElementById('senderName').value.trim();
        
        if (!templateId || !subject || !senderName) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        if (selectedListIds.length === 0 && selectedParticipantIds.length === 0) {
            alert('Por favor, selecione pelo menos uma lista ou participante.');
            return;
        }
        
        // Desabilitar botão e mostrar loading
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando...';
        
        console.log('[BULK-SEND] Iniciando envio:', {
            templateId,
            listIds: selectedListIds,
            participantIds: selectedParticipantIds,
            subject,
            senderName
        });
        
        // Dados para envio
        const bulkData = {
            recipients: {
                listIds: selectedListIds,
                participantIds: selectedParticipantIds
            },
            subject: subject,
            senderName: senderName
        };
        
        // Enviar requisição
        const response = await fetch(`${apiClient.baseURL}/email-templates/${templateId}/send-bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('clientToken')}`
            },
            body: JSON.stringify(bulkData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }
        
        console.log('[BULK-SEND] Envio concluído:', result);
        
        // Sucesso
        alert(`E-mails enviados com sucesso!\n\nProcessados: ${result.processed || 0}\nErros: ${result.errors || 0}`);
        
        // Limpar formulário
        clearSelections();
        document.getElementById('emailSubject').value = '';
        document.getElementById('senderName').value = '';
        document.getElementById('templateSelect').value = '';
        
    } catch (error) {
        console.error('[BULK-SEND] Erro no envio:', error);
        alert(`Erro ao enviar e-mails:\n${error.message}`);
    } finally {
        // Restaurar botão
        sendButton.disabled = false;
        sendButton.innerHTML = originalText;
        validateForm();
    }
}

// Funções do menu (reutilizadas)
function toggleEngagementEmailMenu() {
    const menu = document.getElementById('engagementEmailMenu');
    const arrow = document.getElementById('engagementEmailArrow');
    
    if (menu && arrow) {
        const isHidden = menu.classList.contains('hidden');
        
        if (isHidden) {
            menu.classList.remove('hidden');
            arrow.style.transform = 'rotate(90deg)';
        } else {
            menu.classList.add('hidden');
            arrow.style.transform = 'rotate(0deg)';
        }
    }
}

function toggleFinanceMenu() {
    const menu = document.getElementById('financeMenu');
    const arrow = document.getElementById('financeArrow');
    
    if (menu && arrow) {
        const isHidden = menu.classList.contains('hidden');
        
        if (isHidden) {
            menu.classList.remove('hidden');
            arrow.style.transform = 'rotate(90deg)';
        } else {
            menu.classList.add('hidden');
            arrow.style.transform = 'rotate(0deg)';
        }
    }
}

function toggleSettingsMenu() {
    const menu = document.getElementById('settingsMenu');
    const arrow = document.getElementById('settingsArrow');
    
    if (menu && arrow) {
        const isHidden = menu.classList.contains('hidden');
        
        if (isHidden) {
            menu.classList.remove('hidden');
            arrow.style.transform = 'rotate(90deg)';
        } else {
            menu.classList.add('hidden');
            arrow.style.transform = 'rotate(0deg)';
        }
    }
} 