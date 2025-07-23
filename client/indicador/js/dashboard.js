// Integração completa do dashboard do indicador

const API_BASE = window.APP_CONFIG ? window.APP_CONFIG.API_URL + '/indicator-auth' : '/indicator-auth';

function getToken() {
  return localStorage.getItem('indicator_token');
}

function setToken(token) {
  localStorage.setItem('indicator_token', token);
}

function showMessage(msg, type = 'success') {
  let el = document.getElementById('pixMsg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pixMsg';
    el.className = 'mt-2 text-sm';
    document.getElementById('pixKey').parentNode.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'mt-2 text-sm ' + (type === 'success' ? 'text-green-400' : 'text-red-400');
  setTimeout(() => { el.textContent = ''; }, 4000);
}

async function fetchProfile() {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(API_BASE + '/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.success && data.data) {
      fillDashboard(data.data);
    } else {
      showMessage('Erro ao carregar dados do indicador', 'error');
    }
  } catch (e) {
    showMessage('Erro de conexão ao carregar dados', 'error');
  }
}

async function fetchDashboard() {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(API_BASE + '/dashboard', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.success && data.data) {
      fillDashboardData(data.data);
    } else {
      showMessage('Erro ao carregar dashboard', 'error');
    }
  } catch (e) {
    showMessage('Erro de conexão ao carregar dashboard', 'error');
  }
}

function fillDashboard(profile) {
  document.getElementById('indicatorName').textContent = profile.name || 'Indicador';
  document.getElementById('pixKey').value = profile.pixKey || '';
  if (profile.totalIndicacoes !== undefined) document.getElementById('totalIndicacoes').textContent = profile.totalIndicacoes;
  if (profile.indicacoesAprovadas !== undefined) document.getElementById('indicacoesAprovadas').textContent = profile.indicacoesAprovadas;
  if (profile.totalIndicacoes && profile.indicacoesAprovadas !== undefined) {
    const rate = profile.totalIndicacoes > 0 ? Math.round((profile.indicacoesAprovadas / profile.totalIndicacoes) * 100) : 0;
    document.getElementById('conversionRate').textContent = rate;
  }
}

function fillDashboardData(dashboardData) {
  console.log('🔍 [FRONTEND] Preenchendo dados do dashboard:', dashboardData);
  
  // Preencher dados básicos do indicador
  if (dashboardData.indicator) {
    fillDashboard(dashboardData.indicator);
  }
  
  // Preencher estatísticas
  if (dashboardData.stats) {
    const stats = dashboardData.stats;
    console.log('🔍 [FRONTEND] Estatísticas:', stats);
    if (stats.totalReferrals !== undefined) document.getElementById('totalIndicacoes').textContent = stats.totalReferrals;
    if (stats.approvedReferrals !== undefined) document.getElementById('indicacoesAprovadas').textContent = stats.approvedReferrals;
    if (stats.conversionRate !== undefined) document.getElementById('conversionRate').textContent = stats.conversionRate;
    if (stats.paidRewards !== undefined) {
      const totalComissoes = document.getElementById('totalComissoes');
      if (totalComissoes) {
        totalComissoes.textContent = `R$ ${stats.paidRewards.toFixed(2).replace('.', ',')}`;
      }
    }
  }
  
  // 🚀 NOVO: Renderizar campanhas com recompensas
  console.log('🔍 [FRONTEND] Campanhas recebidas:', dashboardData.campaigns);
  if (dashboardData.campaigns && dashboardData.campaigns.length > 0) {
    console.log(`🔍 [FRONTEND] Renderizando ${dashboardData.campaigns.length} campanhas`);
    renderCampaigns(dashboardData.campaigns);
  } else {
    console.log('🔍 [FRONTEND] Nenhuma campanha encontrada');
    renderNoCampaigns();
  }
  
  // Preencher atividades recentes
  if (dashboardData.recentReferrals && dashboardData.recentReferrals.length > 0) {
    renderRecentActivities(dashboardData.recentReferrals);
  }
}

function renderCampaigns(campaigns) {
  const container = document.getElementById('campaignsContainer');
  if (!container) {
    console.error('❌ Container de campanhas não encontrado');
    return;
  }
  
  console.log(`🔍 [FRONTEND] Renderizando ${campaigns.length} campanhas`);
  
  // Limpar conteúdo existente
  container.innerHTML = '';
  
  campaigns.forEach(campaign => {
    console.log(`🔍 [FRONTEND] Criando elemento para campanha: ${campaign.name}`);
    const campaignElement = createCampaignElement(campaign);
    container.appendChild(campaignElement);
  });
}

