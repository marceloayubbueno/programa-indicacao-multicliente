// 🌍 CONFIGURAÇÃO DINÂMICA GLOBAL
const API_URL = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
               (window.location.hostname === 'localhost' ? 
                'http://localhost:3000/api' : 
                'https://programa-indicacao-multicliente-production.up.railway.app/api');

// Variáveis globais
let currentTab = 'types';
let rewardTypes = [];
let rewards = [];
let currentPage = 1;
const itemsPerPage = 10;
let editingRewardTypeId = null;

// Funções de Navegação
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(`${tab}Section`).classList.add('active');
    
    if (tab === 'types') {
        loadRewardTypes();
    } else {
        loadRewards();
    }
}

// Funções de Tipos de Recompensa
function showNewRewardTypeModal() {
    document.getElementById('newRewardTypeModal').style.display = 'block';
    // Resetar o formulário ao abrir
    document.getElementById('newRewardTypeForm').reset();
    // Esconder todos os campos específicos
    document.querySelectorAll('.reward-type-fields').forEach(field => {
        field.style.display = 'none';
    });
    // Ajustar título e botão conforme modo
    const modalTitle = document.querySelector('#newRewardTypeModal .modal-header h2');
    const saveBtn = document.querySelector('#newRewardTypeForm .btn-primary');
    const modalHeader = document.querySelector('#newRewardTypeModal .modal-header');
    if (editingRewardTypeId) {
        modalTitle.textContent = 'Editar Tipo de Recompensa';
        saveBtn.textContent = 'Salvar Alterações';
        modalHeader.style.background = '#e6f7ff';
    } else {
        modalTitle.textContent = 'Novo Tipo de Recompensa';
        saveBtn.textContent = 'Salvar';
        modalHeader.style.background = '';
    }
}

function closeNewRewardTypeModal() {
    document.getElementById('newRewardTypeModal').style.display = 'none';
    document.getElementById('newRewardTypeForm').reset();
    delete document.getElementById('newRewardTypeForm').dataset.editId;
    editingRewardTypeId = null;
    // Esconder todos os campos específicos
    document.querySelectorAll('.reward-type-fields').forEach(field => {
        field.style.display = 'none';
    });
    // Restaurar título e botão
    const modalTitle = document.querySelector('#newRewardTypeModal .modal-header h2');
    const saveBtn = document.querySelector('#newRewardTypeForm .btn-primary');
    const modalHeader = document.querySelector('#newRewardTypeModal .modal-header');
    modalTitle.textContent = 'Novo Tipo de Recompensa';
    saveBtn.textContent = 'Salvar';
    modalHeader.style.background = '';
}

function toggleRewardFields() {
    const type = document.getElementById('rewardType').value;
    
    // Esconder todos os campos específicos
    document.querySelectorAll('.reward-type-fields').forEach(field => {
        field.style.display = 'none';
    });
    
    // Mostrar campos específicos do tipo selecionado
    if (type === 'points') {
        document.getElementById('pointsFields').style.display = 'block';
    } else if (type === 'pix') {
        document.getElementById('pixFields').style.display = 'block';
    } else if (type === 'discount') {
        document.getElementById('discountFields').style.display = 'block';
    }
}

