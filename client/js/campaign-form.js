// Variáveis globais
let formFields = [];
let campaignType = localStorage.getItem('campaignType') || 'form';
let campaignId = localStorage.getItem('campaignId');
let currentStep = 1;
let selectedParticipants = new Set();

// Funções do Modal de Campo
function showFieldModal() {
    document.getElementById('fieldModal').style.display = 'block';
}

function closeFieldModal() {
    document.getElementById('fieldModal').style.display = 'none';
    document.getElementById('fieldForm').reset();
}

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    const modal = document.getElementById('fieldModal');
    if (event.target == modal) {
        closeFieldModal();
    }
}

// Funções de gerenciamento de campos
function addField() {
    showFieldModal();
}

function handleAddField(event) {
    event.preventDefault();
    
    const fieldData = {
        id: Date.now(),
        type: document.getElementById('fieldType').value,
        label: document.getElementById('fieldLabel').value,
        placeholder: document.getElementById('fieldPlaceholder').value,
        required: document.getElementById('fieldRequired').checked,
        options: document.getElementById('fieldType').value === 'select' ? 
                document.getElementById('fieldOptionsList').value.split('\n').filter(opt => opt.trim()) : 
                []
    };
    
    formFields.push(fieldData);
    updateFieldsList();
    updateFormPreview();
    updateEmbedCode();
    
    closeFieldModal();
    return false;
}

function editField(fieldId) {
    const field = formFields.find(f => f.id === fieldId);
    if (!field) return;
    
    document.getElementById('fieldType').value = field.type;
    document.getElementById('fieldLabel').value = field.label;
    document.getElementById('fieldPlaceholder').value = field.placeholder;
    document.getElementById('fieldRequired').checked = field.required;
    if (field.type === 'select') {
        document.getElementById('fieldOptionsList').value = field.options.join('\n');
        document.getElementById('fieldOptions').style.display = 'block';
    } else {
        document.getElementById('fieldOptions').style.display = 'none';
    }
    
    showFieldModal();
    formFields = formFields.filter(f => f.id !== fieldId);
    updateFieldsList();
    updateFormPreview();
    updateEmbedCode();
}

function deleteField(fieldId) {
    if (confirm('Tem certeza que deseja excluir este campo?')) {
        formFields = formFields.filter(f => f.id !== fieldId);
        updateFieldsList();
        updateFormPreview();
        updateEmbedCode();
    }
}

// Funções de atualização da interface
function updateFieldsList() {
    const fieldsList = document.getElementById('fieldsList');
    fieldsList.innerHTML = '';
    
    formFields.forEach(field => {
        const fieldElement = document.createElement('div');
        fieldElement.className = 'field-item';
        fieldElement.innerHTML = `
            <div class="field-item-header">
                <span class="field-item-title">${field.label}</span>
                <div class="field-item-actions">
                    <button onclick="editField(${field.id})" title="Editar">✏️</button>
                    <button onclick="deleteField(${field.id})" title="Excluir">🗑️</button>
                </div>
            </div>
            <div class="field-item-details">
                <small>Tipo: ${field.type}</small>
                ${field.required ? '<small>Obrigatório</small>' : ''}
            </div>
        `;
        fieldsList.appendChild(fieldElement);
    });
}

function updateFormPreview() {
    const preview = document.getElementById('formPreview');
    preview.innerHTML = `
        <h3>${document.getElementById('formTitle').value || 'Formulário'}</h3>
        <p>${document.getElementById('formDescription').value || ''}</p>
        <form id="previewForm">
            ${formFields.map(field => generateFieldHTML(field)).join('')}
        </form>
    `;
}

function generateFieldHTML(field) {
    let html = `
        <div class="form-group">
            <label for="field_${field.id}">${field.label}${field.required ? ' *' : ''}</label>
    `;
    
    switch (field.type) {
        case 'textarea':
            html += `
                <textarea id="field_${field.id}" 
                    placeholder="${field.placeholder}"
                    ${field.required ? 'required' : ''}></textarea>
            `;
            break;
        case 'select':
            html += `
                <select id="field_${field.id}" ${field.required ? 'required' : ''}>
                    <option value="">Selecione...</option>
                    ${field.options.map(opt => `
                        <option value="${opt}">${opt}</option>
                    `).join('')}
                </select>
            `;
            break;
        default:
            html += `
                <input type="${field.type}" 
                    id="field_${field.id}"
                    placeholder="${field.placeholder}"
                    ${field.required ? 'required' : ''}>
            `;
    }
    
    html += '</div>';
    return html;
}

