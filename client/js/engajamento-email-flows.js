// Gerenciamento de Fluxos de E-mail
// MVP: Listagem de fluxos de e-mail automatizados

// 🔧 CORREÇÃO: Função para obter API_URL de forma segura
function getApiUrl() {
    return window.API_URL ||
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL :
           'http://localhost:3000/api');
}

// 🔧 CORREÇÃO: Variável global para armazenar lista de fluxos
let emailFlowsList = [];

document.addEventListener('DOMContentLoaded', function() {
  console.log('📧 [FLOWS] Página carregada, inicializando...');
  renderEmailFlowsList();
});

function renderEmailFlowsList() {
  console.log('🔍 [FLOWS] Carregando fluxos de e-mail...');
  const tbody = document.getElementById('emailFlowsListBody');
  if (!tbody) {
    console.error('❌ [FLOWS] Elemento emailFlowsListBody não encontrado!');
    return;
  }
  
  tbody.innerHTML = '';
  const clientId = localStorage.getItem('clientId');
  const token = localStorage.getItem('clientToken');
  
  if (!clientId) {
    console.error('❌ [FLOWS] ClientId não encontrado');
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-project-diagram"></i><h3>Não autenticado</h3><p>Faça login novamente para ver seus fluxos de e-mail</p></td></tr>';
    return;
  }
  
  const API_URL = getApiUrl();
  console.log(`🔗 [FLOWS] Fazendo requisição para: ${API_URL}/email-flows?clientId=${clientId}`);
  
  // Simular dados para MVP - substituir por chamada real da API
  setTimeout(() => {
    const mockData = [
      {
        id: '1',
        name: 'Fluxo de Onboarding',
        createdAt: new Date('2024-01-05'),
        status: 'active',
        emailsCount: 5,
        activeParticipants: 45,
        description: 'Fluxo automático para novos indicadores',
        trigger: 'Novo indicador cadastrado'
      },
      {
        id: '2',
        name: 'Fluxo de Reengajamento',
        createdAt: new Date('2024-01-15'),
        status: 'draft',
        emailsCount: 3,
        activeParticipants: 0,
        description: 'Fluxo para reativar indicadores inativos',
        trigger: 'Indicador inativo por 30 dias'
      },
      {
        id: '3',
        name: 'Fluxo de Promoção',
        createdAt: new Date('2024-01-25'),
        status: 'paused',
        emailsCount: 4,
        activeParticipants: 12,
        description: 'Fluxo promocional sazonal',
        trigger: 'Promoção ativa'
      }
    ];
    
    emailFlowsList = mockData;
    console.log(`✅ [FLOWS] ${emailFlowsList.length} fluxos carregados`);
    renderEmailFlowsTable();
  }, 500);
  
  // Código real da API (comentado para MVP)
  /*
  fetch(`${API_URL}/email-flows?clientId=${clientId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => {
      console.log(`📡 [FLOWS] Status da resposta: ${response.status}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('📊 [FLOWS] Dados recebidos:', data);
      emailFlowsList = data.data || data || [];
      console.log(`✅ [FLOWS] ${emailFlowsList.length} fluxos carregados`);
      renderEmailFlowsTable();
    })
    .catch(error => {
      console.error('❌ [FLOWS] Erro ao carregar fluxos:', error);
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>Erro ao carregar</h3><p>Erro: ' + error.message + '</p></td></tr>';
      showNotification('Erro ao carregar Fluxos de E-mail: ' + error.message, 'error');
    });
  */
}

