// Máscara para o campo de WhatsApp
function maskWhatsApp(event) {
    let input = event.target;
    let value = input.value.replace(/\D/g, ''); // Remove tudo que não é número
    
    if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Adiciona parênteses e espaço
        value = value.replace(/(\d{5})(\d)/, '$1-$2'); // Adiciona hífen
    }
    
    input.value = value;
}

// Função para mostrar/ocultar senha
function togglePassword() {
    const senhaInput = document.getElementById('senha');
    const toggleButton = document.querySelector('.toggle-password');
    
    if (senhaInput.type === 'password') {
        senhaInput.type = 'text';
        toggleButton.textContent = '🔒';
    } else {
        senhaInput.type = 'password';
        toggleButton.textContent = '👁️';
    }
}

// Validação do formulário
function validateForm() {
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const empresa = document.getElementById('empresa').value.trim();
    const funcionarios = document.getElementById('funcionarios').value;
    const senha = document.getElementById('senha').value;
    const termos = document.getElementById('termos').checked;
    
    // Validar nome (mínimo 3 caracteres)
    if (nome.length < 3) {
        alert('Por favor, digite seu nome completo');
        return false;
    }
    
    // Validar e-mail corporativo
    if (!email.includes('@') || email.endsWith('@gmail.com') || email.endsWith('@hotmail.com') || email.endsWith('@outlook.com')) {
        alert('Por favor, use um e-mail corporativo válido');
        return false;
    }
    
    // Validar WhatsApp (formato brasileiro)
    const whatsappRegex = /^\(\d{2}\)\s\d{5}-\d{4}$/;
    if (!whatsappRegex.test(whatsapp)) {
        alert('Por favor, digite um número de WhatsApp válido');
        return false;
    }
    
    // Validar empresa (mínimo 2 caracteres)
    if (empresa.length < 2) {
        alert('Por favor, digite o nome da sua empresa');
        return false;
    }
    
    // Validar número de funcionários
    if (!funcionarios) {
        alert('Por favor, selecione o número de funcionários');
        return false;
    }
    
    // Validar senha (mínimo 8 caracteres)
    if (senha.length < 8) {
        alert('A senha deve ter no mínimo 8 caracteres');
        return false;
    }
    
    // Validar termos
    if (!termos) {
        alert('Você precisa aceitar os termos de uso e a política de privacidade');
        return false;
    }
    
    return true;
}

async function buscarPlanoTrial() {
    try {
        // 🌍 USAR CONFIGURAÇÃO DINÂMICA
    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                  (window.location.hostname === 'localhost' ? 
                   'http://localhost:3000' : 
                   'https://programa-indicacao-multicliente-production.up.railway.app');
    const response = await fetch(`${apiUrl}/planos`);
        const planos = await response.json();
        const trial = planos.find(p => p.nome && p.nome.toLowerCase() === 'trial');
        if (!trial) throw new Error('Plano Trial não encontrado');
        return trial;
    } catch (err) {
        alert('Erro ao buscar plano Trial. Tente novamente mais tarde.');
        throw err;
    }
}

async function cadastrarClienteTrial(formData, planId) {
    try {
        // 🌍 USAR CONFIGURAÇÃO DINÂMICA
        const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                      (window.location.hostname === 'localhost' ? 
                       'http://localhost:3000' : 
                       'https://programa-indicacao-multicliente-production.up.railway.app');
        const response = await fetch(`${apiUrl}/clients/trial`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, plan: planId })
        });
        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.message || 'Erro ao cadastrar cliente');
        }
        return await response.json();
    } catch (err) {
        alert('Erro ao cadastrar: ' + err.message);
        throw err;
    }
}

async function autenticarCliente(email, senha) {
    try {
        // 🌍 USAR CONFIGURAÇÃO DINÂMICA
        const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                      (window.location.hostname === 'localhost' ? 
                       'http://localhost:3000' : 
                       'https://programa-indicacao-multicliente-production.up.railway.app');
        const response = await fetch(`${apiUrl}/auth/client-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: senha })
        });
        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.message || 'Erro ao autenticar');
        }
        return await response.json();
    } catch (err) {
        alert('Erro ao autenticar: ' + err.message);
        throw err;
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return false;
    const formData = {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        whatsapp: document.getElementById('whatsapp').value.trim(),
        empresa: document.getElementById('empresa').value.trim(),
        funcionarios: document.getElementById('funcionarios').value,
        senha: document.getElementById('senha').value
    };
    try {
        const planoTrial = await buscarPlanoTrial();
        await cadastrarClienteTrial(formData, planoTrial._id);
        // Autenticar cliente
        const login = await autenticarCliente(formData.email, formData.senha);
        if (login && login.token) {
            localStorage.setItem('clientToken', login.token);
            alert('Cadastro realizado com sucesso! Redirecionando para a área do cliente.');
            window.location.href = 'dashboard.html';
        } else {
            alert('Cadastro realizado, mas não foi possível autenticar automaticamente. Faça login manualmente.');
            window.location.href = 'login.html';
        }
    } catch (err) {
        // Erro já tratado nas funções auxiliares
    }
    return false;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Adicionar máscara ao campo de WhatsApp
    const whatsappInput = document.getElementById('whatsapp');
    whatsappInput.addEventListener('input', maskWhatsApp);
    
    // Validar força da senha em tempo real
    const senhaInput = document.getElementById('senha');
    senhaInput.addEventListener('input', function() {
        const passwordHint = document.querySelector('.password-hint');
        
        if (this.value.length < 8) {
            passwordHint.style.color = '#e74c3c';
        } else {
            passwordHint.style.color = '#27ae60';
        }
    });
}); 