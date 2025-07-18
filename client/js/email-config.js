// Configuração de E-mail
let currentConfig = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 [EMAIL-CONFIG] Inicializando página de configuração de e-mail');
  loadCurrentConfig();
  setupFormHandlers();
});

// Carregar configuração atual
async function loadCurrentConfig() {
  try {
    const token = localStorage.getItem('clientToken');
    if (!token) {
      console.error('❌ [EMAIL-CONFIG] Token não encontrado');
      return;
    }

    const response = await fetch(`${getApiUrl()}/email-templates/config/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.config) {
        currentConfig = data.config;
        populateForm(data.config);
        showConfigStatus(data.config);
      }
    } else if (response.status === 404) {
      console.log('📝 [EMAIL-CONFIG] Nenhuma configuração encontrada');
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ [EMAIL-CONFIG] Erro ao carregar configuração:', error);
    showNotification('Erro ao carregar configuração de e-mail', 'error');
  }
}

// Preencher formulário com dados existentes
function populateForm(config) {
  document.getElementById('smtpHost').value = config.smtpHost || '';
  document.getElementById('smtpPort').value = config.smtpPort || 587;
  document.getElementById('smtpUser').value = config.smtpUser || '';
  document.getElementById('smtpPassword').value = config.smtpPassword || '';
  document.getElementById('fromEmail').value = config.fromEmail || '';
  document.getElementById('fromName').value = config.fromName || '';
  document.getElementById('isSecure').checked = config.isSecure || false;
  document.getElementById('status').checked = config.status === 'active';
  document.getElementById('replyTo').value = config.replyTo || '';
}

// Configurar handlers do formulário
function setupFormHandlers() {
  const form = document.getElementById('emailConfigForm');
  form.addEventListener('submit', handleSubmit);
}

// Handler de submit do formulário
async function handleSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const configData = {
    smtpHost: formData.get('smtpHost'),
    smtpPort: parseInt(formData.get('smtpPort')),
    smtpUser: formData.get('smtpUser'),
    smtpPassword: formData.get('smtpPassword'),
    fromEmail: formData.get('fromEmail'),
    fromName: formData.get('fromName'),
    isSecure: formData.get('isSecure') === 'on',
    status: formData.get('status') === 'on' ? 'active' : 'inactive',
    replyTo: formData.get('replyTo') || undefined
  };

  try {
    const token = localStorage.getItem('clientToken');
    if (!token) {
      showNotification('Token não encontrado', 'error');
      return;
    }

    const url = currentConfig 
      ? `${getApiUrl()}/email-templates/config/me`
      : `${getApiUrl()}/email-templates/config`;
    
    const method = currentConfig ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(configData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    currentConfig = data;
    
    showNotification('Configuração salva com sucesso!', 'success');
    showConfigStatus(data);
    
  } catch (error) {
    console.error('❌ [EMAIL-CONFIG] Erro ao salvar configuração:', error);
    showNotification('Erro ao salvar configuração: ' + error.message, 'error');
  }
}

// Testar configuração
async function testConfig() {
  const testEmail = prompt('Digite um e-mail para testar a configuração:');
  if (!testEmail) return;

  try {
    const token = localStorage.getItem('clientToken');
    if (!token) {
      showNotification('Token não encontrado', 'error');
      return;
    }

    // Primeiro salvar a configuração atual
    const form = document.getElementById('emailConfigForm');
    const formData = new FormData(form);
    const configData = {
      smtpHost: formData.get('smtpHost'),
      smtpPort: parseInt(formData.get('smtpPort')),
      smtpUser: formData.get('smtpUser'),
      smtpPassword: formData.get('smtpPassword'),
      fromEmail: formData.get('fromEmail'),
      fromName: formData.get('fromName'),
      isSecure: formData.get('isSecure') === 'on',
      status: 'active',
      replyTo: formData.get('replyTo') || undefined
    };

    // Salvar configuração
    const saveResponse = await fetch(`${getApiUrl()}/email-templates/config/me`, {
      method: currentConfig ? 'PATCH' : 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(configData)
    });

    if (!saveResponse.ok) {
      throw new Error('Erro ao salvar configuração para teste');
    }

    // Testar configuração
    const testResponse = await fetch(`${getApiUrl()}/email-templates/config/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ testEmail })
    });

    if (!testResponse.ok) {
      throw new Error(`HTTP error! status: ${testResponse.status}`);
    }

    const result = await testResponse.json();
    
    if (result.success) {
      showNotification('Teste realizado com sucesso! Verifique seu e-mail.', 'success');
      showTestResult(true, 'Teste realizado com sucesso');
    } else {
      showNotification('Erro no teste: ' + result.message, 'error');
      showTestResult(false, result.message);
    }

  } catch (error) {
    console.error('❌ [EMAIL-CONFIG] Erro no teste:', error);
    showNotification('Erro no teste: ' + error.message, 'error');
    showTestResult(false, error.message);
  }
}