function updateEmbedCode() {
    const formData = {
        title: document.getElementById('formTitle').value,
        description: document.getElementById('formDescription').value,
        theme: document.getElementById('formTheme').value,
        fields: formFields,
        type: campaignType
    };
    
    const embedCode = `
<!-- Código de incorporação do formulário -->
<script>
    window.REFERRAL_FORM_DATA = ${JSON.stringify(formData)};
</script>
<script src="https://seu-dominio.com/embed.js"></script>
<div id="referral-form-container"></div>
    `.trim();
    
    document.getElementById('embedCode').textContent = embedCode;
}

// Funções de gerenciamento do formulário
function previewForm() {
    // Aqui você implementaria a lógica para visualizar o formulário em tela cheia
    console.log('Visualizar formulário');
}

function saveForm() {
    const formData = {
        title: document.getElementById('formTitle').value,
        description: document.getElementById('formDescription').value,
        theme: document.getElementById('formTheme').value,
        fields: formFields,
        type: campaignType
    };
    
    // Aqui você faria uma chamada para a API para salvar o formulário
    console.log('Salvar formulário:', formData);
    
    // Redirecionar de volta para a página de campanhas
    window.location.href = 'campaigns.html';
}

function copyCode() {
    const code = document.getElementById('embedCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Código copiado para a área de transferência!');
    });
}

// Event Listeners
document.getElementById('fieldType').addEventListener('change', function() {
    const optionsDiv = document.getElementById('fieldOptions');
    optionsDiv.style.display = this.value === 'select' ? 'block' : 'none';
});

// Funções de navegação entre etapas
function showStep(step) {
    // Ocultar todas as etapas
    document.querySelectorAll('.step-content').forEach(el => el.style.display = 'none');
    
    // Mostrar a etapa atual
    document.getElementById(`step${step}`).style.display = 'block';
    
    // Atualizar indicadores de etapa
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
    
    // Atualizar botões de navegação
    document.getElementById('prevButton').style.display = step > 1 ? 'block' : 'none';
    document.getElementById('nextButton').textContent = step === 4 ? 'Finalizar' : 'Próxima';
    
    // Carregar dados específicos da etapa
    if (step === 4) {
        loadParticipantsForCampaign();
    }
}

function nextStep() {
    if (validateCurrentStep()) {
        currentStep++;
        if (currentStep > 4) {
            saveCampaign();
            return;
        }
        showStep(currentStep);
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

// Funções de validação
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return validateBasicInfo();
        case 2:
            return validateSettings();
        case 3:
            return validateRewards();
        case 4:
            return validateParticipants();
        default:
            return true;
    }
}

// Funções específicas para a etapa 4 (Participantes)
function loadParticipantsForCampaign() {
    const participants = JSON.parse(localStorage.getItem('participants') || '[]');
    const listContainer = document.getElementById('participantsList');
    const selectedList = document.getElementById('selectedParticipantsList');
    
    if (!listContainer || !selectedList) return;
    
    // Limpar as listas
    listContainer.innerHTML = '';
    selectedList.innerHTML = '';
    
    if (participants.length === 0) {
        listContainer.innerHTML = '<p class="no-data">Nenhum participante cadastrado</p>';
        return;
    }
    
    // Adicionar participantes à lista
    participants.forEach(participant => {
        const participantItem = document.createElement('div');
        participantItem.className = 'participant-item';
        participantItem.innerHTML = `
            <label>
                <input type="checkbox" value="${participant.id}" 
                    ${selectedParticipants.has(participant.id) ? 'checked' : ''}
                    onchange="toggleParticipant(${participant.id}, '${participant.name}', '${participant.email}')">
                <div class="participant-info">
                    <span class="participant-name">${participant.name}</span>
                    <span class="participant-email">${participant.email}</span>
                </div>
            </label>
        `;
        listContainer.appendChild(participantItem);
    });
    
    updateSelectedParticipantsList();
}

function toggleParticipant(id, name, email) {
    if (selectedParticipants.has(id)) {
        selectedParticipants.delete(id);
    } else {
        selectedParticipants.add(id);
    }
    
    updateSelectedParticipantsList();
    updateSelectedCount();
}

