/**
 * WhatsApp Admin JavaScript
 * 
 * Funcionalidades administrativas para gerenciamento do WhatsApp SaaS
 * - Configuração Gupshup
 * - Sistema de preços
 * - Estatísticas da plataforma
 * - Validações e testes
 */

// 🔧 CONFIGURAÇÃO DA API - COMO ESTAVA FUNCIONANDO ANTES
const API_BASE_URL = 'https://programa-indicacao-multicliente-production.up.railway.app/api';

class WhatsAppAdmin {
    constructor() {
        this.config = {
            apiBaseUrl: API_BASE_URL,
            endpoints: {
                twilioConfig: '/admin/whatsapp/twilio/config',
                twilioTestConnection: '/admin/whatsapp/twilio/test-connection',
                twilioTestMessage: '/admin/whatsapp/twilio/test-message',
                twilioStatus: '/admin/whatsapp/twilio/status',

                pricingConfig: '/admin/whatsapp/pricing-config',
                statistics: '/admin/whatsapp/statistics',
                globalSettings: '/admin/whatsapp/global-settings'
            }
        };
        
        // ✅ INICIALIZAR PROPRIEDADES PARA ARMAZENAR CONFIGURAÇÕES
        this.twilioConfig = null;
        this.pricingConfig = null;
        this.currentProvider = 'twilio'; // Provider padrão
        
        this.init();
    }

    /**
     * Inicializar o módulo
     */
    init() {
        console.log('WhatsApp Admin inicializado');
        this.bindEvents();
        this.loadInitialData();
        this.startAutoRefresh();
    }

    /**
     * Vincular eventos aos elementos da interface
     */
    bindEvents() {
        // Botões de configuração Twilio
        document.getElementById('save-twilio-config')?.addEventListener('click', () => this.saveTwilioConfig());
        document.getElementById('test-twilio-connection')?.addEventListener('click', () => this.testTwilioConnection());
        document.getElementById('reset-twilio-config')?.addEventListener('click', () => this.resetTwilioConfig());
        

        
        // Botão de teste de mensagem Twilio
        document.getElementById('send-test-message')?.addEventListener('click', () => this.sendTestMessage());
        
        // Botão de teste de conexão ativa
        document.getElementById('test-active-connection')?.addEventListener('click', () => this.testActiveConnection());
        
        // Botão de preços
        document.getElementById('save-pricing')?.addEventListener('click', () => this.savePricing());

        // Toggle de visibilidade das senhas
        document.getElementById('toggle-account-sid')?.addEventListener('click', () => this.togglePasswordVisibility('twilio-account-sid', 'toggle-account-sid'));
        document.getElementById('toggle-auth-token')?.addEventListener('click', () => this.togglePasswordVisibility('twilio-auth-token', 'toggle-auth-token'));


        // Validação em tempo real
        this.bindRealTimeValidation();
        
        // Seleção de provider
        this.bindProviderSelection();
    }

