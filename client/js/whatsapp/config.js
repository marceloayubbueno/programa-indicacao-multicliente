// Configuração WhatsApp - Gestão de configurações e conexões
// Sistema multicliente - UX otimizada

class WhatsAppConfig {
    constructor() {
        this.clientId = null;
        this.currentProvider = null;
        this.config = null;
        this.init();
    }

    async init() {
        try {
            // Verificar autenticação
            if (!window.auth || !window.auth.isAuthenticated()) {
                window.location.href = 'login.html';
                return;
            }

            // Obter dados do cliente
            this.clientId = window.auth.getClientId();
            
            // Carregar configurações
            await this.loadConfig();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Atualizar interface
            this.updateInterface();
            
        } catch (error) {
            console.error('Erro ao inicializar WhatsApp Config:', error);
            this.showError('Erro ao carregar configurações');
        }
    }

    async loadConfig() {
        try {
            // Mock data para desenvolvimento frontend
            this.config = {
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

            this.updateInterface();

        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }

    setupEventListeners() {
        // Seleção de provedor
        document.querySelectorAll('.provider-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectProvider(e.currentTarget.dataset.provider);
            });
        });

        // Auto-save em mudanças
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.autoSave();
            });
        });
    }

    selectProvider(provider) {
        // Remover seleção anterior
        document.querySelectorAll('.provider-option').forEach(option => {
            option.classList.remove('border-blue-500');
            option.querySelector('.fa-check').classList.add('hidden');
        });

        // Selecionar novo provedor
        const selectedOption = document.querySelector(`[data-provider="${provider}"]`);
        if (selectedOption) {
            selectedOption.classList.add('border-blue-500');
            selectedOption.querySelector('.fa-check').classList.remove('hidden');
        }

        this.currentProvider = provider;
        this.showProviderConfig(provider);
        this.updateProviderName(provider);
    }

    showProviderConfig(provider) {
        // Esconder todas as configurações
        document.querySelectorAll('.provider-config').forEach(config => {
            config.classList.add('hidden');
        });

        // Mostrar configuração do provedor selecionado
        const configElement = document.getElementById(`${provider}Config`);
        if (configElement) {
            configElement.classList.remove('hidden');
        }

        // Mostrar container de configuração
        document.getElementById('providerConfig').classList.remove('hidden');

        // Preencher campos com dados salvos
        this.populateProviderFields(provider);
    }

    populateProviderFields(provider) {
        const credentials = this.config.credentials[provider];
        if (!credentials) return;

        Object.keys(credentials).forEach(key => {
            const input = document.getElementById(`${provider}${key.charAt(0).toUpperCase() + key.slice(1)}`);
            if (input) {
                input.value = credentials[key] || '';
            }
        });
    }

    updateProviderName(provider) {
        const providerNames = {
            'twilio': 'Twilio',
            'meta': 'Meta WhatsApp',
            '360dialog': '360dialog'
        };
        
        document.getElementById('providerName').textContent = providerNames[provider] || 'Não configurado';
    }

    updateInterface() {
        // Atualizar status da conexão
        this.updateConnectionStatus();
        
        // Atualizar estatísticas
        this.updateStats();
        
        // Atualizar logs
        this.updateLogs();
        
        // Selecionar provedor atual
        if (this.config.provider) {
            this.selectProvider(this.config.provider);
        }
        
        // Preencher configurações de rate limiting
        this.populateRateLimiting();
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        const status = this.config.status;
        
        let statusHTML = '';
        switch (status) {
            case 'connected':
                statusHTML = `
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-green-400 font-medium">Conectado</span>
                `;
                break;
            case 'connecting':
                statusHTML = `
                    <div class="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span class="text-yellow-400 font-medium">Conectando...</span>
                `;
                break;
            case 'error':
                statusHTML = `
                    <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span class="text-red-400 font-medium">Erro</span>
                `;
                break;
            default:
                statusHTML = `
                    <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span class="text-red-400 font-medium">Desconectado</span>
                `;
        }
        
        statusElement.innerHTML = statusHTML;
        
        // Atualizar última verificação
        const lastCheck = this.config.lastCheck ? 
            new Date(this.config.lastCheck).toLocaleString('pt-BR') : 'Nunca';
        document.getElementById('lastCheck').textContent = lastCheck;
        
        // Atualizar templates aprovados
        document.getElementById('approvedTemplates').textContent = this.config.approvedTemplates;
    }

    updateStats() {
        document.getElementById('totalMessagesSent').textContent = this.config.stats.totalMessagesSent.toLocaleString();
        document.getElementById('successRate').textContent = `${this.config.stats.successRate}%`;
        document.getElementById('messagesToday').textContent = this.config.stats.messagesToday;
        document.getElementById('remainingQuota').textContent = this.config.stats.remainingQuota;
    }

    updateLogs() {
        const logsContainer = document.getElementById('activityLogs');
        
        if (this.config.logs.length === 0) {
            logsContainer.innerHTML = `
                <div class="text-center text-gray-400 py-4">
                    <i class="fas fa-info-circle text-2xl mb-2"></i>
                    <p>Nenhuma atividade registrada</p>
                </div>
            `;
            return;
        }

        const logsHTML = this.config.logs.slice(0, 10).map(log => `
            <div class="flex items-start gap-3 p-3 bg-gray-600 rounded-lg">
                <div class="flex-shrink-0 mt-1">
                    <i class="fas ${this.getLogIcon(log.type)} text-${this.getLogColor(log.type)}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-gray-200 text-sm">${log.message}</p>
                    <p class="text-gray-400 text-xs">${new Date(log.timestamp).toLocaleString('pt-BR')}</p>
                </div>
            </div>
        `).join('');

        logsContainer.innerHTML = logsHTML;
    }

    getLogIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    getLogColor(type) {
        const colors = {
            'success': 'green-400',
            'error': 'red-400',
            'warning': 'yellow-400',
            'info': 'blue-400'
        };
        return colors[type] || 'blue-400';
    }

    populateRateLimiting() {
        const rateLimiting = this.config.rateLimiting;
        
        document.getElementById('maxMessagesPerDay').value = rateLimiting.maxMessagesPerDay;
        document.getElementById('maxMessagesPerHour').value = rateLimiting.maxMessagesPerHour;
        document.getElementById('delayBetweenMessages').value = rateLimiting.delayBetweenMessages;
        document.getElementById('maxBatchSize').value = rateLimiting.maxBatchSize;
        document.getElementById('startTime').value = rateLimiting.startTime;
        document.getElementById('endTime').value = rateLimiting.endTime;
    }

    async saveProviderConfig() {
        try {
            const provider = this.currentProvider;
            if (!provider) {
                this.showError('Selecione um provedor primeiro');
                return;
            }

            // Coletar dados do formulário
            const credentials = {};
            const inputs = document.querySelectorAll(`#${provider}Config input`);
            inputs.forEach(input => {
                const key = input.id.replace(provider, '').replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
                credentials[key] = input.value;
            });

            // Validação básica
            if (!this.validateProviderCredentials(provider, credentials)) {
                return;
            }

            // Salvar configuração
            this.config.provider = provider;
            this.config.credentials[provider] = credentials;
            this.config.status = 'disconnected';

            // Mock save - em produção seria uma chamada API
            await this.saveConfig();
            
            this.showSuccess('Configuração do provedor salva com sucesso!');
            this.addLog('info', `Configuração do provedor ${provider} salva`);

        } catch (error) {
            console.error('Erro ao salvar configuração do provedor:', error);
            this.showError('Erro ao salvar configuração');
        }
    }

    validateProviderCredentials(provider, credentials) {
        const validations = {
            'twilio': ['accountSid', 'authToken', 'whatsappNumber'],
            'meta': ['accessToken', 'phoneNumberId', 'businessAccountId'],
            '360dialog': ['apiKey', 'whatsappNumber']
        };

        const required = validations[provider] || [];
        const missing = required.filter(field => !credentials[field]);

        if (missing.length > 0) {
            this.showError(`Campos obrigatórios: ${missing.join(', ')}`);
            return false;
        }

        return true;
    }

    async saveRateLimiting() {
        try {
            const rateLimiting = {
                maxMessagesPerDay: parseInt(document.getElementById('maxMessagesPerDay').value),
                maxMessagesPerHour: parseInt(document.getElementById('maxMessagesPerHour').value),
                delayBetweenMessages: parseInt(document.getElementById('delayBetweenMessages').value),
                maxBatchSize: parseInt(document.getElementById('maxBatchSize').value),
                startTime: document.getElementById('startTime').value,
                endTime: document.getElementById('endTime').value
            };

            // Validação
            if (rateLimiting.maxMessagesPerDay < 1 || rateLimiting.maxMessagesPerHour < 1) {
                this.showError('Limites devem ser maiores que zero');
                return;
            }

            if (rateLimiting.startTime >= rateLimiting.endTime) {
                this.showError('Horário de início deve ser menor que o de fim');
                return;
            }

            this.config.rateLimiting = rateLimiting;
            await this.saveConfig();
            
            this.showSuccess('Configurações de rate limiting salvas!');
            this.addLog('info', 'Configurações de rate limiting atualizadas');

        } catch (error) {
            console.error('Erro ao salvar rate limiting:', error);
            this.showError('Erro ao salvar configurações');
        }
    }

    async testConnection() {
        try {
            if (!this.config.provider) {
                this.showError('Configure um provedor primeiro');
                return;
            }

            this.openTestModal();
            this.config.status = 'connecting';
            this.updateConnectionStatus();

            // Simular teste de conexão
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock resultado do teste
            const success = Math.random() > 0.3; // 70% de chance de sucesso
            
            if (success) {
                this.config.status = 'connected';
                this.config.lastCheck = new Date().toISOString();
                this.config.approvedTemplates = Math.floor(Math.random() * 10) + 1;
                this.addLog('success', 'Conexão testada com sucesso');
            } else {
                this.config.status = 'error';
                this.addLog('error', 'Falha na conexão com o provedor');
            }

            this.updateConnectionStatus();
            this.showTestResult(success);

        } catch (error) {
            console.error('Erro no teste de conexão:', error);
            this.config.status = 'error';
            this.updateConnectionStatus();
            this.showTestResult(false);
        }
    }

    openTestModal() {
        document.getElementById('testConnectionModal').classList.remove('hidden');
    }

    closeTestModal() {
        document.getElementById('testConnectionModal').classList.add('hidden');
    }

    showTestResult(success) {
        const statusElement = document.getElementById('testConnectionStatus');
        
        if (success) {
            statusElement.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                    <h3 class="text-xl font-semibold text-green-400 mb-2">Conexão Bem-sucedida!</h3>
                    <p class="text-gray-300">O provedor está funcionando corretamente</p>
                </div>
            `;
        } else {
            statusElement.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
                    <h3 class="text-xl font-semibold text-red-400 mb-2">Falha na Conexão</h3>
                    <p class="text-gray-300">Verifique as credenciais e tente novamente</p>
                </div>
            `;
        }
    }

    resetProviderConfig() {
        if (confirm('Tem certeza que deseja resetar a configuração do provedor?')) {
            const provider = this.currentProvider;
            if (provider) {
                const inputs = document.querySelectorAll(`#${provider}Config input`);
                inputs.forEach(input => {
                    input.value = '';
                });
            }
            this.showInfo('Configuração resetada');
        }
    }

    resetRateLimiting() {
        if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
            const defaults = {
                maxMessagesPerDay: 1000,
                maxMessagesPerHour: 100,
                delayBetweenMessages: 2,
                maxBatchSize: 50,
                startTime: '09:00',
                endTime: '18:00'
            };

            Object.keys(defaults).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = defaults[key];
                }
            });

            this.showInfo('Configurações restauradas para o padrão');
        }
    }

    async refreshLogs() {
        try {
            // Simular carregamento de novos logs
            const newLogs = [
                {
                    type: 'info',
                    message: 'Sistema verificado automaticamente',
                    timestamp: new Date().toISOString()
                },
                {
                    type: 'success',
                    message: '5 mensagens enviadas com sucesso',
                    timestamp: new Date(Date.now() - 300000).toISOString()
                }
            ];

            this.config.logs.unshift(...newLogs);
            this.config.logs = this.config.logs.slice(0, 50); // Manter apenas os 50 mais recentes
            
            this.updateLogs();
            this.showSuccess('Logs atualizados');

        } catch (error) {
            console.error('Erro ao atualizar logs:', error);
            this.showError('Erro ao atualizar logs');
        }
    }

    async saveConfig() {
        try {
            // Mock save - em produção seria uma chamada API
            console.log('Salvando configuração:', this.config);
            
            // Simular delay de salvamento
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
            throw error;
        }
    }

    addLog(type, message) {
        const log = {
            type,
            message,
            timestamp: new Date().toISOString()
        };

        this.config.logs.unshift(log);
        this.config.logs = this.config.logs.slice(0, 50); // Manter apenas os 50 mais recentes
        
        this.updateLogs();
    }

    autoSave() {
        // Debounce para evitar muitas chamadas
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveConfig();
        }, 1000);
    }

    // Métodos de notificação
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-600 text-white' :
            type === 'error' ? 'bg-red-600 text-white' :
            type === 'warning' ? 'bg-yellow-600 text-white' :
            'bg-blue-600 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Funções globais para compatibilidade com onclick
