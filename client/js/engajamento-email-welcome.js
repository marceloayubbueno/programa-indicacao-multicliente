// Gerenciamento de E-mails de Boas-vindas
// MVP: Listagem de templates de e-mail de boas-vindas

// 🔧 CORREÇÃO: Função para obter API_URL de forma segura
function getApiUrl() {
    return window.API_URL ||
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL :
           'http://localhost:3000/api');
}

// 🔧 CORREÇÃO: Variável global para armazenar lista de e-mails
let welcomeEmailsList = [];

document.addEventListener('DOMContentLoaded', function() {
  console.log('📧 [WELCOME] Página carregada, inicializando...');
  renderWelcomeEmailsList();
});

function renderWelcomeEmailsList() {
  console.log('🔍 [WELCOME] Carregando e-mails de boas-vindas...');
  const tbody = document.getElementById('welcomeEmailsListBody');
  if (!tbody) {
    console.error('❌ [WELCOME] Elemento welcomeEmailsListBody não encontrado!');
    return;
  }
  
  tbody.innerHTML = '';
  const clientId = localStorage.getItem('clientId');
  const token = localStorage.getItem('clientToken');
  
  if (!clientId) {
    console.error('❌ [WELCOME] ClientId não encontrado');
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-envelope"></i><h3>Não autenticado</h3><p>Faça login novamente para ver seus e-mails de boas-vindas</p></td></tr>';
    return;
  }
  
  // Carregar dados reais da API
  loadWelcomeEmails();
}

