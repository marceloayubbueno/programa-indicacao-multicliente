// Configuração WhatsApp - Gestão de configurações e conexões
// Sistema multicliente - JWT Authentication

// Variáveis globais
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

        // Carregar dados iniciais
        await loadConfig();
        await loadStatistics();
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

async function loadConfig() {
    try {
        // Mock data para desenvolvimento frontend
        config = {
            whatsappNumber: '+5511999999999',
            displayName: 'Minha Empresa',
            businessDescription: 'Empresa especializada em soluções digitais',
            status: 'connected',
            lastCheck: '2024-01-15T10:30:00Z',
            approvedTemplates: 5
        };
        
        // Preencher formulário
        document.getElementById('whatsappNumber').value = config.whatsappNumber;
        document.getElementById('displayName').value = config.displayName;
        document.getElementById('businessDescription').value = config.businessDescription;
        
        // Atualizar status da conexão
        updateConnectionStatus();
        
    } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        showError('Erro ao carregar configuração');
    }
}

async function loadStatistics() {
    try {
        // Mock data para desenvolvimento frontend
        const stats = {
            totalMessagesSent: 1250,
            successRate: 98.5,
            messagesToday: 45,
            remainingQuota: 955
        };
        
        // Atualizar estatísticas
        document.getElementById('totalMessagesSent').textContent = stats.totalMessagesSent.toLocaleString();
        document.getElementById('successRate').textContent = stats.successRate + '%';
        document.getElementById('messagesToday').textContent = stats.messagesToday;
        document.getElementById('remainingQuota').textContent = stats.remainingQuota;
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        showError('Erro ao carregar estatísticas');
    }
}

async function loadActivityLogs() {
    try {
        // Mock data para desenvolvimento frontend
        const logs = [
            {
                id: '1',
                type: 'message_sent',
                message: 'Mensagem enviada para +5511999999999',
                timestamp: '2024-01-15T15:30:00Z',
                status: 'success'
            },
            {
                id: '2',
                type: 'template_approved',
                message: 'Template "Boas-vindas" aprovado',
                timestamp: '2024-01-15T14:20:00Z',
                status: 'success'
            },
            {
                id: '3',
                type: 'connection_test',
                message: 'Teste de conexão realizado com sucesso',
                timestamp: '2024-01-15T10:30:00Z',
                status: 'success'
            },
            {
                id: '4',
                type: 'message_failed',
                message: 'Falha ao enviar mensagem para +5511888888888',
                timestamp: '2024-01-15T09:15:00Z',
                status: 'error'
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
    
    if (config.status === 'connected') {
        statusElement.innerHTML = `
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-green-400 font-medium">Conectado</span>
        `;
    } else {
        statusElement.innerHTML = `
            <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span class="text-red-400 font-medium">Desconectado</span>
        `;
    }
    
    if (lastCheckElement) {
        lastCheckElement.textContent = new Date(config.lastCheck).toLocaleString('pt-BR');
    }
    
    if (approvedTemplatesElement) {
        approvedTemplatesElement.textContent = config.approvedTemplates;
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
        case 'message_sent': return 'fas fa-paper-plane';
        case 'template_approved': return 'fas fa-check-circle';
        case 'connection_test': return 'fas fa-plug';
        case 'message_failed': return 'fas fa-exclamation-triangle';
        default: return 'fas fa-info-circle';
    }
}

async function saveWhatsAppConfig() {
    try {
        const whatsappNumber = document.getElementById('whatsappNumber').value;
        const displayName = document.getElementById('displayName').value;
        const businessDescription = document.getElementById('businessDescription').value;
        
        // Validação
        if (!whatsappNumber || !displayName) {
            showError('Preencha todos os campos obrigatórios');
            return;
        }
        
        if (!validatePhoneNumber(whatsappNumber)) {
            showError('Número de WhatsApp inválido');
            return;
        }
        
        // Mock save - em produção seria uma chamada API
        config = {
            ...config,
            whatsappNumber,
            displayName,
            businessDescription,
            lastCheck: new Date().toISOString()
        };
        
        showSuccess('Configuração salva com sucesso!');
        
    } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        showError('Erro ao salvar configuração');
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
        // Mostrar modal de teste
        document.getElementById('testConnectionModal').classList.remove('hidden');
        
        // Simular teste de conexão
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Atualizar status do teste
        const statusElement = document.getElementById('testConnectionStatus');
        statusElement.innerHTML = `
            <div class="text-green-400 mb-4">
                <i class="fas fa-check-circle text-4xl"></i>
            </div>
            <p class="text-gray-300">Conexão testada com sucesso!</p>
            <p class="text-gray-400 text-sm mt-2">Todas as configurações estão funcionando corretamente.</p>
        `;
        
        // Atualizar status da conexão
        config.status = 'connected';
        config.lastCheck = new Date().toISOString();
        updateConnectionStatus();
        
    } catch (error) {
        console.error('Erro ao testar conexão:', error);
        
        const statusElement = document.getElementById('testConnectionStatus');
        statusElement.innerHTML = `
            <div class="text-red-400 mb-4">
                <i class="fas fa-exclamation-triangle text-4xl"></i>
            </div>
            <p class="text-gray-300">Erro ao testar conexão</p>
            <p class="text-gray-400 text-sm mt-2">Verifique suas configurações e tente novamente.</p>
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