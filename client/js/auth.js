// 🔧 CORREÇÃO: Removendo declaração duplicada de API_URL (já existe em config.js)
// URLs da API - usando configuração global do config.js
// const API_URL = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
//                (window.location.hostname === 'localhost' ? 
//                 'http://localhost:3000/api' : 
//                 'https://programa-indicacao-multicliente-production.up.railway.app/api');

// 🔧 USAR CONFIGURAÇÃO GLOBAL
const API_URL = window.APP_CONFIG?.API_URL || window.API_URL;

// Função para fazer login
async function handleLogin(event) {
    event.preventDefault();
    console.log('Iniciando login...');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Feedback visual: loading
    const loginButton = event.target.querySelector('button[type="submit"]');
    const originalText = loginButton.textContent;
    loginButton.disabled = true;
    loginButton.textContent = 'Entrando...';
    let errorBox = document.getElementById('loginErrorBox');
    if (!errorBox) {
        errorBox = document.createElement('div');
        errorBox.id = 'loginErrorBox';
        errorBox.style.color = 'red';
        errorBox.style.marginTop = '10px';
        event.target.appendChild(errorBox);
    }
    errorBox.textContent = '';

    try {
        const response = await fetch(`${API_URL}/auth/client-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao fazer login');
        }

        // Salvar token e dados do cliente
        localStorage.setItem('clientToken', data.token);
        localStorage.setItem('clientData', JSON.stringify(data.client));
        if (data.client && data.client._id) {
            localStorage.setItem('clientId', data.client._id);
        }

        // Se for primeiro acesso, redirecionar para página de troca de senha
        if (data.client.primeiroAcesso) {
            window.location.href = 'change-password.html';
        } else {
            // Redirecionar para o dashboard
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Erro:', error);
        errorBox.textContent = error.message || 'Erro ao fazer login. Verifique suas credenciais.';
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = originalText;
    }
}

// Função para obter o token
function getToken() {
    return localStorage.getItem('clientToken');
}

// Função para verificar se está autenticado
function checkAuth() {
    const token = getToken();
    
    // Se estiver na página de login, não precisa verificar autenticação
    if (window.location.pathname.includes('/login.html')) {
        // Se já estiver autenticado na página de login, redireciona para o dashboard
        if (token) {
            window.location.href = 'dashboard.html';
        }
        return;
    }

    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Função para carregar dados do cliente
async function loadClientData() {
    const token = getToken();
    console.log('Token armazenado:', token ? 'Existe' : 'Não existe');
    
    if (!token) {
        console.log('Token não encontrado, redirecionando para login');
        logout();
        return;
    }

    try {
        console.log('Fazendo requisição para /clients/me');
        const response = await fetch(`${API_URL}/clients/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            console.error('Erro na resposta:', response.status, response.statusText);
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error('Erro ao carregar dados do cliente');
        }

        const data = await response.json();
        console.log('Dados do cliente carregados:', data);
        return data;
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        logout();
    }
}

// Função para fazer logout
function logout() {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientData');
    localStorage.removeItem('clientId');
    window.location.href = 'login.html';
}

// Verificar autenticação em páginas protegidas
if (!window.location.pathname.includes('/login.html') && 
    !window.location.pathname.includes('/forgot-password.html') && 
    !window.location.pathname.includes('/reset-password.html')) {
    checkAuth();
} 