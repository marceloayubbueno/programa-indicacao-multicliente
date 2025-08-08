// Configuração WhatsApp - Gestão de configurações simplificada
// Sistema multicliente - JWT Authentication - Apenas campos essenciais

// Variáveis globais
let whatsappConfig = null;
let clientId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM carregado - iniciando WhatsApp Config Simplificado');
    await initWhatsAppConfig();
});

async function initWhatsAppConfig() {
    try {
        console.log('Iniciando WhatsApp Config Simplificado...');
        
        // Verificar se API_BASE_URL está definido
        if (!window.API_BASE_URL) {
            console.error('API_BASE_URL não está definido!');
            showError('Erro de configuração: API_BASE_URL não encontrado');
            return;
        }
        
        console.log('API_BASE_URL:', window.API_BASE_URL);

        // Verificar autenticação
        if (!checkAuth()) {
            console.log('Falha na autenticação');
            return;
        }

        // Obter clientId do token
        clientId = getClientIdFromToken();
        if (!clientId) {
            console.error('ClientId não encontrado no token');
            showError('Token inválido - clientId não encontrado');
            return;
        }
        
        console.log('ClientId extraído:', clientId);

        // Carregar dados iniciais
        await loadConfig();
        await loadActivityLogs();
        
        console.log('WhatsApp Config Simplificado inicializado com sucesso');
        
    } catch (error) {
        console.error('Erro ao inicializar WhatsApp Config:', error);
        showError('Erro ao carregar configurações');
    }
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        console.log('Token não encontrado, redirecionando para login');
        window.location.href = 'login.html';
        return false;
    }
    console.log('Token encontrado');
    return true;
}

function getToken() {
    return localStorage.getItem('clientToken');
}

function getClientIdFromToken() {
    const token = getToken();
    if (!token) return null;
    
    try {
        // Decodificar JWT para extrair clientId
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Payload do token:', payload);
        return payload.clientId || payload.sub;
    } catch (error) {
        console.error('Erro ao decodificar token:', error);
        return null;
    }
}

async function loadConfig() {
    try {
        console.log('Carregando configuração simplificada para clientId:', clientId);
        const token = getToken();
        const url = `${window.API_BASE_URL}/whatsapp/client/config`;
        console.log('URL da requisição:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const responseData = await response.json();
            console.log('Resposta completa:', responseData);
            
            // Extrair dados da resposta
            if (responseData.data) {
                whatsappConfig = responseData.data;
            } else {
                whatsappConfig = responseData;
            }
            
            console.log('Configuração carregada:', whatsappConfig);
            
            // Preencher formulário simplificado
            document.getElementById('companyName').value = whatsappConfig.displayName || whatsappConfig.companyName || '';
            document.getElementById('businessDescription').value = whatsappConfig.businessDescription || '';
            
        } else {
            console.log('Configuração não encontrada, criando nova...');
            whatsappConfig = {
                displayName: '',
                businessDescription: '',
                isActive: false,
                isVerified: false
            };
        }
    } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        showError('Erro ao carregar configuração');
    }
}

async function loadActivityLogs() {
    try {
        const token = getToken();
        const url = `${window.API_BASE_URL}/whatsapp/client/messages`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            renderActivityLogs(data.data || []);
        } else {
            renderActivityLogs([]);
        }
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        renderActivityLogs([]);
    }
}

function validateCompanyName(companyName) {
    return companyName && companyName.trim().length >= 2;
}

async function saveWhatsAppConfig() {
    try {
        const companyName = document.getElementById('companyName').value.trim();
        const businessDescription = document.getElementById('businessDescription').value.trim();
        
        // Validação básica
        if (!validateCompanyName(companyName)) {
            showError('Nome da empresa é obrigatório (mínimo 2 caracteres)');
            return;
        }
        
        const configData = {
            displayName: companyName,
            businessDescription
        };
        
        console.log('Salvando configuração:', configData);
        
        const token = getToken();
        const url = `${window.API_BASE_URL}/whatsapp/client/config`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(configData)
        });
        
        if (response.ok) {
            const result = await response.json();
            whatsappConfig = result.data || result;
            
            showSuccess('Configuração salva com sucesso!');
            await loadActivityLogs();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao salvar configuração');
        }
    } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        showError('Erro ao salvar configuração: ' + error.message);
    }
}

function resetWhatsAppConfig() {
    if (confirm('Tem certeza que deseja resetar a configuração?')) {
        document.getElementById('companyName').value = '';
        document.getElementById('businessDescription').value = '';
        showSuccess('Configuração resetada');
    }
}

async function sendTestMessage() {
    try {
        const testNumber = document.getElementById('testNumber').value.trim();
        const testMessage = document.getElementById('testMessage').value.trim();
        
        if (!testNumber || !testMessage) {
            showError('Número e mensagem são obrigatórios');
            return;
        }
        
        const token = getToken();
        const url = `${window.API_BASE_URL}/whatsapp/client/message`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: testNumber,
                message: testMessage
            })
        });
        
        if (response.ok) {
            showSuccess('Mensagem de teste enviada com sucesso!');
            await loadActivityLogs();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao enviar mensagem');
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem de teste:', error);
        showError('Erro ao enviar mensagem: ' + error.message);
    }
}

function fillTestDefaults() {
    document.getElementById('testNumber').value = '+5511999999999';
    document.getElementById('testMessage').value = 'Olá! Este é um teste do sistema Viral Lead';
}

async function refreshLogs() {
    await loadActivityLogs();
    showSuccess('Logs atualizados');
}

function renderActivityLogs(logs) {
    const container = document.getElementById('activityLogs');
    if (!container) return;

    if (logs.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center">Nenhuma mensagem encontrada</p>';
        return;
    }

    const html = logs.map(message => `
        <div class="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
            <div class="flex-1">
                <p class="text-sm text-gray-200">${message.message || message.content?.body || 'Mensagem'}</p>
                <p class="text-xs text-gray-400 mt-1">${new Date(message.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            <div class="flex-shrink-0">
                <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(message.status)}">${message.status}</span>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

function getStatusColor(status) {
    switch (status) {
        case 'sent': return 'bg-green-500 text-green-100';
        case 'delivered': return 'bg-blue-500 text-blue-100';
        case 'failed': return 'bg-red-500 text-red-100';
        default: return 'bg-gray-500 text-gray-100';
    }
}

function showSuccess(message) {
    // Implementar notificação de sucesso
    alert('✅ ' + message);
}

function showError(message) {
    // Implementar notificação de erro
    alert('❌ ' + message);
} 