// Mostrar resultado do teste
function showTestResult(success, message) {
  const testResult = document.getElementById('testResult');
  testResult.className = success ? 'text-green-400' : 'text-red-400';
  testResult.innerHTML = `
    <i class="fas ${success ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
    ${message}
  `;
  testResult.classList.remove('hidden');
  
  setTimeout(() => {
    testResult.classList.add('hidden');
  }, 5000);
}

// Mostrar status da configuração
function showConfigStatus(config) {
  const statusDiv = document.getElementById('configStatus');
  const lastTestDate = document.getElementById('lastTestDate');
  const testStatus = document.getElementById('testStatus');
  const emailsSent = document.getElementById('emailsSent');

  if (config.lastTestAt) {
    lastTestDate.textContent = new Date(config.lastTestAt).toLocaleString('pt-BR');
  } else {
    lastTestDate.textContent = 'Nunca testado';
  }

  if (config.testSuccess) {
    testStatus.textContent = 'Sucesso';
    testStatus.className = 'text-green-400 ml-2';
  } else {
    testStatus.textContent = 'Falha';
    testStatus.className = 'text-red-400 ml-2';
  }

  emailsSent.textContent = config.emailsSent || 0;

  statusDiv.classList.remove('hidden');
}

// Limpar formulário
function resetForm() {
  if (confirm('Tem certeza que deseja limpar o formulário?')) {
    document.getElementById('emailConfigForm').reset();
    document.getElementById('smtpPort').value = '587';
    document.getElementById('isSecure').checked = false;
    document.getElementById('status').checked = true;
  }
}

// Toggle password visibility
function togglePassword() {
  const passwordInput = document.getElementById('smtpPassword');
  const passwordIcon = document.getElementById('passwordIcon');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    passwordIcon.className = 'fas fa-eye-slash';
  } else {
    passwordInput.type = 'password';
    passwordIcon.className = 'fas fa-eye';
  }
}

// Toggle Engagement Menu
function toggleEngagementMenu() {
  const menu = document.getElementById('engagementMenu');
  const arrow = document.getElementById('engagementArrow');
  menu.classList.toggle('hidden');
  if (menu.classList.contains('hidden')) {
    arrow.style.transform = 'rotate(0deg)';
  } else {
    arrow.style.transform = 'rotate(90deg)';
  }
}

// Sistema de notificações
function showNotification(message, type = 'info') {
  console.log(`📢 [EMAIL-CONFIG] ${type.toUpperCase()}: ${message}`);
  
  // Criar notificação
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
  
  const bgColor = type === 'success' ? 'bg-green-600' : 
                  type === 'error' ? 'bg-red-600' : 
                  type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600';
  
  notification.className += ` ${bgColor} text-white`;
  
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                      type === 'error' ? 'fa-exclamation-circle' : 
                      type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} mr-2"></i>
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
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
      if (notification.parentElement) {
        notification.remove();
      }
    }, 300);
  }, 5000);
} 