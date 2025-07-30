// Gerenciamento de Templates de E-mail Marketing
// MVP: Listagem de templates de e-mail marketing

// 🔧 Inicializar APIClient quando a página carregar
let apiClient;
document.addEventListener('DOMContentLoaded', function() {
  if (typeof APIClient !== 'undefined') {
    window.apiClient = new APIClient();
    apiClient = window.apiClient;
    console.log('✅ [TEMPLATES] APIClient inicializado');
  } else {
    console.error('❌ [TEMPLATES] APIClient não encontrado - verifique se api-client.js foi carregado');
  }
  
  console.log('📧 [TEMPLATES] Página carregada, inicializando...');
  renderEmailTemplatesList();
});

// 🔧 CORREÇÃO: Função para obter API_URL de forma segura
function getApiUrl() {
    return window.API_URL ||
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL :
           'http://localhost:3000/api');
}

// 🔧 CORREÇÃO: Variável global para armazenar lista de e-mails
let emailTemplatesList = [];

// Generalizar para carregar todos os tipos
const DEFAULT_TYPE = 'all'; // ou 'welcome', 'promo', etc. se quiser filtrar
let currentType = DEFAULT_TYPE;

function renderEmailTemplatesList() {
  console.log('🔍 [TEMPLATES] Carregando templates de e-mail...');
  const tbody = document.getElementById('emailTemplatesListBody');
  if (!tbody) {
    console.error('❌ [TEMPLATES] Elemento emailTemplatesListBody não encontrado!');
    return;
  }
  tbody.innerHTML = '';
  const clientId = localStorage.getItem('clientId');
  if (!clientId) {
    console.error('❌ [TEMPLATES] ClientId não encontrado');
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-envelope"></i><h3>Não autenticado</h3><p>Faça login novamente para ver seus templates de e-mail</p></td></tr>';
    return;
  }
  loadEmailTemplates();
}

