// Configuração WhatsApp - Gestão de configurações e conexões
// Sistema multicliente - JWT Authentication

// Variáveis globais
let config = null;
let clientId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    await initWhatsAppConfig();
});

async function initWhatsAppConfig() {
    try {
        // Verificar autenticação
        if (!checkAuth()) {
            return;
        }

        // Obter clientId do token
        clientId = getClientIdFromToken();
        if (!clientId) {
            showError('Token inválido - clientId não encontrado');
            return;
        }

        // Carregar dados iniciais
        await loadConfig();
        await loadActivityLogs();
        
        // Configurar eventos
        setupEventListeners();
        
    } catch (error) {
        console.error('Erro ao inicializar WhatsApp Config:', error);
        showError('Erro ao carregar configurações');
    }
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
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
        return payload.clientId || payload.sub;
    } catch (error) {
        console.error('Erro ao decodificar token:', error);
        return null;
    }
}

async function loadConfig() {
    try {
        const token = getToken();
        const response = await fetch(`${window.API_BASE_URL}/whatsapp/client/config/${clientId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            config = await response.json();
            
            // Preencher formulário
            document.getElementById('whatsappNumber').value = config.whatsappNumber || '';
            document.getElementById('displayName').value = config.displayName || '';
            document.getElementById('businessDescription').value = config.businessDescription || '';
            
            // Atualizar status da conexão
            updateConnectionStatus();
        } else if (response.status === 404) {
            // Configuração não existe ainda - usar valores padrão
            config = {
                whatsappNumber: '',
                displayName: '',
                businessDescription: '',
                isActive: false,
                isVerified: false
            };
            
            // Limpar formulário
            document.getElementById('whatsappNumber').value = '';
            document.getElementById('displayName').value = '';
            document.getElementById('businessDescription').value = '';
            
            updateConnectionStatus();
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        showError('Erro ao carregar configuração');
        
        // Usar dados padrão em caso de erro
        config = {
            whatsappNumber: '',
            displayName: '',
            businessDescription: '',
            isActive: false,
            isVerified: false
        };
    }
}

async function loadActivityLogs() {
    try {
        // Por enquanto, usar logs simulados
        // TODO: Implementar endpoint de logs quando necessário
        const logs = [
            {
                id: '1',
                type: 'config_saved',
                message: 'Configuração de WhatsApp salva',
                timestamp: new Date().toISOString(),
                status: 'success'
            }
        ];
        
        renderActivityLogs(logs);
        
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        showError('Erro ao carregar logs de atividade');
    }
}

function setupEventListeners() {
    // Event listeners para validação em tempo real
    const whatsappNumber = document.getElementById('whatsappNumber');
    if (whatsappNumber) {
        whatsappNumber.addEventListener('input', function() {
            validatePhoneNumber(this.value);
        });
    }
}

function validatePhoneNumber(phoneNumber) {
    // Validação básica de número de telefone
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    const isValid = phoneRegex.test(phoneNumber);
    
    const input = document.getElementById('whatsappNumber');
    if (isValid) {
        input.classList.remove('border-red-500');
        input.classList.add('border-green-500');
    } else {
        input.classList.remove('border-green-500');
        input.classList.add('border-red-500');
    }
    
    return isValid;
}

function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    const lastCheckElement = document.getElementById('lastCheck');
    const approvedTemplatesElement = document.getElementById('approvedTemplates');
    
    if (config && config.isActive && config.isVerified) {
        statusElement.innerHTML = `
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-green-400 font-medium">Conectado</span>
        `;
    } else if (config && config.isVerified) {
        statusElement.innerHTML = `
            <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span class="text-yellow-400 font-medium">Inativo</span>
        `;
    } else {
        statusElement.innerHTML = `
            <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span class="text-red-400 font-medium">Não configurado</span>
        `;
    }
    
    if (lastCheckElement) {
        if (config && config.verifiedAt) {
            lastCheckElement.textContent = new Date(config.verifiedAt).toLocaleString('pt-BR');
        } else {
            lastCheckElement.textContent = 'Nunca';
        }
    }
    
    if (approvedTemplatesElement) {
        // TODO: Implementar contagem real de templates
        approvedTemplatesElement.textContent = '0';
    }
}

function renderActivityLogs(logs) {
    const container = document.getElementById('activityLogs');
    if (!container) return;
    
    container.innerHTML = '';
    
    logs.forEach(log => {
        const logElement = document.createElement('div');
        logElement.className = 'flex items-start gap-3 p-3 bg-gray-600 rounded-lg';
        
        const iconClass = getLogIcon(log.type);
        const statusColor = log.status === 'success' ? 'text-green-400' : 'text-red-400';
        
        logElement.innerHTML = `
            <div class="flex-shrink-0">
                <i class="${iconClass} ${statusColor}"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-gray-200 text-sm">${log.message}</p>
                <p class="text-gray-400 text-xs">${new Date(log.timestamp).toLocaleString('pt-BR')}</p>
            </div>
        `;
        
        container.appendChild(logElement);
    });
}

function getLogIcon(type) {
    switch(type) {
        case 'config_saved': return 'fas fa-save';
        case 'message_sent': return 'fas fa-paper-plane';
        case 'template_approved': return 'fas fa-check-circle';
        case 'connection_test': return 'fas fa-plug';
        case 'message_failed': return 'fas fa-exclamation-triangle';
        default: return 'fas fa-info-circle';
    }
}

async function saveWhatsAppConfig() {
    try {
        const whatsappNumber = document.getElementById('whatsappNumber').value.trim();
        const displayName = document.getElementById('displayName').value.trim();
        const businessDescription = document.getElementById('businessDescription').value.trim();
        
        // Validação
        if (!whatsappNumber || !displayName) {
            showError('Preencha todos os campos obrigatórios');
            return;
        }
        
        if (!validatePhoneNumber(whatsappNumber)) {
            showError('Número de WhatsApp inválido');
            return;
        }
        
        const token = getToken();
        const configData = {
            whatsappNumber,
            displayName,
            businessDescription
        };
        
        let response;
        
        if (config && config._id) {
            // Atualizar configuração existente
            response = await fetch(`${window.API_BASE_URL}/whatsapp/client/config/${clientId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(configData)
            });
        } else {
            // Criar nova configuração
            response = await fetch(`${window.API_BASE_URL}/whatsapp/client/config`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...configData,
                    clientId
                })
            });
        }
        
        if (response.ok) {
            config = await response.json();
            showSuccess('Configuração salva com sucesso!');
            updateConnectionStatus();
            
            // Recarregar logs
            await loadActivityLogs();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
    } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        showError(`Erro ao salvar configuração: ${error.message}`);
    }
}

