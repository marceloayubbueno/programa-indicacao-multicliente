// WhatsApp Configuration Management
class WhatsAppConfigManager {
    constructor() {
        this.currentProvider = null;
        this.config = null;
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Provider selection
        document.querySelectorAll('input[name="provider"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentProvider = e.target.value;
                this.showProviderConfig();
            });
        });

        // Auto-save on input changes
        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => {
                this.autoSave();
            });
        });
    }

    showProviderConfig() {
        // Hide all provider configs
        document.querySelectorAll('.provider-config').forEach(config => {
            config.classList.add('hidden');
        });

        // Show selected provider config
        if (this.currentProvider) {
            const configElement = document.getElementById(`${this.currentProvider}-config`);
            if (configElement) {
                configElement.classList.remove('hidden');
            }
        }

        // Update radio button styling
        document.querySelectorAll('input[name="provider"]').forEach(radio => {
            const label = radio.nextElementSibling;
            const radioCircle = label.querySelector('.w-4.h-4');
            
            if (radio.checked) {
                radioCircle.classList.remove('border-gray-400');
                radioCircle.classList.add('border-blue-500', 'bg-blue-500');
                label.classList.add('border-blue-500');
                label.classList.remove('border-gray-600');
            } else {
                radioCircle.classList.remove('border-blue-500', 'bg-blue-500');
                radioCircle.classList.add('border-gray-400');
                label.classList.remove('border-blue-500');
                label.classList.add('border-gray-600');
            }
        });
    }

    async loadConfig() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/whatsapp/config`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.config = await response.json();
                this.populateForm();
            } else {
                console.log('No WhatsApp config found, starting fresh');
                this.config = this.getDefaultConfig();
            }
        } catch (error) {
            console.error('Error loading WhatsApp config:', error);
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            provider: 'twilio',
            credentials: {},
            globalSettings: {
                rateLimitPerMinute: 30,
                sendTimeStart: '08:00',
                sendTimeEnd: '20:00',
                timezone: 'America/Sao_Paulo',
                enableWebhooks: true
            },
            status: {
                connected: false,
                messagesToday: 0,
                dailyLimit: 1000,
                activeClients: 0,
                totalTemplates: 0
            }
        };
    }

    populateForm() {
        // Set provider
        if (this.config.provider) {
            this.currentProvider = this.config.provider;
            const radio = document.getElementById(`provider-${this.config.provider}`);
            if (radio) {
                radio.checked = true;
            }
        }

        // Populate credentials based on provider
        if (this.config.credentials) {
            Object.keys(this.config.credentials).forEach(key => {
                const input = document.getElementById(`${this.currentProvider}-${key}`);
                if (input) {
                    input.value = this.config.credentials[key];
                }
            });
        }

        // Populate global settings
        if (this.config.globalSettings) {
            const settings = this.config.globalSettings;
            document.getElementById('rate-limit-per-minute').value = settings.rateLimitPerMinute || 30;
            document.getElementById('send-time-start').value = settings.sendTimeStart || '08:00';
            document.getElementById('send-time-end').value = settings.sendTimeEnd || '20:00';
            document.getElementById('timezone').value = settings.timezone || 'America/Sao_Paulo';
            document.getElementById('enable-webhooks').checked = settings.enableWebhooks !== false;
        }

        this.showProviderConfig();
        this.updateStatus();
    }

    async saveConfig() {
        try {
            const configData = this.getFormData();
            
            const response = await fetch(`${API_BASE_URL}/admin/whatsapp/config`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(configData)
            });

            if (response.ok) {
                this.showNotification('Configuração salva com sucesso!', 'success');
                await this.loadConfig(); // Reload to get updated status
            } else {
                const error = await response.json();
                this.showNotification(`Erro ao salvar: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            this.showNotification('Erro ao salvar configuração', 'error');
        }
    }

    getFormData() {
        const credentials = {};
        
        // Get provider-specific credentials
        if (this.currentProvider === 'twilio') {
            credentials.accountSid = document.getElementById('twilio-account-sid').value;
            credentials.authToken = document.getElementById('twilio-auth-token').value;
            credentials.whatsappNumber = document.getElementById('twilio-whatsapp-number').value;
        } else if (this.currentProvider === 'meta') {
            credentials.accessToken = document.getElementById('meta-access-token').value;
            credentials.phoneNumberId = document.getElementById('meta-phone-number-id').value;
            credentials.businessAccountId = document.getElementById('meta-business-account-id').value;
        } else if (this.currentProvider === '360dialog') {
            credentials.apiKey = document.getElementById('360dialog-api-key').value;
            credentials.instanceId = document.getElementById('360dialog-instance-id').value;
        }

        return {
            provider: this.currentProvider,
            credentials: credentials,
            globalSettings: {
                rateLimitPerMinute: parseInt(document.getElementById('rate-limit-per-minute').value),
                sendTimeStart: document.getElementById('send-time-start').value,
                sendTimeEnd: document.getElementById('send-time-end').value,
                timezone: document.getElementById('timezone').value,
                enableWebhooks: document.getElementById('enable-webhooks').checked
            }
        };
    }

    async testConnection() {
        const testPhone = document.getElementById('test-phone').value;
        if (!testPhone) {
            this.showNotification('Digite um número de telefone para teste', 'warning');
            return;
        }

        try {
            const configData = this.getFormData();
            
            const response = await fetch(`${API_BASE_URL}/admin/whatsapp/test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...configData,
                    testPhone: testPhone
                })
            });

            if (response.ok) {
                this.showNotification('Mensagem de teste enviada com sucesso!', 'success');
                await this.loadConfig(); // Reload to get updated status
            } else {
                const error = await response.json();
                this.showNotification(`Erro no teste: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error testing connection:', error);
            this.showNotification('Erro ao testar conexão', 'error');
        }
    }

    updateStatus() {
        if (!this.config || !this.config.status) return;

        const status = this.config.status;
        
        // Update status indicator
        const statusElement = document.getElementById('whatsapp-status');
        if (status.connected) {
            statusElement.className = 'px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white';
            statusElement.innerHTML = '<i class="fas fa-circle mr-1"></i>Conectado';
        } else {
            statusElement.className = 'px-3 py-1 rounded-full text-xs font-medium bg-gray-600 text-gray-300';
            statusElement.innerHTML = '<i class="fas fa-circle mr-1"></i>Desconectado';
        }

        // Update provider name
        document.getElementById('provider-name').textContent = this.currentProvider ? this.currentProvider.toUpperCase() : '-';
        
        // Update connection status
        document.getElementById('connection-status').textContent = status.connected ? 'Ativo' : 'Inativo';
        
        // Update statistics
        document.getElementById('messages-today').textContent = status.messagesToday || 0;
        document.getElementById('daily-limit').textContent = status.dailyLimit || '-';
        document.getElementById('active-clients').textContent = status.activeClients || 0;
        document.getElementById('total-templates').textContent = status.totalTemplates || 0;
    }

    async autoSave() {
        // Debounce auto-save
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveConfig();
        }, 2000);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 transition-all duration-300 transform translate-x-full`;
        
        // Set color based on type
        if (type === 'success') {
            notification.classList.add('bg-green-600');
        } else if (type === 'error') {
            notification.classList.add('bg-red-600');
        } else if (type === 'warning') {
            notification.classList.add('bg-yellow-600');
        } else {
            notification.classList.add('bg-blue-600');
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    resetConfig() {
        if (confirm('Tem certeza que deseja resetar todas as configurações?')) {
            this.config = this.getDefaultConfig();
            this.populateForm();
            this.saveConfig();
        }
    }
}

// Global functions for HTML onclick handlers
let whatsappConfigManager;

document.addEventListener('DOMContentLoaded', function() {
    whatsappConfigManager = new WhatsAppConfigManager();
});

function saveWhatsAppConfig() {
    if (whatsappConfigManager) {
        whatsappConfigManager.saveConfig();
    }
}

function testWhatsAppConnection() {
    if (whatsappConfigManager) {
        whatsappConfigManager.testConnection();
    }
}

function resetWhatsAppConfig() {
    if (whatsappConfigManager) {
        whatsappConfigManager.resetConfig();
    }
}

function saveGlobalSettings() {
    if (whatsappConfigManager) {
        whatsappConfigManager.saveConfig();
    }
} 