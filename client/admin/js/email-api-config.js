// Configuração SendGrid API - Área Administrativa
let currentConfig = null;
let logsInterval = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 [SENDGRID-ADMIN] Inicializando configuração SendGrid');
    loadCurrentConfig();
    setupFormHandlers();
    checkApiStatus();
    loadLogs();
    startLogsRefresh();
});

// Carregar configuração atual
async function loadCurrentConfig() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            console.error('❌ [SENDGRID-ADMIN] Token admin não encontrado');
            return;
        }

        const response = await fetch(`${getApiUrl()}/admin/sendgrid-config`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentConfig = data;
            populateForm(data);
            updateApiStatus(data);
        } else if (response.status === 404) {
            console.log('📝 [SENDGRID-ADMIN] Nenhuma configuração encontrada');
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ [SENDGRID-ADMIN] Erro ao carregar configuração:', error);
        showNotification('Erro ao carregar configuração SendGrid', 'error');
    }
}

// Preencher formulário com dados existentes
function populateForm(config) {
    document.getElementById('apiKey').value = config.apiKey || '';
    document.getElementById('defaultFromEmail').value = config.defaultFromEmail || '';
    document.getElementById('defaultFromName').value = config.defaultFromName || '';
    document.getElementById('clientEmailLimit').value = config.clientEmailLimit || 1000;
    document.getElementById('sendTimeout').value = config.sendTimeout || 30;
    document.getElementById('enableRetry').checked = config.enableRetry !== false;
    document.getElementById('maxRetries').value = config.maxRetries || 3;
    document.getElementById('retryDelay').value = config.retryDelay || 5;
}

// Configurar handlers do formulário
function setupFormHandlers() {
    const form = document.getElementById('sendgridConfigForm');
    form.addEventListener('submit', handleSubmit);
}

// Handler de submit do formulário
async function handleSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const configData = {
        apiKey: formData.get('apiKey'),
        defaultFromEmail: formData.get('defaultFromEmail'),
        defaultFromName: formData.get('defaultFromName'),
        clientEmailLimit: parseInt(formData.get('clientEmailLimit')),
        sendTimeout: parseInt(formData.get('sendTimeout')),
        enableRetry: formData.get('enableRetry') === 'on',
        maxRetries: parseInt(formData.get('maxRetries')),
        retryDelay: parseInt(formData.get('retryDelay'))
    };

    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            showNotification('Token admin não encontrado', 'error');
            return;
        }

        const url = currentConfig 
            ? `${getApiUrl()}/admin/sendgrid-config`
            : `${getApiUrl()}/admin/sendgrid-config`;
        
        const method = currentConfig ? 'PATCH' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(configData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        currentConfig = data;
        
        showNotification('Configuração SendGrid salva com sucesso!', 'success');
        checkApiStatus();
        
    } catch (error) {
        console.error('❌ [SENDGRID-ADMIN] Erro ao salvar configuração:', error);
        showNotification('Erro ao salvar configuração: ' + error.message, 'error');
    }
}

// Testar conexão da API
async function testApiConnection() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            showNotification('Token admin não encontrado', 'error');
            return;
        }

        // Primeiro salvar a configuração atual
        const form = document.getElementById('sendgridConfigForm');
        const formData = new FormData(form);
        const configData = {
            apiKey: formData.get('apiKey'),
            defaultFromEmail: formData.get('defaultFromEmail'),
            defaultFromName: formData.get('defaultFromName'),
            clientEmailLimit: parseInt(formData.get('clientEmailLimit')),
            sendTimeout: parseInt(formData.get('sendTimeout')),
            enableRetry: formData.get('enableRetry') === 'on',
            maxRetries: parseInt(formData.get('maxRetries')),
            retryDelay: parseInt(formData.get('retryDelay'))
        };

        // Salvar configuração
        const saveResponse = await fetch(`${getApiUrl()}/admin/sendgrid-config`, {
            method: currentConfig ? 'PATCH' : 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(configData)
        });

        if (!saveResponse.ok) {
            throw new Error('Erro ao salvar configuração para teste');
        }

        // Testar conexão
        const testResponse = await fetch(`${getApiUrl()}/admin/sendgrid-config/test`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!testResponse.ok) {
            throw new Error(`HTTP error! status: ${testResponse.status}`);
        }

        const result = await testResponse.json();
        
        if (result.success) {
            showNotification('Teste de conexão realizado com sucesso!', 'success');
            showTestResult(true, 'Conexão estabelecida com sucesso');
            checkApiStatus();
        } else {
            showNotification('Erro no teste: ' + result.message, 'error');
            showTestResult(false, result.message);
        }

    } catch (error) {
        console.error('❌ [SENDGRID-ADMIN] Erro no teste:', error);
        showNotification('Erro no teste: ' + error.message, 'error');
        showTestResult(false, error.message);
    }
}