async function loadEmailTemplates() {
  try {
    const token = localStorage.getItem('clientToken');
    const clientId = localStorage.getItem('clientId');
    console.log('🔍 [TEMPLATES] Token encontrado:', token ? 'SIM' : 'NÃO');
    console.log('🔍 [TEMPLATES] ClientId encontrado:', clientId || 'NÃO');
    
    if (!token) {
      console.error('❌ [TEMPLATES] Token não encontrado');
      return;
    }
    let url = `${getApiUrl()}/email-templates`;
    if (currentType !== 'all') url += `?type=${currentType}`;
    console.log('🔍 [TEMPLATES] Fazendo requisição para:', url);
    console.log('🔍 [TEMPLATES] Headers:', {
      'Authorization': `Bearer ${token ? 'TOKEN_PRESENTE' : 'TOKEN_AUSENTE'}`,
      'Content-Type': 'application/json'
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('🔍 [TEMPLATES] Status da resposta:', response.status);
    console.log('🔍 [TEMPLATES] Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [TEMPLATES] Erro na resposta:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    console.log('🔍 [TEMPLATES] Dados recebidos:', data);
    console.log('🔍 [TEMPLATES] Templates encontrados:', data.templates ? data.templates.length : 0);
    
    emailTemplatesList = data.templates || data || [];
    renderEmailTemplatesTable();
  } catch (error) {
    console.error('❌ [TEMPLATES] Erro ao carregar templates:', error);
    showNotification('Erro ao carregar templates de e-mail: ' + error.message, 'error');
  }
}

function renderEmailTemplatesTable() {
  const tbody = document.getElementById('emailTemplatesListBody');
  const emptyMsg = document.getElementById('emptyTemplatesMessage');
  if (!emailTemplatesList || emailTemplatesList.length === 0) {
    tbody.innerHTML = '';
    if (emptyMsg) emptyMsg.style.display = 'flex';
    return;
  }
  if (emptyMsg) emptyMsg.style.display = 'none';
  tbody.innerHTML = emailTemplatesList.map((tpl, index) => {
    const statusToggle = `
      <div class="flex items-center gap-2">
        <button 
          onclick="toggleEmailTemplateStatus('${tpl._id}', '${tpl.status}')" 
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            tpl.status === 'active' 
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
          }"
          title="Clique para ${tpl.status === 'active' ? 'desativar' : 'ativar'}"
        >
          <i class="fas ${tpl.status === 'active' ? 'fa-check-circle' : 'fa-pause-circle'} text-xs"></i>
          <span class="text-xs font-medium">${tpl.status === 'active' ? 'Ativo' : 'Rascunho'}</span>
        </button>
      </div>
    `;
    
    // 🚀 NOVO: Botão Enviar condicional para templates tipo "campaign"
    const sendButton = tpl.type === 'campaign' && tpl.status === 'active' ? `
      <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-purple-400 hover:text-purple-300" 
              title="Enviar em Massa" 
              onclick="openBulkSendModal('${tpl._id}', '${tpl.name}', '${tpl.type}')">
        <i class="fas fa-share"></i>
      </button>
    ` : '';
    
    return `
      <tr class="hover:bg-gray-800 transition-colors">
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-envelope text-green-400"></i>
            </div>
            <div>
              <div class="font-medium text-gray-200">${tpl.name || 'Sem nome'}</div>
              <div class="text-xs text-gray-400 mt-1">
                <span>${tpl.description || '-'}</span>
              </div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="text-sm text-gray-300">
            <i class="fas fa-calendar text-gray-400 mr-1"></i>
            ${tpl.createdAt ? new Date(tpl.createdAt).toLocaleDateString('pt-BR') : '-'}
          </div>
        </td>
        <td class="px-4 py-3">${statusToggle}</td>
        <td class="px-4 py-3">
          <div class="text-sm text-gray-300">
            <i class="fas fa-tag text-gray-400 mr-1"></i>
            ${tpl.type || '-'}
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="text-sm text-gray-300">
            <i class="fas fa-paper-plane text-gray-400 mr-1"></i>
            ${tpl.emailsSent || 0} enviados
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-1">
            ${sendButton}
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-blue-400 hover:text-blue-300" 
                    title="Visualizar" 
                    onclick="previewEmailTemplate('${tpl._id}', '${tpl.type || ''}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-green-400 hover:text-green-300" 
                    title="Editar" 
                    onclick="editEmailTemplate('${tpl._id}', '${tpl.type || ''}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-purple-400 hover:text-purple-300" 
                    title="Duplicar" 
                    onclick="duplicateEmailTemplate('${tpl._id}')">
              <i class="fas fa-copy"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-red-400 hover:text-red-300" 
                    title="Excluir" 
                    onclick="deleteEmailTemplate('${tpl._id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Funções de ação
function refreshEmailTemplates() {
  loadEmailTemplates();
}

function createEmailTemplate() {
  window.location.href = 'engajamento-email-template-editor.html';
}

async function toggleEmailTemplateStatus(templateId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'draft' : 'active';
  try {
    const token = localStorage.getItem('clientToken');
    if (!token) {
      showNotification('Token não encontrado', 'error');
      return;
    }
    const response = await fetch(`${getApiUrl()}/email-templates/${templateId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // Atualizar lista local
    const idx = emailTemplatesList.findIndex(tpl => tpl._id === templateId);
    if (idx !== -1) {
      emailTemplatesList[idx].status = newStatus;
      renderEmailTemplatesTable();
    }
    showNotification(`Template ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`, 'success');
  } catch (error) {
    showNotification('Erro ao atualizar status do template', 'error');
  }
}

function previewEmailTemplate(templateId, type) {
  window.open(`engajamento-email-template-editor.html?id=${templateId}&type=${type || ''}&preview=true`, '_blank');
}

function editEmailTemplate(templateId, type) {
  console.log('🔍 [EDIT] Função editEmailTemplate chamada');
  console.log('🔍 [EDIT] templateId:', templateId);
  console.log('🔍 [EDIT] type:', type);
  console.log('🔍 [EDIT] URL que será redirecionada:', `engajamento-email-template-editor.html?id=${templateId}&type=${type || ''}`);
  window.location.href = `engajamento-email-template-editor.html?id=${templateId}&type=${type || ''}`;
}

function duplicateEmailTemplate(templateId) {
  // MVP: duplicação local (pode ser adaptada para API futuramente)
  const tpl = emailTemplatesList.find(t => t._id === templateId);
  if (tpl) {
    const duplicated = {
      ...tpl,
      _id: Date.now().toString(),
      name: `${tpl.name} (Cópia)`,
      status: 'draft',
      emailsSent: 0,
      createdAt: new Date(),
    };
    emailTemplatesList.push(duplicated);
    renderEmailTemplatesTable();
    showNotification('Template duplicado localmente!', 'success');
  }
}

async function deleteEmailTemplate(templateId) {
  if (confirm('Tem certeza que deseja excluir este template de e-mail?')) {
    try {
      const token = localStorage.getItem('clientToken');
      if (!token) {
        showNotification('Token não encontrado', 'error');
        return;
      }
      const response = await fetch(`${getApiUrl()}/email-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      emailTemplatesList = emailTemplatesList.filter(tpl => tpl._id !== templateId);
      renderEmailTemplatesTable();
      showNotification('Template excluído com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao excluir template', 'error');
    }
  }
}

// =============================================================================
// 🚀 NOVAS FUNÇÕES DO MODAL DE ENVIO EM MASSA
// =============================================================================

// Variáveis globais para o modal
let currentBulkTemplate = null;
let selectedLists = new Set();
let selectedParticipants = new Set();
let allLists = [];
let allParticipants = [];

/**
 * 📧 Abre o modal de envio em massa
 */
function openBulkSendModal(templateId, templateName, templateType) {
  console.log('🚀 [BULK-SEND] Abrindo modal para template:', templateId);
  
  // Armazenar informações do template
  currentBulkTemplate = {
    id: templateId,
    name: templateName,
    type: templateType
  };
  
  // Limpar seleções anteriores
  selectedLists.clear();
  selectedParticipants.clear();
  
  // Atualizar informações do modal
  document.getElementById('modalTemplateName').textContent = templateName || 'Template';
  document.getElementById('modalTemplateType').textContent = `Tipo: ${templateType || 'Campaign'}`;
  
  // Carregar dados e mostrar modal
  loadModalData();
  document.getElementById('bulkSendModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevenir scroll
}

/**
 * ❌ Fecha o modal de envio em massa
 */
function closeBulkSendModal() {
  console.log('❌ [BULK-SEND] Fechando modal');
  
  document.getElementById('bulkSendModal').classList.add('hidden');
  document.body.style.overflow = 'auto'; // Restaurar scroll
  
  // Limpar dados
  currentBulkTemplate = null;
  selectedLists.clear();
  selectedParticipants.clear();
  updateRecipientsCount();
}

/**
 * 📊 Carrega dados necessários para o modal
 */
async function loadModalData() {
  console.log('📊 [BULK-SEND] Carregando dados do modal...');
  
  try {
    // Carregar listas em paralelo
    await Promise.all([
      loadModalLists(),
      // loadModalParticipants() // Será carregado sob demanda via busca
    ]);
    
    console.log('✅ [BULK-SEND] Dados carregados com sucesso');
  } catch (error) {
    console.error('❌ [BULK-SEND] Erro ao carregar dados:', error);
    showNotification('Erro ao carregar dados do modal', 'error');
  }
}

/**
 * 📋 Carrega e renderiza as listas disponíveis
 */
async function loadModalLists() {
  const container = document.getElementById('listsCheckboxContainer');
  
  try {
    console.log('📋 [BULK-SEND] Carregando listas...');
    
    // Usar o mesmo método do participants.js
    const data = await window.apiClient.getParticipantLists();
    allLists = Array.isArray(data) ? data : [];
    
    console.log(`📋 [BULK-SEND] ${allLists.length} listas carregadas`);
    
    if (allLists.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-400 py-8">
          <i class="fas fa-list text-2xl mb-2"></i>
          <p>Nenhuma lista encontrada</p>
          <a href="participants.html" class="text-blue-400 hover:text-blue-300 text-sm">
            Criar primeira lista
          </a>
        </div>
      `;
      return;
    }
    
    // Renderizar checkboxes das listas
    container.innerHTML = allLists.map(list => {
      const participantsCount = list.participants?.length || 0;
      return `
        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-600/50 cursor-pointer transition-colors">
          <input type="checkbox" 
                 class="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                 onchange="toggleListSelection('${list._id}', this.checked)"
                 data-list-id="${list._id}">
          <div class="flex-1">
            <div class="font-medium text-gray-200">${list.name}</div>
            <div class="text-sm text-gray-400">
              ${participantsCount} participante${participantsCount !== 1 ? 's' : ''}
            </div>
          </div>
          <div class="text-xs bg-gray-600 px-2 py-1 rounded">
            ${list.tipo || 'lista'}
          </div>
        </label>
      `;
    }).join('');
    
  } catch (error) {
    console.error('❌ [BULK-SEND] Erro ao carregar listas:', error);
    container.innerHTML = `
      <div class="text-center text-red-400 py-8">
        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
        <p>Erro ao carregar listas</p>
      </div>
    `;
  }
}

/**
 * ✅ Toggle seleção de lista
 */
function toggleListSelection(listId, isSelected) {
  console.log(`✅ [BULK-SEND] Toggle lista ${listId}:`, isSelected);
  
  if (isSelected) {
    selectedLists.add(listId);
  } else {
    selectedLists.delete(listId);
  }
  
  updateRecipientsCount();
}

/**
 * ✅ Toggle seleção de participante individual
 */
function toggleParticipantSelection(participantId, isSelected) {
  console.log(`✅ [BULK-SEND] Toggle participante ${participantId}:`, isSelected);
  
  if (isSelected) {
    selectedParticipants.add(participantId);
  } else {
    selectedParticipants.delete(participantId);
  }
  
  updateRecipientsCount();
}

/**
 * 🔍 Busca participantes (executada quando o usuário digita)
 */
let searchTimeout = null;
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('participantSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchParticipants(e.target.value.trim());
      }, 500); // Debounce de 500ms
    });
  }
});

