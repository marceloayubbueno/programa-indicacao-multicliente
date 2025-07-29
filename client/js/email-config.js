/**
 * 📧 EMAIL CONFIG - CONFIGURAÇÃO DE E-MAIL DO CLIENTE
 * Responsável por gerenciar a configuração SMTP do cliente
 * 
 * Funcionalidades:
 * - Salvar configuração SMTP
 * - Testar configuração
 * - Carregar configuração existente
 * - Validações em tempo real
 * - Histórico de testes
 */

// 🌐 Configurações globais
let currentConfig = null;
let testHistory = [];

// 📋 Inicialização
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 [EMAIL-CONFIG] Inicializando página de configuração de e-mail');
  
  // Carregar configurações
  loadCurrentConfig();
  loadClientInfo();
  setupFormHandlers();
  setupValidations();
  loadTestHistory();
  
  // Debug
  if (window.APP_CONFIG?.DEBUG_MODE) {
    console.log('🔧 [EMAIL-CONFIG] Modo debug ativo');
  }
});

// 👤 Carregar informações do cliente
async function loadClientInfo() {
  try {
    const token = localStorage.getItem('clientToken');
    if (!token) return;

    // Aqui você pode carregar o nome do cliente se houver endpoint
    const clientNameElement = document.getElementById('clientName');
    if (clientNameElement) {
      clientNameElement.textContent = 'Cliente'; // Placeholder
    }
  } catch (error) {
    console.error('❌ [EMAIL-CONFIG] Erro ao carregar info do cliente:', error);
  }
}

