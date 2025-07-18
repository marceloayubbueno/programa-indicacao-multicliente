// Gerenciamento de Campanhas de E-mail
// MVP: Listagem de campanhas de e-mail

// 🔧 CORREÇÃO: Função para obter API_URL de forma segura
function getApiUrl() {
    return window.API_URL ||
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL :
           'http://localhost:3000/api');
}

// 🔧 CORREÇÃO: Variável global para armazenar lista de campanhas
let emailCampaignsList = [];

document.addEventListener('DOMContentLoaded', function() {
  console.log('📧 [CAMPAIGNS] Página carregada, inicializando...');
  renderEmailCampaignsList();
});

function renderEmailCampaignsList() {
  console.log('🔍 [CAMPAIGNS] Carregando campanhas de e-mail...');
  const tbody = document.getElementById('emailCampaignsListBody');
  if (!tbody) {
    console.error('❌ [CAMPAIGNS] Elemento emailCampaignsListBody não encontrado!');
    return;
  }
  
  tbody.innerHTML = '';
  const clientId = localStorage.getItem('clientId');
  const token = localStorage.getItem('clientToken');
  
  if (!clientId) {
    console.error('❌ [CAMPAIGNS] ClientId não encontrado');
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-bullhorn"></i><h3>Não autenticado</h3><p>Faça login novamente para ver suas campanhas de e-mail</p></td></tr>';
    return;
  }
  
  const API_URL = getApiUrl();
  console.log(`🔗 [CAMPAIGNS] Fazendo requisição para: ${API_URL}/email-campaigns?clientId=${clientId}`);
  
  // Simular dados para MVP - substituir por chamada real da API
  setTimeout(() => {
    const mockData = [
      {
        id: '1',
        name: 'Campanha de Lançamento',
        createdAt: new Date('2024-01-10'),
        status: 'sent',
        emailsSent: 850,
        openRate: 68.5,
        clickRate: 12.3,
        description: 'Campanha para lançamento do novo produto'
      },
      {
        id: '2',
        name: 'Campanha de Reengajamento',
        createdAt: new Date('2024-01-25'),
        status: 'draft',
        emailsSent: 0,
        openRate: 0,
        clickRate: 0,
        description: 'Campanha para reativar indicadores inativos'
      },
      {
        id: '3',
        name: 'Campanha de Promoção',
        createdAt: new Date('2024-02-01'),
        status: 'scheduled',
        emailsSent: 0,
        openRate: 0,
        clickRate: 0,
        description: 'Campanha promocional de fim de mês'
      }
    ];
    
    emailCampaignsList = mockData;
    console.log(`✅ [CAMPAIGNS] ${emailCampaignsList.length} campanhas carregadas`);
    renderEmailCampaignsTable();
  }, 500);
  
  // Código real da API (comentado para MVP)
  /*
  fetch(`${API_URL}/email-campaigns?clientId=${clientId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => {
      console.log(`📡 [CAMPAIGNS] Status da resposta: ${response.status}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('📊 [CAMPAIGNS] Dados recebidos:', data);
      emailCampaignsList = data.data || data || [];
      console.log(`✅ [CAMPAIGNS] ${emailCampaignsList.length} campanhas carregadas`);
      renderEmailCampaignsTable();
    })
    .catch(error => {
      console.error('❌ [CAMPAIGNS] Erro ao carregar campanhas:', error);
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>Erro ao carregar</h3><p>Erro: ' + error.message + '</p></td></tr>';
      showNotification('Erro ao carregar Campanhas de E-mail: ' + error.message, 'error');
    });
  */
}