async function loadWelcomeEmails() {
  try {
    const token = localStorage.getItem('clientToken');
    if (!token) {
      console.error('❌ [WELCOME] Token não encontrado');
      return;
    }

    const response = await fetch(`${getApiUrl()}/email-templates?type=welcome`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    welcomeEmailsList = data.templates || [];
    console.log(`✅ [WELCOME] ${welcomeEmailsList.length} e-mails carregados da API`);
    renderWelcomeEmailsTable();
  } catch (error) {
    console.error('❌ [WELCOME] Erro ao carregar e-mails:', error);
    showNotification('Erro ao carregar e-mails de boas-vindas', 'error');
  }
}

function renderWelcomeEmailsTable() {
  console.log(`🎨 [WELCOME] Renderizando ${welcomeEmailsList.length} e-mails na tabela`);
  const tbody = document.getElementById('welcomeEmailsListBody');
  
  if (!welcomeEmailsList || welcomeEmailsList.length === 0) {
    console.log('📝 [WELCOME] Nenhum e-mail encontrado, mostrando mensagem vazia');
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><div class="text-center py-12"><div class="text-gray-400 text-xl mb-4"><i class="fas fa-envelope fa-3x"></i></div><p class="text-gray-300 text-lg">Nenhum e-mail de boas-vindas criado</p><p class="text-gray-500 text-sm mt-2">Clique em "Novo E-mail Boas-vindas" para começar.</p></div></td></tr>';
    return;
  }
  
  tbody.innerHTML = welcomeEmailsList.map((email, index) => {
    console.log(`🔍 [WELCOME] E-mail ${index}:`, email);
    
    // Status toggle button
    const statusToggle = `
      <div class="flex items-center gap-2">
        <button 
          onclick="toggleWelcomeEmailStatus('${email._id}', '${email.status}')" 
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            email.status === 'active' 
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
          }"
          title="Clique para ${email.status === 'active' ? 'desativar' : 'ativar'}"
        >
          <i class="fas ${email.status === 'active' ? 'fa-check-circle' : 'fa-pause-circle'} text-xs"></i>
          <span class="text-xs font-medium">${email.status === 'active' ? 'Ativo' : 'Rascunho'}</span>
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
              <div class="font-medium text-gray-200">${email.name || 'Sem nome'}</div>
              <div class="text-xs text-gray-400 mt-1">
                <span>${email.description || 'E-mail de boas-vindas'}</span>
              </div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="text-sm text-gray-300">
            <i class="fas fa-calendar text-gray-400 mr-1"></i>
            ${email.createdAt ? new Date(email.createdAt).toLocaleDateString('pt-BR') : '-'}
          </div>
        </td>
        <td class="px-4 py-3">${statusToggle}</td>
        <td class="px-4 py-3">
          <div class="text-sm text-gray-300">
            <i class="fas fa-paper-plane text-gray-400 mr-1"></i>
            ${email.emailsSent || 0} enviados
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-1">
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-blue-400 hover:text-blue-300" 
                    title="Visualizar" 
                    onclick="previewWelcomeEmail('${email._id}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-green-400 hover:text-green-300" 
                    title="Editar" 
                    onclick="editWelcomeEmail('${email._id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-purple-400 hover:text-purple-300" 
                    title="Duplicar" 
                    onclick="duplicateWelcomeEmail('${email._id}')">
              <i class="fas fa-copy"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-red-400 hover:text-red-300" 
                    title="Excluir" 
                    onclick="deleteWelcomeEmail('${email._id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Funções de ação
async function toggleWelcomeEmailStatus(emailId, currentStatus) {
  console.log(`🔄 [WELCOME] Alternando status do e-mail ${emailId} de ${currentStatus}`);
  const newStatus = currentStatus === 'active' ? 'draft' : 'active';
  
  try {
    const token = localStorage.getItem('clientToken');
    if (!token) {
      showNotification('Token não encontrado', 'error');
      return;
    }

    const response = await fetch(`${getApiUrl()}/email-templates/${emailId}/status`, {
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

    const data = await response.json();
    
    // Atualizar lista local
    const emailIndex = welcomeEmailsList.findIndex(email => email._id === emailId);
    if (emailIndex !== -1) {
      welcomeEmailsList[emailIndex].status = newStatus;
      renderWelcomeEmailsTable();
    }
    
    showNotification(`E-mail ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`, 'success');
  } catch (error) {
    console.error('❌ [WELCOME] Erro ao atualizar status:', error);
    showNotification('Erro ao atualizar status do e-mail', 'error');
  }
}

function previewWelcomeEmail(emailId) {
  console.log(`👁️ [WELCOME] Visualizando e-mail ${emailId}`);
  window.open(`engajamento-email-template-editor.html?type=welcome&id=${emailId}&preview=true`, '_blank');
}

function editWelcomeEmail(emailId) {
  console.log(`✏️ [WELCOME] Editando e-mail ${emailId}`);
  window.location.href = `engajamento-email-template-editor.html?type=welcome&id=${emailId}`;
}

function duplicateWelcomeEmail(emailId) {
  console.log(`📋 [WELCOME] Duplicando e-mail ${emailId}`);
  const email = welcomeEmailsList.find(e => e.id === emailId);
  if (email) {
    const duplicatedEmail = {
      ...email,
      id: Date.now().toString(),
      name: `${email.name} (Cópia)`,
      status: 'draft',
      emailsSent: 0,
      createdAt: new Date()
    };
    welcomeEmailsList.push(duplicatedEmail);
    renderWelcomeEmailsTable();
    showNotification('E-mail duplicado com sucesso!', 'success');
  }
}

async function deleteWelcomeEmail(emailId) {
  console.log(`🗑️ [WELCOME] Excluindo e-mail ${emailId}`);
  if (confirm('Tem certeza que deseja excluir este e-mail de boas-vindas?')) {
    try {
      const token = localStorage.getItem('clientToken');
      if (!token) {
        showNotification('Token não encontrado', 'error');
        return;
      }

      const response = await fetch(`${getApiUrl()}/email-templates/${emailId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remover da lista local
      welcomeEmailsList = welcomeEmailsList.filter(email => email._id !== emailId);
      renderWelcomeEmailsTable();
      showNotification('E-mail excluído com sucesso!', 'success');
    } catch (error) {
      console.error('❌ [WELCOME] Erro ao excluir e-mail:', error);
      showNotification('Erro ao excluir e-mail', 'error');
    }
  }
}

function showNotification(message, type = 'info') {
  // Implementar sistema de notificação
  console.log(`📢 [WELCOME] ${type.toUpperCase()}: ${message}`);
  alert(message); // Substituir por sistema de notificação mais elegante
} 