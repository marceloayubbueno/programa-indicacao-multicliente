// Lógica para página dedicada de edição/criação de tipos de recompensa

// 🌍 CONFIGURAÇÃO DINÂMICA: usar config.js quando disponível
const apiBaseUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                  (window.location.hostname === 'localhost' ? 
                   'http://localhost:3000' : 
                   'https://programa-indicacao-multicliente-production.up.railway.app');
const apiUrl = `${apiBaseUrl}/rewards`;
let editingRewardTypeId = null;
let originalRewardData = null;

// Carregar dados para edição, se houver ID na querystring
window.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id) {
    loadRewardType(id);
  }

  document.getElementById('rewardTypeForm').addEventListener('submit', handleSaveRewardType);
  document.getElementById('duplicateBtn').addEventListener('click', handleDuplicate);
  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.location.href = 'rewards.html';
  });
});

async function loadRewardType(id) {
  try {
    const token = localStorage.getItem('clientToken');
    const response = await fetch(`${apiUrl}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': 'Bearer ' + token })
      }
    });
    if (!response.ok) throw new Error('Erro ao buscar tipo de recompensa');
    const data = await response.json();
    fillForm(data);
    editingRewardTypeId = id;
    originalRewardData = data;
  } catch (err) {
    alert('Erro ao carregar tipo de recompensa: ' + err.message);
  }
}

function fillForm(data) {
  document.getElementById('rewardName').value = data.description || '';
  document.getElementById('rewardType').value = data.type;
  document.getElementById('rewardValue').value = data.value;
  document.getElementById('rewardDescription').value = data.description || '';
}

async function handleSaveRewardType(event) {
  event.preventDefault();
  const rewardData = {
    type: document.getElementById('rewardType').value,
    value: parseFloat(document.getElementById('rewardValue').value),
    description: document.getElementById('rewardName').value,
    details: document.getElementById('rewardDescription').value,
    clientId: localStorage.getItem('clientId')
  };
  try {
    const token = localStorage.getItem('clientToken');
    let response;
    if (editingRewardTypeId) {
      response = await fetch(`${apiUrl}/${editingRewardTypeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': 'Bearer ' + token })
        },
        body: JSON.stringify(rewardData)
      });
    } else {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': 'Bearer ' + token })
        },
        body: JSON.stringify(rewardData)
      });
    }
    if (!response.ok) throw new Error('Erro ao salvar tipo de recompensa');
    alert('Tipo de recompensa salvo com sucesso!');
    window.location.href = 'rewards.html';
  } catch (err) {
    alert('Erro ao salvar tipo de recompensa: ' + err.message);
  }
}

function handleDuplicate() {
  if (!originalRewardData) {
    alert('Só é possível duplicar após carregar um tipo de recompensa existente.');
    return;
  }
  // Preenche o formulário com os dados originais, mas limpa o nome e o id de edição
  fillForm({ ...originalRewardData, description: '', _id: undefined });
  editingRewardTypeId = null;
  alert('Dados duplicados! Edite o nome e salve para criar um novo tipo de recompensa.');
} 