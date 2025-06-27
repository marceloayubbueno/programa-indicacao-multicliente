// Função para carregar os dados do cliente autenticado
async function loadCompanyData() {
    try {
        const token = localStorage.getItem('clientToken');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch('http://localhost:3000/api/clients/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Erro ao carregar dados do cliente');
        }

        const data = await response.json();
        // Salvar o id do cliente para uso posterior
        localStorage.setItem('clientId', data._id);
        populateForms(data);
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao carregar dados do cliente', 'error');
    }
}

// Função para preencher os formulários com os dados do cliente
function populateForms(data) {
    // Dados da Empresa
    document.getElementById('companyName').value = data.companyName || '';
    document.getElementById('companyCNPJ').value = data.cnpj || '';
    document.getElementById('companyEmail').value = data.accessEmail || '';
    document.getElementById('companyPhone').value = data.responsiblePhone || '';
    document.getElementById('companyAddress').value = data.street || '';
    document.getElementById('companyCity').value = data.city || '';
    document.getElementById('companyState').value = data.state || '';
    document.getElementById('companyCEP').value = data.cep || '';

    // Dados do Plano
    const planoElement = document.getElementById('companyPlan');
    if (planoElement) {
        planoElement.value = (data.plan && typeof data.plan === 'object' && data.plan.nome) ? data.plan.nome : (data.plan || 'Sem plano');
    }

    // Dados de Contato
    document.getElementById('contactName').value = data.responsibleName || '';
    document.getElementById('contactPosition').value = data.responsiblePosition || '';
    document.getElementById('contactEmail').value = data.responsibleEmail || '';
    document.getElementById('contactPhone').value = data.responsiblePhone || '';

    // Configurações de Notificação (opcional, se existir no backend)
    document.getElementById('notifyNewReferrals').checked = data.notifyNewReferrals ?? true;
    document.getElementById('notifyRewards').checked = data.notifyRewards ?? true;
    document.getElementById('notifyCampaigns').checked = data.notifyCampaigns ?? true;

    // Bloquear edição do CNPJ
    document.getElementById('companyCNPJ').readOnly = true;
}

// Função para validar os dados antes de salvar
function validateForm() {
    const requiredFields = [
        'companyName',
        'companyEmail',
        'companyPhone',
        'contactName',
        'contactEmail',
        'contactPhone'
    ];

    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            showNotification(`O campo ${field.previousElementSibling.textContent.replace('*', '')} é obrigatório`, 'error');
            field.focus();
            return false;
        }
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const companyEmail = document.getElementById('companyEmail').value;
    const contactEmail = document.getElementById('contactEmail').value;

    if (!emailRegex.test(companyEmail) || !emailRegex.test(contactEmail)) {
        showNotification('Por favor, insira um e-mail válido', 'error');
        return false;
    }

    return true;
}

// Função para salvar os dados do cliente
async function saveCompanyData() {
    if (!validateForm()) {
        return;
    }

    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        if (!token || !clientId) {
            window.location.href = 'login.html';
            return;
        }

        // Montar o objeto no formato esperado pelo backend NestJS
        const updateData = {
            companyName: document.getElementById('companyName').value,
            cnpj: document.getElementById('companyCNPJ').value,
            plan: document.getElementById('companyPlan').value,
            accessEmail: document.getElementById('companyEmail').value,
            responsibleName: document.getElementById('contactName').value,
            responsiblePosition: document.getElementById('contactPosition').value,
            responsibleEmail: document.getElementById('contactEmail').value,
            responsiblePhone: document.getElementById('contactPhone').value,
            cep: document.getElementById('companyCEP').value,
            street: document.getElementById('companyAddress').value,
            city: document.getElementById('companyCity').value,
            state: document.getElementById('companyState').value,
            // Notificações (se existirem no backend)
            notifyNewReferrals: document.getElementById('notifyNewReferrals').checked,
            notifyRewards: document.getElementById('notifyRewards').checked,
            notifyCampaigns: document.getElementById('notifyCampaigns').checked
        };

        const response = await fetch(`http://localhost:3000/api/clients/${clientId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Erro ao salvar dados do cliente');
        }

        showNotification('Dados salvos com sucesso!', 'success');
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao salvar dados do cliente', 'error');
    }
}

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

// Máscara para CNPJ
function maskCNPJ(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    input.value = value;
}

// Máscara para telefone
function maskPhone(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    input.value = value;
}

// Máscara para CEP
function maskCEP(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    input.value = value;
}

// Adicionar máscaras aos campos
document.getElementById('companyCNPJ').addEventListener('input', function() {
    maskCNPJ(this);
});

document.getElementById('companyPhone').addEventListener('input', function() {
    maskPhone(this);
});

document.getElementById('contactPhone').addEventListener('input', function() {
    maskPhone(this);
});

document.getElementById('companyCEP').addEventListener('input', function() {
    maskCEP(this);
});

// Carregar dados ao iniciar a página
document.addEventListener('DOMContentLoaded', loadCompanyData); 