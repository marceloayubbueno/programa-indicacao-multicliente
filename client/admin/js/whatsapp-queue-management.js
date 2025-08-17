// WhatsApp Queue Management
class WhatsAppQueueManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalMessages = 0;
        this.queues = [];
        this.clients = [];
        this.settings = {};
        this.autoRefreshInterval = null;
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadClients();
        this.setupEventListeners();
        this.startAutoRefresh();
        await this.loadQueueStatus();
        await this.loadQueueMessages();
    }

    setupEventListeners() {
        // Botões principais
        document.getElementById('refresh-queues').addEventListener('click', () => this.refreshQueues());
        document.getElementById('process-queues').addEventListener('click', () => this.processQueues());
        document.getElementById('save-queue-settings').addEventListener('click', () => this.saveSettings());

        // Filtros
        document.getElementById('filter-priority').addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-status').addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-client').addEventListener('change', () => this.applyFilters());

        // Paginação
        document.getElementById('prev-page').addEventListener('click', () => this.previousPage());
        document.getElementById('next-page').addEventListener('click', () => this.nextPage());

        // Logs
        document.getElementById('clear-logs').addEventListener('click', () => this.clearLogs());
        document.getElementById('export-logs').addEventListener('click', () => this.exportLogs());

        // Auto-save nas configurações
        document.querySelectorAll('#rate-limit-per-minute, #delay-between-messages, #send-time-start, #send-time-end').forEach(input => {
            input.addEventListener('change', () => this.autoSaveSettings());
        });

        document.querySelectorAll('#auto-process, #enable-retries, #log-all-messages').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.autoSaveSettings());
        });
    }

    async loadSettings() {
        try {
            const response = await fetch(`${window.ADMIN_CONFIG.API_URL}/admin/whatsapp/queue/settings`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.settings = await response.json();
            } else {
                // Configurações padrão se não existirem
                this.settings = {
                    rateLimitPerMinute: 30,
                    delayBetweenMessages: 2000,
                    sendTimeStart: '08:00',
                    sendTimeEnd: '20:00',
                    autoProcess: true,
                    enableRetries: true,
                    logAllMessages: false
                };
            }

            this.populateSettingsForm();
        } catch (error) {
            console.error('Error loading queue settings:', error);
            this.settings = {
                rateLimitPerMinute: 30,
                delayBetweenMessages: 2000,
                sendTimeStart: '08:00',
                sendTimeEnd: '20:00',
                autoProcess: true,
                enableRetries: true,
                logAllMessages: false
            };
            this.populateSettingsForm();
        }
    }

    populateSettingsForm() {
        document.getElementById('rate-limit-per-minute').value = this.settings.rateLimitPerMinute || 30;
        document.getElementById('delay-between-messages').value = this.settings.delayBetweenMessages || 2000;
        document.getElementById('send-time-start').value = this.settings.sendTimeStart || '08:00';
        document.getElementById('send-time-end').value = this.settings.sendTimeEnd || '20:00';
        document.getElementById('auto-process').checked = this.settings.autoProcess !== false;
        document.getElementById('enable-retries').checked = this.settings.enableRetries !== false;
        document.getElementById('log-all-messages').checked = this.settings.logAllMessages || false;
    }

    async loadClients() {
        try {
            // Por enquanto, usar dados mockados até o endpoint ser implementado
            this.clients = [
                { _id: 'mock-1', name: 'Cliente Demo 1', email: 'cliente1@demo.com' },
                { _id: 'mock-2', name: 'Cliente Demo 2', email: 'cliente2@demo.com' }
            ];
            this.populateClientFilter();
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    }

    populateClientFilter() {
        const clientFilter = document.getElementById('filter-client');
        clientFilter.innerHTML = '<option value="">Todos os clientes</option>';
        
        this.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client._id;
            option.textContent = client.name || client.email;
            clientFilter.appendChild(option);
        });
    }

    async loadQueueStatus() {
        try {
            const response = await fetch(`${window.ADMIN_CONFIG.API_URL}/admin/whatsapp/queue/status`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const status = await response.json();
                this.updateQueueStatus(status);
            }
        } catch (error) {
            console.error('Error loading queue status:', error);
            this.updateQueueStatus({
                totalQueued: 0,
                highPriority: 0,
                mediumPriority: 0,
                lowPriority: 0,
                processing: 0
            });
        }
    }

    updateQueueStatus(status) {
        document.getElementById('total-queued').textContent = status.totalQueued || 0;
        document.getElementById('high-priority').textContent = status.highPriority || 0;
        document.getElementById('medium-priority').textContent = status.mediumPriority || 0;
        document.getElementById('low-priority').textContent = status.lowPriority || 0;
        document.getElementById('processing').textContent = status.processing || 0;
    }

    async loadQueueMessages() {
        try {
            const filters = this.getActiveFilters();
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                ...filters
            });

            const response = await fetch(`${window.ADMIN_CONFIG.API_URL}/admin/whatsapp/queue/messages?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.queues = data.messages || [];
                this.totalMessages = data.total || 0;
                this.renderQueueMessages();
                this.updatePagination();
            }
        } catch (error) {
            console.error('Error loading queue messages:', error);
            this.showNotification('Erro ao carregar mensagens da fila', 'error');
        }
    }

    getActiveFilters() {
        const filters = {};
        
        const priority = document.getElementById('filter-priority').value;
        const status = document.getElementById('filter-status').value;
        const client = document.getElementById('filter-client').value;

        if (priority) filters.priority = priority;
        if (status) filters.status = status;
        if (client) filters.clientId = client;

        return filters;
    }

    renderQueueMessages() {
        const tbody = document.getElementById('queue-messages-tbody');
        tbody.innerHTML = '';

        if (this.queues.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                        <i class="fas fa-inbox text-4xl mb-2 block"></i>
                        Nenhuma mensagem na fila
                    </td>
                </tr>
            `;
            return;
        }

        this.queues.forEach(message => {
            const row = this.createMessageRow(message);
            tbody.appendChild(row);
        });
    }

    createMessageRow(message) {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700 hover:bg-gray-700';

        const clientName = this.getClientName(message.clientId);
        const priorityClass = this.getPriorityClass(message.priority);
        const statusClass = this.getStatusClass(message.status);

        row.innerHTML = `
            <td class="px-4 py-3">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-building text-white text-xs"></i>
                    </div>
                    <span class="text-gray-100">${clientName}</span>
                </div>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs font-medium rounded-full ${priorityClass}">
                    ${this.getPriorityLabel(message.priority)}
                </span>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">
                    ${this.getStatusLabel(message.status)}
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center">
                    <i class="fas fa-phone text-green-400 mr-2"></i>
                    <span class="text-gray-100">${message.to}</span>
                </div>
            </td>
            <td class="px-4 py-3">
                <span class="text-gray-300">${this.getTriggerLabel(message.trigger)}</span>
            </td>
            <td class="px-4 py-3">
                <span class="text-gray-300">${message.retryCount || 0}/${message.maxRetries || 3}</span>
            </td>
            <td class="px-4 py-3">
                <span class="text-gray-400 text-xs">${this.formatDate(message.createdAt)}</span>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                    <button onclick="queueManager.viewMessage('${message._id}')" class="p-1 text-blue-400 hover:text-blue-300" title="Ver detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="queueManager.retryMessage('${message._id}')" class="p-1 text-yellow-400 hover:text-yellow-300" title="Tentar novamente">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button onclick="queueManager.deleteMessage('${message._id}')" class="p-1 text-red-400 hover:text-red-300" title="Remover da fila">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    getClientName(clientId) {
        const client = this.clients.find(c => c._id === clientId);
        return client ? (client.name || client.email) : 'Cliente não encontrado';
    }

    getPriorityClass(priority) {
        const classes = {
            high: 'bg-red-100 text-red-800',
            medium: 'bg-yellow-100 text-yellow-800',
            low: 'bg-gray-100 text-gray-800'
        };
        return classes[priority] || classes.medium;
    }

    getStatusClass(status) {
        const classes = {
            pending: 'bg-blue-100 text-blue-800',
            processing: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            retry: 'bg-orange-100 text-orange-800'
        };
        return classes[status] || classes.pending;
    }

    getPriorityLabel(priority) {
        const labels = {
            high: 'Alta',
            medium: 'Média',
            low: 'Baixa'
        };
        return labels[priority] || 'Média';
    }

    getStatusLabel(status) {
        const labels = {
            pending: 'Pendente',
            processing: 'Processando',
            completed: 'Concluído',
            failed: 'Falhou',
            retry: 'Tentativa'
        };
        return labels[status] || 'Pendente';
    }

    getTriggerLabel(trigger) {
        const labels = {
            indicator_joined: 'Novo Indicador',
            lead_indicated: 'Novo Lead',
            reward_earned: 'Recompensa Ganha',
            campaign_started: 'Campanha Iniciada',
            follow_up: 'Follow-up'
        };
        return labels[trigger] || trigger;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    updatePagination() {
        const totalPages = Math.ceil(this.totalMessages / this.pageSize);
        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, this.totalMessages);

        document.getElementById('showing-start').textContent = start;
        document.getElementById('showing-end').textContent = end;
        document.getElementById('total-messages').textContent = this.totalMessages;
        document.getElementById('current-page').textContent = this.currentPage;

        document.getElementById('prev-page').disabled = this.currentPage <= 1;
        document.getElementById('next-page').disabled = this.currentPage >= totalPages;
    }

    async refreshQueues() {
        await this.loadQueueStatus();
        await this.loadQueueMessages();
        this.showNotification('Filas atualizadas', 'success');
    }

    async processQueues() {
        try {
            const response = await fetch(`${window.ADMIN_CONFIG.API_URL}/admin/whatsapp/queue/process`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ limit: 10 })
            });

            if (response.ok) {
                this.showNotification('Processamento de filas iniciado', 'success');
                this.addLog('Processamento de filas iniciado manualmente');
                await this.refreshQueues();
            } else {
                const error = await response.json();
                this.showNotification(`Erro ao processar filas: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error processing queues:', error);
            this.showNotification('Erro ao processar filas', 'error');
        }
    }

    async saveSettings() {
        try {
            const settings = {
                rateLimitPerMinute: parseInt(document.getElementById('rate-limit-per-minute').value),
                delayBetweenMessages: parseInt(document.getElementById('delay-between-messages').value),
                sendTimeStart: document.getElementById('send-time-start').value,
                sendTimeEnd: document.getElementById('send-time-end').value,
                autoProcess: document.getElementById('auto-process').checked,
                enableRetries: document.getElementById('enable-retries').checked,
                logAllMessages: document.getElementById('log-all-messages').checked
            };

            const response = await fetch(`${window.ADMIN_CONFIG.API_URL}/admin/whatsapp/queue/settings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                this.settings = settings;
                this.showNotification('Configurações salvas com sucesso', 'success');
                this.addLog('Configurações de fila atualizadas');
            } else {
                const error = await response.json();
                this.showNotification(`Erro ao salvar: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Erro ao salvar configurações', 'error');
        }
    }

    autoSaveSettings() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveSettings();
        }, 2000);
    }

    applyFilters() {
        this.currentPage = 1;
        this.loadQueueMessages();
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadQueueMessages();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.totalMessages / this.pageSize);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.loadQueueMessages();
        }
    }

    async viewMessage(messageId) {
        try {
            const response = await fetch(`${window.ADMIN_CONFIG.API_URL}/admin/whatsapp/queue/messages/${messageId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const message = await response.json();
                this.showMessageDetails(message);
            }
        } catch (error) {
            console.error('Error viewing message:', error);
            this.showNotification('Erro ao carregar detalhes da mensagem', 'error');
        }
    }

    showMessageDetails(message) {
        // Implementar modal com detalhes da mensagem
        alert(`Detalhes da mensagem:\nCliente: ${this.getClientName(message.clientId)}\nDestinatário: ${message.to}\nConteúdo: ${message.content.body}`);
    }

    async retryMessage(messageId) {
        try {
            const response = await fetch(`${window.ADMIN_CONFIG.API_URL}/admin/whatsapp/queue/messages/${messageId}/retry`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showNotification('Mensagem enviada para retry', 'success');
                this.addLog(`Mensagem ${messageId} enviada para retry`);
                await this.refreshQueues();
            } else {
                const error = await response.json();
                this.showNotification(`Erro no retry: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error retrying message:', error);
            this.showNotification('Erro ao tentar novamente', 'error');
        }
    }

    async deleteMessage(messageId) {
        if (!confirm('Tem certeza que deseja remover esta mensagem da fila?')) {
            return;
        }

        try {
            const response = await fetch(`${window.ADMIN_CONFIG.API_URL}/admin/whatsapp/queue/messages/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showNotification('Mensagem removida da fila', 'success');
                this.addLog(`Mensagem ${messageId} removida da fila`);
                await this.refreshQueues();
            } else {
                const error = await response.json();
                this.showNotification(`Erro ao remover: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            this.showNotification('Erro ao remover mensagem', 'error');
        }
    }

    clearLogs() {
        const logsContainer = document.getElementById('processing-logs');
        logsContainer.innerHTML = '<div class="text-gray-500">Logs limpos...</div>';
        this.addLog('Logs limpos pelo usuário');
    }

    exportLogs() {
        const logsContainer = document.getElementById('processing-logs');
        const logs = logsContainer.innerText;
        
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whatsapp-queue-logs-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Logs exportados com sucesso', 'success');
    }

    addLog(message) {
        const logsContainer = document.getElementById('processing-logs');
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const logEntry = document.createElement('div');
        logEntry.className = 'text-green-400 mb-1';
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    startAutoRefresh() {
        this.autoRefreshInterval = setInterval(() => {
            this.loadQueueStatus();
        }, 30000); // Atualiza a cada 30 segundos
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
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
}

// Inicializar quando o DOM estiver carregado
let queueManager;
document.addEventListener('DOMContentLoaded', () => {
    queueManager = new WhatsAppQueueManager();
});

// Cleanup quando a página for fechada
window.addEventListener('beforeunload', () => {
    if (queueManager) {
        queueManager.stopAutoRefresh();
    }
});
