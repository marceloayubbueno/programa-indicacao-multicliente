// Configuração WhatsApp - Gestão de configurações e conexões
// Sistema multicliente - JWT Authentication

// Variáveis globais
let currentProvider = null;
let config = null;

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

        // Carregar configurações
        await loadConfig();
        
        // Configurar eventos
        setupEventListeners();
        
        // Atualizar interface
        updateInterface();
        
    } catch (error) {
        console.error('Erro ao inicializar WhatsApp Config:', error);
        showError('Erro ao carregar configurações');
    }
}

async function loadConfig() {
    try {
        const token = getToken();
        if (!token) {
            console.error('Token não encontrado');
            return;
        }

        // Mock data para desenvolvimento frontend
        config = {
            provider: 'twilio',
            status: 'disconnected',
            lastCheck: null,
            approvedTemplates: 0,
            credentials: {
                twilio: {
                    accountSid: '',
                    authToken: '',
                    whatsappNumber: '',
                    webhookUrl: ''
                },
                meta: {
                    accessToken: '',
                    phoneNumberId: '',
                    businessAccountId: '',
                    webhookVerifyToken: ''
                },
                '360dialog': {
                    apiKey: '',
                    whatsappNumber: '',
                    webhookUrl: '',
                    webhookSecret: ''
                }
            },
            rateLimiting: {
                maxMessagesPerDay: 1000,
                maxMessagesPerHour: 100,
                delayBetweenMessages: 2,
                maxBatchSize: 50,
                startTime: '09:00',
                endTime: '18:00'
            },
            stats: {
                totalMessagesSent: 0,
                successRate: 0,
                messagesToday: 0,
                remainingQuota: 1000
            },
            logs: []
        };

        updateInterface();

    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

function setupEventListeners() {
    // Seleção de provedor
    document.querySelectorAll('.provider-option').forEach(option => {
        option.addEventListener('click', (e) => {
            selectProvider(e.currentTarget.dataset.provider);
        });
    });

    // Auto-save em mudanças
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            autoSave();
        });
    });
}

function selectProvider(provider) {
    currentProvider = provider;
    config.provider = provider;
    
    // Atualizar interface
    document.querySelectorAll('.provider-option').forEach(option => {
        option.classList.remove('bg-blue-600', 'text-white');
        option.classList.add('bg-gray-700', 'text-gray-300');
    });
    
    const selectedOption = document.querySelector(`[data-provider="${provider}"]`);
    if (selectedOption) {
        selectedOption.classList.remove('bg-gray-700', 'text-gray-300');
        selectedOption.classList.add('bg-blue-600', 'text-white');
    }
    
    showProviderConfig(provider);
    updateProviderName(provider);
}

function showProviderConfig(provider) {
    // Esconder todas as configurações
    document.querySelectorAll('.provider-config').forEach(config => {
        config.classList.add('hidden');
    });
    
    // Mostrar configuração do provedor selecionado
    const configElement = document.getElementById(`${provider}-config`);
    if (configElement) {
        configElement.classList.remove('hidden');
    }
    
    // Preencher campos com dados salvos
    populateProviderFields(provider);
}

function populateProviderFields(provider) {
    const credentials = config.credentials[provider];
    if (!credentials) return;
    
    Object.keys(credentials).forEach(key => {
        const input = document.getElementById(`${provider}-${key}`);
        if (input) {
            input.value = credentials[key] || '';
        }
    });
}

function updateProviderName(provider) {
    const providerNames = {
        'twilio': 'Twilio WhatsApp API',
        'meta': 'Meta WhatsApp Business API',
        '360dialog': '360dialog WhatsApp API'
    };
    
    const nameElement = document.getElementById('currentProviderName');
    if (nameElement) {
        nameElement.textContent = providerNames[provider] || provider;
    }
}

function updateInterface() {
    updateConnectionStatus();
    updateStats();
    updateLogs();
    populateRateLimiting();
}