function toggleAllParticipants() {
    const checkboxes = document.querySelectorAll('#participantsList input[type="checkbox"]');
    const selectAll = document.getElementById('selectAllParticipants');
    
    checkboxes.forEach(checkbox => {
        const id = parseInt(checkbox.value);
        const participantInfo = checkbox.closest('label').querySelector('.participant-info');
        const name = participantInfo.querySelector('.participant-name').textContent;
        const email = participantInfo.querySelector('.participant-email').textContent;
        
        checkbox.checked = selectAll.checked;
        
        if (selectAll.checked) {
            selectedParticipants.add(id);
        } else {
            selectedParticipants.delete(id);
        }
    });
    
    updateSelectedParticipantsList();
    updateSelectedCount();
}

function updateSelectedParticipantsList() {
    const selectedList = document.getElementById('selectedParticipantsList');
    if (!selectedList) return;
    
    selectedList.innerHTML = '';
    
    const participants = JSON.parse(localStorage.getItem('participants') || '[]');
    
    selectedParticipants.forEach(id => {
        const participant = participants.find(p => p.id === id);
        if (participant) {
            const tag = document.createElement('div');
            tag.className = 'selected-participant-tag';
            tag.innerHTML = `
                <span>${participant.name}</span>
                <span class="remove-participant" onclick="toggleParticipant(${id})">&times;</span>
            `;
            selectedList.appendChild(tag);
        }
    });
}

function updateSelectedCount() {
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
        countElement.textContent = `${selectedParticipants.size} selecionados`;
    }
}

function filterParticipants() {
    const searchTerm = document.getElementById('participantSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const items = document.querySelectorAll('.participant-item');
    
    items.forEach(item => {
        const name = item.querySelector('.participant-name').textContent.toLowerCase();
        const email = item.querySelector('.participant-email').textContent.toLowerCase();
        const status = item.querySelector('.participant-status')?.textContent.toLowerCase() || 'active';
        
        const matchesSearch = name.includes(searchTerm) || email.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        
        item.style.display = matchesSearch && matchesStatus ? 'flex' : 'none';
    });
}

function validateParticipants() {
    if (selectedParticipants.size === 0) {
        alert('Selecione pelo menos um participante para a campanha.');
        return false;
    }
    return true;
}

function saveCampaign() {
    // Obter dados do formulário
    const name = document.getElementById('campaignName').value;
    const description = document.getElementById('campaignDescription').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const rewardType = document.querySelector('input[name="rewardType"]:checked')?.value;
    const rewardValue = document.getElementById('rewardValue').value;
    const productName = document.getElementById('productName').value;
    
    // Criar objeto da campanha
    const campaign = {
        id: Date.now(),
        name,
        description,
        startDate,
        endDate,
        reward: {
            type: rewardType,
            value: rewardType === 'product' ? productName : rewardValue
        },
        participants: Array.from(selectedParticipants),
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    // Obter campanhas existentes
    const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
    
    // Adicionar nova campanha
    campaigns.push(campaign);
    
    // Salvar no localStorage
    localStorage.setItem('campaigns', JSON.stringify(campaigns));
    
    // Redirecionar para a lista de campanhas
    alert('Campanha criada com sucesso!');
    window.location.href = 'campaigns.html';
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    checkAuth(); // Função do dashboard.js
    
    // Se estiver editando uma campanha existente, carregar os dados
    if (campaignId) {
        // Aqui você faria uma chamada para a API para buscar os dados da campanha
        const mockData = {
            title: 'Formulário de Indicação',
            description: 'Preencha os dados para participar do programa de indicação',
            theme: 'light',
            fields: [
                {
                    id: 1,
                    type: 'text',
                    label: 'Nome Completo',
                    placeholder: 'Digite seu nome completo',
                    required: true
                },
                {
                    id: 2,
                    type: 'email',
                    label: 'E-mail',
                    placeholder: 'Digite seu e-mail',
                    required: true
                }
            ]
        };
        
        document.getElementById('formTitle').value = mockData.title;
        document.getElementById('formDescription').value = mockData.description;
        document.getElementById('formTheme').value = mockData.theme;
        formFields = mockData.fields;
        
        updateFieldsList();
        updateFormPreview();
        updateEmbedCode();
    }
    
    showStep(1);
    
    // Adicionar evento de busca
    const searchInput = document.getElementById('participantSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterParticipants);
    }
}); 