/**
 * 🔍 Executa busca de participantes
 */
async function searchParticipants(query) {
  const container = document.getElementById('participantsCheckboxContainer');
  
  if (!query || query.length < 2) {
    container.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <i class="fas fa-users text-2xl mb-2"></i>
        <p>Digite pelo menos 2 caracteres para buscar</p>
      </div>
    `;
    return;
  }
  
  try {
    console.log('🔍 [BULK-SEND] Buscando participantes:', query);
    
    // Mostrar loading
    container.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
        <p>Buscando participantes...</p>
      </div>
    `;
    
    // Buscar participantes via API
    const participants = await window.apiClient.getParticipants({
      limit: 50,
      filters: {
        search: query // Assumindo que a API suporta busca
      }
    });
    
    allParticipants = participants.data || participants || [];
    console.log(`🔍 [BULK-SEND] ${allParticipants.length} participantes encontrados`);
    
    if (allParticipants.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-400 py-8">
          <i class="fas fa-user-slash text-2xl mb-2"></i>
          <p>Nenhum participante encontrado</p>
          <p class="text-sm">Tente termos diferentes</p>
        </div>
      `;
      return;
    }
    
    // Renderizar participantes
    container.innerHTML = allParticipants.map(participant => `
      <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-600/50 cursor-pointer transition-colors">
        <input type="checkbox" 
               class="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
               onchange="toggleParticipantSelection('${participant._id}', this.checked)"
               data-participant-id="${participant._id}"
               ${selectedParticipants.has(participant._id) ? 'checked' : ''}>
        <div class="flex-1">
          <div class="font-medium text-gray-200">${participant.name}</div>
          <div class="text-sm text-gray-400">${participant.email}</div>
          ${participant.company ? `<div class="text-xs text-gray-500">${participant.company}</div>` : ''}
        </div>
        <div class="text-xs bg-gray-600 px-2 py-1 rounded">
          ${participant.status || 'ativo'}
        </div>
      </label>
    `).join('');
    
  } catch (error) {
    console.error('❌ [BULK-SEND] Erro ao buscar participantes:', error);
    container.innerHTML = `
      <div class="text-center text-red-400 py-8">
        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
        <p>Erro ao buscar participantes</p>
      </div>
    `;
  }
}

/**
 * 📊 Atualiza contadores de destinatários
 */
function updateRecipientsCount() {
  const listsCount = selectedLists.size;
  const participantsCount = selectedParticipants.size;
  
  // Calcular total estimado (pode haver sobreposição)
  let totalEstimated = participantsCount;
  
  // Somar participantes das listas selecionadas
  selectedLists.forEach(listId => {
    const list = allLists.find(l => l._id === listId);
    if (list && list.participants) {
      totalEstimated += list.participants.length;
    }
  });
  
  // Atualizar contadores na UI
  document.getElementById('selectedListsCount').textContent = listsCount;
  document.getElementById('selectedParticipantsCount').textContent = participantsCount;
  document.getElementById('totalRecipientsCount').textContent = totalEstimated;
  
  // Atualizar estado do botão de envio
  const sendButton = document.getElementById('bulkSendButton');
  const footerInfo = document.getElementById('modalFooterInfo');
  
  if (totalEstimated > 0) {
    sendButton.disabled = false;
    footerInfo.textContent = `${totalEstimated} destinatário${totalEstimated !== 1 ? 's' : ''} selecionado${totalEstimated !== 1 ? 's' : ''}`;
  } else {
    sendButton.disabled = true;
    footerInfo.textContent = 'Selecione destinatários para continuar';
  }
  
  console.log('📊 [BULK-SEND] Contadores atualizados:', {
    listas: listsCount,
    individuais: participantsCount,
    total: totalEstimated
  });
}

/**
 * 📤 Processa o envio em massa
 */
async function processBulkSend() {
  console.log('📤 [BULK-SEND] Iniciando processamento...');
  
  if (!currentBulkTemplate) {
    showNotification('Erro: Template não selecionado', 'error');
    return;
  }
  
  const subject = document.getElementById('bulkEmailSubject').value.trim();
  const senderName = document.getElementById('bulkSenderName').value.trim();
  
  if (!subject) {
    showNotification('Por favor, digite o assunto do e-mail', 'error');
    document.getElementById('bulkEmailSubject').focus();
    return;
  }
  
  // Preparar dados do envio
  const bulkData = {
    recipients: {
      listIds: Array.from(selectedLists),
      participantIds: Array.from(selectedParticipants)
    },
    subject: subject,
    senderName: senderName || undefined
  };
  
  console.log('📤 [BULK-SEND] Dados preparados:', bulkData);
  
  try {
    // Desabilitar botão e mostrar loading
    const sendButton = document.getElementById('bulkSendButton');
    const originalText = sendButton.innerHTML;
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando...';
    
    // Fazer chamada para o backend (será implementado na próxima fase)
    const response = await fetch(`${getApiUrl()}/email-templates/${currentBulkTemplate.id}/send-bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('clientToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bulkData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ [BULK-SEND] Envio iniciado:', result);
    
    // Mostrar sucesso
    showNotification(`Envio em massa iniciado! ${result.totalRecipients || 'Vários'} destinatários serão processados.`, 'success');
    
    // Fechar modal
    closeBulkSendModal();
    
    // Atualizar lista de templates
    refreshEmailTemplates();
    
  } catch (error) {
    console.error('❌ [BULK-SEND] Erro no envio:', error);
    showNotification('Erro ao iniciar envio em massa: ' + error.message, 'error');
    
    // Restaurar botão
    const sendButton = document.getElementById('bulkSendButton');
    sendButton.disabled = false;
    sendButton.innerHTML = originalText;
  }
}

// Fechar modal ao clicar fora (ESC key)
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && !document.getElementById('bulkSendModal').classList.contains('hidden')) {
    closeBulkSendModal();
  }
});

// =============================================================================
// 🔄 ATUALIZAÇÃO DAS FUNÇÕES EXISTENTES
// =============================================================================

// Garantir que o refreshWelcomeEmails chama a função correta
function refreshWelcomeEmails() {
  refreshEmailTemplates();
}

function showNotification(message, type = 'info') {
  alert(message); // Substituir por sistema de notificação mais elegante
} 