function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    const statusTextElement = document.getElementById('connectionStatusText');
    const lastCheckElement = document.getElementById('lastCheck');
    
    if (!statusElement || !statusTextElement) return;
    
    const status = config.status;
    const statusConfig = {
        'connected': {
            color: 'bg-green-500',
            text: 'Conectado',
            icon: 'fas fa-check-circle'
        },
        'disconnected': {
            color: 'bg-red-500',
            text: 'Desconectado',
            icon: 'fas fa-times-circle'
        },
        'connecting': {
            color: 'bg-yellow-500',
            text: 'Conectando...',
            icon: 'fas fa-spinner fa-spin'
        },
        'error': {
            color: 'bg-red-500',
            text: 'Erro',
            icon: 'fas fa-exclamation-triangle'
        }
    };
    
    const currentStatus = statusConfig[status] || statusConfig.disconnected;
    
    statusElement.className = `w-3 h-3 ${currentStatus.color} rounded-full animate-pulse`;
    statusTextElement.innerHTML = `<i class="${currentStatus.icon} mr-2"></i>${currentStatus.text}`;
    
    if (lastCheckElement && config.lastCheck) {
        lastCheckElement.textContent = new Date(config.lastCheck).toLocaleString('pt-BR');
    }
}

function updateStats() {
    const stats = config.stats;
    
    document.getElementById('totalMessagesSent').textContent = stats.totalMessagesSent.toLocaleString();
    document.getElementById('successRate').textContent = `${stats.successRate}%`;
    document.getElementById('messagesToday').textContent = stats.messagesToday.toLocaleString();
    document.getElementById('remainingQuota').textContent = stats.remainingQuota.toLocaleString();
}

function updateLogs() {
    const logsContainer = document.getElementById('logsContainer');
    if (!logsContainer) return;
    
    const logs = config.logs.slice(-10); // Últimos 10 logs
    
    if (logs.length === 0) {
        logsContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-info-circle text-2xl mb-2"></i>
                <p>Nenhum log disponível</p>
            </div>
        `;
        return;
    }
    
    const logsHTML = logs.map(log => `
        <div class="flex items-center gap-3 py-2 border-b border-gray-700 last:border-b-0">
            <div class="flex-shrink-0">
                <i class="${getLogIcon(log.type)} ${getLogColor(log.type)}"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-200 truncate">${log.message}</p>
                <p class="text-xs text-gray-500">${new Date(log.timestamp).toLocaleString('pt-BR')}</p>
            </div>
        </div>
    `).join('');
    
    logsContainer.innerHTML = logsHTML;
}

function getLogIcon(type) {
    const icons = {
        'info': 'fas fa-info-circle',
        'success': 'fas fa-check-circle',
        'warning': 'fas fa-exclamation-triangle',
        'error': 'fas fa-times-circle'
    };
    return icons[type] || icons.info;
}

function getLogColor(type) {
    const colors = {
        'info': 'text-blue-400',
        'success': 'text-green-400',
        'warning': 'text-yellow-400',
        'error': 'text-red-400'
    };
    return colors[type] || colors.info;
}

function populateRateLimiting() {
    const rateLimiting = config.rateLimiting;
    
    document.getElementById('maxMessagesPerDay').value = rateLimiting.maxMessagesPerDay;
    document.getElementById('maxMessagesPerHour').value = rateLimiting.maxMessagesPerHour;
    document.getElementById('delayBetweenMessages').value = rateLimiting.delayBetweenMessages;
    document.getElementById('maxBatchSize').value = rateLimiting.maxBatchSize;
    document.getElementById('startTime').value = rateLimiting.startTime;
    document.getElementById('endTime').value = rateLimiting.endTime;
}

async function saveProviderConfig() {
    try {
        const token = getToken();
        if (!token) {
            showError('Token não encontrado');
            return;
        }

        if (!currentProvider) {
            showError('Selecione um provedor primeiro');
            return;
        }

        // Coletar dados do formulário
        const credentials = {};
        const inputs = document.querySelectorAll(`#${currentProvider}-config input`);
        inputs.forEach(input => {
            const key = input.id.replace(`${currentProvider}-`, '');
            credentials[key] = input.value;
        });

        // Validar credenciais
        if (!validateProviderCredentials(currentProvider, credentials)) {
            return;
        }

        // Salvar no config
        config.credentials[currentProvider] = credentials;
        
        // Mock - em produção seria uma chamada para a API
        showSuccess('Configurações salvas com sucesso!');
        addLog('success', `Configurações do ${currentProvider} salvas`);

    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showError('Erro ao salvar configurações');
    }
}

