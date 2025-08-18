/**
 * Users Management JavaScript
 * Gerenciamento de usuários administradores
 */

// 🔧 CONFIGURAÇÃO DA API - COMO ESTAVA FUNCIONANDO ANTES
const API_BASE_URL = 'https://programa-indicacao-multicliente-production.up.railway.app';

// Endpoints da API
const API_LIST_ADMINS = `${API_BASE_URL}/api/auth/admins`;
const API_CRUD_ADMINS = `${API_BASE_URL}/api/admins`;
let admins = [];
let editingAdminId = null;

// Utilitário para obter token do localStorage
function getToken() {
  return localStorage.getItem('adminToken');
}

// Utilitário para obter dados do admin logado
function getLoggedAdmin() {
  try {
    return JSON.parse(localStorage.getItem('adminData'));
  } catch (error) {
    return null;
  }
}

// ✅ NOVA FUNÇÃO: Verificar se token está expirado
function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = new Date();
    const expiration = new Date(payload.exp * 1000);
    return now > expiration;
  } catch (e) {
    return true; // Se não consegue verificar, considera expirado
  }
}

// ✅ NOVA FUNÇÃO: Limpar sessão e redirecionar para login  
function clearSessionAndRedirect(message = 'Sua sessão expirou. Faça login novamente.') {
  alert(message);
  localStorage.clear();
  window.location.href = 'login.html';
}

// Redireciona para login se não houver token ou admin válido
function checkAuth() {
  const token = getToken();
  const admin = getLoggedAdmin();
  
  // Verificar se existe token e dados do admin
  if (!token || !admin || !admin.role) {
    clearSessionAndRedirect('Sessão expirada ou acesso não autorizado. Faça login novamente.');
    return false;
  }
  
  // Verificar se o token está expirado
  if (isTokenExpired(token)) {
    clearSessionAndRedirect();
    return false;
  }
  
  return true;
}

// Carregar admins ao abrir a página
window.onload = function () {
  if (!checkAuth()) return;
  checkPermissionUI();
  fetchAdmins();
};

// Checa permissões e ajusta UI
function checkPermissionUI() {
  const admin = getLoggedAdmin();
  const isSuper = admin && admin.role === 'superadmin';
  
  const actualButton = document.querySelector('button[onclick="openNewAdminModal()"]');
  if (actualButton) {
    actualButton.style.display = isSuper ? 'inline-flex' : 'none';
  }
}

// Buscar admins do backend
function fetchAdmins() {
  const token = getToken();
  
  if (!token || isTokenExpired(token)) {
    clearSessionAndRedirect();
    return;
  }
  
  fetch(API_LIST_ADMINS, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      // 🔧 CORREÇÃO: Verificar estrutura de dados
      if (data && data.success === false) {
        throw new Error(data.message || 'Erro no servidor');
      }
      
      // Extrair array de admins da resposta
      if (data && Array.isArray(data)) {
        admins = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        admins = data.data;
      } else if (data && data.admins && Array.isArray(data.admins)) {
        admins = data.admins;
      } else {
        console.warn('Estrutura de dados inesperada:', data);
        admins = [];
      }
      
      renderAdminsTable();
      updateStatistics();
    })
    .catch(error => {
      console.error('Erro ao carregar administradores:', error);
      admins = []; // Garantir que admins seja array
      renderAdminsTable();
      updateStatistics();
      alert('Erro ao carregar administradores: ' + error.message);
    });
}

