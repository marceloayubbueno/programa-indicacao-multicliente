// URLs da API
// 🌍 CONFIGURAÇÃO DINÂMICA: usar config.js quando disponível
window.AUTH_API_URL = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                     (window.location.hostname === 'localhost' ? 
                      'http://localhost:3000/api' : 
                      'https://programa-indicacao-multicliente-production.up.railway.app/api');

// Função para fazer login
async function handleAdminLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${window.AUTH_API_URL}/auth/admin-login`, {
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

        // Salvar token e dados do admin
        localStorage.setItem('adminToken', data.access_token);
        localStorage.setItem('adminData', JSON.stringify(data.admin));

        // Redirecionar para o dashboard
        window.location.href = '/admin/pages/dashboard.html';
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    }
}

// Função para verificar se está autenticado
function checkAuth() {
    // Se estiver na página de login, não precisa verificar autenticação
    if (window.location.pathname.includes('/admin/pages/login.html')) {
        return;
    }
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/pages/login.html';
        return false;
    }
    return true;
}

// Função para fazer logout
function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = '/admin/pages/login.html';
}

// Verificar autenticação ao carregar a página
// Só chama checkAuth no DOMContentLoaded
// para evitar loop na tela de login

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    console.log('[DEPURACAO] checkAdminAuth token:', token);
    if (!token) {
        console.log('[DEPURACAO] Redirecionando para login.html');
        window.location.href = 'login.html'; // ou dashboard.html, conforme fluxo
    }
    // Opcional: validar expiração do token, etc.
}

// Executar verificação ao carregar páginas administrativas
if (typeof window !== 'undefined' && !window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', checkAdminAuth);
} 