function validateProviderCredentials(provider, credentials) {
    const validations = {
        'twilio': () => {
            if (!credentials.accountSid || !credentials.authToken) {
                showError('Account SID e Auth Token são obrigatórios para Twilio');
                return false;
            }
            return true;
        },
        'meta': () => {
            if (!credentials.accessToken || !credentials.phoneNumberId) {
                showError('Access Token e Phone Number ID são obrigatórios para Meta');
                return false;
            }
            return true;
        },
        '360dialog': () => {
            if (!credentials.apiKey) {
                showError('API Key é obrigatória para 360dialog');
                return false;
            }
            return true;
        }
    };

    const validation = validations[provider];
    return validation ? validation() : true;
}

async function saveRateLimiting() {
    try {
        const token = getToken();
        if (!token) {
            showError('Token não encontrado');
            return;
        }

        // Coletar dados do formulário
        const rateLimiting = {
            maxMessagesPerDay: parseInt(document.getElementById('maxMessagesPerDay').value),
            maxMessagesPerHour: parseInt(document.getElementById('maxMessagesPerHour').value),
            delayBetweenMessages: parseInt(document.getElementById('delayBetweenMessages').value),
            maxBatchSize: parseInt(document.getElementById('maxBatchSize').value),
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value
        };

        // Validações
        if (rateLimiting.maxMessagesPerDay < 1 || rateLimiting.maxMessagesPerHour < 1) {
            showError('Limites de mensagens devem ser maiores que 0');
            return;
        }

        if (rateLimiting.delayBetweenMessages < 1) {
            showError('Delay entre mensagens deve ser maior que 0');
            return;
        }

        // Salvar no config
        config.rateLimiting = rateLimiting;
        
        // Mock - em produção seria uma chamada para a API
        showSuccess('Configurações de rate limiting salvas!');
        addLog('success', 'Configurações de rate limiting atualizadas');

    } catch (error) {
        console.error('Erro ao salvar rate limiting:', error);
        showError('Erro ao salvar configurações de rate limiting');
    }
}

async function testConnection() {
    try {
        const token = getToken();
        if (!token) {
            showError('Token não encontrado');
            return;
        }

        if (!currentProvider) {
            showError('Selecione um provedor primeiro');
            return;
        }

        // Atualizar status para conectando
        config.status = 'connecting';
        updateConnectionStatus();

        // Simular teste de conexão
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock - em produção seria uma chamada para a API
        const success = Math.random() > 0.3; // 70% de chance de sucesso
        
        if (success) {
            config.status = 'connected';
            config.lastCheck = new Date().toISOString();
            addLog('success', `Conexão com ${currentProvider} estabelecida com sucesso`);
            showSuccess('Conexão testada com sucesso!');
        } else {
            config.status = 'error';
            addLog('error', `Falha na conexão com ${currentProvider}`);
            showError('Falha na conexão. Verifique as credenciais.');
        }

        updateConnectionStatus();

    } catch (error) {
        console.error('Erro ao testar conexão:', error);
        config.status = 'error';
        updateConnectionStatus();
        showError('Erro ao testar conexão');
    }
}

function openTestModal() {
    document.getElementById('testModal').classList.remove('hidden');
}

function closeTestModal() {
    document.getElementById('testModal').classList.add('hidden');
}