// Renderizar tabela de admins
function renderAdminsTable() {
  const tbody = document.getElementById('adminsTableBody');
  const admin = getLoggedAdmin();
  const isSuper = admin && admin.role === 'superadmin';
  
  if (!tbody) {
    console.error('Table body not found!');
    return;
  }
  
  tbody.innerHTML = '';
  
  if (!admins || admins.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-400">Nenhum administrador encontrado</td></tr>';
    return;
  }
  
  admins.forEach((a) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-800 transition-colors';
    tr.innerHTML = `
      <td class="px-6 py-4">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-${a.role === 'superadmin' ? 'red' : 'blue'}-500 rounded-full flex items-center justify-center mr-3">
            <i class="fas fa-${a.role === 'superadmin' ? 'user-shield' : 'user'} text-white text-sm"></i>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-100">${a.nome || 'N/A'}</div>
            <div class="text-xs text-gray-400">${a.role === 'superadmin' ? 'Administrador Principal' : 'Administrador'}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 text-sm text-gray-300">${a.email || 'N/A'}</td>
      <td class="px-6 py-4 text-sm text-gray-300">${a.telefone || 'N/A'}</td>
      <td class="px-6 py-4">
        <span class="px-3 py-1 text-xs font-medium rounded-full ${a.role === 'superadmin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}">
          <i class="fas fa-${a.role === 'superadmin' ? 'crown' : 'user-cog'} mr-1"></i>${a.role === 'superadmin' ? 'Superadmin' : 'Admin'}
        </span>
      </td>
      <td class="px-6 py-4">
        <span class="px-3 py-1 text-xs font-medium rounded-full ${a.ativo !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
          <i class="fas fa-${a.ativo !== false ? 'check-circle' : 'times-circle'} mr-1"></i>${a.ativo !== false ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          ${isSuper ? `
            <button class="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm" onclick="openEditAdminModal('${a._id}')" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="p-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition-colors text-sm" title="Resetar Senha">
              <i class="fas fa-key"></i>
            </button>
            <button class="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm" onclick="confirmDeleteAdmin('${a._id}')" title="Remover">
              <i class="fas fa-trash"></i>
            </button>
          ` : '<span class="text-gray-500 text-sm">Sem permissão</span>'}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Abrir modal para novo admin
function openNewAdminModal() {
  const modalById = document.getElementById('adminModal');
  const modalByDetails = document.getElementById('adminDetailsModal');
  
  editingAdminId = null;
  document.getElementById('adminModalTitle').innerText = 'Novo Usuário Admin';
  clearAdminForm();
  document.getElementById('adminSenha').required = true;
  
  if (modalById) {
    modalById.classList.remove('hidden');
  } else if (modalByDetails) {
    modalByDetails.style.display = 'block';
  }
}

// Abrir modal para editar admin
function openEditAdminModal(id) {
  const admin = admins.find(a => a._id === id);
  if (!admin) return;
  
  editingAdminId = id;
  document.getElementById('adminModalTitle').innerText = 'Editar Usuário Admin';
  document.getElementById('adminNome').value = admin.nome;
  document.getElementById('adminEmail').value = admin.email;
  document.getElementById('adminTelefone').value = admin.telefone || '';
  document.getElementById('adminRole').value = admin.role;
  document.getElementById('adminAtivo').value = admin.ativo ? 'true' : 'false';
  document.getElementById('adminSenha').value = '';
  document.getElementById('adminSenha').required = false;
  
  const modalById = document.getElementById('adminModal');
  const modalByDetails = document.getElementById('adminDetailsModal');
  
  if (modalById) {
    modalById.classList.remove('hidden');
  } else if (modalByDetails) {
    modalByDetails.style.display = 'block';
  }
}

// Fechar modal
function closeAdminModal() {
  const modalById = document.getElementById('adminModal');
  const modalByDetails = document.getElementById('adminDetailsModal');
  
  if (modalById) {
    modalById.classList.add('hidden');
  }
  if (modalByDetails) {
    modalByDetails.style.display = 'none';
  }
}

// Limpar formulário
function clearAdminForm() {
  document.getElementById('adminForm').reset();
  document.getElementById('adminSenha').value = '';
}

// Função para salvar usuário (criar ou editar)
async function salvarUsuario() {
    try {
        // Coletando dados do formulário
        const formData = {
            nome: document.getElementById('adminNome').value,
            email: document.getElementById('adminEmail').value,
            telefone: document.getElementById('adminTelefone').value,
            tipoUsuario: document.getElementById('adminRole').value,
            status: document.getElementById('adminAtivo').value,
            senha: document.getElementById('adminSenha').value
        };
        
        // ✅ VERIFICAÇÃO ROBUSTA DE TOKEN
        const token = getToken();
        
        if (!token || isTokenExpired(token)) {
            clearSessionAndRedirect();
            return;
        }
        
        // Verificar permissões do usuário
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            if (payload.role !== 'superadmin') {
                alert('Apenas superadmins podem criar/editar usuários.');
                return;
            }
        } catch (e) {
            clearSessionAndRedirect('Token inválido. Faça login novamente.');
            return;
        }
        
        if (!token) {
            alert('Erro de autenticação. Faça login novamente.');
            window.location.href = 'login.html';
            return;
        }

        // Validações básicas
        if (!formData.nome || !formData.email || !formData.senha) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const isEdit = editingAdminId !== null;
        const url = isEdit 
            ? `${API_CRUD_ADMINS}/${editingAdminId}`
            : API_CRUD_ADMINS;
            
        const method = isEdit ? 'PUT' : 'POST';

        // Preparando payload (convertendo campos para o formato esperado pelo backend)
        const payload = {
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            role: formData.tipoUsuario,
            ativo: formData.status === 'true',
            ...(formData.senha && { senha: formData.senha })
        };
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            if (response.status === 401) {
                clearSessionAndRedirect();
                return;
            } else if (response.status === 400) {
                alert(`Erro de validação: ${errorData?.message || 'Dados inválidos'}`);
                return;
            } else if (response.status === 409) {
                alert(`Conflito: ${errorData?.message || 'Email já está em uso'}`);
                return;
            } else {
                alert(`Erro: ${errorData?.message || 'Erro interno do servidor'}`);
                return;
            }
        }

        const result = await response.json();
        
        alert(isEdit ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
        
        // Fechando modal e atualizando lista
        closeAdminModal();
        fetchAdmins();

    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        alert('Erro interno. Tente novamente.');
    }
}

// Função para atualizar estatísticas dinamicamente
function updateStatistics() {
  if (!admins || !Array.isArray(admins)) {
    return;
  }

  // Calcular estatísticas
  const totalAdmins = admins.length;
  const usuariosAtivos = admins.filter(admin => admin.ativo !== false).length;
  const superAdmins = admins.filter(admin => admin.role === 'superadmin').length;

  // Atualizar elementos na página
  const usersCountEl = document.getElementById('usersCount');
  const totalAdminsEl = document.getElementById('totalAdmins');
  const usuariosAtivosEl = document.getElementById('usuariosAtivos');
  const superAdminsEl = document.getElementById('superAdmins');

  if (usersCountEl) usersCountEl.textContent = totalAdmins;
  if (totalAdminsEl) totalAdminsEl.textContent = totalAdmins;
  if (usuariosAtivosEl) usuariosAtivosEl.textContent = usuariosAtivos;
  if (superAdminsEl) superAdminsEl.textContent = superAdmins;
}

// Confirmar remoção
function confirmDeleteAdmin(id) {
  if (confirm('Tem certeza que deseja remover este administrador?')) {
    deleteAdmin(id);
  }
}

// Remover admin
function deleteAdmin(id) {
  const admin = getLoggedAdmin();
  if (!admin || admin.role !== 'superadmin') {
    alert('Apenas superadmins podem remover administradores.');
    return;
  }
  
  fetch(`${API_CRUD_ADMINS}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + getToken() }
  })
    .then(res => res.json().then(data => ({ status: res.status, data })))
    .then(({ status, data }) => {
      if (status >= 200 && status < 300) {
        alert(data.message || 'Admin removido com sucesso.');
        fetchAdmins();
      } else {
        alert(data.message || 'Erro ao remover admin.');
      }
    })
    .catch(error => {
      console.error('Erro ao remover admin:', error);
      alert('Erro ao remover admin.');
    });
}

