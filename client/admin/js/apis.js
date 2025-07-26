/**
 * 🔧 GERENCIADOR DE APIS - ÁREA ADMIN
 * Arquivo responsável por gerenciar configurações de APIs externas
 * 
 * Funcionalidades:
 * - Configuração Brevo API  
 * - Testes de conectividade
 * - Gerenciamento de status
 */

// 🌐 Configurações globais
let brevoConfig = null;

// 📋 Inicialização
document.addEventListener('DOMContentLoaded', function() {
    adminDebugLog('🚀 Inicializando gerenciador de APIs...');
    
    // Carregar configurações salvas automaticamente
    loadAllConfigs();
    
    // Preencher campo de teste com email padrão
    document.getElementById('brevoTestEmail').value = 'marceloayub@virallead.com.br';
});



// 👁️ Função para mostrar/ocultar senha
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}



// 💾 Função para salvar configuração Brevo
async function saveBrevoConfig() {
    try {
        const apiKey = document.getElementById('brevoApiKey').value.trim();
        
        if (!apiKey) {
            adminErrorLog('❌ API Key do Brevo é obrigatória');
            showNotification('API Key do Brevo é obrigatória', 'error');
            return;
        }
        
        // Validar formato da API Key
        if (!apiKey.startsWith('xkeysib-')) {
            adminErrorLog('❌ API Key do Brevo deve começar com "xkeysib-"');
            showNotification('API Key do Brevo deve começar com "xkeysib-"', 'error');
            return;
        }
        
        const config = {
            provider: 'brevo',
            apiKey: apiKey,
            enabled: true,
            isDefault: true
        };
        
        // Salvar no backend
        const response = await fetch(`${window.ADMIN_CONFIG.API_URL}/email-config/admin/brevo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify(config)
        });
        
        if (response.ok) {
            const savedConfig = await response.json();
            brevoConfig = savedConfig;
            updateBrevoStatus('active');
            adminSuccessLog('✅ Configuração Brevo salva com sucesso');
            showNotification('Configuração Brevo salva com sucesso!', 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao salvar configuração');
        }
        
    } catch (error) {
        adminErrorLog('❌ Erro ao salvar configuração Brevo:', error);
        showNotification('Erro ao salvar configuração Brevo', 'error');
    }
}



// 🧪 Função para testar Brevo
async function testBrevo(event) {
    try {
        const testEmail = document.getElementById('brevoTestEmail').value.trim();
        
        if (!testEmail) {
            adminErrorLog('❌ E-mail de teste é obrigatório');
            showNotification('E-mail de teste é obrigatório', 'error');
            return;
        }
        
        if (!brevoConfig?.apiKey) {
            adminErrorLog('❌ Configure a API Key do Brevo primeiro');
            showNotification('⚠️ Primeiro salve a configuração do Brevo antes de testar!', 'warning');
            return;
        }
        
        // Mostrar loading
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Testando...';
        button.disabled = true;
        
        // Testar envio
        const response = await fetch(`${window.ADMIN_CONFIG.API_URL}/email-config/admin/brevo/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify({
                testEmail: testEmail
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Verificar se realmente foi enviado
            if (result.success) {
                adminSuccessLog('✅ E-mail enviado com sucesso!', result);
                showNotification(`📧 E-mail enviado para ${testEmail}! Verifique sua caixa de entrada.`, 'success');
                
                // Mostrar detalhes
                if (result.details) {
                    adminDebugLog('📧 Detalhes do envio:', result.details);
                    showNotification(`🆔 ID: ${result.details.configId} | ⏰ ${new Date(result.details.timestamp).toLocaleString('pt-BR')}`, 'info');
                }
            } else {
                throw new Error('Falha no envio do e-mail');
            }
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Erro no teste');
        }
        
    } catch (error) {
        adminErrorLog('❌ Erro no teste Brevo:', error);
        showNotification(`Erro no teste: ${error.message}`, 'error');
    } finally {
        // Restaurar botão
        const button = event.target;
        button.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Testar';
        button.disabled = false;
    }
}



// 📥 Função para carregar configuração Brevo
async function loadBrevoConfig() {
    try {
        const response = await fetch(`${window.ADMIN_CONFIG.API_URL}/email-config/admin/brevo`, {
            headers: {
                'Authorization': `Bearer ${getAdminToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            // Verificar se é configuração direta ou objeto com config
            if (data.apiKey) {
                // Configuração direta
                brevoConfig = data;
                document.getElementById('brevoApiKey').value = brevoConfig.apiKey || '';
                updateBrevoStatus(brevoConfig.enabled ? 'active' : 'inactive');
                adminSuccessLog('✅ Configuração Brevo carregada');
            } else if (data.config) {
                // Objeto com config
                brevoConfig = data.config;
                document.getElementById('brevoApiKey').value = brevoConfig.apiKey || '';
                updateBrevoStatus(brevoConfig.enabled ? 'active' : 'inactive');
                adminSuccessLog('✅ Configuração Brevo carregada');
            } else {
                updateBrevoStatus('not-configured');
            }
        } else {
            updateBrevoStatus('not-configured');
        }
        
    } catch (error) {
        adminErrorLog('❌ Erro ao carregar configuração Brevo:', error);
        updateBrevoStatus('error');
    }
}

// 📥 Função para carregar todas as configurações
async function loadAllConfigs() {
    await loadBrevoConfig();
}



// 🔄 Função para atualizar status Brevo
function updateBrevoStatus(status) {
    const statusElement = document.getElementById('brevo-status');
    const icon = statusElement.querySelector('i');
    
    statusElement.className = 'px-3 py-1 rounded-full text-xs font-medium';
    
    switch (status) {
        case 'active':
            statusElement.classList.add('bg-green-600', 'text-green-100');
            icon.className = 'fas fa-circle mr-1';
            statusElement.innerHTML = '<i class="fas fa-circle mr-1"></i>Ativo';
            break;
        case 'inactive':
            statusElement.classList.add('bg-yellow-600', 'text-yellow-100');
            icon.className = 'fas fa-circle mr-1';
            statusElement.innerHTML = '<i class="fas fa-circle mr-1"></i>Inativo';
            break;
        case 'error':
            statusElement.classList.add('bg-red-600', 'text-red-100');
            icon.className = 'fas fa-exclamation-triangle mr-1';
            statusElement.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i>Erro';
            break;
        default:
            statusElement.classList.add('bg-gray-600', 'text-gray-300');
            icon.className = 'fas fa-circle mr-1';
            statusElement.innerHTML = '<i class="fas fa-circle mr-1"></i>Não configurado';
    }
}

// 🔐 Função para obter token do admin
function getAdminToken() {
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
}

// 📢 Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // Definir cores baseadas no tipo
    switch (type) {
        case 'success':
            notification.classList.add('bg-green-600', 'text-white');
            notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
            break;
        case 'error':
            notification.classList.add('bg-red-600', 'text-white');
            notification.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${message}`;
            break;
        case 'warning':
            notification.classList.add('bg-yellow-600', 'text-white');
            notification.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i>${message}`;
            break;
        default:
            notification.classList.add('bg-blue-600', 'text-white');
            notification.innerHTML = `<i class="fas fa-info-circle mr-2"></i>${message}`;
    }
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// 🚪 Função de logout
function handleLogout() {
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminToken');
    window.location.href = 'login.html';
} 