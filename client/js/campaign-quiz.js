// 🔧 CORREÇÃO: Função para obter API_URL de forma segura
function getApiUrl() {
    return window.API_URL || 
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
           (window.location.hostname === 'localhost' ? 
            'http://localhost:3000/api' : 
            'https://programa-indicacao-multicliente-production.up.railway.app/api'));
}

let currentStep = 0;
let selectedCampaignType = null;
let selectedSourceType = null;

const totalSteps = 6; // 0 a 6

// --- Recompensas ---
// Variáveis para armazenar IDs das recompensas selecionadas
let selectedRewardOnReferral = null;
let selectedRewardOnConversion = null;

function showStep(step) {
  console.log('🔍 H4 - showStep chamado:', step, 'selectedSourceType:', selectedSourceType);
  
  // Oculta todas as etapas
  const steps = document.querySelectorAll('.quiz-step');
  steps.forEach((el) => (el.style.display = 'none'));

  // Lógica condicional para step 3
  if (step === 3) {
    if (selectedSourceType === 'lp') {
      document.getElementById('step3-lp').style.display = 'block';
    } else if (selectedSourceType === 'list') {
      document.getElementById('step3-lista').style.display = 'block';
    }
  } else {
    // Mostra a etapa normal
    const stepId = step === 0 ? 'step0' : step === 1 ? 'step1' : step === 2 ? 'step2' : step === 4 ? 'step4' : step === 5 ? 'step5' : step === 6 ? 'step6' : '';
    if (stepId) {
      const el = document.getElementById(stepId);
      if (el) el.style.display = 'block';
    }
  }

  // Atualiza barra de progresso
  const progressPercents = [0, 16.6, 33.2, 49.8, 66.4, 83, 100];
  document.getElementById('progressBar').style.width = progressPercents[step] + '%';

  // Botões
  document.getElementById('prevButton').style.display = step > 0 ? '' : 'none';
  document.getElementById('nextButton').style.display = step <= totalSteps ? '' : 'none';
  const nextBtn = document.getElementById('nextButton');
  if (step === totalSteps) {
    nextBtn.textContent = 'Finalizar';
    nextBtn.onclick = salvarCampanhaBackend;
  } else {
    nextBtn.textContent = 'Próxima';
    nextBtn.onclick = nextStep;
  }

  // Se for etapa de LP de Indicadores
  if (step === 3 && selectedSourceType === 'lp') {
    renderLPIndicadoresModelos();
  }
  // Se for etapa de LP de Divulgação
  if (step === 4) {
    renderLPDivulgacaoModelos();
  }

  if (step === 3 && selectedSourceType === 'list') {
    console.log('🔍 H3 - Entrando no step 3 com sourceType = list');
    renderListasParticipantes();
    setupUploadLista();
    validarListaSelecionada();
  }

  if (step === 5) {
    renderRewards();
  }

  if (step === 6) {
    renderResumoCampanha();
  }
}

function nextStep() {
  // Validação por etapa
  if (currentStep === 0) {
    if (!selectedCampaignType) {
      alert('Selecione o tipo de campanha.');
      return;
    }
    if (selectedCampaignType === 'online') {
      alert('O fluxo de Link de Compartilhamento (Conversão Online) estará disponível em breve!');
      return;
    }
  }
  if (currentStep === 1) {
    const name = document.getElementById('campaignName').value.trim();
    if (!name) {
      alert('Informe o nome da campanha.');
      return;
    }
  }
  if (currentStep === 2) {
    if (!selectedSourceType) {
      alert('Selecione a fonte dos indicadores.');
      return;
    }
  }
  // Step 3: validação pode ser feita nas subetapas
  if (currentStep < totalSteps) {
    // Se estamos no step 2 e indo para 3, mostrar subetapa correta
    if (currentStep === 2) {
      currentStep = 3;
      showStep(currentStep);
      return;
    }
    // Se estamos no step 3, ir para 4
    if (currentStep === 3) {
      currentStep = 4;
      showStep(currentStep);
      return;
    }
    currentStep++;
    showStep(currentStep);
  }
}

function previousStep() {
  if (currentStep > 0) {
    // Se estamos em step 4 vindo de uma subetapa 3, voltar para step 3 correto
    if (currentStep === 4 && (selectedSourceType === 'lp' || selectedSourceType === 'list')) {
      currentStep = 3;
      showStep(currentStep);
      return;
    }
    // Se estamos em step 3, voltar para 2
    if (currentStep === 3) {
      currentStep = 2;
      showStep(currentStep);
      return;
    }
    currentStep--;
    showStep(currentStep);
  }
}

function selectCampaignType(type) {
  selectedCampaignType = type;
  document.getElementById('cardOffline').classList.toggle('ring-2', type === 'offline');
  document.getElementById('cardOffline').classList.toggle('ring-blue-500', type === 'offline');
  document.getElementById('cardOnline').classList.toggle('ring-2', type === 'online');
  document.getElementById('cardOnline').classList.toggle('ring-yellow-500', type === 'online');
}

function selectSourceType(type) {
  selectedSourceType = type;
  document.getElementById('cardList').classList.toggle('ring-2', type === 'list');
  document.getElementById('cardList').classList.toggle('ring-blue-500', type === 'list');
  document.getElementById('cardLP').classList.toggle('ring-2', type === 'lp');
  document.getElementById('cardLP').classList.toggle('ring-green-500', type === 'lp');
}