function testConnection() {
    if (window.whatsappConfig) {
        window.whatsappConfig.testConnection();
    }
}

function saveProviderConfig() {
    if (window.whatsappConfig) {
        window.whatsappConfig.saveProviderConfig();
    }
}

function saveRateLimiting() {
    if (window.whatsappConfig) {
        window.whatsappConfig.saveRateLimiting();
    }
}

function resetProviderConfig() {
    if (window.whatsappConfig) {
        window.whatsappConfig.resetProviderConfig();
    }
}

function resetRateLimiting() {
    if (window.whatsappConfig) {
        window.whatsappConfig.resetRateLimiting();
    }
}

function refreshLogs() {
    if (window.whatsappConfig) {
        window.whatsappConfig.refreshLogs();
    }
}

function closeTestModal() {
    if (window.whatsappConfig) {
        window.whatsappConfig.closeTestModal();
    }
}

// Função de logout (reutilizada do sistema existente)
function logout() {
    if (window.auth) {
        window.auth.logout();
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar carregamento dos módulos necessários
    if (typeof window.auth !== 'undefined' && typeof window.apiClient !== 'undefined') {
        window.whatsappConfig = new WhatsAppConfig();
    } else {
        // Tentar novamente após um delay
        setTimeout(() => {
            if (typeof window.auth !== 'undefined' && typeof window.apiClient !== 'undefined') {
                window.whatsappConfig = new WhatsAppConfig();
            } else {
                console.error('Módulos necessários não carregados');
            }
        }, 1000);
    }
}); 