function renderEmailFlowsTable() {
  console.log(`🎨 [FLOWS] Renderizando ${emailFlowsList.length} fluxos na tabela`);
  const tbody = document.getElementById('emailFlowsListBody');
  
  if (!emailFlowsList || emailFlowsList.length === 0) {
    console.log('📝 [FLOWS] Nenhum fluxo encontrado, mostrando mensagem vazia');
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="text-center py-12"><div class="text-gray-400 text-xl mb-4"><i class="fas fa-project-diagram fa-3x"></i></div><p class="text-gray-300 text-lg">Nenhum fluxo de e-mail criado</p><p class="text-gray-500 text-sm mt-2">Clique em "Novo Fluxo" para começar.</p></div></td></tr>';
    return;
  }
  
  tbody.innerHTML = emailFlowsList.map((flow, index) => {
    console.log(`🔍 [FLOWS] Fluxo ${index}:`, flow);
    
    // Status badge
    const getStatusBadge = (status) => {
      const statusConfig = {
        'draft': { color: 'bg-yellow-500/20 text-yellow-400', icon: 'fa-pause-circle', text: 'Rascunho' },
        'active': { color: 'bg-green-500/20 text-green-400', icon: 'fa-play-circle', text: 'Ativo' },
        'paused': { color: 'bg-red-500/20 text-red-400', icon: 'fa-stop-circle', text: 'Pausado' },
        'archived': { color: 'bg-gray-500/20 text-gray-400', icon: 'fa-archive', text: 'Arquivado' }
      };
      
      const config = statusConfig[status] || statusConfig['draft'];
      return `
        <div class="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${config.color}">
          <i class="fas ${config.icon} text-xs"></i>
          <span class="text-xs font-medium">${config.text}</span>
        </div>
      `;
    };
    
    return `
      <tr class="hover:bg-gray-800 transition-colors">
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-project-diagram text-orange-400"></i>
            </div>
            <div>
              <div class="font-medium text-gray-200">${flow.name || 'Sem nome'}</div>
              <div class="text-xs text-gray-400 mt-1">
                <span>${flow.description || 'Fluxo de e-mail'}</span>
                <br>
                <span class="text-orange-400"><i class="fas fa-bolt mr-1"></i>${flow.trigger || 'Trigger não definido'}</span>
              </div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="text-sm text-gray-300">
            <i class="fas fa-calendar text-gray-400 mr-1"></i>
            ${flow.createdAt ? new Date(flow.createdAt).toLocaleDateString('pt-BR') : '-'}
          </div>
        </td>
        <td class="px-4 py-3">${getStatusBadge(flow.status)}</td>
        <td class="px-4 py-3">
          <div class="text-sm text-gray-300">
            <i class="fas fa-envelope text-gray-400 mr-1"></i>
            ${flow.emailsCount || 0} e-mails
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="text-sm text-gray-300">
            <i class="fas fa-users text-gray-400 mr-1"></i>
            ${flow.activeParticipants || 0} ativos
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-1">
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-blue-400 hover:text-blue-300" 
                    title="Visualizar" 
                    onclick="previewEmailFlow('${flow.id}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-green-400 hover:text-green-300" 
                    title="Editar" 
                    onclick="editEmailFlow('${flow.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-orange-400 hover:text-orange-300" 
                    title="Duplicar" 
                    onclick="duplicateEmailFlow('${flow.id}')">
              <i class="fas fa-copy"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-purple-400 hover:text-purple-300" 
                    title="Relatórios" 
                    onclick="viewFlowReports('${flow.id}')">
              <i class="fas fa-chart-bar"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-yellow-400 hover:text-yellow-300" 
                    title="${flow.status === 'active' ? 'Pausar' : 'Ativar'}" 
                    onclick="toggleFlowStatus('${flow.id}', '${flow.status}')">
              <i class="fas ${flow.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-red-400 hover:text-red-300" 
                    title="Excluir" 
                    onclick="deleteEmailFlow('${flow.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Funções de ação
function previewEmailFlow(flowId) {
  console.log(`👁️ [FLOWS] Visualizando fluxo ${flowId}`);
  window.open(`engajamento-email-flow-editor.html?id=${flowId}&preview=true`, '_blank');
}

function editEmailFlow(flowId) {
  console.log(`✏️ [FLOWS] Editando fluxo ${flowId}`);
  window.location.href = `engajamento-email-flow-editor.html?id=${flowId}`;
}

function duplicateEmailFlow(flowId) {
  console.log(`📋 [FLOWS] Duplicando fluxo ${flowId}`);
  const flow = emailFlowsList.find(f => f.id === flowId);
  if (flow) {
    const duplicatedFlow = {
      ...flow,
      id: Date.now().toString(),
      name: `${flow.name} (Cópia)`,
      status: 'draft',
      activeParticipants: 0,
      createdAt: new Date()
    };
    emailFlowsList.push(duplicatedFlow);
    renderEmailFlowsTable();
    showNotification('Fluxo duplicado com sucesso!', 'success');
  }
}

function viewFlowReports(flowId) {
  console.log(`📊 [FLOWS] Visualizando relatórios do fluxo ${flowId}`);
  // Implementar página de relatórios
  showNotification('Funcionalidade de relatórios em desenvolvimento', 'info');
}

function toggleFlowStatus(flowId, currentStatus) {
  console.log(`🔄 [FLOWS] Alternando status do fluxo ${flowId} de ${currentStatus}`);
  const newStatus = currentStatus === 'active' ? 'paused' : 'active';
  
  // Simular atualização para MVP
  const flowIndex = emailFlowsList.findIndex(flow => flow.id === flowId);
  if (flowIndex !== -1) {
    emailFlowsList[flowIndex].status = newStatus;
    renderEmailFlowsTable();
    showNotification(`Fluxo ${newStatus === 'active' ? 'ativado' : 'pausado'} com sucesso!`, 'success');
  }
  
  // Código real da API (comentado para MVP)
  /*
  const API_URL = getApiUrl();
  const token = localStorage.getItem('clientToken');
  
  fetch(`${API_URL}/email-flows/${flowId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: newStatus })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        renderEmailFlowsList();
        showNotification(`Fluxo ${newStatus === 'active' ? 'ativado' : 'pausado'} com sucesso!`, 'success');
      } else {
        showNotification('Erro ao atualizar status: ' + data.message, 'error');
      }
    })
    .catch(error => {
      console.error('❌ [FLOWS] Erro ao atualizar status:', error);
      showNotification('Erro ao atualizar status do fluxo', 'error');
    });
  */
}

function deleteEmailFlow(flowId) {
  console.log(`🗑️ [FLOWS] Excluindo fluxo ${flowId}`);
  if (confirm('Tem certeza que deseja excluir este fluxo de e-mail?')) {
    emailFlowsList = emailFlowsList.filter(flow => flow.id !== flowId);
    renderEmailFlowsTable();
    showNotification('Fluxo excluído com sucesso!', 'success');
  }
}

function showNotification(message, type = 'info') {
  // Implementar sistema de notificação
  console.log(`📢 [FLOWS] ${type.toUpperCase()}: ${message}`);
  alert(message); // Substituir por sistema de notificação mais elegante
} 