// Busca LPs reais do backend para o usuário logado
async function fetchLPIndicadoresBackend() {
  const clientId = localStorage.getItem('clientId');
  const token = localStorage.getItem('clientToken');
  if (!clientId || !token) return [];
  try {
    const response = await fetch(`${getApiUrl()}/lp-indicadores?clientId=${clientId}` , {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Erro ao buscar LPs');
    const data = await response.json();
    return data.data || [];
  } catch (err) {
    return [];
  }
}

// Função utilitária para criar um preview visual seguro da LP
function createLPPreviewIframe(lp) {
  if (!lp?.compiledOutput?.html) {
    return '<div class="w-full h-32 flex items-center justify-center text-gray-500 bg-gray-800 rounded">Sem preview</div>';
  }
  // Cria um iframe sandboxed com o HTML salvo
  const html = lp.compiledOutput.html;
  const css = lp.compiledOutput.css || '';
  // Gera um blob para evitar problemas de CORS
  const blob = new Blob([
    `<html><head><style>body{margin:0;padding:0;box-sizing:border-box;}${css}</style></head><body>${html}</body></html>`
  ], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  // Iframe limitado em altura, sem borda, com sandbox
  return `<iframe src="${url}" sandbox="allow-scripts allow-same-origin" style="width:100%;height:300px;max-height:300px;border:none;overflow:hidden;background:#181C23;border-radius:8px;"></iframe>`;
}

// Renderiza a etapa de modelos de LP de Indicadores (agora integrado ao backend)
async function renderLPIndicadoresModelos() {
  const container = document.getElementById('lpIndicadoresModelos');
  container.innerHTML = '<div class="text-gray-400">Carregando modelos...</div>';
  const allLps = await fetchLPIndicadoresBackend();
  
  // Filtrar LPs que NÃO têm campanha (somente templates/modelos disponíveis)
  const lps = allLps.filter(lp => !lp.campaignId && !lp.campaignName);
  
  window.lpIndicadoresModelos = lps; // Salva os dados globalmente
  container.innerHTML = '';
  if (lps.length) {
    lps.forEach(lp => {
      const card = document.createElement('div');
      card.className = 'rounded-xl p-6 bg-gray-900 border border-blue-800 shadow flex flex-col items-start mb-4';
      card.innerHTML = `
        <div class="w-full flex items-center justify-between mb-2">
          <span class="text-blue-400 font-bold text-lg">${lp.name || 'LP sem nome'}</span>
          <div class="flex gap-2">
            <button class="px-3 py-1 rounded bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors" onclick="editarLPIndicadoresBackend('${lp._id}')"><i class='fas fa-pen mr-1'></i>Editar</button>
            <button class="px-3 py-1 rounded bg-gray-700 text-gray-200 text-xs font-semibold hover:bg-gray-800 transition-colors" onclick="visualizarLPIndicadoresBackend('${lp._id}')"><i class='fas fa-eye mr-1'></i>Visualizar</button>
          </div>
        </div>
        <div class="w-full rounded mb-2" style="min-height:60px;max-height:300px;overflow:hidden;">${createLPPreviewIframe(lp)}</div>
        <span class="text-xs text-gray-400">${lp.status === 'published' ? 'Publicado' : 'Rascunho'} | Criada em: ${lp.createdAt ? new Date(lp.createdAt).toLocaleString('pt-BR') : '-'}</span>
        <button class="mt-4 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition-colors w-full" onclick="selecionarLPIndicadores('${lp._id}')">Selecionar este modelo</button>
      `;
      if (window.selectedLPIndicadoresId === lp._id) {
        card.classList.add('ring-2', 'ring-green-500');
      }
      container.appendChild(card);
    });
  } else {
    const message = allLps.length > 0 ? 
      'Todas as LPs de Indicadores já estão vinculadas a campanhas.<br>Crie uma nova LP para usar como modelo.' :
      'Nenhuma LP de Indicadores encontrada.<br>Crie sua LP agora para usar nesta campanha!';
    
    container.innerHTML = `
      <div class="rounded-xl p-8 bg-gray-800 text-center text-gray-400 flex flex-col items-center justify-center">
        <i class="fas fa-clipboard-list text-4xl mb-4 text-gray-600"></i>
        <p class="mb-4">${message}</p>
        <button class="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors" onclick="criarLPIndicadoresBackend()"><i class='fas fa-plus mr-2'></i>Criar/Editar LP</button>
      </div>
    `;
  }
}

// Selecionar LP para a campanha
window.selectedLPIndicadoresId = null;
window.selecionarLPIndicadores = function(id) {
  window.selectedLPIndicadoresId = id;
  renderLPIndicadoresModelos();
};

// Editar LP existente
window.editarLPIndicadoresBackend = function(id) {
  window.open(`lp-editor-grapes.html?id=${id}`, '_blank');
};
// Visualizar LP existente
window.visualizarLPIndicadoresBackend = function(id) {
  window.open(`lp-preview.html?id=${id}`, '_blank');
};
// Criar nova LP
window.criarLPIndicadoresBackend = function() {
  window.open('lp-editor-grapes.html', '_blank');
};

// Busca LPs de divulgação do backend para o usuário logado
async function fetchLPDivulgacaoBackend() {
  const clientId = localStorage.getItem('clientId');
  const token = localStorage.getItem('clientToken');
  if (!clientId || !token) return [];
  try {
    const response = await fetch(`${getApiUrl()}/lp-divulgacao?clientId=${clientId}` , {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Erro ao buscar LPs de divulgação');
    const data = await response.json();
    return data.data || [];
  } catch (err) {
    return [];
  }
}

// Renderiza a etapa de modelos de LP de Divulgação (integrado ao backend)
async function renderLPDivulgacaoModelos() {
  const container = document.getElementById('lpDivulgacaoModelos');
  container.innerHTML = '<div class="text-gray-400">Carregando modelos...</div>';
  const allLps = await fetchLPDivulgacaoBackend();
  
  // Filtrar LPs que NÃO têm campanha (somente templates/modelos disponíveis)
  const lps = allLps.filter(lp => !lp.campaignId && !lp.campaignName);
  
  window.lpDivulgacaoModelos = lps; // Salva os dados globalmente
  container.innerHTML = '';
  if (lps.length) {
    lps.forEach(lp => {
      const card = document.createElement('div');
      card.className = 'rounded-xl p-6 bg-gray-900 border border-blue-800 shadow flex flex-col items-start mb-4';
      card.innerHTML = `
        <div class="w-full flex items-center justify-between mb-2">
          <span class="text-blue-400 font-bold text-lg">${lp.name || 'LP sem nome'}</span>
          <div class="flex gap-2">
            <button class="px-3 py-1 rounded bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors" onclick="editarLPDivulgacaoBackend('${lp._id}')"><i class='fas fa-pen mr-1'></i>Editar</button>
            <button class="px-3 py-1 rounded bg-gray-700 text-gray-200 text-xs font-semibold hover:bg-gray-800 transition-colors" onclick="visualizarLPDivulgacaoBackend('${lp._id}')"><i class='fas fa-eye mr-1'></i>Visualizar</button>
          </div>
        </div>
        <div class="w-full rounded mb-2" style="min-height:60px;max-height:300px;overflow:hidden;">${createLPPreviewIframe(lp)}</div>
        <span class="text-xs text-gray-400">${lp.status === 'published' ? 'Publicado' : 'Rascunho'} | Criada em: ${lp.createdAt ? new Date(lp.createdAt).toLocaleString('pt-BR') : '-'}</span>
        <button class="mt-4 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition-colors w-full" onclick="selecionarLPDivulgacao('${lp._id}')">Selecionar este modelo</button>
      `;
      if (window.selectedLPDivulgacaoId === lp._id) {
        card.classList.add('ring-2', 'ring-green-500');
      }
      container.appendChild(card);
    });
  } else {
    const message = allLps.length > 0 ? 
      'Todas as LPs de Divulgação já estão vinculadas a campanhas.<br>Crie uma nova LP para usar como modelo.' :
      'Nenhuma LP de Divulgação encontrada.<br>Crie sua LP agora para usar nesta campanha!';
    
    container.innerHTML = `
      <div class="rounded-xl p-8 bg-gray-800 text-center text-gray-400 flex flex-col items-center justify-center">
        <i class="fas fa-bullhorn text-4xl mb-4 text-gray-600"></i>
        <p class="mb-4">${message}</p>
        <button class="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors" onclick="criarLPDivulgacaoBackend()"><i class='fas fa-plus mr-2'></i>Criar/Editar LP</button>
      </div>
    `;
  }
}

// Selecionar LP de Divulgação para a campanha
window.selectedLPDivulgacaoId = null;
window.selecionarLPDivulgacao = function(id) {
  window.selectedLPDivulgacaoId = id;
  renderLPDivulgacaoModelos();
};

// Editar LP de Divulgação existente
window.editarLPDivulgacaoBackend = function(id) {
  window.open(`lp-editor-grapes-divulgacao.html?id=${id}`, '_blank');
};
// Visualizar LP de Divulgação existente
window.visualizarLPDivulgacaoBackend = function(id) {
          window.open('lp-preview-divulgacao.html?id=' + id, '_blank');
};
// Criar nova LP de Divulgação
window.criarLPDivulgacaoBackend = function() {
  window.open('lp-editor-grapes-divulgacao.html', '_blank');
};

// --- Seleção, Criação e Upload de Listas de Participantes ---

let listasParticipantes = [];
let selectedListaId = null;

async function fetchListasParticipantes() {
  const clientId = localStorage.getItem('clientId');
  const token = localStorage.getItem('clientToken');
  
  // 🔍 H1 - LOG DE DEPURAÇÃO
  console.log('🔍 H1 - fetchListasParticipantes iniciada');
  console.log('🔍 H1 - clientId:', clientId);
  console.log('🔍 H1 - token presente:', !!token);
  
  if (!clientId || !token) {
    console.log('🔍 H1 - ERRO: clientId ou token ausente');
    return [];
  }
  
  try {
    const url = `${getApiUrl()}/participant-lists?clientId=${clientId}`;
    console.log('🔍 H1 - URL da requisição:', url);
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('🔍 H1 - Status da resposta:', response.status);
    
    if (!response.ok) {
      console.error('🔍 H1 - ERRO: Resposta não ok:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log('🔍 H1 - Dados brutos do backend:', data);
    
    let listas = [];
    if (Array.isArray(data)) {
      listas = data;
    } else if (Array.isArray(data.data)) {
      listas = data.data;
    }
    
    console.log('🔍 H1 - Total de listas encontradas:', listas.length);
    
    // 🔍 DIAGNÓSTICO DETALHADO - vamos ver EXATAMENTE o que vem do backend
    listas.forEach((lista, index) => {
      console.log(`🔍 H1 - LISTA ${index + 1} COMPLETA:`, lista);
      console.log(`🔍 H1 - LISTA ${index + 1} CAMPOS:`, {
        _id: lista._id,
        name: lista.name,
        tipo: lista.tipo,
        type: lista.type, // Pode ter mudado para 'type'
        participants: lista.participants,
        participantIds: lista.participantIds, // Pode ter mudado o nome
        participantCount: lista.participantCount,
        allKeys: Object.keys(lista)
      });
    });
    
    // 🔍 DIAGNÓSTICO: Vamos ver cada condição separadamente
    listas.forEach((lista, index) => {
      const tipoOk = lista.tipo === 'participante';
      const isArray = Array.isArray(lista.participants);
      const hasLength = lista.participants && lista.participants.length > 0;
      
      console.log(`🔍 H1 - LISTA ${index + 1} FILTRO:`, {
        name: lista.name,
        tipoValue: lista.tipo,
        tipoOk: tipoOk,
        participantsIsArray: isArray,
        participantsLength: lista.participants?.length || 0,
        hasLength: hasLength,
        passaFiltro: tipoOk && isArray && hasLength
      });
      
      // 🚨 PROBLEMA IDENTIFICADO: Lista vazia quando deveria ter participantes
      if (tipoOk && isArray && !hasLength) {
        console.error(`🚨 PROBLEMA: Lista "${lista.name}" tem tipo correto mas está VAZIA!`);
        console.error('🚨 Isso indica problema na sincronização lista ↔ participantes no backend');
        console.error('🚨 Lista ID:', lista._id, 'Client ID:', lista.clientId);
      }
    });
    
    // 🚨 SOLUÇÃO TEMPORÁRIA: Aceitar listas vazias do tipo "participante"
    // Isso permite que listas criadas mas ainda não populadas apareçam no quiz
    const filtradas = listas.filter(l => l.tipo === 'participante');
    console.log('🔍 H1 - Listas após filtro (apenas tipo participante):', filtradas.length);
    console.log('🔍 H1 - SOLUÇÃO TEMPORÁRIA: Aceitando listas vazias para investigar problema backend');
    
    return filtradas;
  } catch (err) {
    console.error('🔍 H1 - ERRO na requisição:', err);
    return [];
  }
}

function renderListasParticipantes() {
  const container = document.getElementById('listasParticipantes');
  container.innerHTML = '<div class="text-gray-400">Carregando listas...</div>';
  fetchListasParticipantes().then(async listas => {
    window.listasParticipantes = listas; // Salva os dados globalmente
    
    console.log('🔍 H2 - renderListasParticipantes - Total de listas:', listas.length);
    
    if (!listas.length) {
      container.innerHTML = '<div class="text-gray-400">Nenhuma lista de participantes com participantes ativos encontrada. Crie uma nova lista abaixo.</div>';
      return;
    }
    container.innerHTML = '';
    for (const lista of listas) {
      // Mostra loading enquanto busca a contagem
      const card = document.createElement('div');
      card.className = 'rounded-lg p-4 mb-2 bg-gray-800 border flex items-center justify-between cursor-pointer ' + (selectedListaId === lista._id ? 'border-green-500 ring-2' : 'border-gray-700');
      card.onclick = () => selecionarListaParticipantes(lista._id);
      card.innerHTML = `
        <div>
          <span class="font-bold text-blue-300">${lista.name}</span>
          <span class="ml-2 text-xs text-gray-400" id="count-${lista._id}">(carregando...)</span>
        </div>
        <div class="text-xs text-gray-400">${lista.createdAt ? new Date(lista.createdAt).toLocaleDateString('pt-BR') : ''}</div>
      `;
      container.appendChild(card);
      // Busca a contagem real via API
      try {
        const clientId = localStorage.getItem('clientId');
        const token = localStorage.getItem('clientToken');
        const resp = await fetch(`${getApiUrl()}/participant-lists/${lista._id}/participants/count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        const count = data.count ?? 0;
        const countText = count === 0 ? 
          '⚠️ (VAZIA - problema backend)' : 
          `(${count} participante${count !== 1 ? 's' : ''})`;
        document.getElementById(`count-${lista._id}`).textContent = countText;
        
        console.log(`🔍 H2 - Lista "${lista.name}": ${count} participantes`);
        
        if (count === 0) {
          console.warn(`⚠️ Lista "${lista.name}" está vazia - pode indicar problema na sincronização backend`);
        }
      } catch (err) {
        console.error(`🔍 H2 - ERRO ao carregar contagem da lista ${lista.name}:`, err);
        document.getElementById(`count-${lista._id}`).textContent = '(erro ao carregar)';
      }
    }
  });
}

function selecionarListaParticipantes(id) {
  selectedListaId = id;
  renderListasParticipantes();
  validarListaSelecionada();
}

function validarListaSelecionada() {
  const nextBtn = document.getElementById('nextButton');
  if (selectedListaId) {
    nextBtn.disabled = false;
    nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  } else {
    nextBtn.disabled = true;
    nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }
}

window.criarNovaLista = async function() {
  const nome = document.getElementById('novaListaNome').value.trim();
  if (!nome) {
    alert('Informe o nome da nova lista.');
    return;
  }
  const clientId = localStorage.getItem('clientId');
  const token = localStorage.getItem('clientToken');
  try {
    const response = await fetch(`${getApiUrl()}/participant-lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: nome, clientId, tipo: 'participante' })
    });
    if (!response.ok) throw new Error('Erro ao criar lista');
    document.getElementById('novaListaNome').value = '';
    renderListasParticipantes();
  } catch (err) {
    alert('Erro ao criar lista: ' + err.message);
  }
};

// --- Upload de Lista (CSV) ---
function setupUploadLista() {
  const container = document.getElementById('listasParticipantes');
  let uploadBtn = document.getElementById('uploadListaBtn');
  if (!uploadBtn) {
    uploadBtn = document.createElement('button');
    uploadBtn.id = 'uploadListaBtn';
    uploadBtn.className = 'ml-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors';
    uploadBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Subir Lista (CSV)';
    uploadBtn.onclick = () => document.getElementById('inputUploadLista').click();
    container.parentElement.insertBefore(uploadBtn, container.nextSibling);
    // Input file oculto
    let input = document.getElementById('inputUploadLista');
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.id = 'inputUploadLista';
      input.style.display = 'none';
      input.onchange = handleUploadLista;
      container.parentElement.appendChild(input);
    }
  }
}

// --- Ajuste do input de upload para múltiplos formatos ---
document.addEventListener('DOMContentLoaded', function() {
  const uploadBtn = document.getElementById('uploadListaBtn');
  const inputUpload = document.getElementById('inputUploadLista');
  if (uploadBtn && inputUpload) {
    uploadBtn.onclick = () => inputUpload.click();
    inputUpload.onchange = handleUploadLista;
  }
});

async function handleUploadLista(e) {
  const file = e.target.files[0];
  if (!file) return;
  const clientId = localStorage.getItem('clientId');
  const token = localStorage.getItem('clientToken');
  const statusDiv = document.getElementById('uploadListaStatus');
  statusDiv.textContent = 'Processando arquivo...';
  let participants = [];
  try {
    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const idxName = header.indexOf('name');
      const idxEmail = header.indexOf('email');
      const idxPhone = header.indexOf('phone');
      if (idxName === -1 || idxEmail === -1 || idxPhone === -1) throw new Error('CSV deve conter as colunas: name, email, phone');
      participants = lines.slice(1).map(line => {
        const cols = line.split(',');
        return {
          name: cols[idxName]?.trim(),
          email: cols[idxEmail]?.trim(),
          phone: cols[idxPhone]?.trim(),
          tipo: 'participante'
        };
      }).filter(p => p.name && p.email && p.phone);
    } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const header = json[0].map(h => h.toString().trim().toLowerCase());
      const idxName = header.indexOf('name');
      const idxEmail = header.indexOf('email');
      const idxPhone = header.indexOf('phone');
      if (idxName === -1 || idxEmail === -1 || idxPhone === -1) throw new Error('Excel deve conter as colunas: name, email, phone');
      participants = json.slice(1).map(row => ({
        name: row[idxName]?.toString().trim(),
        email: row[idxEmail]?.toString().trim(),
        phone: row[idxPhone]?.toString().trim(),
        tipo: 'participante'
      })).filter(p => p.name && p.email && p.phone);
    } else {
      throw new Error('Formato de arquivo não suportado. Use CSV, XLS ou XLSX.');
    }
    if (!participants.length) throw new Error('Nenhum participante válido encontrado no arquivo.');
    const listaName = prompt('Nome da nova lista para este upload:');
    if (!listaName) return;
    // 1. Cria lista
    const resLista = await fetch(`${getApiUrl()}/participant-lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: listaName, clientId, tipo: 'participante' })
    });
    if (!resLista.ok) throw new Error('Erro ao criar lista');
    const lista = await resLista.json();
    // 2. Importa participantes
    const resImport = await fetch(`${getApiUrl()}/participants/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ clientId, participants })
    });
    if (!resImport.ok) throw new Error('Erro ao importar participantes');
    const importData = await resImport.json();
    // 3. Associa participantes à lista
    const participantIds = (importData.data || []).map(p => p._id);
    if (participantIds.length) {
      await fetch(`${getApiUrl()}/participant-lists/${lista.data._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ participants: participantIds })
      });
    }
    statusDiv.textContent = 'Lista importada com sucesso!';
    renderListasParticipantes();
    selectedListaId = lista.data._id;
    validarListaSelecionada();
  } catch (err) {
    statusDiv.textContent = 'Erro: ' + err.message;
  }
}

// --- Criação manual de lista ---
window.abrirCriacaoManualLista = function() {
  const container = document.getElementById('criacaoManualListaContainer');
  container.style.display = 'block';
  container.innerHTML = `
    <div class="mb-2 flex gap-2">
      <input type="text" id="manualNome" placeholder="Nome" class="rounded bg-gray-800 border border-gray-600 px-2 py-1 text-gray-100" />
      <input type="email" id="manualEmail" placeholder="E-mail" class="rounded bg-gray-800 border border-gray-600 px-2 py-1 text-gray-100" />
      <input type="text" id="manualPhone" placeholder="Telefone" class="rounded bg-gray-800 border border-gray-600 px-2 py-1 text-gray-100" />
      <button class="px-2 py-1 bg-blue-600 text-white rounded" onclick="adicionarContatoManual()">Adicionar</button>
    </div>
    <table class="w-full text-sm mb-2"><thead><tr><th>Nome</th><th>Email</th><th>Telefone</th><th></th></tr></thead><tbody id="manualContatos"></tbody></table>
    <button class="px-4 py-2 rounded bg-green-600 text-white font-semibold" onclick="salvarListaManual()">Salvar Lista</button>
    <div id="manualListaStatus" class="text-xs text-gray-400 mt-2"></div>
  `;
  window.manualContatos = [];
  renderManualContatos();
};

window.adicionarContatoManual = function() {
  const nome = document.getElementById('manualNome').value.trim();
  const email = document.getElementById('manualEmail').value.trim();
  const phone = document.getElementById('manualPhone').value.trim();
  if (!nome || !email || !phone) return;
  window.manualContatos.push({ name: nome, email, phone, tipo: 'participante' });
  document.getElementById('manualNome').value = '';
  document.getElementById('manualEmail').value = '';
  document.getElementById('manualPhone').value = '';
  renderManualContatos();
};

window.removerContatoManual = function(idx) {
  window.manualContatos.splice(idx, 1);
  renderManualContatos();
};

function renderManualContatos() {
  const tbody = document.getElementById('manualContatos');
  if (!tbody) return;
  tbody.innerHTML = '';
  (window.manualContatos || []).forEach((c, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.name}</td><td>${c.email}</td><td>${c.phone}</td><td><button onclick="removerContatoManual(${i})" class="text-red-400">Remover</button></td>`;
    tbody.appendChild(tr);
  });
}

window.salvarListaManual = async function() {
  const nome = document.getElementById('novaListaNome').value.trim() || prompt('Nome da nova lista:');
  const contatos = window.manualContatos || [];
  const clientId = localStorage.getItem('clientId');
  const token = localStorage.getItem('clientToken');
  const statusDiv = document.getElementById('manualListaStatus');
  if (!nome || !contatos.length) {
    statusDiv.textContent = 'Preencha o nome e adicione pelo menos um contato.';
    return;
  }
  try {
    // 1. Cria lista
    const resLista = await fetch(`${getApiUrl()}/participant-lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: nome, clientId, tipo: 'participante' })
    });
    if (!resLista.ok) throw new Error('Erro ao criar lista');
    const lista = await resLista.json();
    // 2. Importa participantes
    const resImport = await fetch(`${getApiUrl()}/participants/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ clientId, participants: contatos })
    });
    if (!resImport.ok) throw new Error('Erro ao importar participantes');
    const importData = await resImport.json();
    // 3. Associa participantes à lista
    const participantIds = (importData.data || []).map(p => p._id);
    if (participantIds.length) {
      await fetch(`${getApiUrl()}/participant-lists/${lista.data._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ participants: participantIds })
      });
    }
    statusDiv.textContent = 'Lista criada com sucesso!';
    renderListasParticipantes();
    selectedListaId = lista.data._id;
    validarListaSelecionada();
    document.getElementById('criacaoManualListaContainer').style.display = 'none';
  } catch (err) {
    statusDiv.textContent = 'Erro: ' + err.message;
  }
}

// Busca recompensas do backend para o usuário logado
async function fetchRewardsBackend() {
  const clientId = localStorage.getItem('clientId');
  const token = localStorage.getItem('clientToken');
  if (!clientId || !token) {
    return [];
  }
  try {
    const response = await fetch(`${getApiUrl()}/rewards?clientId=${clientId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta:', errorText);
      throw new Error('Erro ao buscar recompensas');
    }
    const data = await response.json();
    return data.data || [];
  } catch (err) {
    console.error('Erro ao buscar recompensas:', err);
    return [];
  }
}

// Renderiza as recompensas para cada bloco
async function renderRewards() {
  const rewards = await fetchRewardsBackend();
  
  // Renderiza recompensas para indicação
  renderRewardsForBlock('rewardsOnReferral', rewards, selectedRewardOnReferral, 'referral');
  
  // Renderiza recompensas para conversão
  renderRewardsForBlock('rewardsOnConversion', rewards, selectedRewardOnConversion, 'conversion');
}

// Renderiza recompensas para um bloco específico
function renderRewardsForBlock(containerId, rewards, selectedId, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  // Filtrar recompensas que NÃO têm campanha (somente templates/modelos disponíveis)
  const availableRewards = rewards.filter(reward => 
    !reward.campaignId && !reward.campaignName
  );

  // Cria o select
  const select = document.createElement('select');
  select.className = 'w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-100 px-4 py-2 mb-2 focus:outline-none focus:border-blue-500';
  select.onchange = (e) => selecionarRecompensa(e.target.value, type);

  // Opção 'Nenhuma recompensa'
  const optionNone = document.createElement('option');
  optionNone.value = 'none';
  optionNone.textContent = 'Nenhuma recompensa';
  select.appendChild(optionNone);

  // Opções de recompensas (apenas as disponíveis)
  availableRewards.forEach(reward => {
    const option = document.createElement('option');
    option.value = reward._id;
    let valorFormatado = '';
    if (reward.type === 'DINHEIRO' || reward.type === 'pix') {
      valorFormatado = `R$ ${reward.value.toFixed(2)}`;
    } else if (reward.type === 'PONTOS' || reward.type === 'points') {
      valorFormatado = `${reward.value} pontos`;
    } else if (reward.type === 'VOUCHER' || reward.type === 'discount') {
      valorFormatado = `Voucher de R$ ${reward.value.toFixed(2)}`;
    } else {
      valorFormatado = reward.value;
    }
    option.textContent = `${reward.type} ${valorFormatado} ${reward.description ? '- ' + reward.description : ''}`;
    if (selectedId === reward._id) option.selected = true;
    select.appendChild(option);
  });

  // Seleciona 'nenhuma' se for o caso
  if (!selectedId || selectedId === 'none') select.value = 'none';

  container.appendChild(select);

  // Feedback visual
  if (availableRewards.length === 0) {
    const noRewardsIndicator = document.createElement('div');
    noRewardsIndicator.className = 'text-yellow-400 mb-2 text-xs';
    noRewardsIndicator.innerHTML = 'Nenhuma recompensa-modelo disponível. Todas as recompensas já estão vinculadas a campanhas. <a href="rewards.html" target="_blank" class="text-blue-400 underline">Criar nova recompensa</a>';
    container.appendChild(noRewardsIndicator);
  } else if (select.value === 'none') {
    const noneIndicator = document.createElement('div');
    noneIndicator.className = 'text-gray-400 mb-2 text-xs';
    noneIndicator.innerHTML = 'Nenhuma recompensa selecionada para este momento.';
    container.appendChild(noneIndicator);
  }
}

// Seleciona uma recompensa para um tipo específico
function selecionarRecompensa(id, type) {
  if (type === 'referral') {
    selectedRewardOnReferral = id;
  } else if (type === 'conversion') {
    selectedRewardOnConversion = id;
  }
  renderRewards();
}

// Seleciona "nenhuma recompensa" para um tipo específico
window.selecionarNenhumaRecompensa = function(type) {
  selecionarRecompensa('none', type);
};

// Cria nova recompensa (abre modal ou redireciona)
window.criarNovaRecompensa = function(type) {
  // Salva o tipo de recompensa sendo criado para usar após retorno
  localStorage.setItem('creatingRewardFor', type);
  
  // Abre página de criação de recompensa em nova aba
  window.open('rewards-form.html', '_blank');
};

// Inicialização
window.onload = function() {
  console.log('🔍 H5 - window.onload executado, currentStep:', currentStep);
  showStep(currentStep);
};

window.nextStep = nextStep;
window.previousStep = previousStep;
window.selectCampaignType = selectCampaignType;
window.selectSourceType = selectSourceType;

async function renderResumoCampanha() {
  const container = document.getElementById('summaryStepContent');
  if (!container) return;

  // Nome e descrição
  const nome = document.getElementById('campaignName')?.value || '-';
  const descricao = document.getElementById('campaignDescription')?.value || '-';
  const dataInicio = document.getElementById('campaignStartDate')?.value || '-';
  const dataFim = document.getElementById('campaignEndDate')?.value || '-';

  // Tipo de campanha
  const tipoCampanha = selectedCampaignType === 'offline' ? 'LP de Divulgação' : selectedCampaignType === 'online' ? 'Link de Compartilhamento' : '-';
  const fonteIndicadores = selectedSourceType === 'lp' ? 'LP de Indicadores' : selectedSourceType === 'list' ? 'Lista de Participantes' : '-';

  // LPs selecionadas
  let lpIndicadores = '-';
  if (window.selectedLPIndicadoresId && window.lpIndicadoresModelos) {
    const lp = window.lpIndicadoresModelos.find(lp => lp._id === window.selectedLPIndicadoresId);
    lpIndicadores = lp ? lp.name : '-';
  }
  let lpDivulgacao = '-';
  if (window.selectedLPDivulgacaoId && window.lpDivulgacaoModelos) {
    const lp = window.lpDivulgacaoModelos.find(lp => lp._id === window.selectedLPDivulgacaoId);
    lpDivulgacao = lp ? lp.name : '-';
  }

  // Lista de participantes
  let listaParticipantes = '-';
  if (selectedListaId && window.listasParticipantes) {
    const lista = window.listasParticipantes.find(l => l._id === selectedListaId);
    listaParticipantes = lista ? lista.name : '-';
  }

  // Recompensas selecionadas
  let recompensaIndicacao = 'Nenhuma';
  let recompensaConversao = 'Nenhuma';
  const rewards = await fetchRewardsBackend();
  if (selectedRewardOnReferral && selectedRewardOnReferral !== 'none') {
    const r = rewards.find(r => r._id === selectedRewardOnReferral);
    recompensaIndicacao = r ? `${r.type} - ${r.value}` : 'Nenhuma';
  }
  if (selectedRewardOnConversion && selectedRewardOnConversion !== 'none') {
    const r = rewards.find(r => r._id === selectedRewardOnConversion);
    recompensaConversao = r ? `${r.type} - ${r.value}` : 'Nenhuma';
  }

  container.innerHTML = `
    <div class="mb-4">
      <h3 class="text-lg font-bold text-blue-400 mb-2">Resumo da Campanha</h3>
      <div class="mb-2 flex items-center justify-between"><span><span class="font-semibold">Nome:</span> ${nome}</span><button class="text-xs text-blue-400 underline" onclick="window.irParaEtapa(1)">Editar</button></div>
      <div class="mb-2 flex items-center justify-between"><span><span class="font-semibold">Descrição:</span> ${descricao}</span><button class="text-xs text-blue-400 underline" onclick="window.irParaEtapa(1)">Editar</button></div>
      <div class="mb-2 flex items-center justify-between"><span><span class="font-semibold">Período:</span> ${dataInicio} até ${dataFim}</span><button class="text-xs text-blue-400 underline" onclick="window.irParaEtapa(1)">Editar</button></div>
      <div class="mb-2 flex items-center justify-between"><span><span class="font-semibold">Tipo de Campanha:</span> ${tipoCampanha}</span><button class="text-xs text-blue-400 underline" onclick="window.irParaEtapa(0)">Editar</button></div>
      <div class="mb-2 flex items-center justify-between"><span><span class="font-semibold">Fonte dos Indicadores:</span> ${fonteIndicadores}</span><button class="text-xs text-blue-400 underline" onclick="window.irParaEtapa(2)">Editar</button></div>
      <div class="mb-2 flex items-center justify-between"><span><span class="font-semibold">LP de Indicadores:</span> ${lpIndicadores}</span><button class="text-xs text-blue-400 underline" onclick="window.irParaEtapa(3)">Editar</button></div>
      <div class="mb-2 flex items-center justify-between"><span><span class="font-semibold">LP de Divulgação:</span> ${lpDivulgacao}</span><button class="text-xs text-blue-400 underline" onclick="window.irParaEtapa(4)">Editar</button></div>
      <div class="mb-2 flex items-center justify-between"><span><span class="font-semibold">Lista de Participantes:</span> ${listaParticipantes}</span><button class="text-xs text-blue-400 underline" onclick="window.irParaEtapa(3)">Editar</button></div>
      <div class="mb-2 flex items-center justify-between"><span><span class="font-semibold">Recompensa por Indicação:</span> ${recompensaIndicacao}</span><button class="text-xs text-blue-400 underline" onclick="window.irParaEtapa(5)">Editar</button></div>
      <div class="mb-2 flex items-center justify-between"><span><span class="font-semibold">Recompensa por Conversão:</span> ${recompensaConversao}</span><button class="text-xs text-blue-400 underline" onclick="window.irParaEtapa(5)">Editar</button></div>
    </div>
  `;
}

window.irParaEtapa = function(step) {
  currentStep = step;
  showStep(currentStep);
};

// === [INÍCIO] Função para salvar campanha no backend ===
async function salvarCampanhaBackend() {
  const token = localStorage.getItem('clientToken');
  const clientId = localStorage.getItem('clientId');
  if (!token || !clientId) {
    alert('Sessão expirada. Faça login novamente.');
                window.location.href = 'login.html';
    return;
  }

  // 🆕 NOVA LÓGICA: Montar payload conforme schema do backend
  let type = '-';
  if (typeof selectedSourceType !== 'undefined') {
    if (selectedSourceType === 'lp') {
      type = 'lp-indicadores'; // ✅ Tipo correto para criar lista automática
    } else if (selectedSourceType === 'list') {
      type = 'lista-participantes';
    }
  } else if (typeof selectedCampaignType !== 'undefined') {
    if (selectedCampaignType === 'offline') {
      type = 'lp-divulgacao';
    } else if (selectedCampaignType === 'online') {
      type = 'link-compartilhamento';
    }
  }

  const payload = {
    name: document.getElementById('campaignName')?.value.trim() || '',
    description: document.getElementById('campaignDescription')?.value.trim() || '',
    startDate: document.getElementById('campaignStartDate')?.value || null,
    endDate: document.getElementById('campaignEndDate')?.value || null,
    clientId: clientId,
    participantListId: selectedListaId || null,
    lpIndicadoresId: window.selectedLPIndicadoresId || null, // ✅ LP de indicadores vinculada
    lpDivulgacaoId: window.selectedLPDivulgacaoId || null,
    rewardOnReferral: selectedRewardOnReferral && selectedRewardOnReferral !== 'none' ? selectedRewardOnReferral : null,
    rewardOnConversion: selectedRewardOnConversion && selectedRewardOnConversion !== 'none' ? selectedRewardOnConversion : null,
    status: 'active',
    type: type
  };
  // Se for lista de participantes, envie também o campo selectedParticipantListId
  if (type === 'lista-participantes' && selectedListaId) {
    payload.selectedParticipantListId = selectedListaId;
  }
  
  // Adicionar campos de template baseados nas seleções atuais
  if (selectedRewardOnReferral && selectedRewardOnReferral !== 'none') {
    payload.rewardOnReferralTemplateId = selectedRewardOnReferral;
  }
  if (selectedRewardOnConversion && selectedRewardOnConversion !== 'none') {
    payload.rewardOnConversionTemplateId = selectedRewardOnConversion;
  }
  if (window.selectedLPIndicadoresId) {
    payload.lpIndicadoresTemplateId = window.selectedLPIndicadoresId;
  }
  if (window.selectedLPDivulgacaoId) {
    payload.lpDivulgacaoTemplateId = window.selectedLPDivulgacaoId;
  }

  // Validação mínima
  if (!payload.name || !payload.clientId) {
    alert('Nome da campanha e cliente são obrigatórios.');
    return;
  }

  // Feedback visual
  const finalizarBtn = document.getElementById('nextButton');
  if (finalizarBtn) {
    finalizarBtn.disabled = true;
    finalizarBtn.textContent = 'Salvando...';
  }

  try {
    const response = await fetch(`${getApiUrl()}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || !data) throw new Error(data.message || 'Erro ao salvar campanha');
    alert('Campanha criada com sucesso!');
                window.location.href = 'campaigns.html';
  } catch (err) {
    console.error('Erro ao salvar campanha:', err);
    alert('Erro ao salvar campanha: ' + err.message);
    if (finalizarBtn) {
      finalizarBtn.disabled = false;
      finalizarBtn.textContent = 'Finalizar';
    }
  }
}
// === [FIM] Função para salvar campanha no backend ===

// Handler do botão de próximo passo (será configurado dinamicamente em showStep)

// Handler global para o botão de finalizar do resumo
window.finalizarCampanha = function() {
  salvarCampanhaBackend();
} 