// Mostrar resultado do teste
function showTestResult(success, message) {
    const testResult = document.getElementById('testResult');
    testResult.className = success ? 'text-green-400' : 'text-red-400';
    testResult.innerHTML = `
        <i class="fas ${success ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
        ${message}
    `;
    testResult.classList.remove('hidden');
    
    setTimeout(() => {
        testResult.classList.add('hidden');
    }, 5000);
}

// Verificar status da API
async function checkApiStatus() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const response = await fetch(`${getApiUrl()}/admin/sendgrid-config/status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateApiStatus(data);
        }
    } catch (error) {
        console.error('❌ [SENDGRID-ADMIN] Erro ao verificar status:', error);
    }
}

// Atualizar status da API na interface
function updateApiStatus(data) {
    const statusElement = document.getElementById('apiStatus');
    const statusDot = statusElement.querySelector('span:first-child');
    const statusText = statusElement.querySelector('span:last-child');

    if (data.isConnected) {
        statusDot.className = 'w-3 h-3 bg-green-500 rounded-full mr-2';
        statusText.textContent = 'Conectado';
        statusText.className = 'text-green-400';
    } else {
        statusDot.className = 'w-3 h-3 bg-red-500 rounded-full mr-2';
        statusText.textContent = 'Desconectado';
        statusText.className = 'text-red-400';
    }

    // Atualizar métricas
    document.getElementById('lastTestTime').textContent = data.lastTestTime || '-';
    document.getElementById('emailsToday').textContent = data.emailsToday || '0';
    document.getElementById('deliveryRate').textContent = data.deliveryRate || '-';
    document.getElementById('remainingQuota').textContent = data.remainingQuota || '-';
}

// Carregar logs de envio
async function loadLogs() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const response = await fetch(`${getApiUrl()}/admin/sendgrid-config/logs`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateLogsTable(data.logs);
        }
    } catch (error) {
        console.error('❌ [SENDGRID-ADMIN] Erro ao carregar logs:', error);
    }
}

// Atualizar tabela de logs
function updateLogsTable(logs) {
    const tbody = document.getElementById('logsTableBody');
    
    if (!logs || logs.length === 0) {
        tbody.innerHTML = `
            <tr class="border-b border-gray-700">
                <td colspan="5" class="py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-2xl mb-2"></i>
                    <p>Nenhum log encontrado</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = logs.map(log => `
        <tr class="border-b border-gray-700">
            <td class="py-3 px-4 text-gray-300">${new Date(log.timestamp).toLocaleString('pt-BR')}</td>
            <td class="py-3 px-4 text-gray-300">${log.clientName || 'Sistema'}</td>
            <td class="py-3 px-4 text-gray-300">${log.toEmail}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs ${log.status === 'sent' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                    ${log.status === 'sent' ? 'Enviado' : 'Falha'}
                </span>
            </td>
            <td class="py-3 px-4 text-gray-300">${log.attempts || 1}</td>
        </tr>
    `).join('');
}

// Atualizar logs
function refreshLogs() {
    loadLogs();
}

// Iniciar atualização automática dos logs
function startLogsRefresh() {
    logsInterval = setInterval(loadLogs, 30000); // Atualizar a cada 30 segundos
}

// Parar atualização automática
function stopLogsRefresh() {
    if (logsInterval) {
        clearInterval(logsInterval);
        logsInterval = null;
    }
}

// Limpar formulário
function resetForm() {
    if (confirm('Tem certeza que deseja limpar o formulário?')) {
        document.getElementById('sendgridConfigForm').reset();
        document.getElementById('clientEmailLimit').value = '1000';
        document.getElementById('sendTimeout').value = '30';
        document.getElementById('enableRetry').checked = true;
        document.getElementById('maxRetries').value = '3';
        document.getElementById('retryDelay').value = '5';
    }
}

// Toggle API Key visibility
function toggleApiKey() {
    const apiKeyInput = document.getElementById('apiKey');
    const apiKeyIcon = document.getElementById('apiKeyIcon');
    
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        apiKeyIcon.className = 'fas fa-eye-slash';
    } else {
        apiKeyInput.type = 'password';
        apiKeyIcon.className = 'fas fa-eye';
    }
}

// Logout
function handleLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
    }
}

// Sistema de notificações
function showNotification(message, type = 'info') {
    console.log(`📢 [SENDGRID-ADMIN] ${type.toUpperCase()}: ${message}`);
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
    
    const bgColor = type === 'success' ? 'bg-green-600' : 
                    type === 'error' ? 'bg-red-600' : 
                    type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600';
    
    notification.className += ` ${bgColor} text-white`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                            type === 'error' ? 'fa-exclamation-circle' : 
                            type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Cleanup ao sair da página
window.addEventListener('beforeunload', function() {
    stopLogsRefresh();
}); 