// Funções de Tipos de Recompensa (CRUD via API)
async function loadRewardTypes() {
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        const response = await fetch(`${API_URL}/rewards?clientId=${clientId}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': 'Bearer ' + token })
            }
        });
        if (!response.ok) throw new Error('Erro ao buscar tipos de recompensa');
        const result = await response.json();
        console.log('🔍 [REWARDS] Resposta da API:', result);
        const rewardTypes = result.data || result || [];
        console.log('🔍 [REWARDS] Tipos carregados:', rewardTypes);
        renderRewardTypesGrid(rewardTypes);
    } catch (err) {
        console.error('❌ [REWARDS] Erro:', err);
        alert('Erro ao carregar tipos de recompensa: ' + err.message);
    }
}

function renderRewardTypesGrid(rewardTypes) {
    const grid = document.getElementById('typesSection');
    if (!grid) {
        console.error('❌ [REWARDS] Elemento typesSection não encontrado!');
        return;
    }
    
    console.log('🔍 [REWARDS] Renderizando grid com:', rewardTypes);
    
    if (!rewardTypes || rewardTypes.length === 0) {
        console.log('📝 [REWARDS] Nenhum tipo encontrado, mostrando mensagem vazia');
        grid.innerHTML = '<div class="col-span-full text-center py-12"><div class="text-gray-400 text-xl mb-4"><i class="fas fa-gift fa-3x"></i></div><p class="text-gray-300 text-lg">Nenhum tipo de recompensa cadastrado</p><p class="text-gray-500 text-sm mt-2">Clique em "Novo Tipo de Recompensa" para começar.</p></div>';
        return;
    }
    
    console.log(`✅ [REWARDS] Renderizando ${rewardTypes.length} tipos de recompensa`);
    
    grid.innerHTML = rewardTypes.map((type, index) => {
        console.log(`🔍 [REWARDS] Tipo ${index}:`, type);
        return `
            <div class="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col gap-2 hover:shadow-2xl transition-shadow border border-gray-700">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-bold text-blue-400">${type.description || type.name || 'Sem nome'}</h3>
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${type.type === 'pix' ? 'bg-blue-900 text-blue-300' : type.type === 'points' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}">${getTypeLabel(type.type)}</span>
              </div>
              <div class="text-gray-200 text-base mb-1">${formatValue(type)}</div>
              <div class="text-gray-400 text-sm mb-2">${type.description || 'Sem descrição'}</div>
              <div class="flex gap-2 mt-2">
                <button class="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm transition-colors" onclick="editRewardType('${type._id || type.id}')" title="Editar">
                  <i class="fas fa-edit mr-1"></i>Editar
                </button>
                <button class="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-sm transition-colors" onclick="deleteRewardType('${type._id || type.id}')" title="Excluir">
                  <i class="fas fa-trash mr-1"></i>Excluir
                </button>
              </div>
            </div>
        `;
    }).join('');
    
    console.log('✅ [REWARDS] Grid renderizado com sucesso!');
}

async function handleNewRewardType(event) {
    event.preventDefault();
    const type = document.getElementById('rewardType').value;
    const rewardData = {
        type: type,
        value: parseFloat(document.getElementById(type === 'pix' ? 'pixValue' : type === 'discount' ? 'discountValue' : 'pointsValue').value),
        description: document.getElementById('rewardName').value,
        clientId: localStorage.getItem('clientId')
    };
    try {
        const token = localStorage.getItem('clientToken');
        let response;
        if (editingRewardTypeId) {
            response = await fetch(`${API_URL}/rewards/${editingRewardTypeId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': 'Bearer ' + token })
                },
                body: JSON.stringify(rewardData)
            });
        } else {
            response = await fetch(`${API_URL}/rewards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': 'Bearer ' + token })
                },
                body: JSON.stringify(rewardData)
            });
        }
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao salvar tipo de recompensa');
        }
        
        const result = await response.json();
        console.log('✅ [REWARDS] Salvo com sucesso:', result);
        
        closeNewRewardTypeModal();
        await loadRewardTypes();
        alert(editingRewardTypeId ? 'Tipo de recompensa atualizado com sucesso!' : 'Tipo de recompensa criado com sucesso!');
        editingRewardTypeId = null;
    } catch (err) {
        console.error('❌ [REWARDS] Erro ao salvar:', err);
        alert('Erro ao salvar tipo de recompensa: ' + err.message);
    }
}

async function deleteRewardType(id) {
    if (!confirm('Tem certeza que deseja excluir este tipo de recompensa?')) return;
    try {
        const token = localStorage.getItem('clientToken');
        const response = await fetch(`${API_URL}/rewards/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': 'Bearer ' + token })
            }
        });
        if (!response.ok) throw new Error('Erro ao excluir tipo de recompensa');
        
        console.log('✅ [REWARDS] Excluído com sucesso');
        await loadRewardTypes();
        alert('Tipo de recompensa excluído com sucesso!');
    } catch (err) {
        console.error('❌ [REWARDS] Erro ao excluir:', err);
        alert('Erro ao excluir tipo de recompensa: ' + err.message);
    }
}

function getTypeLabel(type) {
    const labels = {
        points: 'Pontos',
        pix: 'PIX',
        discount: 'Desconto'
    };
    return labels[type] || type;
}

function formatValue(rewardType) {
    switch(rewardType.type) {
        case 'points':
            return `${rewardType.value} Pontos`;
        case 'pix':
            return `R$ ${parseFloat(rewardType.value).toFixed(2)}`;
        case 'discount':
            return `${rewardType.value}% de Desconto`;
        default:
            return rewardType.value;
    }
}

function editRewardType(id) {
    const token = localStorage.getItem('clientToken');
    fetch(`${API_URL}/rewards/${id}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': 'Bearer ' + token })
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar tipo de recompensa');
        return res.json();
    })
    .then(result => {
        const type = result.data || result;
        console.log('🔍 [REWARDS] Editando tipo:', type);
        
        document.getElementById('rewardName').value = type.description || '';
        document.getElementById('rewardType').value = type.type;
        document.getElementById('rewardDescription').value = type.description || '';
        if (type.type === 'pix') {
            document.getElementById('pixValue').value = type.value;
            document.getElementById('pointsValue').value = '';
            document.getElementById('discountValue').value = '';
        } else if (type.type === 'points') {
                document.getElementById('pointsValue').value = type.value;
            document.getElementById('pixValue').value = '';
            document.getElementById('discountValue').value = '';
        } else if (type.type === 'discount') {
                document.getElementById('discountValue').value = type.value;
            document.getElementById('pixValue').value = '';
            document.getElementById('pointsValue').value = '';
        }
        toggleRewardFields();
        editingRewardTypeId = id;
        showNewRewardTypeModal();
    })
    .catch(err => {
        console.error('❌ [REWARDS] Erro ao carregar para edição:', err);
        alert('Erro ao carregar tipo de recompensa: ' + err.message);
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada, inicializando...');
    try {
        checkAuth();
        loadRewardTypes();
        
        // Adicionar event listeners
        document.getElementById('rewardType').addEventListener('change', toggleRewardFields);
        
        // Fechar modais ao clicar fora
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        }
        
        console.log('Inicialização concluída com sucesso');
    } catch (error) {
        console.error('Erro durante a inicialização:', error);
    }
});

// Ajustar botão de novo tipo de recompensa para redirecionar para a nova página
window.showNewRewardTypeModal = function() {
  window.location.href = 'reward-type-editor.html';
};

// 🆕 IMPLEMENTAR FUNÇÃO loadRewards (mesmo conteúdo de loadRewardTypes por enquanto)
async function loadRewards() {
    console.log('🔍 [REWARDS] loadRewards chamada - redirecionando para loadRewardTypes');
    await loadRewardTypes();
} 