    /**
     * Vincular validação em tempo real
     */
    bindRealTimeValidation() {
        const priceInput = document.getElementById('price-per-message');
        const limitInput = document.getElementById('monthly-limit-per-client');
        const setupFeeInput = document.getElementById('setup-fee');

        // Validação de preço por mensagem
        priceInput?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (value < 0.01 || value > 1.00) {
                this.showFieldError('price-per-message', 'Preço deve estar entre R$ 0,01 e R$ 1,00');
            } else {
                this.clearFieldError('price-per-message');
            }
        });

        // Validação de limite mensal
        limitInput?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value < 100 || value > 10000) {
                this.showFieldError('monthly-limit-per-client', 'Limite deve estar entre 100 e 10.000 mensagens');
            } else {
                this.clearFieldError('monthly-limit-per-client');
            }
        });

        // Validação de taxa de setup
        setupFeeInput?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (value < 0 || value > 100) {
                this.showFieldError('setup-fee', 'Taxa deve estar entre R$ 0,00 e R$ 100,00');
            } else {
                this.clearFieldError('setup-fee');
            }
        });
    }

    /**
     * Carregar dados iniciais
     */
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadTwilioConfig(),
                this.loadPricingConfig(),
                this.loadStatistics()
            ]);
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            this.showNotification('Erro ao carregar configurações', 'error');
        }
    }



    /**
     * Carregar configuração do Twilio
     */
    async loadTwilioConfig() {
        try {
            console.log('🔍 DEBUG: Carregando configuração Twilio...');
            const response = await this.makeRequest('GET', this.config.endpoints.twilioConfig);
            console.log('🔍 DEBUG: Resposta loadTwilioConfig:', response);
            
            // ✅ CORREÇÃO: Verificar se response.data existe (simplificado)
            if (response.success && response.data) {
                console.log('🔍 DEBUG: Configuração encontrada, preenchendo...');
                this.fillTwilioConfig(response.data);
            } else {
                console.log('🔍 DEBUG: Nenhuma configuração encontrada');
                // Se não há configuração, mostrar status como não configurado
                this.updateConnectionStatus(false);
            }
        } catch (error) {
            console.error('Erro ao carregar configuração Twilio:', error);
            this.updateConnectionStatus(false);
        }
    }

    /**
     * Carregar configuração de preços
     */
    async loadPricingConfig() {
        try {
            const response = await this.makeRequest('GET', this.config.endpoints.pricingConfig);
            if (response.success) {
                this.fillPricingConfig(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar configuração de preços:', error);
        }
    }

    /**
     * Carregar estatísticas
     */
    async loadStatistics() {
        try {
            const response = await this.makeRequest('GET', this.config.endpoints.statistics);
            if (response.success) {
                this.updateStatistics(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }



    /**
     * Preencher configuração do Twilio
     */
    fillTwilioConfig(config) {
        if (!config) return;

        console.log('🔍 DEBUG: fillTwilioConfig recebeu:', config);
        console.log('🔍 DEBUG: config._id existe?', !!config._id);

        // ✅ SALVAR CONFIGURAÇÃO COMPLETA para uso posterior
        this.twilioConfig = config;
        console.log('🔍 DEBUG: this.twilioConfig salvo:', this.twilioConfig);

        const elements = {
            'twilio-account-sid': config.accountSid || '',
            'twilio-auth-token': config.authToken || '',
            'twilio-phone-number': config.phoneNumber || '',
            'twilio-webhook-url': config.webhookUrl || ''
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });

        // Verificar se há configuração válida para determinar status
        const hasValidConfig = config.accountSid && config.authToken && config.phoneNumber;
        this.updateConnectionStatus(config.isActive || hasValidConfig);
    }

    /**
     * Preencher configuração de preços
     */
    fillPricingConfig(config) {
        if (!config) return;

        const elements = {
            'price-per-message': config.pricePerMessage || '0.05',
            'monthly-limit-per-client': config.monthlyLimitPerClient || '1000',
            'setup-fee': config.setupFee || '0.00'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });
    }

    /**
     * Atualizar estatísticas
     */
    updateStatistics(stats) {
        if (!stats) return;

        const elements = {
            'total-clients': stats.totalClients || '0',
            'active-clients-count': stats.activeClients || '0',
            'total-messages-sent': stats.totalMessagesSent || '0',
            'messages-this-month': stats.messagesThisMonth || '0',
            'total-revenue': this.formatCurrency(stats.totalRevenue || 0),
            'revenue-this-month': this.formatCurrency(stats.revenueThisMonth || 0),
            'overall-delivery-rate': stats.deliveryRate ? `${stats.deliveryRate}%` : '-',
            'avg-delivery-time': stats.avgDeliveryTime ? `${stats.avgDeliveryTime}s` : '-'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    /**
     * Salvar configuração do Gupshup
     */
    async saveGupshupConfig() {
        try {
            const config = this.getGupshupConfig();
            
            if (!this.validateGupshupConfig(config)) {
                return;
            }

            this.showLoading('save-gupshup-config', 'Salvando...');
            
            const response = await this.makeRequest('POST', this.config.endpoints.gupshupConfig, config);
            
            if (response.success) {
                this.showNotification('Configuração Gupshup salva com sucesso!', 'success');
                this.updateConnectionStatus(true);
            } else {
                this.showNotification(response.message || 'Erro ao salvar configuração', 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar configuração Gupshup:', error);
            this.showNotification('Erro ao conectar com o servidor', 'error');
        } finally {
            this.hideLoading('save-gupshup-config', 'Salvar Configuração');
        }
    }

    /**
     * Testar conexão com Gupshup
     */
    async testGupshupConnection() {
        try {
            this.showLoading('test-gupshup-connection', 'Testando...');
            
            const response = await this.makeRequest('POST', this.config.endpoints.testConnection);
            
            if (response.success) {
                this.showNotification('Conexão com Gupshup testada com sucesso!', 'success');
                this.updateConnectionStatus(true);
                this.updateStatusDisplay(response.data);
            } else {
                this.showNotification(response.message || 'Erro no teste de conexão', 'error');
                this.updateConnectionStatus(false);
            }
        } catch (error) {
            console.error('Erro ao testar conexão Gupshup:', error);
            this.showNotification('Erro ao conectar com o servidor', 'error');
            this.updateConnectionStatus(false);
        } finally {
            this.hideLoading('test-gupshup-connection', 'Testar Conexão');
        }
    }

    /**
     * Salvar configuração de preços
     */
    async savePricing() {
        try {
            const pricing = this.getPricingConfig();
            
            if (!this.validatePricingConfig(pricing)) {
                return;
            }

            this.showLoading('save-pricing', 'Salvando...');
            
            const response = await this.makeRequest('POST', this.config.endpoints.pricingConfig, pricing);
            
            if (response.success) {
                this.showNotification('Configuração de preços salva com sucesso!', 'success');
            } else {
                this.showNotification(response.message || 'Erro ao salvar preços', 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar configuração de preços:', error);
            this.showNotification('Erro ao conectar com o servidor', 'error');
        } finally {
            this.hideLoading('save-pricing', 'Salvar Preços');
        }
    }

    /**
     * Resetar configuração do Gupshup
     */
    resetGupshupConfig() {
        if (confirm('Tem certeza que deseja resetar a configuração do Gupshup?')) {
            const defaultConfig = {
                apiKey: 'ojlftrm5pv02cemljepf29g86wyrpuk8',
                appName: 'ViralLeadWhatsApp',
                clientId: '4000307927',
                sourceNumber: '15557777720'
            };
            
            this.fillGupshupConfig(defaultConfig);
            this.showNotification('Configuração Gupshup resetada!', 'info');
        }
    }

    /**
     * Obter configuração do Gupshup do formulário
     */
    getGupshupConfig() {
        return {
            apiKey: document.getElementById('gupshup-api-key')?.value || '',
            appName: document.getElementById('gupshup-app-name')?.value || '',
            clientId: document.getElementById('gupshup-client-id')?.value || '',
            sourceNumber: document.getElementById('gupshup-source-number')?.value || ''
        };
    }

    /**
     * Obter configuração de preços do formulário
     */
    getPricingConfig() {
        return {
            pricePerMessage: parseFloat(document.getElementById('price-per-message')?.value || '0.05'),
            monthlyLimitPerClient: parseInt(document.getElementById('monthly-limit-per-client')?.value || '1000'),
            setupFee: parseFloat(document.getElementById('setup-fee')?.value || '0.00')
        };
    }

    /**
     * Validar configuração do Gupshup
     */
    validateGupshupConfig(config) {
        if (!config.apiKey || config.apiKey.length < 10) {
            this.showNotification('API Key inválida', 'error');
            return false;
        }
        
        if (!config.appName || config.appName.length < 3) {
            this.showNotification('Nome do app inválido', 'error');
            return false;
        }
        
        return true;
    }

    /**
     * Validar configuração de preços
     */
    validatePricingConfig(pricing) {
        if (pricing.pricePerMessage < 0.01 || pricing.pricePerMessage > 1.00) {
            this.showNotification('Preço por mensagem deve estar entre R$ 0,01 e R$ 1,00', 'error');
            return false;
        }
        
        if (pricing.monthlyLimitPerClient < 100 || pricing.monthlyLimitPerClient > 10000) {
            this.showNotification('Limite mensal deve estar entre 100 e 10.000 mensagens', 'error');
            return false;
        }
        
        if (pricing.setupFee < 0 || pricing.setupFee > 100) {
            this.showNotification('Taxa de setup deve estar entre R$ 0,00 e R$ 100,00', 'error');
            return false;
        }
        
        return true;
    }

    /**
     * Atualizar status de conexão
     */
    updateConnectionStatus(isConnected) {
        const statusElement = document.getElementById('connection-status');
        const statusBadge = document.getElementById('whatsapp-status');
        
        if (statusElement) {
            statusElement.textContent = isConnected ? 'Conectado' : 'Desconectado';
            statusElement.className = isConnected ? 'text-green-400' : 'text-red-400';
        }
        
        if (statusBadge) {
            if (isConnected) {
                statusBadge.innerHTML = '<i class="fas fa-circle mr-1 text-green-400"></i>Plataforma Ativa';
                statusBadge.className = 'px-3 py-1 rounded-full text-xs font-medium bg-green-900/20 text-green-400 border border-green-500/30';
            } else {
                statusBadge.innerHTML = '<i class="fas fa-circle mr-1 text-red-400"></i>Plataforma Inativa';
                statusBadge.className = 'px-3 py-1 rounded-full text-xs font-medium bg-red-900/20 text-red-400 border border-red-500/30';
            }
        }
    }

    /**
     * Atualizar display de status
     */
    updateStatusDisplay(data) {
        if (data) {
            const providerElement = document.getElementById('provider-name');
            if (providerElement) {
                providerElement.textContent = 'Gupshup';
            }
        }
    }

    /**
     * Toggle de visibilidade da API key
     */
    toggleApiKeyVisibility() {
        const apiKeyInput = document.getElementById('gupshup-api-key');
        const toggleButton = document.getElementById('toggle-api-key');
        const icon = toggleButton?.querySelector('i');
        
        if (apiKeyInput && toggleButton && icon) {
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                apiKeyInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
    }

    /**
     * Mostrar erro de campo
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('border-red-500', 'focus:ring-red-500');
            
            // Remover mensagem de erro anterior
            const existingError = field.parentNode.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }
            
            // Adicionar nova mensagem de erro
            const errorElement = document.createElement('p');
            errorElement.className = 'field-error text-xs text-red-400 mt-1';
            errorElement.textContent = message;
            field.parentNode.appendChild(errorElement);
        }
    }

    /**
     * Limpar erro de campo
     */
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('border-red-500', 'focus:ring-red-500');
            
            const errorElement = field.parentNode.querySelector('.field-error');
            if (errorElement) {
                errorElement.remove();
            }
        }
    }

    /**
     * Mostrar loading
     */
    showLoading(buttonId, text) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
            button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${text}`;
        }
    }

    /**
     * Esconder loading
     */
    hideLoading(buttonId, text) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
            button.innerHTML = text;
        }
    }

    /**
     * Mostrar notificação
     */
    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
        
        const colors = {
            success: 'bg-green-600 text-white',
            error: 'bg-red-600 text-white',
            warning: 'bg-yellow-600 text-white',
            info: 'bg-blue-600 text-white'
        };
        
        notification.className += ` ${colors[type] || colors.info}`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-white hover:text-gray-200">
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
                notification.remove();
            }, 300);
        }, 5000);
    }

    /**
     * Fazer requisição HTTP
     */
    async makeRequest(method, endpoint, data = null) {
        const url = `${this.config.apiBaseUrl}${endpoint}`;
        console.log('🌐 Fazendo requisição:', {
            method,
            url,
            data,
            apiBaseUrl: this.config.apiBaseUrl
        });
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        console.log('📤 Enviando requisição para:', url);
        const response = await fetch(url, options);
        console.log('📥 Resposta recebida:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url
        });
        
        // 🔧 CORREÇÃO: Tratar erros HTTP antes de tentar parse JSON
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Endpoint não encontrado: ${endpoint}`);
            } else if (response.status === 401) {
                throw new Error('Não autorizado. Faça login novamente.');
            } else if (response.status === 500) {
                throw new Error('Erro interno do servidor');
            } else {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }
        }
        
        const result = await response.json();
        console.log('📄 Dados da resposta:', result);
        
        // 🔧 CORREÇÃO: Verificar estrutura de dados
        if (result && result.success === false) {
            throw new Error(result.message || 'Erro no servidor');
        }
        
        return result;
    }

    /**
     * Formatar moeda
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    /**
     * Iniciar auto-refresh das estatísticas
     */
    startAutoRefresh() {
        // Atualizar estatísticas a cada 30 segundos
        setInterval(() => {
            this.loadStatistics();
        }, 30000);
    }

    /**
     * Salvar configuração Twilio
     */
    async saveTwilioConfig() {
        try {
            const config = this.getTwilioConfig();
            
            // ✅ DEBUG: Verificar se está funcionando
            console.log('🔍 DEBUG saveTwilioConfig:', {
                config,
                hasId: !!config._id,
                twilioConfig: this.twilioConfig,
                method: config._id ? 'PUT' : 'POST'
            });
            
            if (!this.validateTwilioConfig(config)) {
                return;
            }

            this.showLoading('save-twilio-config', 'Salvando...');
            
            const method = config._id ? 'PUT' : 'POST';
            const response = await this.makeRequest(method, this.config.endpoints.twilioConfig, config);
            
            if (response.success) {
                this.showNotification('Configuração Twilio salva com sucesso!', 'success');
                await this.loadTwilioConfig(); // Recarregar para atualizar status
            } else {
                this.showNotification('Erro ao salvar configuração', 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar configuração Twilio:', error);
            this.showNotification(`Erro ao salvar: ${error.message}`, 'error');
        } finally {
            this.hideLoading('save-twilio-config', 'Salvar Configuração');
        }
    }

    /**
     * Testar conexão Twilio
     */
    async testTwilioConnection() {
        try {
            this.showLoading('test-twilio-connection', 'Testando...');
            
            const response = await this.makeRequest('POST', this.config.endpoints.twilioTestConnection);
            
            if (response.success) {
                this.showNotification('Conexão Twilio testada com sucesso!', 'success');
                await this.loadTwilioConfig(); // Recarregar para atualizar status
            } else {
                this.showNotification('Falha no teste de conexão', 'error');
            }
        } catch (error) {
            console.error('Erro ao testar conexão Twilio:', error);
            this.showNotification(`Erro no teste: ${error.message}`, 'error');
        } finally {
            this.hideLoading('test-twilio-connection', 'Testar Conexão');
        }
    }

    /**
     * Testar conexão ativa
     */
    async testActiveConnection() {
        try {
            this.showLoading('test-active-connection', 'Testando...');
            
            const response = await this.makeRequest('POST', this.config.endpoints.twilioTestConnection);
            
            if (response.success) {
                this.showNotification('Conexão ativa testada com sucesso!', 'success');
                await this.loadTwilioConfig(); // Recarregar para atualizar status
            } else {
                this.showNotification('Falha no teste de conexão ativa', 'error');
            }
        } catch (error) {
            console.error('Erro ao testar conexão ativa:', error);
            this.showNotification(`Erro no teste: ${error.message}`, 'error');
        } finally {
            this.hideLoading('test-active-connection', 'Testar Conexão Ativa');
        }
    }

    /**
     * Enviar mensagem de teste
     */
    async sendTestMessage() {
        try {
            const phoneNumber = document.getElementById('test-phone-number').value;
            const message = document.getElementById('test-message').value;
            
            if (!phoneNumber || !message) {
                this.showNotification('Preencha o número e a mensagem de teste', 'error');
                return;
            }

            this.showLoading('send-test-message', 'Enviando...');
            
            const response = await this.makeRequest('POST', this.config.endpoints.twilioTestMessage, {
                to: phoneNumber,
                message: message
            });
            
            if (response.success) {
                this.showNotification('Mensagem de teste enviada com sucesso!', 'success');
                this.showTestResult(true, response.message);
            } else {
                this.showNotification('Falha ao enviar mensagem de teste', 'error');
                this.showTestResult(false, response.message);
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem de teste:', error);
            this.showNotification(`Erro ao enviar: ${error.message}`, 'error');
            this.showTestResult(false, error.message);
        } finally {
            this.hideLoading('send-test-message', 'Enviar Mensagem de Teste');
        }
    }



    /**
     * Mostrar resultado do teste
     */
    showTestResult(success, message) {
        const resultDiv = document.getElementById('test-result');
        const successDiv = document.getElementById('test-success');
        const errorDiv = document.getElementById('test-error');
        const successMessage = document.getElementById('success-message');
        const errorMessage = document.getElementById('error-message');
        
        resultDiv.classList.remove('hidden');
        
        if (success) {
            successDiv.classList.remove('hidden');
            errorDiv.classList.add('hidden');
            successMessage.textContent = message;
        } else {
            successDiv.classList.add('hidden');
            errorDiv.classList.remove('hidden');
            errorMessage.textContent = message;
        }
    }

    /**
     * Resetar configuração Twilio
     */
    resetTwilioConfig() {
        if (confirm('Tem certeza que deseja resetar a configuração Twilio?')) {
            document.getElementById('twilio-account-sid').value = '';
            document.getElementById('twilio-auth-token').value = '';
            document.getElementById('twilio-phone-number').value = '';
            document.getElementById('twilio-webhook-url').value = '';
            this.showNotification('Configuração Twilio resetada', 'info');
        }
    }



    /**
     * Obter configuração Twilio do formulário
     */
    getTwilioConfig() {
        // Verificar se existe configuração carregada
        const existingConfig = this.twilioConfig || {};
        
        return {
            _id: existingConfig._id, // ✅ IMPORTANTE: ID para determinar POST vs PUT
            accountSid: document.getElementById('twilio-account-sid').value.trim(),
            authToken: document.getElementById('twilio-auth-token').value.trim(),
            phoneNumber: document.getElementById('twilio-phone-number').value.trim(),
            webhookUrl: document.getElementById('twilio-webhook-url').value.trim()
        };
    }



    /**
     * Validar configuração Twilio
     */
    validateTwilioConfig(config) {
        if (!config.accountSid || config.accountSid.length < 10) {
            this.showNotification('Account SID é obrigatório e deve ter pelo menos 10 caracteres', 'error');
            return false;
        }
        
        if (!config.authToken || config.authToken.length < 10) {
            this.showNotification('Auth Token é obrigatório e deve ter pelo menos 10 caracteres', 'error');
            return false;
        }
        
        if (!config.phoneNumber || !config.phoneNumber.includes('+')) {
            this.showNotification('Número WhatsApp deve incluir código do país (+55)', 'error');
            return false;
        }
        
        return true;
    }



    /**
     * Toggle de visibilidade de senha
     */
    togglePasswordVisibility(fieldId, buttonId) {
        const field = document.getElementById(fieldId);
        const button = document.getElementById(buttonId);
        const icon = button.querySelector('i');
        
        if (field.type === 'password') {
            field.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            field.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    /**
     * Vincular seleção de provider
     */
    bindProviderSelection() {
        const providerOptions = document.querySelectorAll('.provider-option');
        
        providerOptions.forEach(option => {
            option.addEventListener('click', () => {
                const provider = option.dataset.provider;
                this.selectProvider(provider);
            });
        });
    }

    /**
     * Selecionar provider
     */
    selectProvider(provider) {
        console.log('🔍 DEBUG: Selecionando provider:', provider);
        
        // Ocultar todas as configurações
        document.querySelectorAll('.provider-config').forEach(config => {
            config.classList.add('hidden');
        });
        
        // Mostrar configuração do provider selecionado
        const configElement = document.getElementById(`${provider}-config`);
        if (configElement) {
            configElement.classList.remove('hidden');
        }
        
        // Atualizar UI de seleção
        this.updateProviderSelectionUI(provider);
        
        // Atualizar provider ativo
        this.currentProvider = provider;
        
        console.log('🔍 DEBUG: Provider selecionado:', this.currentProvider);
    }

    /**
     * Atualizar UI de seleção de provider
     */
    updateProviderSelectionUI(selectedProvider) {
        const providerOptions = document.querySelectorAll('.provider-option');
        
        providerOptions.forEach(option => {
            const provider = option.dataset.provider;
            const container = option.querySelector('div');
            
            if (provider === selectedProvider) {
                container.classList.remove('border-gray-600/50', 'opacity-50', 'cursor-not-allowed');
                container.classList.add('border-blue-500/50', 'cursor-pointer');
            } else {
                container.classList.remove('border-blue-500/50', 'cursor-pointer');
                container.classList.add('border-gray-600/50', 'opacity-50', 'cursor-not-allowed');
            }
        });
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.whatsappAdmin = new WhatsAppAdmin();
});

// Exportar para uso global
window.WhatsAppAdmin = WhatsAppAdmin;