function createCampaignElement(campaign) {
  const div = document.createElement('div');
  div.className = 'flex flex-col md:flex-row md:items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg p-3';
  
  // Nome da campanha
  const nameSpan = document.createElement('span');
  nameSpan.className = 'font-medium text-gray-200 flex-1';
  nameSpan.textContent = campaign.name;
  
  // Recompensas
  const rewardsSpan = document.createElement('span');
  rewardsSpan.className = 'text-green-400 font-semibold flex-shrink-0 text-sm';
  
  let rewardsText = '';
  if (campaign.rewardOnReferral && campaign.rewardOnConversion) {
    rewardsText = `R$ ${campaign.rewardOnReferral.value},00 + R$ ${campaign.rewardOnConversion.value},00`;
  } else if (campaign.rewardOnReferral) {
    rewardsText = `R$ ${campaign.rewardOnReferral.value},00`;
  } else if (campaign.rewardOnConversion) {
    rewardsText = `R$ ${campaign.rewardOnConversion.value},00`;
  } else {
    rewardsText = 'Sem recompensa';
  }
  rewardsSpan.textContent = rewardsText;
  
  // 🔗 LINK DE INDICAÇÃO - MESMA UX DA CENTRAL DE PARTICIPANTES
  const linkContainer = document.createElement('div');
  linkContainer.className = 'flex items-center gap-2';
  
  // Botão copiar (apenas ícone)
  const copyBtn = document.createElement('button');
  copyBtn.className = 'text-blue-400 hover:text-blue-300 text-sm transition-colors p-2 rounded hover:bg-blue-500/10';
  copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
  copyBtn.title = 'Copiar link de indicação';
  copyBtn.onclick = () => copyToClipboard(campaign.referralLink);
  
  // Botão regenerar código (apenas ícone)
  const regenerateBtn = document.createElement('button');
  regenerateBtn.className = 'text-green-400 hover:text-green-300 text-sm transition-colors p-2 rounded hover:bg-green-500/10';
  regenerateBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
  regenerateBtn.title = 'Gerar novo código';
  regenerateBtn.onclick = () => regenerateReferralCode();
  
  linkContainer.appendChild(copyBtn);
  linkContainer.appendChild(regenerateBtn);
  
  div.appendChild(nameSpan);
  div.appendChild(rewardsSpan);
  div.appendChild(linkContainer);
  
  return div;
}

function renderNoCampaigns() {
  const container = document.getElementById('campaignsContainer');
  if (!container) {
    console.error('❌ Container de campanhas não encontrado');
    return;
  }
  
  console.log('🔍 [FRONTEND] Nenhuma campanha encontrada, renderizando mensagem');
  
  container.innerHTML = `
    <div class="text-center py-8 text-gray-400">
      <i class="fas fa-info-circle text-2xl mb-2"></i>
      <p>Nenhuma campanha ativa encontrada.</p>
      <p class="text-sm">Entre em contato com o administrador.</p>
    </div>
  `;
}

function renderRecentActivities(referrals) {
  const container = document.getElementById('recentActivities');
  if (!container) return;
  
  container.innerHTML = '';
  
  referrals.forEach(referral => {
    const activityElement = createActivityElement(referral);
    container.appendChild(activityElement);
  });
}

function createActivityElement(referral) {
  const div = document.createElement('div');
  div.className = 'flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg';
  
  const icon = document.createElement('div');
  icon.className = referral.status === 'aprovada' 
    ? 'w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center'
    : 'w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center';
  
  const iconElement = document.createElement('i');
  iconElement.className = referral.status === 'aprovada'
    ? 'fas fa-check-circle text-blue-400 text-sm'
    : 'fas fa-user-plus text-green-400 text-sm';
  
  icon.appendChild(iconElement);
  
  const content = document.createElement('div');
  content.className = 'flex-1';
  
  const title = document.createElement('p');
  title.className = 'text-gray-100 font-medium';
  title.textContent = referral.status === 'aprovada' ? 'Indicação aprovada' : 'Indicação enviada';
  
  const description = document.createElement('p');
  description.className = 'text-gray-400 text-sm';
  description.textContent = `Você indicou ${referral.leadName}`;
  
  content.appendChild(title);
  content.appendChild(description);
  
  const time = document.createElement('div');
  time.className = 'text-gray-400 text-sm';
  time.textContent = formatTimeAgo(referral.createdAt);
  
  div.appendChild(icon);
  div.appendChild(content);
  div.appendChild(time);
  
  return div;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showMessage('Link copiado para a área de transferência!', 'success');
  }).catch(() => {
    showMessage('Erro ao copiar link', 'error');
  });
}

function regenerateReferralCode() {
  showMessage('Funcionalidade de regenerar código será implementada em breve!', 'info');
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Agora mesmo';
  if (diffInHours === 1) return 'Há 1 hora';
  if (diffInHours < 24) return `Há ${diffInHours} horas`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Há 1 dia';
  return `Há ${diffInDays} dias`;
}

async function savePixKey() {
  const token = getToken();
  const pixKey = document.getElementById('pixKey').value.trim();
  if (!token) {
    showMessage('Faça login novamente', 'error');
    return;
  }
  try {
    const res = await fetch(API_BASE + '/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ pixKey })
    });
    const data = await res.json();
    if (data.success) {
      showMessage('Chave Pix atualizada com sucesso!', 'success');
    } else {
      showMessage(data.message || 'Erro ao atualizar Pix', 'error');
    }
  } catch (e) {
    showMessage('Erro de conexão ao salvar Pix', 'error');
  }
}

window.addEventListener('DOMContentLoaded', function() {
  // Buscar dados completos do dashboard
  fetchDashboard();
  
  const btn = document.getElementById('savePixBtn');
  if (btn) {
    btn.addEventListener('click', savePixKey);
  }
});

// Função de logout (remove token e redireciona)
window.handleLogout = function() {
  localStorage.removeItem('indicator_token');
  window.location.href = 'login.html';
}; 