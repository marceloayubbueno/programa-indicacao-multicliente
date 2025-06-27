function validatePassword(password) {
    const regex = /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
    return regex.test(password);
}

function showError(element, message) {
    const formGroup = element.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message') || document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    if (!formGroup.querySelector('.error-message')) {
        formGroup.appendChild(errorElement);
    }
    
    element.classList.add('error');
}

function clearError(element) {
    const formGroup = element.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
    element.classList.remove('error');
}

async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validações
    let isValid = true;
    
    if (password !== confirmPassword) {
        showError(document.getElementById('confirmPassword'), 'As senhas não coincidem');
        isValid = false;
    } else {
        clearError(document.getElementById('confirmPassword'));
    }
    
    if (!validatePassword(password)) {
        showError(document.getElementById('password'), 'A senha não atende aos requisitos mínimos');
        isValid = false;
    } else {
        clearError(document.getElementById('password'));
    }
    
    if (!isValid) return false;
    
    try {
        // Primeiro, registra o usuário
        const registerResponse = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                password
            })
        });

        if (!registerResponse.ok) {
            throw new Error('Erro no registro');
        }

        const { token } = await registerResponse.json();

        // Salva o token
        localStorage.setItem('token', token);

        // Agora, salva os dados iniciais da empresa
        const companyData = {
            companyName: name.split(' ')[0] + ' Empresa', // Nome temporário baseado no nome do usuário
            companyEmail: email,
            companyPhone: phone,
            contactName: name,
            contactEmail: email,
            contactPhone: phone,
            // Campos vazios que podem ser preenchidos depois
            companyCNPJ: '',
            companyAddress: '',
            companyCity: '',
            companyState: '',
            companyCEP: '',
            contactPosition: '',
            notifyNewReferrals: true,
            notifyRewards: true,
            notifyCampaigns: true
        };

        const companyResponse = await fetch('/api/company/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(companyData)
        });

        if (!companyResponse.ok) {
            throw new Error('Erro ao salvar dados da empresa');
        }

        showNotification('Registro realizado com sucesso!', 'success');
        
        // Redireciona para o dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao realizar registro', 'error');
    }
    
    return false;
}

// Adiciona validação em tempo real
document.getElementById('password').addEventListener('input', function(e) {
    if (!validatePassword(e.target.value)) {
        showError(e.target, 'A senha não atende aos requisitos mínimos');
    } else {
        clearError(e.target);
    }
});

document.getElementById('confirmPassword').addEventListener('input', function(e) {
    const password = document.getElementById('password').value;
    if (e.target.value !== password) {
        showError(e.target, 'As senhas não coincidem');
    } else {
        clearError(e.target);
    }
});

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Máscara para telefone
function maskPhone(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    input.value = value;
}

// Adicionar máscara ao campo de telefone
document.getElementById('phone').addEventListener('input', function() {
    maskPhone(this);
}); 