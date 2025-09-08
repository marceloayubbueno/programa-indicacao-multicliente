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
        const response = await fetch(`${API_URL}/api/auth/client-login`, {
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
        if (data.client && data.client.id) {
            localStorage.setItem('clientId', data.client.id);
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
        const response = await fetch(`${API_URL}/api/clients/me`, {
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

// ===== FUNÇÕES DE MENU CENTRALIZADAS =====
// Funções para controlar os menus dropdown do sistema

function toggleEngagementEmailMenu() {
    const menu = document.getElementById('engagementEmailMenu');
    const arrow = document.getElementById('engagementEmailArrow');
    
    if (menu && arrow) {
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            arrow.style.transform = 'rotate(90deg)';
        } else {
            menu.classList.add('hidden');
            arrow.style.transform = 'rotate(0deg)';
        }
    }
}

function toggleWhatsAppMenu() {
    const menu = document.getElementById('whatsappMenu');
    const arrow = document.getElementById('whatsappArrow');
    
    if (menu && arrow) {
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            arrow.style.transform = 'rotate(90deg)';
        } else {
            menu.classList.add('hidden');
            arrow.style.transform = 'rotate(0deg)';
        }
    }
}

function toggleFinanceMenu() {
    const menu = document.getElementById('financeMenu');
    const arrow = document.getElementById('financeArrow');
    
    if (menu && arrow) {
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            arrow.style.transform = 'rotate(90deg)';
        } else {
            menu.classList.add('hidden');
            arrow.style.transform = 'rotate(0deg)';
        }
    }
}

function toggleSettingsMenu() {
    const menu = document.getElementById('settingsMenu');
    const arrow = document.getElementById('settingsArrow');
    
    if (menu && arrow) {
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            arrow.style.transform = 'rotate(90deg)';
        } else {
            menu.classList.add('hidden');
            arrow.style.transform = 'rotate(0deg)';
        }
    }
}

// Função para destacar menu ativo baseado na URL atual
function highlightActiveMenu() {
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('nav a');
    
    menuItems.forEach(item => {
        item.classList.remove('bg-gray-800', 'text-blue-400', 'font-semibold');
        item.classList.add('hover:bg-gray-700');
        
        if (item.getAttribute('href') && currentPath.includes(item.getAttribute('href'))) {
            item.classList.remove('hover:bg-gray-700');
            item.classList.add('bg-gray-800', 'text-blue-400', 'font-semibold');
        }
    });
    
    // Destacar submenu ativo
    const submenuItems = document.querySelectorAll('nav ul ul a');
    submenuItems.forEach(item => {
        if (item.getAttribute('href') && currentPath.includes(item.getAttribute('href'))) {
            // Expandir o menu pai
            const parentMenu = item.closest('ul');
            if (parentMenu && parentMenu.id) {
                const parentButton = document.querySelector(`[onclick*="${parentMenu.id.replace('Menu', '')}"]`);
                if (parentButton) {
                    parentMenu.classList.remove('hidden');
                    const arrow = parentButton.querySelector('.fa-chevron-right');
                    if (arrow) {
                        arrow.style.transform = 'rotate(90deg)';
                    }
                }
            }
            
            // Destacar o item ativo
            item.classList.remove('hover:bg-gray-700');
            item.classList.add('bg-gray-700', 'text-blue-400');
        }
    });
}

// Inicializar menus quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    highlightActiveMenu();
});