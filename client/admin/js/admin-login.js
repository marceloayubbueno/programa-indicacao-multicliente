// 🔒 SEGURANÇA: Credenciais removidas por segurança
// Use as variáveis de ambiente ou interface de login

document.addEventListener('DOMContentLoaded', function() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    
    // 🌍 USAR CONFIGURAÇÃO DINÂMICA DO config.js
    const BASE_URL = window.APP_CONFIG ? window.APP_CONFIG.API_URL.replace('/api', '') : 
                     (window.location.hostname === 'localhost' ? 
                      'http://localhost:3000' : 
                      'https://programa-indicacao-multicliente-production.up.railway.app');

    // Verifica se já existe um token válido
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken && window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Form submit acionado');
            const emailInput = document.getElementById('email');
            const senhaInput = document.getElementById('password');
            console.log('Campo email:', emailInput);
            console.log('Campo senha:', senhaInput);
            if (!emailInput || !senhaInput) {
                alert('Erro: campo de e-mail ou senha não encontrado no DOM!');
                window.lastLoginError = 'Campo de e-mail ou senha não encontrado no DOM!';
                return;
            }
            const email = emailInput.value;
            const password = senhaInput.value;
            console.log('Fazendo login com:', { email, password: '[CENSURADO]' });
            
            // Validações simples
            if (!email.trim() || !password.trim()) {
                alert('Por favor, preencha todos os campos.');
                return;
            }
            
            try {
                console.log('Fazendo requisição para:', `${BASE_URL}/api/auth/admin-login`);
                // 🔧 CORRIGIDO: URL correta do backend NestJS
                const response = await fetch(`${BASE_URL}/api/auth/admin-login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                console.log('Status da resposta:', response.status);
                const result = await response.json();
                console.log('Dados recebidos:', result);
                
                if (response.ok) {
                    // 🔧 CORRIGIDO: Backend retorna 'access_token', não 'token'
                    const adminToken = result.access_token;
                    const adminData = result.admin;
                    
                    // Salvar no localStorage
                    localStorage.setItem('adminToken', adminToken);
                    localStorage.setItem('adminData', JSON.stringify(adminData));
                    
                    window.lastLoginSuccess = true;
                    console.log('Login realizado com sucesso');
                    
                    // Redirecionar
                    window.location.href = 'dashboard.html';
                } else {
                    throw new Error(result.message || 'Erro na autenticação');
                }
            } catch (error) {
                console.error('Erro durante login:', error);
                alert('Erro ao fazer login: ' + error.message);
                window.lastLoginError = error.message;
            }
        });
    } else {
        console.error('Formulário de login não encontrado!');
    }
    
    // 🔒 SEGURANÇA: Auto-preenchimento removido por segurança
    // Para desenvolvimento, use login manual ou configure via .env
}); 