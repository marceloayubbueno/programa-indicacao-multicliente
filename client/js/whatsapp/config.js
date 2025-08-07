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
        
        // Verificar se APP_CONFIG está definido
        if (!window.APP_CONFIG || !window.APP_CONFIG.API_URL) {
            console.error('APP_CONFIG não está definido!');
            showError('Erro de configuração: APP_CONFIG não encontrado');
            return;
        }
        
        console.log('API_URL:', window.APP_CONFIG.API_URL);

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
        const url = `${window.APP_CONFIG.API_URL}/whatsapp/client/config`;
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
            
            // Preencher credenciais se existirem
            if (whatsappConfig.whatsappCredentials) {
                document.getElementById('accessToken').value = whatsappConfig.whatsappCredentials.accessToken || '';
                document.getElementById('phoneNumberId').value = whatsappConfig.whatsappCredentials.phoneNumberId || '';
                document.getElementById('businessAccountId').value = whatsappConfig.whatsappCredentials.businessAccountId || '';
                document.getElementById('webhookUrl').value = whatsappConfig.whatsappCredentials.webhookUrl || '';
            }
            
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
            document.getElementById('accessToken').value = '';
            document.getElementById('phoneNumberId').value = '';
            document.getElementById('businessAccountId').value = '';
            document.getElementById('webhookUrl').value = '';
            
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
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                <span class="text-green-400 font-medium">Conectado e Ativo</span>
                <span class="text-gray-400 text-sm">(${whatsappConfig.whatsappNumber})</span>
            </div>
        `;
        if (toggleActiveBtn) {
            toggleActiveBtn.innerHTML = '<i class="fas fa-power-off mr-2"></i>Desativar';
            toggleActiveBtn.className = 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors';
            toggleActiveBtn.classList.remove('hidden');
        }
    } else if (whatsappConfig && whatsappConfig.isVerified) {
        statusElement.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span class="text-yellow-400 font-medium">Verificado (Inativo)</span>
                <span class="text-gray-400 text-sm">(${whatsappConfig.whatsappNumber})</span>
            </div>
        `;
        if (toggleActiveBtn) {
            toggleActiveBtn.innerHTML = '<i class="fas fa-power-off mr-2"></i>Ativar';
            toggleActiveBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors';
            toggleActiveBtn.classList.remove('hidden');
        }
    } else if (whatsappConfig && whatsappConfig.whatsappCredentials) {
        statusElement.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <span class="text-orange-400 font-medium">Configurado (Não Verificado)</span>
                <span class="text-gray-400 text-sm">Teste as credenciais</span>
            </div>
        `;
        if (toggleActiveBtn) {
            toggleActiveBtn.classList.add('hidden');
        }
    } else {
        statusElement.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span class="text-red-400 font-medium">Não Configurado</span>
                <span class="text-gray-400 text-sm">Configure as credenciais</span>
            </div>
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
        
        // Novos campos de credenciais
        const accessToken = document.getElementById('accessToken').value.trim();
        const phoneNumberId = document.getElementById('phoneNumberId').value.trim();
        const businessAccountId = document.getElementById('businessAccountId').value.trim();
        const webhookUrl = document.getElementById('webhookUrl').value.trim();
        
        console.log('Dados do formulário:', { 
            whatsappNumber, 
            displayName, 
            businessDescription,
            accessToken: accessToken ? '***' : '',
            phoneNumberId,
            businessAccountId,
            webhookUrl
        });
        
        // Validação básica
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
            businessDescription,
            whatsappCredentials: {
                accessToken,
                phoneNumberId,
                businessAccountId,
                webhookUrl: webhookUrl || undefined
            }
        };
        
        console.log('Enviando dados:', configData);
        
        let response;
        
        if (whatsappConfig && whatsappConfig._id) {
            // Atualizar configuração existente
            const url = `${window.APP_CONFIG.API_URL}/whatsapp/client/config`;
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
            const url = `${window.APP_CONFIG.API_URL}/whatsapp/client/config`;
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
        const url = `${window.APP_CONFIG.API_URL}/whatsapp/client/config/toggle-active`;
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
        const url = `${window.APP_CONFIG.API_URL}/whatsapp/client/config/verify`;
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

        // 🔧 NOVA VALIDAÇÃO: Verificar se as credenciais foram testadas
        if (!whatsappConfig.isVerified) {
            showError('❌ Credenciais não verificadas!\n\nPara enviar mensagens de teste, você precisa:\n1. Preencher as credenciais do WhatsApp Business API\n2. Clicar em "Testar Credenciais"\n3. Aguardar a confirmação de sucesso\n\nDepois disso, você poderá enviar mensagens de teste.');
            return;
        }
        
        if (!confirm(`Enviar mensagem de teste para ${testNumber}?\n\nMensagem: "${testMessage}"`)) {
            return;
        }
        
        console.log('Enviando mensagem de teste:', { testNumber, testMessage });
        
        const token = getToken();
        const url = `${window.APP_CONFIG.API_URL}/whatsapp/client/test-message`;
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
            
            showSuccess('✅ Mensagem de teste enviada com sucesso!\n\nVerifique o WhatsApp do número de destino.');
            
            // Adicionar log de atividade
            await addActivityLog('test_message_sent', `Mensagem de teste enviada para ${testNumber}`);
            
        } else {
            const errorData = await response.json();
            console.error('Erro no teste de envio:', errorData);
            
            // 🔧 MELHORIA: Mensagem de erro mais específica
            let errorMessage = errorData.message || `HTTP ${response.status}`;
            
            if (errorMessage.includes('Configuração não verificada')) {
                errorMessage = '❌ Credenciais não verificadas!\n\nExecute o teste de credenciais primeiro.';
            } else if (errorMessage.includes('Credenciais do WhatsApp')) {
                errorMessage = '❌ Credenciais inválidas!\n\nVerifique suas credenciais do WhatsApp Business API.';
            }
            
            throw new Error(errorMessage);
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
        case 'credentials_tested': return 'fas fa-key';
        case 'credentials_failed': return 'fas fa-key';
        default: return 'fas fa-info-circle';
    }
}

function showSuccess(message) {
    console.log('Sucesso:', message);
    
    // 🔧 MELHORIA: Formatação de mensagens de sucesso
    let formattedMessage = message;
    
    // Se a mensagem contém quebras de linha, formatar como HTML
    if (message.includes('\n')) {
        formattedMessage = message.replace(/\n/g, '<br>');
        
        // Criar modal de sucesso mais informativo
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
                <div class="p-6 border-b border-gray-700">
                    <h2 class="text-xl font-semibold text-green-400 flex items-center">
                        <i class="fas fa-check-circle mr-2"></i>
                        Sucesso
                    </h2>
                </div>
                <div class="p-6">
                    <div class="text-gray-300 text-sm leading-relaxed">
                        ${formattedMessage}
                    </div>
                </div>
                <div class="p-6 border-t border-gray-700 flex justify-end">
                    <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors">
                        OK
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return;
    }
    
    // Para mensagens simples, usar alert
    alert(message);
}

function showError(message) {
    console.error('Erro:', message);
    
    // 🔧 MELHORIA: Formatação de mensagens de erro
    let formattedMessage = message;
    
    // Se a mensagem contém quebras de linha, formatar como HTML
    if (message.includes('\n')) {
        formattedMessage = message.replace(/\n/g, '<br>');
        
        // Criar modal de erro mais informativo
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
                <div class="p-6 border-b border-gray-700">
                    <h2 class="text-xl font-semibold text-red-400 flex items-center">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Erro
                    </h2>
                </div>
                <div class="p-6">
                    <div class="text-gray-300 text-sm leading-relaxed">
                        ${formattedMessage}
                    </div>
                </div>
                <div class="p-6 border-t border-gray-700 flex justify-end">
                    <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-lg transition-colors">
                        Entendi
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return;
    }
    
    // Para mensagens simples, usar alert
    alert('Erro: ' + message);
}

async function testWhatsAppCredentials() {
    console.log('Função testWhatsAppCredentials chamada');
    try {
        const accessToken = document.getElementById('accessToken').value.trim();
        const phoneNumberId = document.getElementById('phoneNumberId').value.trim();
        const businessAccountId = document.getElementById('businessAccountId').value.trim();
        
        if (!accessToken || !phoneNumberId || !businessAccountId) {
            showError('Preencha todas as credenciais antes de testar');
            return;
        }
        
        const token = getToken();
        const testData = {
            accessToken,
            phoneNumberId,
            businessAccountId
        };
        
        console.log('Testando credenciais...');
        
        const response = await fetch(`${window.APP_CONFIG.API_URL}/whatsapp/client/test-credentials`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Teste de credenciais bem-sucedido:', result);
            
            // 🔧 MELHORIA: Verificar se há erro específico de verificação
            if (result.data && result.data.codeVerificationStatus === 'NOT_VERIFIED') {
                showError('❌ Número WhatsApp não verificado!\n\nPara enviar mensagens, você precisa:\n1. Acessar business.facebook.com\n2. Ir em WhatsApp > API Setup\n3. Verificar o número de telefone\n4. Aguardar aprovação (1-3 dias úteis)\n\nStatus atual: NOT_VERIFIED');
                return;
            }
            
            showSuccess('✅ Credenciais válidas! Conexão com WhatsApp Business API estabelecida.');
            
            // 🔧 MELHORIA: Recarregar configuração para atualizar status
            await loadConfig();
            
            // Adicionar log de atividade
            await addActivityLog('credentials_tested', 'Credenciais testadas com sucesso');
            
        } else {
            const errorData = await response.json();
            console.error('Erro no teste de credenciais:', errorData);
            
            // 🔧 MELHORIA: Mensagem de erro mais específica
            let errorMessage = errorData.message || 'Credenciais inválidas';
            
            if (errorMessage.includes('NOT_VERIFIED')) {
                errorMessage = '❌ Número WhatsApp não verificado!\n\nPara enviar mensagens, você precisa:\n1. Acessar business.facebook.com\n2. Ir em WhatsApp > API Setup\n3. Verificar o número de telefone\n4. Aguardar aprovação (1-3 dias úteis)';
            }
            
            showError(`Erro ao testar credenciais: ${errorMessage}`);
            
            // Adicionar log de atividade
            await addActivityLog('credentials_failed', `Falha no teste de credenciais: ${errorMessage}`);
        }
        
    } catch (error) {
        console.error('Erro ao testar credenciais:', error);
        showError(`Erro ao testar credenciais: ${error.message}`);
    }
} 

async function forceRevalidateCredentials() {
    console.log('Função forceRevalidateCredentials chamada');
    try {
        if (!whatsappConfig || !whatsappConfig.whatsappCredentials) {
            showError('Configure o WhatsApp antes de forçar revalidação');
            return;
        }

        const token = getToken();
        
        console.log('Forçando revalidação...');
        
        const response = await fetch(`${window.APP_CONFIG.API_URL}/whatsapp/client/force-revalidate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('Revalidação forçada bem-sucedida:', result);
            
            // Recarregar configuração
            await loadConfig();
            
            showSuccess(`✅ Revalidação forçada concluída!\n\nStatus: ${result.data.isVerified ? 'VERIFICADO' : 'NÃO VERIFICADO'}\n\nSe o número foi aprovado no Meta, tente enviar uma mensagem de teste agora.`);
            
            // Adicionar log
            await addActivityLog('force_revalidation', `Revalidação forçada: ${result.data.isVerified ? 'VERIFICADO' : 'NÃO VERIFICADO'}`);
            
        } else {
            console.error('Erro na revalidação forçada:', result);
            showError(`❌ Erro na revalidação: ${result.message}`);
        }
        
    } catch (error) {
        console.error('Erro ao forçar revalidação:', error);
        showError(`❌ Erro ao forçar revalidação: ${error.message}`);
    }
} 

