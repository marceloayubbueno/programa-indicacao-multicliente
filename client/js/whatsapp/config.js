// Configuração WhatsApp - Gestão de configurações e conexões
// Sistema multicliente - JWT Authentication

// Variáveis globais
let whatsappConfig = null;
let clientId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM carregado - iniciando WhatsApp Config');
    await initWhatsAppConfig();
});

async function initWhatsAppConfig() {
    try {
        console.log('Iniciando WhatsApp Config...');
        
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
        
        // Configurar eventos
        setupEventListeners();
        
        console.log('WhatsApp Config inicializado com sucesso');
        
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
        console.log('Carregando configuração para clientId:', clientId);
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
            
            // Preencher formulário
            document.getElementById('whatsappNumber').value = whatsappConfig.whatsappNumber || '';
            document.getElementById('displayName').value = whatsappConfig.displayName || '';
            document.getElementById('businessDescription').value = whatsappConfig.businessDescription || '';
            
            // Atualizar status da conexão
            updateConnectionStatus();
        } else if (response.status === 404) {
            console.log('Configuração não encontrada, usando valores padrão');
            // Configuração não existe ainda - usar valores padrão
            whatsappConfig = {
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
            const errorText = await response.text();
            console.error('Erro na resposta:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        showError('Erro ao carregar configuração');
        
        // Usar dados padrão em caso de erro
        whatsappConfig = {
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
        console.log('Carregando logs de atividade...');
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
    console.log('Configurando event listeners...');
    // Event listeners para validação em tempo real
    const whatsappNumber = document.getElementById('whatsappNumber');
    if (whatsappNumber) {
        whatsappNumber.addEventListener('input', function() {
            validatePhoneNumber(this.value);
        });
    }
    
    // Verificar se os botões existem e adicionar event listeners
    const saveButton = document.querySelector('button[onclick="saveWhatsAppConfig()"]');
    const testButton = document.querySelector('button[onclick="testConnection()"]');
    
    console.log('Botão salvar encontrado:', !!saveButton);
    console.log('Botão testar encontrado:', !!testButton);
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
    const toggleActiveBtn = document.getElementById('toggleActiveBtn');
    
    if (whatsappConfig && whatsappConfig.isActive && whatsappConfig.isVerified) {
        statusElement.innerHTML = `
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-green-400 font-medium">Conectado</span>
        `;
        if (toggleActiveBtn) {
            toggleActiveBtn.innerHTML = '<i class="fas fa-power-off mr-2"></i>Desativar';
            toggleActiveBtn.className = 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors';
            toggleActiveBtn.classList.remove('hidden');
        }
    } else if (whatsappConfig && whatsappConfig.isVerified) {
        statusElement.innerHTML = `
            <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span class="text-yellow-400 font-medium">Inativo</span>
        `;
        if (toggleActiveBtn) {
            toggleActiveBtn.innerHTML = '<i class="fas fa-power-off mr-2"></i>Ativar';
            toggleActiveBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors';
            toggleActiveBtn.classList.remove('hidden');
        }
    } else {
        statusElement.innerHTML = `
            <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span class="text-red-400 font-medium">Não configurado</span>
        `;
        if (toggleActiveBtn) {
            toggleActiveBtn.classList.add('hidden');
        }
    }
    
    if (lastCheckElement) {
        if (whatsappConfig && whatsappConfig.verifiedAt) {
            lastCheckElement.textContent = new Date(whatsappConfig.verifiedAt).toLocaleString('pt-BR');
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

async function saveWhatsAppConfig() {
    console.log('Função saveWhatsAppConfig chamada');
    try {
        const whatsappNumber = document.getElementById('whatsappNumber').value.trim();
        const displayName = document.getElementById('displayName').value.trim();
        const businessDescription = document.getElementById('businessDescription').value.trim();
        
        console.log('Dados do formulário:', { whatsappNumber, displayName, businessDescription });
        
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
        
        console.log('Enviando dados:', configData);
        
        let response;
        
        if (whatsappConfig && whatsappConfig._id) {
            // Atualizar configuração existente
            const url = `${window.API_BASE_URL}/whatsapp/client/config`;
            console.log('Atualizando configuração:', url);
            response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(configData)
            });
        } else {
            // Criar nova configuração
            const url = `${window.API_BASE_URL}/whatsapp/client/config`;
            console.log('Criando nova configuração:', url);
            response = await fetch(url, {
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
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const responseData = await response.json();
            console.log('Configuração salva:', responseData);
            
            // Atualizar whatsappConfig com os dados retornados
            if (responseData.data) {
                whatsappConfig = responseData.data;
            } else {
                whatsappConfig = responseData;
            }
            
            showSuccess('Configuração salva com sucesso!');
            updateConnectionStatus();
            
            // Recarregar logs
            await loadActivityLogs();
        } else {
            const errorData = await response.json();
            console.error('Erro na resposta:', errorData);
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
    } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        showError(`Erro ao salvar configuração: ${error.message}`);
    }
}

async function toggleActive() {
    console.log('Função toggleActive chamada');
    try {
        if (!whatsappConfig) {
            showError('Configure o WhatsApp antes de ativar');
            return;
        }
        
        const newStatus = !whatsappConfig.isActive;
        const action = newStatus ? 'ativar' : 'desativar';
        
        if (!confirm(`Tem certeza que deseja ${action} a configuração de WhatsApp?`)) {
            return;
        }
        
        const token = getToken();
        const url = `${window.API_BASE_URL}/whatsapp/client/config/toggle-active`;
        console.log(`${action.charAt(0).toUpperCase() + action.slice(1)} configuração:`, url);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isActive: newStatus })
        });
        
        console.log('Response status toggle:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Resultado toggle:', result);
            
            // Atualizar configuração local
            if (result.data) {
                whatsappConfig = result.data;
            }
            
            showSuccess(`Configuração ${action} com sucesso!`);
            updateConnectionStatus();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        showError(`Erro ao alterar status: ${error.message}`);
    }
}

function resetWhatsAppConfig() {
    console.log('Função resetWhatsAppConfig chamada');
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
    console.log('Função testConnection chamada');
    try {
        // Verificar se há configuração salva
        if (!whatsappConfig || !whatsappConfig.whatsappNumber) {
            showError('Configure um número de WhatsApp antes de testar a conexão');
            return;
        }
        
        console.log('Testando conexão para número:', whatsappConfig.whatsappNumber);
        
        // Mostrar modal de teste
        document.getElementById('testConnectionModal').classList.remove('hidden');
        
        const token = getToken();
        const url = `${window.API_BASE_URL}/whatsapp/client/config/verify`;
        console.log('URL do teste:', url);
        
        // Testar conexão via API
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status do teste:', response.status);
        const result = await response.json();
        console.log('Resultado do teste:', result);
        
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
    console.log('Função refreshLogs chamada');
    try {
        await loadActivityLogs();
        showSuccess('Logs atualizados');
    } catch (error) {
        console.error('Erro ao atualizar logs:', error);
        showError('Erro ao atualizar logs');
    }
}

async function sendTestMessage() {
    console.log('Função sendTestMessage chamada');
    try {
        const testNumber = document.getElementById('testNumber').value.trim();
        const testMessage = document.getElementById('testMessage').value.trim();
        
        // Validação
        if (!testNumber || !testMessage) {
            showError('Preencha o número e a mensagem de teste');
            return;
        }
        
        if (!validatePhoneNumber(testNumber)) {
            showError('Número de teste inválido');
            return;
        }
        
        if (!whatsappConfig || !whatsappConfig.whatsappNumber) {
            showError('Configure o WhatsApp antes de enviar mensagens de teste');
            return;
        }
        
        if (!confirm(`Enviar mensagem de teste para ${testNumber}?\n\nMensagem: "${testMessage}"`)) {
            return;
        }
        
        console.log('Enviando mensagem de teste:', { testNumber, testMessage });
        
        const token = getToken();
        const url = `${window.API_BASE_URL}/whatsapp/admin/test-message`;
        console.log('URL do teste de envio:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: testNumber,
                message: testMessage,
                from: whatsappConfig.whatsappNumber
            })
        });
        
        console.log('Response status do teste de envio:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Resultado do teste de envio:', result);
            
            showSuccess('Mensagem de teste enviada com sucesso! Verifique o WhatsApp do número de destino.');
            
            // Adicionar log de atividade
            await addActivityLog('test_message_sent', `Mensagem de teste enviada para ${testNumber}`);
            
        } else {
            const errorData = await response.json();
            console.error('Erro no teste de envio:', errorData);
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
    } catch (error) {
        console.error('Erro ao enviar mensagem de teste:', error);
        showError(`Erro ao enviar mensagem de teste: ${error.message}`);
    }
}

function fillTestDefaults() {
    console.log('Função fillTestDefaults chamada');
    
    // Preencher número de teste com o número configurado (se existir)
    if (whatsappConfig && whatsappConfig.whatsappNumber) {
        document.getElementById('testNumber').value = whatsappConfig.whatsappNumber;
    }
    
    // Preencher mensagem padrão
    document.getElementById('testMessage').value = 'Olá! Este é um teste do sistema Viral Lead. Se você recebeu esta mensagem, a configuração está funcionando perfeitamente! 🎉';
    
    showSuccess('Campos preenchidos com valores padrão');
}

async function addActivityLog(type, message) {
    try {
        // Adicionar log localmente
        const logs = [
            {
                id: Date.now().toString(),
                type: type,
                message: message,
                timestamp: new Date().toISOString(),
                status: 'success'
            }
        ];
        
        renderActivityLogs(logs);
        
    } catch (error) {
        console.error('Erro ao adicionar log:', error);
    }
}

function getLogIcon(type) {
    switch(type) {
        case 'config_saved': return 'fas fa-save';
        case 'test_message_sent': return 'fas fa-paper-plane';
        case 'message_sent': return 'fas fa-paper-plane';
        case 'template_approved': return 'fas fa-check-circle';
        case 'connection_test': return 'fas fa-plug';
        case 'message_failed': return 'fas fa-exclamation-triangle';
        default: return 'fas fa-info-circle';
    }
}

function showSuccess(message) {
    console.log('Sucesso:', message);
    // Implementar notificação de sucesso
    alert(message);
}

function showError(message) {
    console.error('Erro:', message);
    // Implementar notificação de erro
    alert('Erro: ' + message);
} 