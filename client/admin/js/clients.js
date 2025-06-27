// Variáveis globais
let currentClientId = null;
let clients = [];
let currentPage = 1;
let totalPages = 1;

// API URLs
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/clients`;

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

// Carregar dados quando a página iniciar
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    loadClients();
    populateStates();
    setupMasks();
    // loadPlans(); // Removido para evitar alerta desnecessário
});

// Função para carregar os clientes
async function loadClients(page = 1, search = '') {
    try {
        // ✅ VERIFICAÇÃO ROBUSTA DE TOKEN
        const token = getToken();
        
        if (!token || isTokenExpired(token)) {
            clearSessionAndRedirect();
            return;
        }

        const response = await fetch(`${API_URL}?page=${page}&search=${search}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                clearSessionAndRedirect();
                return;
            }
            throw new Error('Erro ao carregar clientes');
        }

        const data = await response.json();
        clients = data.clients || [];
        currentPage = data.page || 1;
        totalPages = data.totalPages || 1;
        
        renderClientsTable();
        updatePagination();
        updateClientsCount();
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showError('Erro ao carregar os clientes. Tente novamente.');
    }
}

// Função para carregar os planos
async function loadPlans() {
    try {
        const response = await fetch(`${BASE_URL}/api/planos`);
        if (!response.ok) {
            throw new Error('Erro ao carregar planos');
        }
        const planos = await response.json();
        const planoSelect = document.getElementById('plano');
        planoSelect.innerHTML = '<option value="">Selecione um plano...</option>';
        
        planos.forEach(plano => {
            const option = document.createElement('option');
            option.value = plano._id;
            option.textContent = `${plano.nome} - ${plano.descricao}`;
            planoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar planos:', error);
        // Só exibe alerta se o campo de plano estiver visível
        const planoGroup = document.getElementById('plano')?.closest('.form-group');
        if (planoGroup && planoGroup.style.display !== 'none') {
            showError('Erro ao carregar os planos. Tente novamente.');
        }
        // Caso contrário, apenas loga o erro
    }
}

// Função para renderizar a tabela de clientes
function renderClientsTable() {
    const tbody = document.getElementById('clientsTableBody');
    tbody.innerHTML = '';

    if (!clients || clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-400">Nenhum cliente encontrado</td></tr>';
        return;
    }

    clients.forEach(client => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-800 transition-colors';
        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-100">${client.companyName || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-300">${client.responsibleName || 'N/A'}</td>
            <td class="px-6 py-4 text-sm text-gray-300">${client.responsibleEmail || 'N/A'}</td>
            <td class="px-6 py-4 text-sm text-gray-300">${formatPhone(client.responsiblePhone) || 'N/A'}</td>
            <td class="px-6 py-4 text-sm text-gray-300">${formatCNPJ(client.cnpj) || 'N/A'}</td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(client.status)}">
                    ${formatStatus(client.status)}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <button class="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm" onclick="editClient('${client._id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm" onclick="deleteClient('${client._id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Função para obter classes CSS baseadas no status
function getStatusClass(status) {
    const statusClasses = {
        ativo: 'bg-green-500/20 text-green-400',
        inativo: 'bg-red-500/20 text-red-400',
        pendente: 'bg-yellow-500/20 text-yellow-400'
    };
    return statusClasses[status] || 'bg-gray-500/20 text-gray-400';
}

// Funções de formatação
function formatStatus(status) {
    const statuses = {
        ativo: 'Ativo',
        inativo: 'Inativo',
        pendente: 'Pendente'
    };
    return statuses[status] || status;
}

function formatPhone(phone) {
    if (!phone) return '';
    phone = phone.replace(/\D/g, '');
    return phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
}

function formatCNPJ(cnpj) {
    if (!cnpj) return '';
    cnpj = cnpj.replace(/\D/g, '');
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatCPF(cpf) {
    if (!cpf) return '';
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

// Funções do modal
function openNewClientModal() {
    currentClientId = null;
    clearForms();
    document.getElementById('modalTitle').textContent = 'Novo Cliente';
    document.getElementById('clientModal').classList.remove('hidden');
    document.getElementById('enviarCredenciais').checked = true;
    loadPlans();
    switchTab('company'); // Começar na aba empresa
}

// Função para atualizar contador de clientes
function updateClientsCount() {
    const clientsCountEl = document.getElementById('clientsCount');
    if (clientsCountEl) {
        clientsCountEl.textContent = clients.length;
    }
}

async function editClient(clientId) {
    try {
        // ✅ VERIFICAÇÃO ROBUSTA DE TOKEN
        const token = getToken();
        
        if (!token || isTokenExpired(token)) {
            clearSessionAndRedirect();
            return;
        }

        const response = await fetch(`${API_URL}/${clientId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                clearSessionAndRedirect();
                return;
            }
            throw new Error('Erro ao carregar dados do cliente');
        }

        const client = await response.json();
        currentClientId = clientId;
        localStorage.setItem(`client_${clientId}`, JSON.stringify(client));
        await loadPlans();
        fillClientData(client);
        document.getElementById('modalTitle').textContent = 'Editar Cliente';
        document.getElementById('clientModal').classList.remove('hidden');
    } catch (error) {
        console.error('Erro:', error);
        showError('Erro ao carregar dados do cliente. Tente novamente.');
    }
}

function closeClientModal() {
    document.getElementById('clientModal').classList.add('hidden');
    clearForms();
}

// Funções de manipulação de dados
function clearForms() {
    currentClientId = null;
    
    // Limpar todos os campos do formulário
    const inputs = document.querySelectorAll('#clientModal input, #clientModal select');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
    
    // Configura valores padrão para novo cliente
    document.getElementById('status').value = 'pendente';
    document.getElementById('emailAcesso').value = '';
    
    // Configura a senha para novo cliente
    const senhaInput = document.getElementById('senha');
    senhaInput.value = generatePassword();
    senhaInput.type = 'text'; // Garante que a senha fique visível
    
    document.getElementById('enviarCredenciais').checked = true;
    switchTab('company');
}

function fillClientData(client) {
    if (!client || typeof client !== 'object') {
        showError('Dados do cliente não encontrados ou inválidos.');
        return;
    }
    currentClientId = client._id;

    // Dados da Empresa
    document.getElementById('empresaNome').value = client.companyName || '';
    document.getElementById('empresaCNPJ').value = client.cnpj || '';

    // Dados do Responsável
    document.getElementById('responsavelNome').value = client.responsibleName || '';
    document.getElementById('responsavelCargo').value = client.responsiblePosition || '';
    document.getElementById('responsavelEmail').value = client.responsibleEmail || '';
    document.getElementById('responsavelTelefone').value = client.responsiblePhone || '';
    document.getElementById('responsavelCPF').value = client.responsibleCPF || '';

    // Dados de Acesso
    document.getElementById('emailAcesso').value = client.accessEmail || client.responsibleEmail || '';
    // Dados de Acesso
    document.getElementById('status').value = client.status || 'pendente';
    document.getElementById('plano').value = client.plan || '';
    
    // Recupera a senha do cache se disponível
    const cachedClient = localStorage.getItem(`client_${client._id}`);
    const senhaInput = document.getElementById('senha');
    if (cachedClient) {
        const parsedClient = JSON.parse(cachedClient);
        senhaInput.value = parsedClient.password || client.password || '';
    } else {
        senhaInput.value = client.password || '';
    }
    senhaInput.type = 'text'; // Garante que a senha fique visível
    
    document.getElementById('enviarCredenciais').checked = false;

    // Endereço
    document.getElementById('cep').value = client.cep || '';
    document.getElementById('rua').value = client.street || '';
    document.getElementById('numero').value = client.number || '';
    document.getElementById('complemento').value = client.complement || '';
    document.getElementById('bairro').value = client.neighborhood || '';
    document.getElementById('cidade').value = client.city || '';
    document.getElementById('estado').value = client.state || '';
}

// Função para gerar senha aleatória
function generatePassword() {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    // Atualiza o campo de senha com a nova senha gerada
    const senhaInput = document.getElementById('senha');
    senhaInput.value = password;
    senhaInput.type = 'text'; // Garante que a senha fique visível
    return password;
}

// Função para copiar senha
function copyPassword() {
    const senhaInput = document.getElementById('senha');
    senhaInput.select();
    document.execCommand('copy');
    showSuccess('Senha copiada para a área de transferência!');
}

// Função para buscar CEP
async function buscarCep() {
    const cep = document.getElementById('cep').value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            throw new Error('CEP não encontrado');
        }

        document.getElementById('rua').value = data.logradouro;
        document.getElementById('bairro').value = data.bairro;
        document.getElementById('cidade').value = data.localidade;
        document.getElementById('estado').value = data.uf;
    } catch (error) {
        showError('Erro ao buscar CEP. Verifique o número informado.');
    }
}

// Função para salvar os dados do cliente
async function saveClientData() {
    try {
        // ✅ VERIFICAÇÃO ROBUSTA DE TOKEN
        const token = getToken();
        
        if (!token || isTokenExpired(token)) {
            clearSessionAndRedirect();
            return;
        }

        // Validações básicas
        const password = document.getElementById('senha').value;
        if (!password || password.length < 6) {
            showError('A senha é obrigatória e deve ter pelo menos 6 caracteres.');
            return;
        }

        const clientData = {
            companyName: document.getElementById('empresaNome').value,
            cnpj: document.getElementById('empresaCNPJ').value,
            responsibleName: document.getElementById('responsavelNome').value,
            responsiblePosition: document.getElementById('responsavelCargo').value,
            responsibleEmail: document.getElementById('responsavelEmail').value,
            responsiblePhone: document.getElementById('responsavelTelefone').value,
            responsibleCPF: document.getElementById('responsavelCPF').value,
            cep: document.getElementById('cep').value,
            street: document.getElementById('rua').value,
            number: document.getElementById('numero').value,
            complement: document.getElementById('complemento').value,
            neighborhood: document.getElementById('bairro').value,
            city: document.getElementById('cidade').value,
            state: document.getElementById('estado').value,
            accessEmail: document.getElementById('emailAcesso').value,
            password: password,
            plan: document.getElementById('plano').value,
            status: document.getElementById('status').value
        };
        
        const isEdit = currentClientId !== null;
        const method = isEdit ? 'PATCH' : 'POST';
        const url = isEdit ? `${API_URL}/${currentClientId}` : API_URL;
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(clientData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            if (response.status === 401) {
                clearSessionAndRedirect();
                return;
            } else if (response.status === 400) {
                showError(`Erro de validação: ${errorData?.message || 'Dados inválidos'}`);
                return;
            } else if (response.status === 409) {
                showError(`Conflito: ${errorData?.message || 'CNPJ ou email já está em uso'}`);
                return;
            } else {
                showError(`Erro: ${errorData?.message || 'Erro interno do servidor'}`);
                return;
            }
        }

        showSuccess(isEdit ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
        closeClientModal();
        loadClients();
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        showError('Erro interno. Tente novamente.');
    }
}

// Função para excluir cliente
async function deleteClient(clientId) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
        return;
    }

    try {
        // ✅ VERIFICAÇÃO ROBUSTA DE TOKEN
        const token = getToken();
        
        if (!token || isTokenExpired(token)) {
            clearSessionAndRedirect();
            return;
        }

        const response = await fetch(`${API_URL}/${clientId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                clearSessionAndRedirect();
                return;
            }
            
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erro ao excluir cliente');
        }

        // Remove o cliente do cache
        localStorage.removeItem(`client_${clientId}`);
        
        await loadClients(currentPage);
        showSuccess('Cliente excluído com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        showError(error.message || 'Erro ao excluir o cliente. Tente novamente.');
    }
}

// Função para buscar clientes
let searchTimeout;
function searchClients() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const searchTerm = document.getElementById('searchClient').value;
        loadClients(1, searchTerm);
    }, 300);
}

// Funções de paginação
function updatePagination() {
    // Implementar conforme necessário
}

// Função para alternar entre as tabs
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-red-500', 'text-red-400');
        btn.classList.add('border-transparent', 'text-gray-400');
    });
    
    // Show selected tab content
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }
    
    // Add active class to selected tab button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('border-transparent', 'text-gray-400');
        activeBtn.classList.add('border-red-500', 'text-red-400');
    }
}