function resetWhatsAppConfig() {
    if (confirm('Tem certeza que deseja resetar as configurações?')) {
        document.getElementById('whatsappNumber').value = '';
        document.getElementById('displayName').value = '';
        document.getElementById('businessDescription').value = '';
        
        // Remover classes de validação
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.classList.remove('border-red-500', 'border-green-500');
        });
        
        showSuccess('Configurações resetadas');
    }
}

async function testConnection() {
    try {
        // Verificar se há configuração salva
        if (!config || !config.whatsappNumber) {
            showError('Configure um número de WhatsApp antes de testar a conexão');
            return;
        }
        
        // Mostrar modal de teste
        document.getElementById('testConnectionModal').classList.remove('hidden');
        
        const token = getToken();
        
        // Testar conexão via API
        const response = await fetch(`${window.API_BASE_URL}/whatsapp/client/config/${clientId}/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        // Atualizar status do teste
        const statusElement = document.getElementById('testConnectionStatus');
        
        if (response.ok && result.success) {
            statusElement.innerHTML = `
                <div class="text-green-400 mb-4">
                    <i class="fas fa-check-circle text-4xl"></i>
                </div>
                <p class="text-gray-300">Conexão testada com sucesso!</p>
                <p class="text-gray-400 text-sm mt-2">${result.message}</p>
            `;
            
            // Recarregar configuração para atualizar status
            await loadConfig();
        } else {
            statusElement.innerHTML = `
                <div class="text-red-400 mb-4">
                    <i class="fas fa-exclamation-triangle text-4xl"></i>
                </div>
                <p class="text-gray-300">Erro ao testar conexão</p>
                <p class="text-gray-400 text-sm mt-2">${result.message || 'Verifique suas configurações e tente novamente.'}</p>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao testar conexão:', error);
        
        const statusElement = document.getElementById('testConnectionStatus');
        statusElement.innerHTML = `
            <div class="text-red-400 mb-4">
                <i class="fas fa-exclamation-triangle text-4xl"></i>
            </div>
            <p class="text-gray-300">Erro ao testar conexão</p>
            <p class="text-gray-400 text-sm mt-2">Erro de comunicação com o servidor.</p>
        `;
    }
}

function closeTestModal() {
    document.getElementById('testConnectionModal').classList.add('hidden');
    
    // Resetar status do teste
    const statusElement = document.getElementById('testConnectionStatus');
    statusElement.innerHTML = `
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-300">Testando conexão com o provedor...</p>
    `;
}

async function refreshLogs() {
    try {
        await loadActivityLogs();
        showSuccess('Logs atualizados');
    } catch (error) {
        console.error('Erro ao atualizar logs:', error);
        showError('Erro ao atualizar logs');
    }
}

function showSuccess(message) {
    // Implementar notificação de sucesso
    alert(message);
}

function showError(message) {
    // Implementar notificação de erro
    alert('Erro: ' + message);
} 