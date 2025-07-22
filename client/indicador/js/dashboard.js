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

function fillDashboard(profile) {
  document.getElementById('indicatorName').textContent = profile.name || 'Indicador';
  document.getElementById('pixKey').value = profile.pixKey || '';
  if (profile.totalIndicacoes !== undefined) document.getElementById('totalIndicacoes').textContent = profile.totalIndicacoes;
  if (profile.indicacoesAprovadas !== undefined) document.getElementById('indicacoesAprovadas').textContent = profile.indicacoesAprovadas;
  if (profile.totalIndicacoes && profile.indicacoesAprovadas !== undefined) {
    const rate = profile.totalIndicacoes > 0 ? Math.round((profile.indicacoesAprovadas / profile.totalIndicacoes) * 100) : 0;
    document.getElementById('conversionRate').textContent = rate;
  }
  // TODO: preencher outros campos se necessário
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
  fetchProfile();
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