// Função para popular o select de estados
function populateStates() {
    const states = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
        'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
        'SP', 'SE', 'TO'
    ];

    const select = document.getElementById('estado');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        select.appendChild(option);
    });
}

// Configurar máscaras de input
function setupMasks() {
    const cpfInput = document.getElementById('responsavelCPF');
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
            e.target.value = value;
        }
    });

    const cnpjInput = document.getElementById('empresaCNPJ');
    cnpjInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 14) {
            value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
            e.target.value = value;
        }
    });

    const phoneInput = document.getElementById('responsavelTelefone');
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
            e.target.value = value;
        }
    });

    const cepInput = document.getElementById('cep');
    cepInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 8) {
            value = value.replace(/^(\d{5})(\d{3})$/, '$1-$2');
            e.target.value = value;
        }
    });
}

// Funções de feedback
function showSuccess(message) {
    // Sistema de notificação simples usando alert por ora
    // TODO: Implementar sistema de toast mais elegante futuramente
    alert('✅ ' + message);
}

function showError(message) {
    // Sistema de notificação simples usando alert por ora  
    // TODO: Implementar sistema de toast mais elegante futuramente
    alert('❌ ' + message);
}

// ✅ Inicialização da página com verificação de autenticação
window.onload = function () {
    if (!checkAuth()) return;
    
    // Configurar eventos para sincronização de email
    const responsavelEmailInput = document.getElementById('responsavelEmail');
    if (responsavelEmailInput) {
        responsavelEmailInput.addEventListener('input', function(e) {
            const emailAcessoInput = document.getElementById('emailAcesso');
            if (emailAcessoInput) {
                emailAcessoInput.value = e.target.value;
            }
        });
    }
}; 