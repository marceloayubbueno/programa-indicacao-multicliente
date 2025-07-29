// 🎯 EDITAR LISTA - VERSÃO SIMPLIFICADA E OTIMIZADA
// ===================================================

// 🌐 CONFIGURAÇÃO CORRIGIDA
function getApiUrl() {
    return window.API_URL ||
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL :
           'http://localhost:3000/api');
}

// 📊 ESTADO GLOBAL
let allParticipants = [];
let selectedParticipants = new Set();

// 🔔 SISTEMA DE NOTIFICAÇÕES MODERNO
function showNotification(message, type = 'info', duration = 4000) {
  const container = document.getElementById('notificationContainer');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `p-4 rounded-lg shadow-lg transform transition-all duration-300 max-w-sm ${getNotificationClasses(type)}`;
  
  const icon = getNotificationIcon(type);
  notification.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="flex-shrink-0">${icon}</div>
      <div class="flex-1">
        <p class="text-sm font-medium">${message}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 text-white/70 hover:text-white">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  // Animação de entrada
  notification.style.transform = 'translateX(100%)';
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);

  // Auto-remover
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, duration);
}

function getNotificationClasses(type) {
  const classes = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-600 text-white',
    info: 'bg-blue-600 text-white'
  };
  return classes[type] || classes.info;
}

function getNotificationIcon(type) {
  const icons = {
    success: '<i class="fas fa-check-circle text-green-200"></i>',
    error: '<i class="fas fa-exclamation-circle text-red-200"></i>',
    warning: '<i class="fas fa-exclamation-triangle text-yellow-200"></i>',
    info: '<i class="fas fa-info-circle text-blue-200"></i>'
  };
  return icons[type] || icons.info;
}

// 🚀 INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
  setupPageTitle();
  loadAllParticipants();
  setupEventListeners();
});

function setupPageTitle() {
  const title = document.getElementById('pageTitle');
  if (title) {
    title.textContent = window.location.search.includes('id=') ? 'Editar Lista' : 'Nova Lista';
  }
}

