// Gerenciamento de Templates de E-mail Marketing
// MVP: Listagem de templates de e-mail marketing

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

document.addEventListener('DOMContentLoaded', function() {
  console.log('📧 [TEMPLATES] Página carregada, inicializando...');
  renderEmailTemplatesList();
});

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

function showNotification(message, type = 'info') {
  alert(message); // Substituir por sistema de notificação mais elegante
} 