function renderEmailCampaignsTable() {
  console.log(`🎨 [CAMPAIGNS] Renderizando ${emailCampaignsList.length} campanhas na tabela`);
  const tbody = document.getElementById('emailCampaignsListBody');
  
  if (!emailCampaignsList || emailCampaignsList.length === 0) {
    console.log('📝 [CAMPAIGNS] Nenhuma campanha encontrada, mostrando mensagem vazia');
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="text-center py-12"><div class="text-gray-400 text-xl mb-4"><i class="fas fa-bullhorn fa-3x"></i></div><p class="text-gray-300 text-lg">Nenhuma campanha de e-mail criada</p><p class="text-gray-500 text-sm mt-2">Clique em "Nova Campanha" para começar.</p></div></td></tr>';
    return;
  }
  
  tbody.innerHTML = emailCampaignsList.map((campaign, index) => {
    console.log(`🔍 [CAMPAIGNS] Campanha ${index}:`, campaign);
    
    // Status badge
    const getStatusBadge = (status) => {
      const statusConfig = {
        'draft': { color: 'bg-yellow-500/20 text-yellow-400', icon: 'fa-pause-circle', text: 'Rascunho' },
        'scheduled': { color: 'bg-blue-500/20 text-blue-400', icon: 'fa-clock', text: 'Agendada' },
        'sending': { color: 'bg-orange-500/20 text-orange-400', icon: 'fa-paper-plane', text: 'Enviando' },
        'sent': { color: 'bg-green-500/20 text-green-400', icon: 'fa-check-circle', text: 'Enviada' },
        'paused': { color: 'bg-red-500/20 text-red-400', icon: 'fa-stop-circle', text: 'Pausada' }
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
            <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-bullhorn text-purple-400"></i>
            </div>
            <div>
              <div class="font-medium text-gray-200">${campaign.name || 'Sem nome'}</div>
              <div class="text-xs text-gray-400 mt-1">
                <span>${campaign.description || 'Campanha de e-mail'}</span>
              </div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="text-sm text-gray-300">
            <i class="fas fa-calendar text-gray-400 mr-1"></i>
            ${campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString('pt-BR') : '-'}
          </div>
        </td>
        <td class="px-4 py-3">${getStatusBadge(campaign.status)}</td>
        <td class="px-4 py-3">
          <div class="text-sm text-gray-300">
            <i class="fas fa-paper-plane text-gray-400 mr-1"></i>
            ${campaign.emailsSent || 0} enviados
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="text-sm text-gray-300">
            <i class="fas fa-eye text-gray-400 mr-1"></i>
            ${campaign.openRate ? campaign.openRate + '%' : '0%'}
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-1">
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-blue-400 hover:text-blue-300" 
                    title="Visualizar" 
                    onclick="previewEmailCampaign('${campaign.id}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-green-400 hover:text-green-300" 
                    title="Editar" 
                    onclick="editEmailCampaign('${campaign.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-orange-400 hover:text-orange-300" 
                    title="Duplicar" 
                    onclick="duplicateEmailCampaign('${campaign.id}')">
              <i class="fas fa-copy"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-purple-400 hover:text-purple-300" 
                    title="Relatórios" 
                    onclick="viewCampaignReports('${campaign.id}')">
              <i class="fas fa-chart-bar"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-red-400 hover:text-red-300" 
                    title="Excluir" 
                    onclick="deleteEmailCampaign('${campaign.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Funções de ação
function previewEmailCampaign(campaignId) {
  console.log(`👁️ [CAMPAIGNS] Visualizando campanha ${campaignId}`);
  window.open(`engajamento-email-template-editor.html?type=campaign&id=${campaignId}&preview=true`, '_blank');
}

function editEmailCampaign(campaignId) {
  console.log(`✏️ [CAMPAIGNS] Editando campanha ${campaignId}`);
  window.location.href = `engajamento-email-template-editor.html?type=campaign&id=${campaignId}`;
}

function duplicateEmailCampaign(campaignId) {
  console.log(`📋 [CAMPAIGNS] Duplicando campanha ${campaignId}`);
  const campaign = emailCampaignsList.find(c => c.id === campaignId);
  if (campaign) {
    const duplicatedCampaign = {
      ...campaign,
      id: Date.now().toString(),
      name: `${campaign.name} (Cópia)`,
      status: 'draft',
      emailsSent: 0,
      openRate: 0,
      clickRate: 0,
      createdAt: new Date()
    };
    emailCampaignsList.push(duplicatedCampaign);
    renderEmailCampaignsTable();
    showNotification('Campanha duplicada com sucesso!', 'success');
  }
}

function viewCampaignReports(campaignId) {
  console.log(`📊 [CAMPAIGNS] Visualizando relatórios da campanha ${campaignId}`);
  // Implementar página de relatórios
  showNotification('Funcionalidade de relatórios em desenvolvimento', 'info');
}

function deleteEmailCampaign(campaignId) {
  console.log(`🗑️ [CAMPAIGNS] Excluindo campanha ${campaignId}`);
  if (confirm('Tem certeza que deseja excluir esta campanha de e-mail?')) {
    emailCampaignsList = emailCampaignsList.filter(campaign => campaign.id !== campaignId);
    renderEmailCampaignsTable();
    showNotification('Campanha excluída com sucesso!', 'success');
  }
}

function showNotification(message, type = 'info') {
  // Implementar sistema de notificação
  console.log(`📢 [CAMPAIGNS] ${type.toUpperCase()}: ${message}`);
  alert(message); // Substituir por sistema de notificação mais elegante
} 