// 👥 CARREGAR PARTICIPANTES CADASTRADOS
async function loadAllParticipants() {
  const token = localStorage.getItem('clientToken');
  const clientId = localStorage.getItem('clientId');
  
  if (!token || !clientId) {
    showNotification('Erro de autenticação. Faça login novamente.', 'error');
    return;
  }

  try {
    const response = await fetch(`${getApiUrl()}/participants?clientId=${clientId}&limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar participantes');
    }

    const data = await response.json();
    allParticipants = (data.participants || []).map(p => ({
      ...p,
      id: p._id || p.id
    }));

    if (allParticipants.length === 0) {
      showNotification('Nenhum participante cadastrado encontrado.', 'info');
    } else {
      showNotification(`${allParticipants.length} participantes disponíveis para seleção.`, 'success', 2000);
    }
  } catch (error) {
    console.error('Erro ao carregar participantes:', error);
    showNotification('Erro ao carregar participantes cadastrados.', 'error');
    allParticipants = [];
  }
}

// 🎯 CONFIGURAR EVENT LISTENERS
function setupEventListeners() {
  // 🔍 BUSCA DE PARTICIPANTES
  setupParticipantSearch();
  
  // 📁 UPLOAD DE ARQUIVO
  setupFileUpload();
  
  // 📋 COLAR DADOS
  setupPasteData();
  
  // 📝 SUBMIT DO FORMULÁRIO
  setupFormSubmit();
}

// 🔍 BUSCA DE PARTICIPANTES CADASTRADOS
function setupParticipantSearch() {
  const searchInput = document.getElementById('participantSearch');
  const suggestions = document.getElementById('autocompleteSuggestions');
  
  if (!searchInput || !suggestions) return;

  searchInput.addEventListener('input', function() {
    const search = this.value.trim().toLowerCase();
    
    if (!search) {
      suggestions.classList.add('hidden');
      return;
    }

    const filtered = allParticipants.filter(p =>
      !selectedParticipants.has(p.id) &&
      (p.name?.toLowerCase().includes(search) || p.email?.toLowerCase().includes(search))
    ).slice(0, 8);

    if (filtered.length === 0) {
      suggestions.classList.add('hidden');
      return;
    }

    suggestions.innerHTML = filtered.map(p => `
      <div class="px-4 py-2 cursor-pointer hover:bg-gray-700 border-b border-gray-600 last:border-b-0" data-id="${p.id}">
        <div class="font-medium text-white">${p.name}</div>
        <div class="text-xs text-gray-400">${p.email}</div>
      </div>
    `).join('');
    
    suggestions.classList.remove('hidden');
  });

  // Seleção por clique
  suggestions.addEventListener('click', function(e) {
    const item = e.target.closest('[data-id]');
    if (!item) return;

    const id = item.getAttribute('data-id');
    selectedParticipants.add(id);
    searchInput.value = '';
    suggestions.classList.add('hidden');
    
    updateSelectedParticipants();
    showNotification('Participante adicionado à lista!', 'success', 2000);
  });

  // Fechar sugestões ao clicar fora
  document.addEventListener('click', function(e) {
    if (!suggestions.contains(e.target) && e.target !== searchInput) {
      suggestions.classList.add('hidden');
    }
  });
}

// 📁 UPLOAD DE ARQUIVO
function setupFileUpload() {
  const fileInput = document.getElementById('importFile');
  const fileName = document.getElementById('fileName');
  
  if (!fileInput || !fileName) return;

  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    if (!file) {
      fileName.textContent = 'Nenhum arquivo selecionado';
      return;
    }

    fileName.textContent = file.name;
    processFile(file);
  });
}

// 🔄 PROCESSAR ARQUIVO
async function processFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  
  if (!['csv', 'xlsx', 'xls'].includes(ext)) {
    showNotification('Formato não suportado. Use CSV ou Excel.', 'error');
    return;
  }

  showNotification('Processando arquivo...', 'info', 2000);

  try {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      let imported = [];
      
      try {
        if (ext === 'csv') {
          imported = parseCSV(e.target.result);
        } else {
          imported = parseExcel(e.target.result);
        }
        
        processImportedData(imported, 'arquivo');
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        showNotification('Erro ao processar arquivo: ' + error.message, 'error');
      }
    };
    
    if (ext === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  } catch (error) {
    console.error('Erro ao ler arquivo:', error);
    showNotification('Erro ao ler arquivo.', 'error');
  }
}

// 📋 COLAR DADOS DO EXCEL
function setupPasteData() {
  const btnPaste = document.getElementById('btnPasteImport');
  const pasteArea = document.getElementById('pasteArea');
  
  if (!btnPaste || !pasteArea) return;

  btnPaste.addEventListener('click', function() {
    const raw = pasteArea.value.trim();
    
    if (!raw) {
      showNotification('Cole os dados do Excel na área de texto.', 'warning');
      return;
    }

    try {
      const imported = parsePastedData(raw);
      processImportedData(imported, 'dados colados');
      pasteArea.value = '';
    } catch (error) {
      console.error('Erro ao processar dados colados:', error);
      showNotification('Erro ao processar dados: ' + error.message, 'error');
    }
  });
}

// 🔄 PROCESSAR DADOS IMPORTADOS
function processImportedData(imported, source) {
  if (imported.length === 0) {
    showNotification('Nenhum participante válido encontrado.', 'warning');
    updateImportPreview('Nenhum dado válido encontrado. Verifique o formato:', []);
    return;
  }

  // Verificar duplicados
  const existingEmails = new Set(allParticipants.map(p => p.email.toLowerCase()));
  const newParticipants = imported.filter(p => !existingEmails.has(p.email.toLowerCase()));
  const duplicates = imported.length - newParticipants.length;

  // Adicionar novos participantes temporários
  newParticipants.forEach(p => {
    const id = 'tmp_' + Math.random().toString(36).substr(2, 9);
    const participant = { ...p, id };
    allParticipants.push(participant);
    selectedParticipants.add(id);
  });

  // Selecionar duplicados existentes
  imported.forEach(p => {
    const existing = allParticipants.find(ap => ap.email.toLowerCase() === p.email.toLowerCase());
    if (existing && !existing.id.startsWith('tmp_')) {
      selectedParticipants.add(existing._id || existing.id);
    }
  });

  updateSelectedParticipants();
  updateImportPreview('Dados processados com sucesso:', imported);
  
  let message = `${imported.length} participantes de ${source} processados!`;
  if (duplicates > 0) {
    message += ` (${duplicates} já existiam)`;
  }
  
  showNotification(message, 'success');
}

// 📊 ATUALIZAR PREVIEW DE IMPORTAÇÃO
function updateImportPreview(title, data) {
  const preview = document.getElementById('importPreview');
  if (!preview) return;

  if (data.length === 0) {
    preview.innerHTML = `
      <div class="p-3 bg-red-600/20 border border-red-600 rounded-lg">
        <p class="text-red-400 font-medium mb-2">${title}</p>
        <p class="text-sm text-red-300">Formato esperado: Nome, Email, Telefone (separados por tab ou vírgula)</p>
      </div>
    `;
    return;
  }

  preview.innerHTML = `
    <div class="p-3 bg-green-600/20 border border-green-600 rounded-lg">
      <p class="text-green-400 font-medium mb-2">${title}</p>
      <div class="text-sm text-green-300">
        <p class="mb-2">Participantes encontrados: <strong>${data.length}</strong></p>
        <div class="max-h-32 overflow-y-auto">
          ${data.slice(0, 5).map(p => `
            <div class="flex justify-between py-1 border-b border-green-600/30 last:border-b-0">
              <span>${p.name}</span>
              <span class="text-green-400">${p.email}</span>
            </div>
          `).join('')}
          ${data.length > 5 ? `<p class="text-center text-green-400 py-1">... e mais ${data.length - 5}</p>` : ''}
        </div>
      </div>
    </div>
  `;
}

// 👥 ATUALIZAR PARTICIPANTES SELECIONADOS
function updateSelectedParticipants() {
  const container = document.getElementById('selectedParticipantsContainer');
  if (!container) return;

  if (selectedParticipants.size === 0) {
    container.innerHTML = '<span class="text-gray-400 text-sm">Nenhum participante selecionado</span>';
    return;
  }

  const selected = allParticipants.filter(p => selectedParticipants.has(p._id || p.id));
  
  container.innerHTML = `
    <div class="space-y-2">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-yellow-400">${selected.length} participante(s) selecionado(s)</span>
        <button type="button" onclick="clearAllParticipants()" class="text-xs text-red-400 hover:text-red-300">
          <i class="fas fa-trash mr-1"></i>Limpar todos
        </button>
      </div>
      <div class="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
        ${selected.map(p => `
          <span class="inline-flex items-center gap-2 bg-blue-600 text-white rounded-lg px-3 py-1 text-sm">
            <span class="font-medium">${p.name}</span>
            <span class="text-blue-200">(${p.email})</span>
            <button type="button" onclick="removeParticipant('${p._id || p.id}')" class="text-blue-200 hover:text-white">
              <i class="fas fa-times"></i>
            </button>
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

// 🗑️ REMOVER PARTICIPANTE
window.removeParticipant = function(id) {
  selectedParticipants.delete(id);
  updateSelectedParticipants();
  showNotification('Participante removido da lista.', 'info', 2000);
};

// 🗑️ LIMPAR TODOS OS PARTICIPANTES
window.clearAllParticipants = function() {
  selectedParticipants.clear();
  updateSelectedParticipants();
  showNotification('Todos os participantes foram removidos.', 'info', 2000);
};

// 📝 SUBMIT DO FORMULÁRIO
function setupFormSubmit() {
  const form = document.getElementById('listForm');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('listName').value.trim(),
      description: document.getElementById('listDescription').value.trim(),
      tipo: document.getElementById('listTipo').value,
      status: 'active',
      clientId: localStorage.getItem('clientId')
    };

    // Validações
    if (!formData.name || !formData.tipo) {
      showNotification('Preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    if (selectedParticipants.size === 0) {
      showNotification('Selecione pelo menos um participante para a lista.', 'warning');
      return;
    }

    try {
      await createList(formData);
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      showNotification('Erro ao criar lista: ' + error.message, 'error');
    }
  });
}

// 🎯 CRIAR LISTA
async function createList(formData) {
  const token = localStorage.getItem('clientToken');
  
  if (!token) {
    showNotification('Erro de autenticação. Faça login novamente.', 'error');
    return;
  }

  // 🔍 H2 - DIAGNÓSTICO: Início da criação de lista
  console.log('🔍 H2 - EDITAR-LISTA CRIACAO INICIADA:', {
    step: 'CREATE_LIST_START',
    formData: formData,
    selectedParticipantsCount: selectedParticipants.size,
    timestamp: new Date().toISOString()
  });

  showNotification('Criando lista...', 'info', 2000);

  // Separar participantes novos dos existentes
  const selectedArray = Array.from(selectedParticipants);
  const newParticipants = allParticipants.filter(p => 
    selectedArray.includes(p.id) && p.id.startsWith('tmp_')
  );
  const existingParticipants = allParticipants.filter(p => 
    selectedArray.includes(p._id || p.id) && !(p.id && p.id.startsWith('tmp_'))
  );

  // 🔍 H2 - DIAGNÓSTICO: Separação de participantes
  console.log('🔍 H2 - SEPARACAO PARTICIPANTES:', {
    newParticipantsCount: newParticipants.length,
    existingParticipantsCount: existingParticipants.length,
    totalSelected: selectedArray.length,
    newParticipants: newParticipants.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email
    })),
    existingParticipants: existingParticipants.map(p => ({
      id: p._id || p.id,
      name: p.name,
      email: p.email
    })),
    timestamp: new Date().toISOString()
  });

  // 🚀 CORREÇÃO DEFINITIVA: INVERTER FLUXO - CRIAR LISTA PRIMEIRO
  
  // 1. PRIMEIRO: Criar lista (vazia inicialmente)
  console.log('🔍 H2 - NOVO FLUXO: CRIAR LISTA PRIMEIRO:', {
    step: 'CREATE_LIST_FIRST',
    listName: formData.name,
    listTipo: formData.tipo,
    existingParticipantsCount: existingParticipants.length,
    newParticipantsCount: newParticipants.length,
    strategy: 'CREATE_EMPTY_LIST_THEN_IMPORT_WITH_LISTID',
    timestamp: new Date().toISOString()
  });

  const initialListPayload = {
    ...formData,
    participants: existingParticipants.map(p => p._id || p.id) // Apenas existentes primeiro
  };

  const listResponse = await fetch(`${getApiUrl()}/participant-lists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(initialListPayload)
  });

  if (!listResponse.ok) {
    const errorData = await listResponse.json();
    console.log('🔍 H2 - ERRO CRIAR LISTA PRIMEIRO:', {
      status: listResponse.status,
      error: errorData,
      timestamp: new Date().toISOString()
    });
    throw new Error(errorData.message || 'Erro ao criar lista');
  }

  const createdList = await listResponse.json();
  const listId = createdList._id || createdList.id;

  console.log('🔍 H2 - LISTA CRIADA PRIMEIRO - SUCESSO:', {
    listId: listId,
    listName: createdList.name,
    existingParticipantsAssociated: existingParticipants.length,
    step: 'LIST_CREATED_FIRST',
    timestamp: new Date().toISOString()
  });

  // 2. SEGUNDO: Importar novos participantes COM listId
  let newParticipantIds = [];
  if (newParticipants.length > 0) {
    console.log('🔍 H3 - NOVO FLUXO: IMPORT COM LISTID:', {
      listId: listId,
      endpoint: '/participants/import',
      newParticipantsCount: newParticipants.length,
      willCreateOrphans: false, // ✅ CORREÇÃO: COM LISTID
      listIdProvided: true, // ✅ CORREÇÃO APLICADA
      step: 'IMPORT_WITH_LISTID',
      timestamp: new Date().toISOString()
    });

    try {
      const participantsWithRequiredFields = newParticipants.map(p => ({
        name: p.name,
        email: p.email,
        phone: p.phone,
        clientId: formData.clientId,
        tipo: formData.tipo || 'participante',
        status: 'ativo'
      }));

      const response = await fetch(`${getApiUrl()}/participants/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          clientId: formData.clientId, 
          participants: participantsWithRequiredFields,
          listId: listId // ✅ CORREÇÃO: LISTID FORNECIDO!
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao importar novos participantes');
      }

      const data = await response.json();
      
      console.log('🔍 H3 - IMPORT COM LISTID - SUCESSO:', {
        status: response.status,
        participantsCreated: data.participantsCreated || 0,
        duplicatesFound: data.duplicatesFound || 0,
        totalProcessed: data.totalProcessed || 0,
        listAssociated: data.listAssociated || false,
        autoSyncApplied: data.autoSyncApplied || false,
        orphansCreated: false, // ✅ CORREÇÃO: SEM ÓRFÃOS
        associatedToList: listId,
        data: data,
        timestamp: new Date().toISOString()
      });

      newParticipantIds = (data.participants || []).map(p => p._id);
      
      showNotification(`${newParticipants.length} novos participantes importados e associados à lista!`, 'success', 2000);
    } catch (error) {
      throw new Error('Falha ao importar participantes: ' + error.message);
    }
  }

  // 3. RESULTADO FINAL
  const allParticipantIds = [
    ...existingParticipants.map(p => p._id || p.id),
    ...newParticipantIds
  ];

  console.log('🔍 H2 - FLUXO CORRIGIDO FINALIZADO:', {
    step: 'CORRECTED_FLOW_COMPLETED',
    listId: listId,
    listName: createdList.name,
    totalParticipants: allParticipantIds.length,
    existingParticipants: existingParticipants.length,
    newParticipants: newParticipantIds.length,
    orphansPrevented: true, // ✅ CORREÇÃO APLICADA
    autoFixAvoided: true, // ✅ CORREÇÃO APLICADA  
    timestamp: new Date().toISOString()
  });

  // 🔍 H2 - DIAGNÓSTICO: Lista criada com sucesso (fluxo corrigido)
  console.log('🔍 H2 - LISTA CRIADA COM SUCESSO:', {
    step: 'LIST_CREATED_SUCCESS',
    listId: createdList._id || createdList.id,
    listName: createdList.name,
    participantsAssociated: allParticipantIds.length,
    responseData: createdList,
    timestamp: new Date().toISOString()
  });

  // 🔍 H3 - DIAGNÓSTICO: Redirecionamento
  console.log('🔍 H3 - REDIRECIONAMENTO EDITAR-LISTA:', {
    currentPage: 'editar-lista.html',
    willRedirectTo: 'participants.html',
    redirectDelay: 1500,
    redirectMethod: 'window.location.href',
    timestamp: new Date().toISOString()
  });

  showNotification('Lista criada com sucesso!', 'success');
  setTimeout(() => {
    console.log('🔍 H3 - REDIRECIONAMENTO EXECUTADO:', {
      action: 'REDIRECT_EXECUTED',
      targetPage: 'participants.html',
      timestamp: new Date().toISOString()
    });
    window.location.href = 'participants.html';
  }, 1500);
}

// 🔧 FUNÇÕES DE PARSING
function parseCSV(data) {
  const lines = data.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) throw new Error('Arquivo CSV deve ter pelo menos 2 linhas (cabeçalho + dados)');

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const nameIdx = findColumnIndex(headers, ['name', 'nome']);
  const emailIdx = findColumnIndex(headers, ['email', 'e-mail']);
  const phoneIdx = findColumnIndex(headers, ['phone', 'telefone', 'fone']);

  if (nameIdx === -1 || emailIdx === -1 || phoneIdx === -1) {
    throw new Error('Colunas obrigatórias não encontradas: Nome, Email, Telefone');
  }

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
    return {
      name: values[nameIdx] || '',
      email: values[emailIdx] || '',
      phone: values[phoneIdx] || ''
    };
  }).filter(p => p.name && p.email && p.phone && isValidEmail(p.email));
}

function parseExcel(data) {
  if (typeof XLSX === 'undefined') {
    throw new Error('Biblioteca Excel não carregada');
  }

  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

  if (jsonData.length === 0) {
    throw new Error('Planilha vazia ou sem dados válidos');
  }

  const headers = Object.keys(jsonData[0]).map(h => h.toLowerCase());
  
  return jsonData.map(row => {
    const name = findFieldValue(row, ['name', 'nome']);
    const email = findFieldValue(row, ['email', 'e-mail']);
    const phone = findFieldValue(row, ['phone', 'telefone', 'fone']);
    
    return { name, email, phone };
  }).filter(p => p.name && p.email && p.phone && isValidEmail(p.email));
}

function parsePastedData(raw) {
  const lines = raw.split(/\r?\n/).filter(l => l.trim() !== '');
  
  if (lines.length === 0) {
    throw new Error('Nenhum dado encontrado');
  }

  return lines.map(line => {
    const cols = line.includes('\t') ? line.split('\t') : line.split(',');
    const name = (cols[0] || '').trim();
    const email = (cols[1] || '').trim();
    const phone = (cols[2] || '').trim();
    
    return { name, email, phone };
  }).filter(p => p.name && p.email && p.phone && isValidEmail(p.email));
}

// 🔧 FUNÇÕES AUXILIARES
function findColumnIndex(headers, possibleNames) {
  return headers.findIndex(h => possibleNames.some(name => h.includes(name)));
}

function findFieldValue(row, possibleKeys) {
  for (const key of Object.keys(row)) {
    if (possibleKeys.some(pk => key.toLowerCase().includes(pk))) {
      return row[key] || '';
    }
  }
  return '';
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 🔐 AUTENTICAÇÃO - Usar função do auth.js
// function checkAuth() já existe em auth.js

// ⚡ INICIALIZAR AUTENTICAÇÃO - será feita pelo auth.js automaticamente
// checkAuth() será chamado automaticamente pelo auth.js 