function showTestResult(success) {
    const resultElement = document.getElementById('testResult');
    if (!resultElement) return;

    if (success) {
        resultElement.innerHTML = `
            <div class="text-center">
                <i class="fas fa-check-circle text-6xl text-green-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-100 mb-2">Conexão Bem-sucedida!</h3>
                <p class="text-gray-400">O provedor está configurado corretamente.</p>
            </div>
        `;
    } else {
        resultElement.innerHTML = `
            <div class="text-center">
                <i class="fas fa-times-circle text-6xl text-red-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-100 mb-2">Falha na Conexão</h3>
                <p class="text-gray-400">Verifique as credenciais e tente novamente.</p>
            </div>
        `;
    }
}

function resetProviderConfig() {
    if (!currentProvider) {
        showError('Selecione um provedor primeiro');
        return;
    }

    if (!confirm(`Tem certeza que deseja resetar as configurações do ${currentProvider}?`)) {
        return;
    }

    // Limpar campos
    const inputs = document.querySelectorAll(`#${currentProvider}-config input`);
    inputs.forEach(input => {
        input.value = '';
    });

    // Limpar do config
    config.credentials[currentProvider] = {};
    
    showSuccess('Configurações resetadas!');
    addLog('info', `Configurações do ${currentProvider} resetadas`);
}

function resetRateLimiting() {
    if (!confirm('Tem certeza que deseja resetar as configurações de rate limiting?')) {
        return;
    }

    // Resetar para valores padrão
    config.rateLimiting = {
        maxMessagesPerDay: 1000,
        maxMessagesPerHour: 100,
        delayBetweenMessages: 2,
        maxBatchSize: 50,
        startTime: '09:00',
        endTime: '18:00'
    };

    populateRateLimiting();
    showSuccess('Configurações de rate limiting resetadas!');
    addLog('info', 'Configurações de rate limiting resetadas');
}

async function refreshLogs() {
    try {
        const token = getToken();
        if (!token) {
            showError('Token não encontrado');
            return;
        }

        // Mock - em produção seria uma chamada para a API
        // Simular novos logs
        const newLogs = [
            { type: 'info', message: 'Sistema verificado', timestamp: new Date().toISOString() },
            { type: 'success', message: 'Configurações sincronizadas', timestamp: new Date().toISOString() }
        ];

        config.logs.push(...newLogs);
        updateLogs();
        showSuccess('Logs atualizados!');

    } catch (error) {
        console.error('Erro ao atualizar logs:', error);
        showError('Erro ao atualizar logs');
    }
}

async function saveConfig() {
    try {
        const token = getToken();
        if (!token) {
            showError('Token não encontrado');
            return;
        }

        // Mock - em produção seria uma chamada para a API
        showSuccess('Configurações salvas com sucesso!');
        addLog('success', 'Configurações gerais salvas');

    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showError('Erro ao salvar configurações');
    }
}

function addLog(type, message) {
    const log = {
        type,
        message,
        timestamp: new Date().toISOString()
    };

    config.logs.push(log);
    
    // Manter apenas os últimos 100 logs
    if (config.logs.length > 100) {
        config.logs = config.logs.slice(-100);
    }

    updateLogs();
}

function autoSave() {
    // Auto-save a cada 30 segundos
    setTimeout(() => {
        saveConfig();
    }, 30000);
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showInfo(message) {
    showNotification(message, 'info');
}

function showWarning(message) {
    showNotification(message, 'warning');
}

function showNotification(message, type = 'info') {
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
    
    const colors = {
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
        info: 'bg-blue-600 text-white',
        warning: 'bg-yellow-600 text-white'
    };
    
    notification.className += ` ${colors[type]}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Funções globais para compatibilidade com HTML
window.testConnection = testConnection;
window.saveProviderConfig = saveProviderConfig;
window.saveRateLimiting = saveRateLimiting;
window.resetProviderConfig = resetProviderConfig;
window.resetRateLimiting = resetRateLimiting;
window.refreshLogs = refreshLogs;
window.closeTestModal = closeTestModal; 