// Busca na tabela
function searchAdmins() {
  const searchInput = document.getElementById('searchAdmin');
  const term = searchInput ? searchInput.value.toLowerCase() : '';
  
  if (!term) {
    renderAdminsTable();
    return;
  }
  
  const filtered = admins.filter(a => {
    const matchNome = a.nome && a.nome.toLowerCase().includes(term);
    const matchEmail = a.email && a.email.toLowerCase().includes(term);
    const matchTelefone = a.telefone && a.telefone.toLowerCase().includes(term);
    return matchNome || matchEmail || matchTelefone;
  });
  
  renderAdminsTableFiltered(filtered);
}

// Renderização filtrada
function renderAdminsTableFiltered(filteredList) {
  const tbody = document.getElementById('adminsTableBody');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const list = filteredList || admins;
  const admin = getLoggedAdmin();
  const isSuper = admin && admin.role === 'superadmin';
  
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-400">Nenhum resultado encontrado</td></tr>';
    return;
  }
  
  list.forEach((a) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-800 transition-colors';
    tr.innerHTML = `
      <td class="px-6 py-4">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-${a.role === 'superadmin' ? 'red' : 'blue'}-500 rounded-full flex items-center justify-center mr-3">
            <i class="fas fa-${a.role === 'superadmin' ? 'user-shield' : 'user'} text-white text-sm"></i>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-100">${a.nome || 'N/A'}</div>
            <div class="text-xs text-gray-400">${a.role === 'superadmin' ? 'Administrador Principal' : 'Administrador'}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 text-sm text-gray-300">${a.email || 'N/A'}</td>
      <td class="px-6 py-4 text-sm text-gray-300">${a.telefone || 'N/A'}</td>
      <td class="px-6 py-4">
        <span class="px-3 py-1 text-xs font-medium rounded-full ${a.role === 'superadmin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}">
          <i class="fas fa-${a.role === 'superadmin' ? 'crown' : 'user-cog'} mr-1"></i>${a.role === 'superadmin' ? 'Superadmin' : 'Admin'}
        </span>
      </td>
      <td class="px-6 py-4">
        <span class="px-3 py-1 text-xs font-medium rounded-full ${a.ativo !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
          <i class="fas fa-${a.ativo !== false ? 'check-circle' : 'times-circle'} mr-1"></i>${a.ativo !== false ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          ${isSuper ? `
            <button class="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm" onclick="openEditAdminModal('${a._id}')" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="p-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition-colors text-sm" title="Resetar Senha">
              <i class="fas fa-key"></i>
            </button>
            <button class="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm" onclick="confirmDeleteAdmin('${a._id}')" title="Remover">
              <i class="fas fa-trash"></i>
            </button>
          ` : '<span class="text-gray-500 text-sm">Sem permissão</span>'}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
  const adminModal = document.getElementById('adminModal');
  const adminDetailsModal = document.getElementById('adminDetailsModal');
  
  if (event.target === adminModal || event.target === adminDetailsModal) {
    closeAdminModal();
  }
}; 