// 📥 Carregar configuração atual
async function loadCurrentConfig() {
  try {
    const token = localStorage.getItem('clientToken');
    if (!token) {
      console.error('❌ [EMAIL-CONFIG] Token não encontrado');
      updateStatusIndicator('not-configured', 'Token não encontrado');
      return;
    }

    showLoading('Carregando configuração...');

    const response = await fetch(`${getApiUrl()}/email-templates/config/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    hideLoading();

    if (response.ok) {
      const data = await response.json();
      if (data.config || data) {
        const config = data.config || data;
        currentConfig = config;
        populateForm(config);
        updateStatusIndicator('configured', 'Configuração ativa');
        console.log('✅ [EMAIL-CONFIG] Configuração carregada:', config);
      } else {
        updateStatusIndicator('not-configured', 'Não configurado');
      }
    } else if (response.status === 404) {
      console.log('📝 [EMAIL-CONFIG] Nenhuma configuração encontrada');
      updateStatusIndicator('not-configured', 'Não configurado');
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    hideLoading();
    console.error('❌ [EMAIL-CONFIG] Erro ao carregar configuração:', error);
    showNotification('Erro ao carregar configuração de e-mail', 'error');
    updateStatusIndicator('error', 'Erro ao carregar');
  }
}

// ✏️ Preencher formulário com dados existentes
function populateForm(config) {
  try {
    document.getElementById('smtpHost').value = config.smtpHost || '';
    document.getElementById('smtpPort').value = config.smtpPort || 587;
    document.getElementById('smtpUser').value = config.smtpUser || '';
    document.getElementById('smtpPassword').value = config.smtpPassword || '';
    document.getElementById('fromEmail').value = config.fromEmail || '';
    document.getElementById('fromName').value = config.fromName || '';
    document.getElementById('isSecure').checked = config.isSecure !== false; // Padrão true
    document.getElementById('status').checked = config.status === 'active';
    document.getElementById('replyTo').value = config.replyTo || '';

    console.log('✅ [EMAIL-CONFIG] Formulário preenchido com sucesso');
  } catch (error) {
    console.error('❌ [EMAIL-CONFIG] Erro ao preencher formulário:', error);
  }
}

// 🔧 Configurar handlers do formulário
function setupFormHandlers() {
  const form = document.getElementById('emailConfigForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  // Handler para mudanças em tempo real
  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', validateField);
    input.addEventListener('blur', validateField);
  });
}

// ✅ Configurar validações em tempo real
function setupValidations() {
  // Validação de e-mail
  const emailInputs = ['smtpUser', 'fromEmail', 'replyTo'];
  emailInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('input', () => validateEmail(input));
    }
  });

  // Validação de porta
  const portInput = document.getElementById('smtpPort');
  if (portInput) {
    portInput.addEventListener('input', () => validatePort(portInput));
  }
}

// 🔍 Validar campo individual
function validateField(event) {
  const field = event.target;
  const fieldName = field.name;

  // Remover classes de erro anteriores
  field.classList.remove('border-red-500', 'border-green-500');

  // Validações específicas
  switch (fieldName) {
    case 'smtpHost':
      if (field.value.trim()) {
        field.classList.add('border-green-500');
      }
      break;
    case 'smtpUser':
    case 'fromEmail':
      validateEmail(field);
      break;
    case 'smtpPort':
      validatePort(field);
      break;
  }
}

// 📧 Validar e-mail
function validateEmail(input) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(input.value);
  
  if (input.value === '' && input.id === 'replyTo') {
    // replyTo é opcional
    input.classList.remove('border-red-500', 'border-green-500');
  } else if (isValid) {
    input.classList.remove('border-red-500');
    input.classList.add('border-green-500');
  } else if (input.value) {
    input.classList.remove('border-green-500');
    input.classList.add('border-red-500');
  }
  
  return isValid;
}

// 🔌 Validar porta
function validatePort(input) {
  const port = parseInt(input.value);
  const isValid = port >= 1 && port <= 65535;
  
  if (isValid) {
    input.classList.remove('border-red-500');
    input.classList.add('border-green-500');
  } else if (input.value) {
    input.classList.remove('border-green-500');
    input.classList.add('border-red-500');
  }
  
  return isValid;
}

// 💾 Handler de submit do formulário
async function handleSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const configData = {
    smtpHost: formData.get('smtpHost')?.trim(),
    smtpPort: parseInt(formData.get('smtpPort')),
    smtpUser: formData.get('smtpUser')?.trim(),
    smtpPassword: formData.get('smtpPassword'),
    fromEmail: formData.get('fromEmail')?.trim(),
    fromName: formData.get('fromName')?.trim(),
    isSecure: formData.get('isSecure') === 'on',
    status: formData.get('status') === 'on' ? 'active' : 'inactive',
    replyTo: formData.get('replyTo')?.trim() || undefined
  };

  // Validar dados
  if (!validateConfigData(configData)) {
    return;
  }

  try {
    const token = localStorage.getItem('clientToken');
    if (!token) {
      showNotification('Token não encontrado. Faça login novamente.', 'error');
      return;
    }

    showLoading('Salvando configuração...');

    const url = `${getApiUrl()}/email-templates/config/me`;
    const method = currentConfig ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(configData)
    });

    hideLoading();

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    currentConfig = data;
    
    showNotification('Configuração salva com sucesso!', 'success');
    updateStatusIndicator('configured', 'Configuração ativa');
    
    console.log('✅ [EMAIL-CONFIG] Configuração salva:', data);
    
  } catch (error) {
    hideLoading();
    console.error('❌ [EMAIL-CONFIG] Erro ao salvar configuração:', error);
    showNotification('Erro ao salvar configuração: ' + error.message, 'error');
  }
}

// ✅ Validar dados de configuração
function validateConfigData(data) {
  const errors = [];

  if (!data.smtpHost) errors.push('Servidor SMTP é obrigatório');
  if (!data.smtpPort || data.smtpPort < 1 || data.smtpPort > 65535) errors.push('Porta SMTP inválida');
  if (!data.smtpUser) errors.push('E-mail é obrigatório');
  if (!data.smtpPassword) errors.push('Senha é obrigatória');
  if (!data.fromEmail) errors.push('E-mail remetente é obrigatório');
  if (!data.fromName) errors.push('Nome remetente é obrigatório');

  // Validar formato de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.smtpUser && !emailRegex.test(data.smtpUser)) {
    errors.push('Formato de e-mail inválido');
  }
  if (data.fromEmail && !emailRegex.test(data.fromEmail)) {
    errors.push('Formato de e-mail remetente inválido');
  }
  if (data.replyTo && !emailRegex.test(data.replyTo)) {
    errors.push('Formato de e-mail de resposta inválido');
  }

  if (errors.length > 0) {
    showNotification('Corrija os erros: ' + errors.join(', '), 'error');
    return false;
  }

  return true;
}

// 🧪 Testar configuração
async function testConfig() {
  const testEmail = prompt('Digite um e-mail para testar a configuração:');
  if (!testEmail) return;

  // Validar e-mail de teste
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(testEmail)) {
    showNotification('E-mail de teste inválido', 'error');
    return;
  }

  try {
    const token = localStorage.getItem('clientToken');
    if (!token) {
      showNotification('Token não encontrado', 'error');
      return;
    }

    // Primeiro salvar a configuração atual se houver mudanças
    const form = document.getElementById('emailConfigForm');
    const formData = new FormData(form);
    const configData = {
      smtpHost: formData.get('smtpHost')?.trim(),
      smtpPort: parseInt(formData.get('smtpPort')),
      smtpUser: formData.get('smtpUser')?.trim(),
      smtpPassword: formData.get('smtpPassword'),
      fromEmail: formData.get('fromEmail')?.trim(),
      fromName: formData.get('fromName')?.trim(),
      isSecure: formData.get('isSecure') === 'on',
      status: 'active', // Ativar para teste
      replyTo: formData.get('replyTo')?.trim() || undefined
    };

    if (!validateConfigData(configData)) {
      return;
    }

    showLoading('Testando configuração...');

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

    hideLoading();

    if (!testResponse.ok) {
      const errorData = await testResponse.json();
      throw new Error(errorData.message || `HTTP error! status: ${testResponse.status}`);
    }

    const result = await testResponse.json();
    
    // Adicionar ao histórico
    addTestToHistory({
      email: testEmail,
      success: result.success,
      message: result.message,
      timestamp: new Date()
    });

    if (result.success) {
      showNotification('Teste realizado com sucesso! Verifique seu e-mail.', 'success');
      showTestResult(true, 'Teste realizado com sucesso');
      updateStatusIndicator('configured', 'Configuração testada');
    } else {
      showNotification('Erro no teste: ' + result.message, 'error');
      showTestResult(false, result.message);
      updateStatusIndicator('error', 'Erro no teste');
    }

  } catch (error) {
    hideLoading();
    console.error('❌ [EMAIL-CONFIG] Erro no teste:', error);
    showNotification('Erro no teste: ' + error.message, 'error');
    showTestResult(false, error.message);
    updateStatusIndicator('error', 'Erro no teste');
  }
}

// 📊 Mostrar resultado do teste
function showTestResult(success, message) {
  const testResult = document.getElementById('testResult');
  if (!testResult) return;

  testResult.className = `flex items-center px-4 py-2 rounded-lg ${success ? 'bg-green-900/20 border border-green-500/30 text-green-400' : 'bg-red-900/20 border border-red-500/30 text-red-400'}`;
  testResult.innerHTML = `
    <i class="fas ${success ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
    <span class="text-sm">${message}</span>
  `;
  testResult.classList.remove('hidden');

  // Ocultar após 5 segundos
  setTimeout(() => {
    testResult.classList.add('hidden');
  }, 5000);
}

// 📈 Adicionar teste ao histórico
function addTestToHistory(testData) {
  testHistory.unshift(testData);
  
  // Manter apenas os últimos 10 testes
  if (testHistory.length > 10) {
    testHistory = testHistory.slice(0, 10);
  }
  
  // Salvar no localStorage
  localStorage.setItem('emailTestHistory', JSON.stringify(testHistory));
  
  // Atualizar UI
  updateTestHistoryUI();
}

// 📋 Carregar histórico de testes
function loadTestHistory() {
  try {
    const saved = localStorage.getItem('emailTestHistory');
    if (saved) {
      testHistory = JSON.parse(saved);
      updateTestHistoryUI();
    }
  } catch (error) {
    console.error('❌ [EMAIL-CONFIG] Erro ao carregar histórico:', error);
    testHistory = [];
  }
}

// 🎨 Atualizar UI do histórico de testes
function updateTestHistoryUI() {
  const historyContainer = document.getElementById('testHistory');
  if (!historyContainer) return;

  if (testHistory.length === 0) {
    historyContainer.innerHTML = `
      <div class="flex items-center justify-center py-8 text-gray-500">
        <i class="fas fa-clock mr-2"></i>
        Nenhum teste realizado ainda
      </div>
    `;
    return;
  }

  historyContainer.innerHTML = testHistory.map(test => `
    <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full ${test.success ? 'bg-green-400' : 'bg-red-400'}"></div>
        <div>
          <p class="text-sm text-gray-100">${test.email}</p>
          <p class="text-xs text-gray-400">${formatDate(test.timestamp)}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-sm ${test.success ? 'text-green-400' : 'text-red-400'}">
          ${test.success ? 'Sucesso' : 'Erro'}
        </p>
        <p class="text-xs text-gray-400">${test.message}</p>
      </div>
    </div>
  `).join('');
}

// 🗑️ Limpar histórico de testes
function clearTestHistory() {
  if (confirm('Tem certeza que deseja limpar o histórico de testes?')) {
    testHistory = [];
    localStorage.removeItem('emailTestHistory');
    updateTestHistoryUI();
    showNotification('Histórico limpo com sucesso', 'success');
  }
}

// 🔄 Limpar formulário
function resetForm() {
  if (confirm('Tem certeza que deseja limpar o formulário?')) {
    document.getElementById('emailConfigForm').reset();
    
    // Remover classes de validação
    const inputs = document.querySelectorAll('#emailConfigForm input');
    inputs.forEach(input => {
      input.classList.remove('border-red-500', 'border-green-500');
    });
    
    showNotification('Formulário limpo', 'info');
  }
}

// 👁️ Alternar visibilidade da senha
function togglePassword() {
  const input = document.getElementById('smtpPassword');
  const icon = document.getElementById('passwordIcon');
  
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

// 🔄 Atualizar indicador de status
function updateStatusIndicator(status, message) {
  const indicator = document.getElementById('statusIndicator');
  if (!indicator) return;

  // Remover classes anteriores
  indicator.className = 'px-3 py-1 rounded-full text-xs font-medium';
  
  switch (status) {
    case 'configured':
      indicator.classList.add('bg-green-900', 'text-green-400', 'border', 'border-green-500/30');
      indicator.innerHTML = '<i class="fas fa-check-circle mr-1"></i>' + message;
      break;
    case 'error':
      indicator.classList.add('bg-red-900', 'text-red-400', 'border', 'border-red-500/30');
      indicator.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i>' + message;
      break;
    default:
      indicator.classList.add('bg-gray-600', 'text-gray-300');
      indicator.innerHTML = '<i class="fas fa-circle mr-1"></i>' + message;
  }
}

// ⏳ Mostrar loading
function showLoading(message = 'Carregando...') {
  // Implementar se necessário
  console.log('⏳ [LOADING]', message);
}

// ✅ Ocultar loading
function hideLoading() {
  // Implementar se necessário
  console.log('✅ [LOADING] Ocultado');
}

// 📅 Formatar data
function formatDate(date) {
  if (typeof date === 'string') date = new Date(date);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 🔗 Obter URL da API
function getApiUrl() {
  return window.APP_CONFIG?.API_URL || 'http://localhost:3000/api';
}

// 🔔 Mostrar notificação
function showNotification(message, type = 'info') {
  const container = document.getElementById('notificationContainer') || document.body;
  
  const notification = document.createElement('div');
  notification.className = `max-w-sm w-full bg-gray-800 border rounded-lg shadow-lg p-4 mb-4 transition-opacity duration-300`;
  
  let bgColor, textColor, icon;
  switch (type) {
    case 'success':
      bgColor = 'border-green-500/30 bg-green-900/20';
      textColor = 'text-green-400';
      icon = 'fa-check-circle';
      break;
    case 'error':
      bgColor = 'border-red-500/30 bg-red-900/20';
      textColor = 'text-red-400';
      icon = 'fa-exclamation-circle';
      break;
    default:
      bgColor = 'border-blue-500/30 bg-blue-900/20';
      textColor = 'text-blue-400';
      icon = 'fa-info-circle';
  }
  
  notification.className += ` ${bgColor}`;
  
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${icon} ${textColor} mr-3"></i>
      <p class="text-gray-100 text-sm">${message}</p>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-gray-400 hover:text-gray-100">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  container.appendChild(notification);
  
  // Auto remove após 5 segundos
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// 🎯 Funções de menu (compatibilidade)
function toggleEngagementMenu() {
  const menu = document.getElementById('engagementMenu');
  const arrow = document.getElementById('engagementArrow');
  
  if (menu && arrow) {
    menu.classList.toggle('hidden');
    const isOpen = !menu.classList.contains('hidden');
    arrow.style.transform = `rotate(${isOpen ? 90 : 0}deg)`;
  }
}

function toggleFinanceMenu() {
  const menu = document.getElementById('financeMenu');
  const arrow = document.getElementById('financeArrow');
  
  if (menu && arrow) {
    menu.classList.toggle('hidden');
    const isOpen = !menu.classList.contains('hidden');
    arrow.style.transform = `rotate(${isOpen ? 90 : 0}deg)`;
  }
}

function logout() {
  if (confirm('Tem certeza que deseja sair?')) {
    localStorage.removeItem('clientToken');
    window.location.href = 'login.html';
  }
}

// 🎯 Debug helpers
if (window.APP_CONFIG?.DEBUG_MODE) {
  window.emailConfigDebug = {
    currentConfig,
    testHistory,
    loadCurrentConfig,
    testConfig,
    resetForm
  };
} 