async function checkAccountRegistrationStatus() {
    console.log('Função checkAccountRegistrationStatus chamada');
    try {
        if (!whatsappConfig || !whatsappConfig.whatsappCredentials) {
            showError('Configure o WhatsApp antes de verificar o status da conta');
            return;
        }

        const token = getToken();
        
        console.log('Verificando status da conta...');
        
        const response = await fetch(`${window.APP_CONFIG.API_URL}/whatsapp/client/check-account-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('Status da conta verificado:', result);
            
            const status = result.data;
            let message = `📋 Status da Conta WhatsApp Business:\n\n`;
            message += `🏢 Conta: ${status.accountStatus}\n`;
            message += `📱 Número: ${status.phoneStatus}\n`;
            message += `✅ Registrada: ${status.isRegistered ? 'SIM' : 'NÃO'}\n`;
            message += `✅ Número Verificado: ${status.isPhoneVerified ? 'SIM' : 'NÃO'}\n`;
            message += `📤 Pode Enviar: ${status.canSendMessages ? 'SIM' : 'NÃO'}\n\n`;
            
            if (!status.canSendMessages) {
                message += `⚠️ Para enviar mensagens, você precisa:\n\n`;
                if (!status.isRegistered) {
                    message += `1. Registrar a conta no WhatsApp Business Manager\n`;
                }
                if (!status.isPhoneVerified) {
                    message += `2. Verificar o número de telefone\n`;
                }
                message += `3. Aguardar aprovação (1-3 dias úteis)\n\n`;
                message += `Acesse: business.facebook.com > WhatsApp > API Setup`;
            }
            
            showSuccess(message);
            
            // Adicionar log
            await addActivityLog('account_status_check', `Status da conta verificado: ${status.canSendMessages ? 'PRONTO' : 'PENDENTE'}`);
            
        } else {
            console.error('Erro ao verificar status da conta:', result);
            showError(`❌ Erro ao verificar status: ${result.message}`);
        }
        
    } catch (error) {
        console.error('Erro ao verificar status da conta:', error);
        showError(`❌ Erro ao verificar status: ${error.message}`);
    }
} 