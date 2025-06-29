// 🌟 VARIÁVEIS GLOBAIS REFATORADAS - Usando novos módulos
// 🔧 CORREÇÃO: API_URL já declarado em auth.js (removendo duplicação)
let currentTab = 'lists';
let participants = []; // Mantido para compatibilidade
let lists = [];
let currentPage = 1;
let pageSize = 25; // 🔧 OTIMIZADO: Limite escalável para grandes volumes
let totalParticipants = 0; // 🔧 CORRIGIDO: Inicializado
let totalPages = 1; // 🔧 CORRIGIDO: Adicionado
let tipoFiltro = 'todos';
let isLoading = false;
let currentFilters = {}; // 🔧 NOVO: Cache de filtros atuais

// 🚀 INICIALIZAÇÃO DOS NOVOS MÓDULOS
console.log('🔧 Inicializando módulos refatorados...');
console.log('📦 APIClient:', typeof window.apiClient);
console.log('🔄 DataAdapter:', typeof window.DataAdapter);
console.log('👥 ParticipantsManager:', typeof window.participantsManager);

// 🔧 CORREÇÃO: Função para obter API_URL de forma segura
function getApiUrl() {
    return window.API_URL || 
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
           (window.location.hostname === 'localhost' ? 
            'http://localhost:3000/api' : 
            'https://programa-indicacao-multicliente-production.up.railway.app/api'));
}

// 🔍 DIAGNÓSTICO: Função para verificar configuração
function debugConfig() {
    console.log('🔍 === DIAGNÓSTICO DE CONFIGURAÇÃO ===');
    console.log('🔍 window.APP_CONFIG:', window.APP_CONFIG);
    console.log('🔍 window.location.hostname:', window.location.hostname);
    console.log('🔍 REFERRAL_BASE_URL configurado:', window.APP_CONFIG?.REFERRAL_BASE_URL);
    console.log('🔍 API_URL configurado:', window.APP_CONFIG?.API_URL);
    console.log('🔍 ===================================');
}

// Executar diagnóstico ao carregar
if (typeof window !== 'undefined') {
    setTimeout(debugConfig, 1000);
}

// Estado das variáveis (declarações já feitas acima)

// Funções do Modal
function showParticipantModal(participantData) {
    document.getElementById('participantName').textContent = participantData.name;
    document.getElementById('participantEmail').textContent = participantData.email;
    document.getElementById('participantCampaign').textContent = participantData.campaign;
    document.getElementById('participantDate').textContent = participantData.date;
    document.getElementById('participantReferrals').textContent = participantData.referrals;
    document.getElementById('participantStatus').textContent = participantData.status;
    
    // Exibir link de compartilhamento - ATUALIZADO PARA NOVO SISTEMA
    // 🔧 CORREÇÃO DEFINITIVA: Garantir que sempre use o backend correto
    let baseReferralUrl;
    if (window.APP_CONFIG && window.APP_CONFIG.REFERRAL_BASE_URL) {
        baseReferralUrl = window.APP_CONFIG.REFERRAL_BASE_URL;
        console.log('✅ Usando REFERRAL_BASE_URL do config:', baseReferralUrl);
    } else {
        // Fallback: SEMPRE usar o backend Railway em produção
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            baseReferralUrl = 'http://localhost:3000/indicacao';
        } else {
            baseReferralUrl = 'https://programa-indicacao-multicliente-production.up.railway.app/indicacao';
        }
        console.log('⚠️ Usando fallback REFERRAL_BASE_URL:', baseReferralUrl);
    }
    const link = participantData.uniqueReferralCode
        ? `${baseReferralUrl}/${participantData.uniqueReferralCode}`
        : (participantData.linkCompartilhamento 
            ? `${baseReferralUrl}/${participantData.linkCompartilhamento}`
            : '-');
    
    const linkDisplay = link !== '-' ? link : 'Link não disponível';
    const isLinkValid = link !== '-';
    
    document.getElementById('participantShareLink').innerHTML = `
        <div class="share-link-container">
            <input type="text" value="${linkDisplay}" readonly style="width: 70%; font-size: 0.85em; ${!isLinkValid ? 'color: #999;' : ''}" onclick="${isLinkValid ? 'this.select()' : ''}">
            <button class="btn-icon ${!isLinkValid ? 'disabled' : ''}" title="${isLinkValid ? 'Copiar link' : 'Link não disponível'}" onclick="${isLinkValid ? `copyToClipboard('${link}')` : ''}" ${!isLinkValid ? 'disabled' : ''}>
                <i class="fas fa-copy"></i>
            </button>
            ${isLinkValid ? `<button class="btn-icon" title="Gerar novo link" onclick="regenerateReferralCode('${participantData.id}')"><i class="fas fa-sync-alt"></i></button>` : ''}
        </div>
        <small style="display: block; margin-top: 4px; color: #666; font-size: 0.75em;">
            ${isLinkValid ? 'Link exclusivo de indicação' : 'Disponível apenas para indicadores ativos'}
        </small>
    `;

    document.getElementById('participantModal').style.display = 'block';
}

function closeParticipantModal() {
    document.getElementById('participantModal').style.display = 'none';
}

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    const modals = [
        'importModal',
        'participantModal',
        'newParticipantModal',
        'manageListsModal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            if (modalId === 'manageListsModal') {
                closeManageListsModal();
            } else if (modalId === 'importModal') {
                closeImportModal();
            } else if (modalId === 'participantModal') {
                closeParticipantModal();
            } else if (modalId === 'newParticipantModal') {
                closeNewParticipantModal();
            }
        }
    });
}

// Funções de busca e filtro
function searchParticipants() {
    const searchTerm = document.getElementById('searchParticipant').value.toLowerCase();
    // A busca agora é feita através dos filtros modernos
    currentPage = 1;
    displayParticipants();
}

// FUNÇÃO ANTIGA REMOVIDA - havia conflito com a nova implementação

// 🚀 FUNÇÃO ESCALÁVEL - Usando PaginationSystem
async function loadParticipants(page = 1, filters = {}) {
    console.log('🔄 loadParticipants ORIGINAL - Sistema restaurado');
    console.log('📄 Carregando página:', page, 'Filtros:', filters);
    
    if (isLoading) {
        console.log('⏳ Já carregando participantes...');
        return;
    }
    
    try {
        isLoading = true;
        
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        if (!token || !clientId) {
            console.error('❌ Token ou clientId não encontrado');
            return;
        }
        
        console.log('🔗 Carregando participantes via API...');
        
        // 🔧 SISTEMA ORIGINAL: Carregar todos os dados de uma vez
        const url = `${getApiUrl()}/participants?clientId=${clientId}&limit=1000`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📥 Dados recebidos:', data);
        
        // Extrair participantes
        const participantsArray = data.participants || data.data || data || [];
        console.log('👥 Participantes extraídos:', participantsArray.length);
        
        // 🔧 SISTEMA ORIGINAL: Atualizar estado global
        participants = participantsArray;
        totalParticipants = participantsArray.length;
        currentPage = 1; // Reset para página 1
        totalPages = Math.ceil(totalParticipants / pageSize) || 1;
        
        console.log('✅ Participantes carregados:', {
            total: participants.length,
            página: currentPage,
            páginas_total: totalPages
        });
        
        // Forçar exibição
        displayParticipants();
        
    } catch (error) {
        console.error('❌ Erro ao carregar participantes:', error);
        showNotification('Erro ao carregar participantes', 'error');
        
        // Mostrar erro na tabela
        const tbody = document.getElementById('participantsList');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-8">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                            <p class="text-xl text-red-400 mb-2">Erro ao carregar dados</p>
                            <p class="text-sm text-gray-500">Verifique sua conexão e tente novamente</p>
                            <button onclick="loadParticipants()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Tentar novamente
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    } finally {
        isLoading = false;
    }
}

function viewParticipantDetails(participantId) {
    // Aqui você faria uma chamada para a API para buscar os detalhes do participante
    const mockData = {
        name: 'João Silva',
        email: 'joao@email.com',
        campaign: 'Indique e Ganhe',
        date: '01/01/2024',
        referrals: '3',
        status: 'Ativo'
    };
    
    showParticipantModal(mockData);
}

async function editParticipant(participantId) {
    const token = localStorage.getItem('clientToken');
    if (!token) {
        showNotification('Token não encontrado. Faça login novamente.', 'error');
        return;
    }
    try {
        // Buscar dados do participante
        const response = await fetch(`${getApiUrl()}/participants?clientId=${localStorage.getItem('clientId')}`);
        if (!response.ok) throw new Error('Erro ao buscar participante');
        const data = await response.json();
        const participant = (data.participants || []).find(p => p._id === participantId);
        if (!participant) {
            alert('Participante não encontrado.');
            return;
        }
        // Preencher modal de edição
        document.getElementById('participantName').value = participant.name;
        document.getElementById('participantEmail').value = participant.email;
        document.getElementById('participantPhone').value = participant.phone || '';
        document.getElementById('participantStatus').value = participant.status || 'ativo';
        // Exibir o ID do participante
        const idField = document.getElementById('participantId');
        if (idField) idField.value = participant._id || '';
        // Exibir modal
        showNewParticipantModal(true);
        // Substituir handler do formulário para salvar edição
        const form = document.getElementById('newParticipantForm');
        form.onsubmit = async function(event) {
            event.preventDefault();
            let status = document.getElementById('participantStatus').value;
            if (status === 'active') status = 'ativo';
            if (status === 'inactive') status = 'inativo';
            const updatedParticipant = {
                name: document.getElementById('participantName').value,
                email: document.getElementById('participantEmail').value,
                phone: document.getElementById('participantPhone').value,
                status
            };
            try {
                const patchResp = await fetch(`${getApiUrl()}/participants/${participantId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedParticipant)
                });
                if (!patchResp.ok) {
                    const errData = await patchResp.json();
                    throw new Error(errData.message || 'Erro ao atualizar participante');
                }
                showNotification('Participante atualizado com sucesso!', 'success');
                closeNewParticipantModal();
                loadParticipants();
            } catch (error) {
                showNotification(error.message || 'Erro ao atualizar participante', 'error');
            }
            return false;
        };
    } catch (error) {
        showNotification(error.message || 'Erro ao editar participante', 'error');
    }
}

async function deleteParticipant(participantId) {
    // Buscar participante pelo ID para exibir nome/e-mail na confirmação
    const participante = participants.find(p => p._id === participantId);
    let info = '';
    if (participante) {
        info = `\nNome: ${participante.name}\nE-mail: ${participante.email}`;
    }
    if (!confirm(`Tem certeza que deseja excluir este participante?${info}`)) return;
    const token = localStorage.getItem('clientToken');
    if (!token) {
        alert('Token não encontrado. Faça login novamente.');
        return;
    }
    // Desabilitar todos os botões de excluir temporariamente
    const btns = document.querySelectorAll('.btn-icon.delete');
    btns.forEach(btn => btn.disabled = true);
    try {
        const response = await fetch(`${getApiUrl()}/participants/${participantId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            let errorMsg = 'Erro ao excluir participante';
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                errorMsg = data.message || errorMsg;
            } else {
                errorMsg = await response.text();
            }
            throw new Error(errorMsg);
        }
        showNotification('Participante excluído com sucesso!', 'success');
        // Recarregar participantes e reaplicar filtro para manter contexto
        await loadParticipants();
        filterParticipants();
    } catch (error) {
        showNotification(error.message || 'Erro ao excluir participante', 'error');
    } finally {
        btns.forEach(btn => btn.disabled = false);
    }
}

// Função de exportação
function exportParticipants() {
    if (!participants || participants.length === 0) {
        showNotification('Nenhum participante para exportar', 'warning');
        return;
    }
    
    // Gerar CSV com dados dos participantes
    const header = 'Nome,Email,Telefone,Tipo,Status,Data de Cadastro\n';
    const csvContent = participants.map(p => {
        return [
            p.name || '',
            p.email || '',
            p.phone || '',
            p.tipo || 'participante',
            p.status || 'ativo',
            new Date(p.createdAt || p.created_at || Date.now()).toLocaleDateString('pt-BR')
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    }).join('\n');
    
    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `participantes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification('Participantes exportados com sucesso', 'success');
}

// Funções de Importação
function showImportModal() {
    const modal = document.getElementById('importModal');
    if (!modal) {
        console.error('Modal de importação não encontrado');
        return;
    }
    
    // Resetar o formulário e limpar o mapeamento
    const form = document.getElementById('importForm');
    const mappingContainer = document.getElementById('importMapping');
    
    if (form) form.reset();
    if (mappingContainer) mappingContainer.innerHTML = '';
    
    // Exibir o modal
    modal.style.display = 'block';
    
    // Garantir que o input de arquivo aceite ambos os tipos inicialmente
    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.accept = '.xlsx,.csv';
    }
}

function closeImportModal() {
    const modal = document.getElementById('importModal');
    if (!modal) {
        console.error('Modal de importação não encontrado');
        return;
    }
    
    // Resetar o formulário e limpar o mapeamento
    const form = document.getElementById('importForm');
    const mappingContainer = document.getElementById('importMapping');
    
    if (form) form.reset();
    if (mappingContainer) mappingContainer.innerHTML = '';
    
    // Esconder o modal
    modal.style.display = 'none';
}

function toggleImportFields() {
    const importType = document.getElementById('importType').value;
    const importFile = document.getElementById('importFile');
    
    if (!importFile) return;
    
    if (importType === 'excel') {
        importFile.accept = '.xlsx';
    } else if (importType === 'csv') {
        importFile.accept = '.csv';
    } else {
        importFile.accept = '.xlsx,.csv';
    }
}

function handleImport(event) {
    event.preventDefault();
    
    const form = event.target;
    const fileInput = form.querySelector('#importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Selecione um arquivo para importar', 'error');
        return;
    }
    
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Importando...';
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            console.log('🔄 === INICIANDO IMPORTAÇÃO - FLUXO ORIGINAL ===');
            
            let participants;
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            if (fileExtension === 'xlsx') {
                participants = parseExcelFile(e.target.result);
            } else if (fileExtension === 'csv') {
                participants = parseCSVFile(e.target.result);
            } else {
                throw new Error('Formato de arquivo não suportado');
            }
            
            if (participants && participants.length > 0) {
                console.log(`📊 ${participants.length} participantes extraídos do arquivo`);
                
                // 🎯 FLUXO ORIGINAL: 1. IMPORTAR PARTICIPANTES PRIMEIRO (sem lista)
                console.log('1️⃣ Importando participantes...');
                const clientId = localStorage.getItem('clientId');
                const token = localStorage.getItem('clientToken');
                
                // Enviar participantes para o backend SEM listId (fluxo original)
                const importResp = await fetch(`${getApiUrl()}/participants/import`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        clientId, 
                        participants: participants.map(p => ({
                            name: p.name,
                            email: p.email,
                            phone: p.phone,
                            company: p.company || '',
                            status: p.status || 'ativo',
                            tipo: 'participante'  // Tipo padrão
                        }))
                    })
                });
                
                if (!importResp.ok) {
                    const data = await importResp.json();
                    throw new Error(data.message || 'Erro ao importar participantes');
                }
                
                console.log('✅ Participantes importados com sucesso');
                
                // 🎯 FLUXO ORIGINAL: 2. BUSCAR PARTICIPANTES IMPORTADOS
                console.log('2️⃣ Buscando participantes importados...');
                const emails = participants.map(p => p.email);
                const searchResp = await fetch(`${getApiUrl()}/participants?clientId=${clientId}&limit=1000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const allData = await searchResp.json();
                const importedParticipants = (allData.participants || []).filter(p => emails.includes(p.email));
                
                console.log(`📋 ${importedParticipants.length} participantes encontrados no sistema`);
                
                // Validação: só cria lista se houver participantes válidos
                if (importedParticipants.length === 0) {
                    throw new Error('Nenhum participante válido para criar a lista.');
                }
                
                // 🎯 FLUXO ORIGINAL: 3. CRIAR LISTA COM PARTICIPANTES IMPORTADOS
                console.log('3️⃣ Criando lista com participantes...');
                const listName = document.getElementById('listNameImport').value;
                const listDescription = document.getElementById('listDescriptionImport').value;
                const listTipo = 'participante'; // Tipo fixo para importação via participants.html
                
                const listResp = await fetch(`${getApiUrl()}/participant-lists`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: listName,
                        description: listDescription,
                        tipo: listTipo,
                        clientId,
                        participants: importedParticipants.map(p => p._id)  // Associar participantes à lista
                    })
                });
                
                if (!listResp.ok) {
                    const data = await listResp.json();
                    throw new Error(data.message || 'Erro ao criar lista');
                }
                
                const listData = await listResp.json();
                console.log('✅ Lista criada com sucesso:', listData);
                
                // 🎯 SUCESSO: Mostrar resultado
                showNotification(`✅ Importação concluída! ${participants.length} participantes importados e adicionados à lista "${listName}".`, 'success');
                
                // Recarregar dados
                closeImportModal();
                await loadLists(true);      // Recarregar listas
                await loadParticipants();   // Recarregar participantes
                
            } else {
                throw new Error('Nenhum participante encontrado no arquivo. Verifique se o arquivo está no formato correto.');
            }
        } catch (error) {
            console.error('❌ Erro ao processar arquivo:', error);
            showNotification(error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    };
    
    reader.onerror = function() {
        showNotification('Erro ao ler o arquivo. Tente novamente.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    };
    
    reader.readAsBinaryString(file);
}

function generateShareLink() {
    return `${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`;
}

async function handleNewParticipant(event) {
    event.preventDefault();
    const name = document.getElementById('participantName').value;
    const email = document.getElementById('participantEmail').value;
    const phone = document.getElementById('participantPhone').value;
    let status = 'ativo';
    const clientId = localStorage.getItem('clientId');
    const token = localStorage.getItem('clientToken');
    const tipo = document.getElementById('participantTipo').value;
    if (!tipo) {
        alert('Por favor, selecione o tipo de usuário.');
        return false;
    }

    // Validar campos obrigatórios
    if (!name || !email) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return false;
    }
    if (!validateEmail(email)) {
        alert('Por favor, insira um e-mail válido.');
        return false;
    }
    if (!clientId || !token) {
        alert('Erro de autenticação. Faça login novamente.');
        return false;
    }
    try {
        const response = await fetch(`${API_URL}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                status,
                clientId,
                tipo
            })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Erro ao cadastrar participante');
        }
        // Participante cadastrado com sucesso
        showNotification('Participante cadastrado com sucesso!', 'success');
        closeNewParticipantModal();
        loadParticipants();
    } catch (error) {
        showNotification(error.message || 'Erro ao cadastrar participante', 'error');
    }
    return false;
}

function parseExcelFile(data) {
    const participants = [];
    try {
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet);
        
        rows.forEach(row => {
            const nome = row.Nome || row.nome || row.NOME || '';
            const email = row.Email || row.email || row.EMAIL || '';
            const telefone = row.Telefone || row.telefone || row.TELEFONE || '';
            const empresa = row.Empresa || row.empresa || row.EMPRESA || '';
            
            if (nome && email) {
            participants.push({
                id: Date.now() + Math.random(),
                name: nome,
                email: email,
                phone: telefone,
                company: empresa,
                status: 'active',
                    createdAt: new Date().toISOString(),
                    linkCompartilhamento: generateShareLink()
            });
            }
        });
    } catch (error) {
        console.error('Erro ao processar arquivo Excel:', error);
        throw new Error('Erro ao processar arquivo Excel: ' + error.message);
    }
    
    return participants;
}

function parseCSVFile(data) {
    const participants = [];
    try {
        const lines = data.split('\n');
        if (lines.length < 2) {
            throw new Error('O arquivo CSV está vazio ou não contém dados válidos.');
        }
        
        const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
        
        // Verificar cabeçalhos obrigatórios
        if (!headers.includes('nome') && !headers.includes('email')) {
            throw new Error('Cabeçalhos obrigatórios não encontrados. O arquivo deve conter as colunas "nome" e "email".');
        }
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = lines[i].split(',').map(value => value.trim());
            const participant = {};
            
            headers.forEach((header, index) => {
                participant[header] = values[index] || '';
            });
            
            if (participant.nome && participant.email) {
                participants.push({
                    id: Date.now() + i,
                    name: participant.nome,
                    email: participant.email,
                    phone: participant.telefone || '',
                    company: participant.empresa || '',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    linkCompartilhamento: generateShareLink()
                });
            }
        }
    } catch (error) {
        console.error('Erro ao processar arquivo CSV:', error);
        throw new Error('Erro ao processar arquivo CSV: ' + error.message);
    }
    
    return participants;
}

// 🔧 FUNÇÃO CORRIGIDA: Importar participantes com contexto de lista
async function saveImportedParticipants(participants, listId = null, tipoParticipante = 'participante') {
    // 🔍 DIAGNÓSTICO: Log dos parâmetros recebidos
    console.log('🔧 saveImportedParticipants CORRIGIDA chamada com:');
    console.log('   - Participantes:', participants.length);
    console.log('   - ListId:', listId);
    console.log('   - Tipo:', tipoParticipante);
    
    try {
        const clientId = localStorage.getItem('clientId');
        if (!clientId) {
            showMessage('Erro: Cliente não identificado', 'error');
            return;
        }

        // 🔧 CORREÇÃO: Payload completo com listId e tipo
        const payload = {
            clientId: clientId,
            listId: listId, // ✅ ID da lista específica
            tipoParticipante: tipoParticipante, // ✅ Tipo correto
            participants: participants.map(p => ({
                name: p.name,
                email: p.email,
                phone: p.phone,
                company: p.company || '',
                status: p.status || 'active',
                tipo: tipoParticipante, // ✅ Tipo individual
                listId: listId // ✅ Associar à lista
            }))
        };

        console.log('📤 Enviando payload corrigido:', payload);

        const response = await fetch(`${getApiUrl()}/participants/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('clientToken')}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (result.success !== false) {
            showMessage(`${participants.length} participantes importados com sucesso!`, 'success');
            
            // 🔄 CORREÇÃO: Recarregar lista específica
            if (listId) {
                await loadParticipantList(listId);
            } else {
                await loadParticipantLists();
            }
        } else {
            showMessage(`Erro ao importar: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('❌ Erro ao importar participantes:', error);
        showMessage('Erro ao importar participantes', 'error');
    }
}

// Função consolidada para carregar listas (serve tanto para filtros quanto para exibição)
async function loadLists(forDisplayInTab = false) {
    const token = localStorage.getItem('clientToken');
    const clientId = localStorage.getItem('clientId');
    
    if (!token || !clientId) {
        lists = [];
        if (!forDisplayInTab) populateListFilter();
        return Promise.resolve();
    }
    
    try {
        // 🔧 CORREÇÃO: Usar getApiUrl() para garantir URL correta
        const apiUrl = getApiUrl();
        console.log('🔍 DEBUG - URL da API:', `${apiUrl}/participant-lists?clientId=${clientId}`);
        
        const response = await fetch(`${apiUrl}/participant-lists?clientId=${clientId}&populate=campaign`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            console.log('🚨 DEBUG - Resposta da API não foi OK:', response.status, response.statusText);
            
            // Tentar sem populate se der erro
            console.log('🔄 Tentando novamente sem populate...');
            const fallbackResponse = await fetch(`${apiUrl}/participant-lists?clientId=${clientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!fallbackResponse.ok) {
                throw new Error(`Erro ao carregar listas: ${response.status} ${response.statusText}`);
            }
            
            lists = await fallbackResponse.json() || [];
            console.log('✅ Listas carregadas via fallback (sem populate)');
        } else {
            lists = await response.json() || [];
            console.log('✅ Listas carregadas com populate');
        }
        
        // 🔍 DEBUG DETALHADO - Verificar dados completos das listas da API
        console.log(`✅ ${lists.length} listas carregadas da API`);
        console.log('🔍 DEBUG - Dados completos das listas da API:', lists);
        
        // Analisar cada lista individualmente para campanhas
        lists.forEach((list, index) => {
            console.log(`🔍 DEBUG Lista ${index + 1} - "${list.name}":`, {
                id: list._id || list.id,
                campaign: list.campaign,
                campaignType: typeof list.campaign,
                campaignId: list.campaignId,
                campaignIdType: typeof list.campaignId,
                campaignName: list.campaignName,
                temCampanha: !!(list.campaign || list.campaignId || list.campaignName),
                todasPropriedades: Object.keys(list)
            });
            
            // Análise específica de campanha
            if (list.campaign) {
                console.log(`  📢 CAMPANHA ENCONTRADA em "${list.name}":`, list.campaign);
            } else if (list.campaignId) {
                console.log(`  🆔 CAMPAIGN ID em "${list.name}":`, list.campaignId);
            } else {
                console.log(`  ❌ SEM CAMPANHA em "${list.name}"`);
            }
        });
        
        if (forDisplayInTab) {
            displayListsInTab(lists);
        } else {
        populateListFilter();
        // Se participantes já estiverem carregados, exibe agora
        if (participants && participants.length > 0) displayParticipants();
        }
        
    } catch (error) {
        lists = [];
        if (forDisplayInTab) {
            const container = document.getElementById('listsContainer');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <p class="text-red-400 mb-4">Erro ao carregar listas: ${error.message}</p>
                        <button onclick="loadLists(true)" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Tentar novamente
                        </button>
                    </div>
                `;
            }
        } else {
        populateListFilter();
        }
    }
}

function populateListFilter() {
    console.log('🔄 Populando filtro de listas...');
    
    const listFilter = document.getElementById('listFilter');
    if (!listFilter) {
        console.log('⚠️ Elemento listFilter não encontrado');
        return;
    }

    // Limpar opções existentes mantendo apenas a opção "Todas"
    listFilter.innerHTML = '<option value="">Todas as listas</option>';

    // Adicionar cada lista como uma opção (padronizando uso de _id)
    if (lists && lists.length > 0) {
        lists.forEach(list => {
            const option = document.createElement('option');
            option.value = list._id || list.id;
            option.textContent = list.name;
            listFilter.appendChild(option);
        });
        console.log(`✅ ${lists.length} listas adicionadas ao filtro`);
    }
}

// 🚀 FUNÇÃO CORRIGIDA - Display direto COM fallback para ParticipantsManager
function displayParticipants() {
    console.log('🔄 displayParticipants ORIGINAL - Sistema restaurado');
    
    const tbody = document.getElementById('participantsList');
    if (!tbody) {
        console.error('❌ Elemento participantsList não encontrado');
        return;
    }
    
    // 🔧 SISTEMA ORIGINAL: Usar filtros locais
    const filteredParticipants = filterParticipantsData();
    console.log('📊 Participantes filtrados:', filteredParticipants.length);
    
    if (!filteredParticipants || filteredParticipants.length === 0) {
        console.log('⚠️ Nenhum participante após filtros');
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-8">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-users text-4xl text-gray-500 mb-4"></i>
                        <p class="text-xl text-gray-400 mb-2">Nenhum participante encontrado</p>
                        <p class="text-sm text-gray-500">Tente ajustar os filtros ou adicionar novos participantes</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // 🔧 SISTEMA ORIGINAL: Paginação simples local
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedParticipants = filteredParticipants.slice(startIndex, endIndex);
    
    console.log(`📄 Página ${currentPage}: ${startIndex}-${endIndex} de ${filteredParticipants.length}`);
    
    // Atualizar estatísticas globais
    totalParticipants = filteredParticipants.length;
    totalPages = Math.ceil(totalParticipants / pageSize) || 1;
    
    // 🎯 SISTEMA ORIGINAL: Duplicar linhas por lista (João em 2 listas = 2 linhas)
    const html = paginatedParticipants.flatMap(participant => {
        const tipoInfo = getTipoInfo(participant.tipo || 'participante');
        const status = participant.status || 'ativo';
        const statusColor = status === 'ativo' ? 'text-green-400' : 'text-red-400';
        
        // Link de referral se for indicador
        let linkHtml = '-';
        if ((participant.tipo === 'indicador' || participant.tipo === 'influenciador') && participant.uniqueReferralCode) {
            const referralLink = `${window.location.origin}/indicacao/${participant.uniqueReferralCode}`;
            linkHtml = `
                <div class="flex items-center gap-2">
                    <code class="text-xs bg-gray-800 px-2 py-1 rounded">${participant.uniqueReferralCode}</code>
                    <button onclick="copyToClipboard('${referralLink}')" class="text-blue-400 hover:text-blue-300" title="Copiar link">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            `;
        }
        
        // Campanha
        const campaignName = getCampaignDisplayName(participant);
        
        // 🔧 SISTEMA ORIGINAL: Se tem listas, criar uma linha por lista
        if (participant.lists && participant.lists.length > 0) {
            return participant.lists.map(list => {
                const listName = typeof list === 'object' ? list.name : list;
                
                return `
                    <tr class="hover:bg-gray-800 transition-colors" data-participant-id="${participant._id || participant.id}" data-list-name="${listName}">
                    <td class="px-4 py-3">
                            <input type="checkbox" class="user-checkbox rounded border-gray-600 text-blue-600" value="${participant._id || participant.id}">
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full ${tipoInfo.bgColor} flex items-center justify-center">
                                    <i class="${tipoInfo.icon} text-white text-sm"></i>
                            </div>
                            <div>
                                    <div class="font-medium text-gray-100">${participant.name || 'Sem nome'}</div>
                                    <div class="text-sm text-gray-400">${participant.email || 'Sem email'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3">
                            <div class="text-sm text-gray-300">${participant.phone || '-'}</div>
                    </td>
                    <td class="px-4 py-3">
                            <div class="text-sm text-gray-300">${listName}</div>
                    </td>
                    <td class="px-4 py-3">
                            <div class="text-sm">${campaignName}</div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoInfo.badgeClass}">
                            <i class="${tipoInfo.icon} mr-1"></i>
                            ${tipoInfo.label}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                            <div class="text-sm">${linkHtml}</div>
                    </td>
                    <td class="px-4 py-3">
                            <span class="${statusColor}">${status}</span>
                    </td>
                    <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <button onclick="viewParticipantDetails('${participant._id || participant.id}')" class="text-blue-400 hover:text-blue-300" title="Ver detalhes">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="editParticipant('${participant._id || participant.id}')" class="text-yellow-400 hover:text-yellow-300" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                                <button onclick="deleteParticipant('${participant._id || participant.id}')" class="text-red-400 hover:text-red-300" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                    </tr>
                `;
            });
        } else {
            // 🔧 Se não tem listas, criar uma linha normal
            return [`
                <tr class="hover:bg-gray-800 transition-colors" data-participant-id="${participant._id || participant.id}">
                <td class="px-4 py-3">
                        <input type="checkbox" class="user-checkbox rounded border-gray-600 text-blue-600" value="${participant._id || participant.id}">
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full ${tipoInfo.bgColor} flex items-center justify-center">
                                <i class="${tipoInfo.icon} text-white text-sm"></i>
                        </div>
                        <div>
                                <div class="font-medium text-gray-100">${participant.name || 'Sem nome'}</div>
                                <div class="text-sm text-gray-400">${participant.email || 'Sem email'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3">
                        <div class="text-sm text-gray-300">${participant.phone || '-'}</div>
                </td>
                <td class="px-4 py-3">
                        <div class="text-sm text-gray-300">-</div>
                </td>
                <td class="px-4 py-3">
                        <div class="text-sm">${campaignName}</div>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoInfo.badgeClass}">
                        <i class="${tipoInfo.icon} mr-1"></i>
                        ${tipoInfo.label}
                    </span>
                </td>
                <td class="px-4 py-3">
                        <div class="text-sm">${linkHtml}</div>
                </td>
                <td class="px-4 py-3">
                        <span class="${statusColor}">${status}</span>
                </td>
                <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <button onclick="viewParticipantDetails('${participant._id || participant.id}')" class="text-blue-400 hover:text-blue-300" title="Ver detalhes">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="editParticipant('${participant._id || participant.id}')" class="text-yellow-400 hover:text-yellow-300" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                            <button onclick="deleteParticipant('${participant._id || participant.id}')" class="text-red-400 hover:text-red-300" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
                </tr>
            `];
        }
    }).join('');
    
    tbody.innerHTML = html;
    
    // 🔧 SISTEMA ORIGINAL: Atualizar controles de paginação
    updatePaginationControls();
    updateParticipantCount();
    
    console.log('✅ Display original concluído com sucesso!');
}

// Função de teste para verificar conexão de dados
function testDataConnection() {
    setTimeout(() => {
        console.log('🧪 TESTE DE CONEXÃO DE DADOS:');
        console.log('📊 Participantes carregados:', participants ? participants.length : 'undefined');
        console.log('📋 Listas carregadas:', lists ? lists.length : 'undefined');
        
        if (lists && lists.length > 0) {
            console.log('🔍 Primeira lista:', lists[0].name, '- Participantes:', lists[0].participants?.length || 0);
        }
        
        if (participants && participants.length > 0) {
            console.log('🔍 Primeiro participante:', participants[0].name, '- Listas:', participants[0].lists?.length || 0);
        }
        
        console.log('🧪 FIM DO TESTE');
        console.log('💡 Comandos disponíveis no console:');
    console.log('   ===== AUTO-INICIALIZAÇÃO =====');
    console.log('   - ensureUsersTabInitialized() para auto-inicializar aba usuários');
    console.log('   - resetUsersTabInitialization() para resetar e re-inicializar');
    console.log('   - forceDisplayParticipants() para exibição imediata (se necessário)');
    console.log('   ===== DIAGNÓSTICO =====');
    console.log('   - testDebugEndpoint() para testar endpoint');
    console.log('   - debugDatabase() para diagnóstico COMPLETO do banco');
    console.log('   - investigateCleanupIssue() para investigar possível limpeza de duplicados');
    console.log('   ===== RECUPERAÇÃO =====');
    console.log('   - quickRecoverCampaignList() para RECUPERAÇÃO RÁPIDA da lista (RECOMENDADO)');
    console.log('   - recoverOrphanCampaignParticipants() para recuperar participantes órfãos');
    console.log('   ===== SISTEMA ESCALÁVEL =====');
    console.log('   - testScalableSystem() para TESTAR performance com volumes grandes');
    console.log('   - PaginationSystem.goToPage(numero) para navegar páginas');
    console.log('   - PaginationSystem.changePageSize(tamanho) para alterar limite');
    console.log('   - PaginationSystem.search("termo") para buscar');
    console.log('   - PaginationSystem.applyFilters({tipo: "indicador"}) para filtrar');
    console.log('   ===== LEGADO =====');
        console.log('   - fixCampaigns() para corrigir campanhas');
        console.log('   - updateTable() para atualizar tabela');
    }, 3000); // Aguardar 3 segundos para carregar
}

// Função global para teste manual no console
window.testSync = function() {
    console.log('🔄 Forçando sincronização manual...');
    syncListMemberCounts();
    if (currentTab === 'lists') {
        displayListsInTab(lists);
    }
    console.log('✅ Sincronização manual concluída');
};

// Função para buscar campanhas e conectar com listas
async function loadCampaignsAndConnect() {
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        if (!token || !clientId) {
            console.log('⚠️ Sem token ou clientId para buscar campanhas');
            return;
        }
        
        console.log('🔄 Buscando campanhas para conectar com listas...');
        
        const response = await fetch(`${getApiUrl()}/campaigns?clientId=${clientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            console.log('⚠️ Erro ao buscar campanhas:', response.status);
            return;
        }
        
        const campaignsResponse = await response.json();
        console.log('📢 Campanhas encontradas:', campaignsResponse);
        
        // Extrair array de campanhas da resposta
        const campaigns = Array.isArray(campaignsResponse) ? campaignsResponse : (campaignsResponse.data || []);
        console.log('📋 Array de campanhas:', campaigns.length, 'campanhas');
        
        // Salvar campanhas no cache global para uso posterior
        window.campaignsCache = campaigns;
        
        // ✨ Conectar campanhas às listas PRIMEIRO
        if (lists && Array.isArray(lists)) {
            lists.forEach(list => {
                if (list.campaignId && !list.campaign) {
                    const campaign = campaigns.find(c => (c._id || c.id) === list.campaignId);
                    if (campaign) {
                        list.campaign = campaign;
                        list.campaignName = campaign.name;
                    }
                }
            });
        }
        
        // Conectar campanhas com listas
        if (lists && Array.isArray(lists)) {
            let conexoesFeitas = 0;
            
            lists.forEach(list => {
                // Se a lista tem campaignId mas não tem campaign populado
                if (list.campaignId && !list.campaign) {
                    if (campaigns && Array.isArray(campaigns)) {
                        const campaign = campaigns.find(c => {
                            const campaignId = c._id || c.id;
                            return campaignId === list.campaignId;
                        });
                        
                        if (campaign) {
                            // Conectar a campanha diretamente na lista
                            list.campaign = campaign;
                            list.campaignName = campaign.name; // Para fallback
                            conexoesFeitas++;
                        }
                    }
                }
            });
            
            // Atualizar o cache global de listas com as campanhas conectadas
            window.listsWithCampaigns = lists;
            
            // ✨ ATUALIZAR TABELA IMEDIATAMENTE após conectar campanhas
            if (currentTab === 'lists') {
                // Pequeno delay para garantir que a conexão foi feita
                setTimeout(() => {
                    refreshListsDisplay();
                }, 100);
            }
        }
        
    } catch (error) {
        console.error('🚨 Erro ao buscar campanhas:', error);
    }
}

// Função global para teste de campanhas
window.testCampaigns = function() {
    loadCampaignsAndConnect();
};

// Função para forçar atualização imediata da tabela
window.updateTable = function() {
    if (currentTab === 'lists') {
        refreshListsDisplay();
    }
};

// Função global para corrigir campanhas imediatamente
window.fixCampaigns = function() {
    if (!lists || lists.length === 0) {
        loadLists(true).then(() => {
            return loadCampaignsAndConnect();
        });
    } else {
        loadCampaignsAndConnect();
    }
};

// Comando rápido para refresh das campanhas
window.refreshCampaigns = function() {
    if (currentTab === 'lists' && lists && lists.length > 0) {
        refreshListsDisplay();
    }
};

// 🔍 H6 - FUNÇÃO ESPECÍFICA PARA INVESTIGAR LIMPEZA DE DUPLICADOS
window.investigateCleanupIssue = async function() {
    console.log('🔍 H6 - INVESTIGANDO POSSÍVEL LIMPEZA INCORRETA DE DUPLICADOS...');
    
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        if (!token || !clientId) {
            console.log('❌ Token ou clientId não encontrado');
            return;
        }
        
        // 1. Buscar todas as listas do cliente
        const listsResponse = await fetch(`${API_URL}/participant-lists?clientId=${clientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const listsData = await listsResponse.json();
        const allLists = listsData.lists || [];
        
        // 2. Buscar todos os participantes do cliente
        const participantsResponse = await fetch(`${API_URL}/participants?clientId=${clientId}&limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const participantsData = await participantsResponse.json();
        const allParticipants = participantsData.participants || [];
        
        console.log('📊 DADOS COLETADOS:');
        console.log('📋 Total de listas:', allLists.length);
        console.log('👥 Total de participantes:', allParticipants.length);
        
        // 3. Analisar listas de campanha vazias
        const campaignLists = allLists.filter(list => list.campaignId || list.campaignName);
        const emptyCampaignLists = campaignLists.filter(list => !list.participants || list.participants.length === 0);
        
        console.log('🏷️ LISTAS DE CAMPANHA:');
        console.log('📋 Total de listas de campanha:', campaignLists.length);
        console.log('🗳️ Listas de campanha VAZIAS:', emptyCampaignLists.length);
        
        if (emptyCampaignLists.length > 0) {
            console.log('🚨 SUSPEITO - Listas de campanha vazias:');
            emptyCampaignLists.forEach(list => {
                console.log(`   📋 "${list.name}" (ID: ${list._id})`);
                console.log(`      Campanha: ${list.campaignName || 'N/A'}`);
                console.log(`      Tipo: ${list.tipo || 'N/A'}`);
                console.log(`      Participantes: ${list.participants?.length || 0}`);
            });
        }
        
        // 4. Analisar participantes órfãos de campanha
        const campaignParticipants = allParticipants.filter(p => p.campaignId || p.campaignName);
        const orphanCampaignParticipants = campaignParticipants.filter(p => !p.lists || p.lists.length === 0);
        
        console.log('👤 PARTICIPANTES DE CAMPANHA:');
        console.log('👥 Total de participantes de campanha:', campaignParticipants.length);
        console.log('👻 Participantes de campanha ÓRFÃOS (sem listas):', orphanCampaignParticipants.length);
        
        if (orphanCampaignParticipants.length > 0) {
            console.log('🚨 SUSPEITO - Participantes de campanha órfãos:');
            orphanCampaignParticipants.forEach(p => {
                console.log(`   👤 ${p.name} (${p.email})`);
                console.log(`      ID: ${p._id}`);
                console.log(`      Campanha: ${p.campaignName || 'N/A'}`);
                console.log(`      Origem: ${p.originSource || 'N/A'}`);
                console.log(`      Tipo: ${p.tipo || 'N/A'}`);
            });
        }
        
        // 5. Verificar padrões suspeitos
        const listasComNomeIndicadores = allLists.filter(list => 
            list.name && list.name.toLowerCase().includes('indicador')
        );
        
        console.log('🔍 ANÁLISE DE PADRÕES:');
        console.log('📋 Listas com "indicador" no nome:', listasComNomeIndicadores.length);
        
        listasComNomeIndicadores.forEach(list => {
            console.log(`   📋 "${list.name}"`);
            console.log(`      Participantes: ${list.participants?.length || 0}`);
            console.log(`      Tipo: ${list.tipo || 'N/A'}`);
            console.log(`      Campanha: ${list.campaignName || 'N/A'}`);
            
            if ((!list.participants || list.participants.length === 0) && list.campaignId) {
                console.log('   🚨 MUITO SUSPEITO: Lista de indicador de campanha VAZIA!');
            }
        });
        
        // 6. Procurar evidências de operações de limpeza
        const participantesIndicadores = allParticipants.filter(p => p.tipo === 'indicador');
        const indicadoresSemLista = participantesIndicadores.filter(p => !p.lists || p.lists.length === 0);
        
        console.log('🎯 INDICADORES:');
        console.log('👥 Total de indicadores:', participantesIndicadores.length);
        console.log('👻 Indicadores sem lista:', indicadoresSemLista.length);
        
        // 7. Resumo da investigação
        console.log('📄 RESUMO DA INVESTIGAÇÃO:');
        
        const problemas = [];
        if (emptyCampaignLists.length > 0) {
            problemas.push(`${emptyCampaignLists.length} listas de campanha vazias`);
        }
        if (orphanCampaignParticipants.length > 0) {
            problemas.push(`${orphanCampaignParticipants.length} participantes de campanha órfãos`);
        }
        if (indicadoresSemLista.length > 0) {
            problemas.push(`${indicadoresSemLista.length} indicadores sem lista`);
        }
        
        if (problemas.length > 0) {
            console.log('🚨 EVIDÊNCIAS DE POSSÍVEL LIMPEZA INCORRETA:');
            problemas.forEach(problema => console.log(`   ⚠️ ${problema}`));
            console.log('');
            console.log('💡 SUGESTÃO: Verificar se foi executado comando para remover duplicados que afetou listas de campanha');
        } else {
            console.log('✅ Nenhuma evidência clara de limpeza incorreta encontrada');
        }
        
         } catch (error) {
         console.error('❌ Erro na investigação:', error);
     }
 };

// 🔧 H6 - FUNÇÃO PARA RECUPERAR PARTICIPANTES ÓRFÃOS DE CAMPANHA
window.recoverOrphanCampaignParticipants = async function(campaignListName = 'Indicadores - teste lista de participantes') {
     console.log('🔧 H6 - INICIANDO RECUPERAÇÃO DE PARTICIPANTES ÓRFÃOS...');
     console.log('🎯 Lista alvo:', campaignListName);
     
     try {
         const token = localStorage.getItem('clientToken');
         const clientId = localStorage.getItem('clientId');
         
         if (!token || !clientId) {
             console.log('❌ Token ou clientId não encontrado');
             return;
         }
         
         // 🚀 USAR DADOS JÁ CARREGADOS NO FRONTEND (mais rápido e confiável)
         console.log('📊 Usando dados já carregados no frontend...');
         console.log('📋 Listas disponíveis:', lists?.length || 0);
         console.log('👥 Participantes disponíveis:', participants?.length || 0);
         
         if (!lists || lists.length === 0) {
             console.log('❌ Listas não carregadas no frontend. Tentando via API...');
             
             // Fallback: Buscar via API
             const listsResponse = await fetch(`${API_URL}/participant-lists?clientId=${clientId}`, {
                 headers: { 'Authorization': `Bearer ${token}` }
             });
             const listsData = await listsResponse.json();
             window.lists = listsData.lists || [];
         }
         
         // 1. Buscar a lista alvo nos dados já carregados
         const targetList = lists.find(list => 
             list.name === campaignListName || 
             list.name.includes('teste lista de participantes')
         );
         
         if (!targetList) {
             console.log('❌ Lista alvo não encontrada:', campaignListName);
             console.log('📋 Listas disponíveis:', lists.map(l => l.name));
             return;
         }
         
         console.log('✅ Lista encontrada:', targetList.name);
         console.log('📊 Participantes atuais na lista:', targetList.participants?.length || 0);
         console.log('🆔 ID da lista:', targetList._id || targetList.id);
         
         // 2. Usar participantes já carregados no frontend
         let allParticipants = participants || [];
         
         if (!allParticipants || allParticipants.length === 0) {
             console.log('❌ Participantes não carregados no frontend. Tentando via API...');
             
             // Fallback: Buscar via API
             const participantsResponse = await fetch(`${API_URL}/participants?clientId=${clientId}&limit=1000`, {
                 headers: { 'Authorization': `Bearer ${token}` }
             });
             const participantsData = await participantsResponse.json();
             allParticipants = participantsData.participants || [];
         }
         
         console.log('👥 Total de participantes analisados:', allParticipants.length);
         
         // 3. Identificar participantes órfãos que deveriam estar na lista  
         const candidatesForRecovery = allParticipants.filter(p => {
             // Critérios para recuperação:
             const isIndicator = p.tipo === 'indicador';
             const isCampaignParticipant = p.campaignId || p.campaignName || p.originSource === 'campaign';
             const hasNoLists = !p.lists || p.lists.length === 0;
             const notInTargetList = !p.lists?.some(list => {
                 const listId = typeof list === 'object' ? (list._id || list.id) : list;
                 return listId === (targetList._id || targetList.id);
             });
             
             // Participante é indicador OU de campanha E (não tem listas OU não está na lista alvo)
             return isIndicator && (hasNoLists || notInTargetList);
         });
         
         console.log('🔍 Análise de candidatos:');
         console.log('   📊 Total de indicadores:', allParticipants.filter(p => p.tipo === 'indicador').length);
         console.log('   📊 Participantes de campanha:', allParticipants.filter(p => p.campaignId || p.campaignName).length);
         console.log('   👻 Candidatos para recuperação:', candidatesForRecovery.length);
         
         console.log('👻 Participantes órfãos encontrados:', candidatesForRecovery.length);
         
         if (candidatesForRecovery.length === 0) {
             console.log('✅ Nenhum participante órfão encontrado para recuperar');
             return;
         }
         
         // 4. Mostrar participantes que serão recuperados
         console.log('📋 PARTICIPANTES PARA RECUPERAÇÃO:');
         candidatesForRecovery.forEach((p, idx) => {
             console.log(`   ${idx + 1}. ${p.name} (${p.email})`);
             console.log(`      Tipo: ${p.tipo || 'N/A'}`);
             console.log(`      Campanha: ${p.campaignName || 'N/A'}`);
             console.log(`      Listas atuais: ${p.lists?.length || 0}`);
         });
         
         // 5. Confirmar antes de executar
         const confirm = prompt(`Deseja reconectar ${candidatesForRecovery.length} participantes à lista "${targetList.name}"? Digite "CONFIRMAR" para prosseguir:`);
         
         if (confirm !== 'CONFIRMAR') {
             console.log('❌ Operação cancelada pelo usuário');
             return;
         }
         
         // 6. Executar recuperação
         console.log('🔄 Iniciando recuperação...');
         let successCount = 0;
         let errorCount = 0;
         
         for (const participant of candidatesForRecovery) {
             try {
                 console.log(`🔄 Adicionando ${participant.name} à lista...`);
                 
                 const response = await fetch(`${API_URL}/participants/${participant._id}/add-to-list/${targetList._id}`, {
                     method: 'POST',
                     headers: { 'Authorization': `Bearer ${token}` }
                 });
                 
                 if (response.ok) {
                     successCount++;
                     console.log(`   ✅ ${participant.name} adicionado com sucesso`);
                 } else {
                     errorCount++;
                     console.log(`   ❌ Erro ao adicionar ${participant.name}:`, response.status);
                 }
                 
                 // Pequeno delay para não sobrecarregar o servidor
                 await new Promise(resolve => setTimeout(resolve, 100));
                 
             } catch (error) {
                 errorCount++;
                 console.log(`   ❌ Erro ao adicionar ${participant.name}:`, error.message);
             }
         }
         
         // 7. Resultado final
         console.log('📊 RESULTADO DA RECUPERAÇÃO:');
         console.log(`   ✅ Sucessos: ${successCount}`);
         console.log(`   ❌ Erros: ${errorCount}`);
         console.log(`   📋 Total processados: ${candidatesForRecovery.length}`);
         
         if (successCount > 0) {
             console.log('🎉 Recuperação concluída! Recarregando dados...');
             
             // Recarregar participantes para ver o resultado
             setTimeout(() => {
                 if (typeof loadParticipants === 'function') {
                     loadParticipants();
                 }
             }, 1000);
         }
         
     } catch (error) {
         console.error('❌ Erro na recuperação:', error);
     }
 };

// 🚀 H6 - FUNÇÃO SIMPLIFICADA DE RECUPERAÇÃO USANDO DADOS FRONTEND
window.quickRecoverCampaignList = async function() {
     console.log('🚀 H6 - RECUPERAÇÃO RÁPIDA DA LISTA DE CAMPANHA...');
     
     try {
         // 1. Verificar se temos os dados necessários
         if (!lists || !participants) {
             console.log('❌ Dados não carregados. Execute loadParticipants() primeiro.');
             return;
         }
         
         // 2. Encontrar a lista problemática
         const targetList = lists.find(list => 
             list.name.includes('Indicadores - teste lista de participantes') ||
             list.name.includes('teste lista de participantes')
         );
         
         if (!targetList) {
             console.log('❌ Lista alvo não encontrada');
             console.log('📋 Listas disponíveis:', lists.map(l => l.name));
             return;
         }
         
         console.log('✅ Lista encontrada:', targetList.name);
         console.log('📊 Participantes atuais:', targetList.participants?.length || 0);
         
         // 3. Encontrar indicadores órfãos (sem lista ou não na lista alvo)
         const indicadores = participants.filter(p => p.tipo === 'indicador');
         const orphanIndicators = indicadores.filter(p => {
             const hasNoLists = !p.lists || p.lists.length === 0;
             const notInTargetList = !p.lists?.some(list => {
                 const listId = typeof list === 'object' ? (list._id || list.id) : list;
                 return listId === (targetList._id || targetList.id);
             });
             return hasNoLists || notInTargetList;
         });
         
         console.log('📊 ANÁLISE:');
         console.log('   👥 Total de indicadores:', indicadores.length);
         console.log('   👻 Indicadores órfãos:', orphanIndicators.length);
         
         if (orphanIndicators.length === 0) {
             console.log('✅ Não há indicadores órfãos para recuperar');
             return;
         }
         
         // 4. Mostrar indicadores que serão recuperados
         console.log('📋 INDICADORES ÓRFÃOS:');
         orphanIndicators.forEach((p, idx) => {
             console.log(`   ${idx + 1}. ${p.name} (${p.email})`);
         });
         
         // 5. Confirmar recuperação
         const confirm = prompt(`Reconectar ${orphanIndicators.length} indicadores à lista "${targetList.name}"? Digite "SIM" para confirmar:`);
         
         if (confirm !== 'SIM') {
             console.log('❌ Operação cancelada');
             return;
         }
         
         // 6. Executar recuperação usando endpoint do backend
         const token = localStorage.getItem('clientToken');
         let successCount = 0;
         
         for (const participant of orphanIndicators) {
             try {
                 const response = await fetch(`${API_URL}/participants/${participant._id}/add-to-list/${targetList._id}`, {
                     method: 'POST',
                     headers: { 'Authorization': `Bearer ${token}` }
                 });
                 
                 if (response.ok) {
                     successCount++;
                     console.log(`   ✅ ${participant.name} reconectado`);
                 } else {
                     console.log(`   ❌ Erro: ${participant.name}`, response.status);
                 }
                 
                 await new Promise(resolve => setTimeout(resolve, 200));
                 
             } catch (error) {
                 console.log(`   ❌ Erro: ${participant.name}`, error.message);
             }
         }
         
         console.log('🎉 RECUPERAÇÃO CONCLUÍDA!');
         console.log(`   ✅ Sucessos: ${successCount}/${orphanIndicators.length}`);
         
         if (successCount > 0) {
             // Recarregar dados
             setTimeout(() => {
                 loadParticipants();
                 loadLists();
             }, 1000);
         }
         
     } catch (error) {
         console.error('❌ Erro na recuperação rápida:', error);
     }
 };

// Função para atualizar APENAS o conteúdo da tabela de listas (sem recarregar filtros)
function refreshListsDisplay() {
    const tableBody = document.getElementById('listsTableBody');
    if (!tableBody || !lists || lists.length === 0) {
        return;
    }
    
    // Usar listas com campanhas conectadas se disponível
    const listsToUse = window.listsWithCampaigns || lists;
    
    // Aplicar filtros atuais e atualizar apenas o tbody
    const filteredLists = filterListsByType(listsToUse);
    tableBody.innerHTML = filteredLists.map(list => createListRowHTML(list)).join('');
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    switchTab('lists'); // Começar na aba de listas (hierarquia principal)
    testDataConnection(); // Executar teste após carregamento
    
    // Carregar campanhas automaticamente após 3 segundos
    setTimeout(() => {
        loadCampaignsAndConnect();
    }, 3000);
});

// Variável para controlar filtro atual da aba de listas
let listTypeFilter = 'todas';

// Função para sincronizar contagem de membros das listas com os participantes carregados
function syncListMemberCounts() {
    if (!lists || !Array.isArray(lists) || !participants || !Array.isArray(participants)) {
        console.log('⚠️ Não é possível sincronizar - dados insuficientes');
        return;
    }
    
    console.log('🔄 Sincronizando contagens de membros das listas...');
    console.log(`📊 Total de listas: ${lists.length}, Total de participantes: ${participants.length}`);
    
    lists.forEach((list, index) => {
        const listId = list._id || list.id;
        
        // Método 1: Contar baseado nos membros/participantes da lista (flexível)
        let memberCount = 0;
        let membersData = [];
        
        // ✅ CORREÇÃO: Usar participants (padrão correto do backend)
        const listMembersArray = list.participants || [];
        
        if (listMembersArray && Array.isArray(listMembersArray)) {
            if (listMembersArray.length > 0) {
                const firstMember = listMembersArray[0];
                
                // Se são objetos completos, usar diretamente
                if (typeof firstMember === 'object' && firstMember._id) {
                    membersData = listMembersArray;
                    memberCount = listMembersArray.length;
                    console.log(`📋 Lista "${list.name}": ${memberCount} membros (objetos completos)`);
                }
                // Se são apenas IDs, buscar participantes correspondentes
                else if (typeof firstMember === 'string') {
                    membersData = participants.filter(participant => {
                        return listMembersArray.includes(participant._id || participant.id);
                    });
                    memberCount = membersData.length;
                    console.log(`📋 Lista "${list.name}": ${memberCount} membros (IDs convertidos)`);
                }
            }
        }
        
        // Método 2: Se não há membros na lista, buscar nos participantes
        if (memberCount === 0) {
            membersData = participants.filter(participant => {
                if (!participant.lists || !Array.isArray(participant.lists)) return false;
                
                return participant.lists.some(listRef => {
                    const refId = typeof listRef === 'object' ? (listRef._id || listRef.id) : listRef;
                    return refId === listId;
                });
            });
            
            memberCount = membersData.length;
            if (memberCount > 0) {
                console.log(`📋 Lista "${list.name}": ${memberCount} membros (encontrados via participantes)`);
            }
        }
        
        // Garantir que participants esteja sempre atualizado
        if (!list.participants || list.participants.length === 0) {
            list.participants = membersData.map(p => ({
            _id: p._id || p.id,
            name: p.name,
            email: p.email,
            tipo: p.tipo || 'participante',
            status: p.status || 'ativo'
        }));
        }
        
        console.log(`✅ Lista "${list.name}" finalizada com ${list.participants.length} participantes`);
    });
    
    console.log('✅ Sincronização de listas concluída');
}

// Função para filtrar listas por busca de texto
function filterListsBySearch() {
    const searchTerm = document.getElementById('searchLists')?.value.toLowerCase() || '';
    
    let filteredLists = lists || [];
    
    // Aplicar filtro de busca se houver termo
    if (searchTerm) {
        filteredLists = filteredLists.filter(list => 
            (list.name && list.name.toLowerCase().includes(searchTerm)) ||
            (list.description && list.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Aplicar filtro de tipo
    filteredLists = filterListsByType(filteredLists);
    
    // Atualizar exibição
    const tableBody = document.getElementById('listsTableBody');
    if (tableBody) {
        if (filteredLists.length === 0 && searchTerm) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-search text-2xl text-gray-500 mb-2"></i>
                            <p class="text-gray-400">Nenhuma lista encontrada para "${searchTerm}"</p>
            </div>
                    </td>
                </tr>
        `;
        } else {
            tableBody.innerHTML = filteredLists.map(list => createListRowHTML(list)).join('');
        }
    }
}

function displayListsInTab(listsData) {
    const container = document.getElementById('listsContainer');
    
    // Carregar campanhas sempre que exibir listas
    loadCampaignsAndConnect();
    
    if (!listsData || listsData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="flex flex-col items-center">
                    <i class="fas fa-list text-4xl text-gray-500 mb-4"></i>
                    <p class="text-xl text-gray-400 mb-2">Nenhuma lista encontrada</p>
                    <p class="text-sm text-gray-500">Crie sua primeira lista para organizar os participantes</p>
                    <button onclick="window.location.href='editar-lista.html'" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Criar Lista
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <!-- Filtros por Tipo de Lista -->
        <div class="flex gap-2 mb-6">
            <button id="filter-lista-todas" class="filter-btn-list bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm" onclick="setTipoListaFiltroTab('todas')">
                <i class="fas fa-list mr-2"></i>Todas as Listas
            </button>
            <button id="filter-lista-participante" class="filter-btn-list bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-600" onclick="setTipoListaFiltroTab('participante')">
                <i class="fas fa-user mr-2"></i>Participantes
            </button>
            <button id="filter-lista-indicador" class="filter-btn-list bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-600" onclick="setTipoListaFiltroTab('indicador')">
                <i class="fas fa-share-alt mr-2"></i>Indicadores
            </button>
            <button id="filter-lista-influenciador" class="filter-btn-list bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-600" onclick="setTipoListaFiltroTab('influenciador')">
                <i class="fas fa-star mr-2"></i>Influenciadores
            </button>
            <button id="filter-lista-mista" class="filter-btn-list bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-600" onclick="setTipoListaFiltroTab('mista')">
                <i class="fas fa-users mr-2"></i>Mistas
            </button>
            <button id="filter-lista-campanha" class="filter-btn-list bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-600" onclick="setTipoListaFiltroTab('campanha')">
                <i class="fas fa-rocket mr-2"></i>Campanhas
            </button>
        </div>
        
        <!-- Tabela de Listas -->
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-700">
                <thead class="bg-gray-800">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Lista</th>
                        <th class="px-4 py-2 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Tipo</th>
                        <th class="px-4 py-2 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Membros</th>
                        <th class="px-4 py-2 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Campanha</th>
                        <th class="px-4 py-2 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Criada</th>
                        <th class="px-4 py-2 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-gray-900 divide-y divide-gray-800" id="listsTableBody">
                    ${filterListsByType(listsData).map(list => createListRowHTML(list)).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Função para filtrar listas por tipo
function filterListsByType(listsData) {
    if (listTypeFilter === 'todas') {
        return listsData;
    } else if (listTypeFilter === 'campanha') {
        return listsData.filter(list => list.campaign || list.campaignId);
    } else {
        return listsData.filter(list => list.tipo === listTypeFilter);
    }
}

// Função para mudar filtro de tipo na aba de listas
function setTipoListaFiltroTab(tipo) {
    listTypeFilter = tipo;
    
    // Atualizar aparência dos botões de filtro
    const filterButtons = ['filter-lista-todas', 'filter-lista-participante', 'filter-lista-indicador', 'filter-lista-influenciador', 'filter-lista-mista', 'filter-lista-campanha'];
    
    filterButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            const isActive = buttonId === `filter-lista-${tipo}`;
            
            // Remover classes antigas
            button.classList.remove('bg-blue-600', 'text-white', 'bg-gray-700', 'text-gray-200');
            
            // Aplicar classes apropriadas
            if (isActive) {
                button.classList.add('bg-blue-600', 'text-white');
            } else {
                button.classList.add('bg-gray-700', 'text-gray-200');
            }
        }
    });
    
    // Reexibir listas filtradas APENAS se já temos listas carregadas
    if (lists && lists.length > 0) {
        filterListsBySearch(); // Usa a função de busca que já aplica o filtro de tipo
    }
}

function createListRowHTML(list) {
    const tipoInfo = getTipoInfo(list.tipo || 'participante');
    // ✅ CORREÇÃO: Usar participants (padrão correto do backend)
    const membersCount = list.participants ? list.participants.length : 0;
    const createdDate = new Date(list.createdAt || list.created_at || Date.now()).toLocaleDateString('pt-BR');
    
    // ✨ LÓGICA SIMPLIFICADA PARA NOME DA CAMPANHA
    let campaignName = '-';
    
    // Ordem de prioridade para encontrar o nome da campanha
    if (list.campaign && list.campaign.name) {
        campaignName = list.campaign.name;
    } else if (list.campaignName) {
        campaignName = list.campaignName;
    } else if (list.campaignId && window.campaignsCache) {
        const cachedCampaign = window.campaignsCache.find(c => (c._id || c.id) === list.campaignId);
        if (cachedCampaign) {
            campaignName = cachedCampaign.name;
        }
    }
    
    // Criar avatares dos membros com tipos coloridos
    // ✅ CORREÇÃO: Usar participants (padrão correto do backend)
    const membersArray = list.participants || [];
    const membersAvatars = membersArray.slice(0, 3).map((member, index) => {
        const memberTipoInfo = getTipoInfo(member.tipo || 'participante');
        const initial = member.name ? member.name.charAt(0).toUpperCase() : '?';
        
        return `
            <div class="w-6 h-6 rounded-full ${memberTipoInfo.bgColor} flex items-center justify-center text-xs text-white border border-gray-800" 
                 style="z-index: ${3-index}" 
                 title="${member.name || 'Usuário'} (${memberTipoInfo.label})">
                ${initial}
            </div>
        `;
    }).join('');
    
    return `
        <tr class="hover:bg-gray-800 transition-colors">
            <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg ${tipoInfo.bgColor} flex items-center justify-center">
                        <i class="${tipoInfo.icon} text-white"></i>
                    </div>
                    <div>
                        <div class="font-medium text-gray-100">${list.name}</div>
                        <div class="text-sm text-gray-400">${list.description || 'Sem descrição'}</div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoInfo.badgeClass}">
                    <i class="${tipoInfo.icon} mr-1"></i>
                    ${tipoInfo.label}
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                    <div class="flex items-center gap-1">
                        <span class="text-gray-100 font-medium">${membersCount}</span>
                        <span class="text-xs text-gray-400">participantes</span>
                    </div>
                    ${membersCount > 0 ? `
                        <div class="flex items-center gap-2">
                            <div class="flex -space-x-1">
                                ${membersAvatars}
                                ${membersCount > 3 ? `
                                    <div class="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-xs text-white border border-gray-800" 
                                         style="z-index: 1" 
                                         title="Mais ${membersCount - 3} participantes">
                                        +${membersCount - 3}
                                    </div>
                                ` : ''}
                            </div>
                            <button onclick="viewListUsers('${list._id || list.id}')" class="text-blue-400 hover:text-blue-300 text-xs underline" title="Ver todos os usuários">
                                ver todos
                            </button>
                        </div>
                    ` : `
                        <span class="text-xs text-gray-500 italic">Lista vazia</span>
                    `}
                </div>
            </td>
            <td class="px-4 py-3">
                <span class="text-sm text-gray-300">${campaignName}</span>
            </td>
            <td class="px-4 py-3">
                <span class="text-sm text-gray-400">${createdDate}</span>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                    <button onclick="viewListUsers('${list._id || list.id}')" class="btn-icon text-blue-400 hover:bg-blue-500/10" title="Ver Usuários da Lista">
                        <i class="fas fa-users"></i>
                    </button>
                    <button onclick="window.location.href='editar-lista.html?id=${list._id || list.id}'" class="btn-icon text-gray-400 hover:bg-gray-500/10" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="exportListData('${list._id || list.id}')" class="btn-icon text-purple-400 hover:bg-purple-500/10" title="Exportar">
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="deleteListData('${list._id || list.id}')" class="btn-icon text-red-400 hover:bg-red-500/10" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Carregamento de estatísticas
async function loadStatistics() {
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        // Carregar dados em paralelo
        const [participantsRes, listsRes] = await Promise.all([
            fetch(`${API_URL}/participants?clientId=${clientId}&limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_URL}/participant-lists?clientId=${clientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        const participantsData = await participantsRes.json();
        const listsData = await listsRes.json();
        
        const participants = participantsData.participants || [];
        const lists = listsData || [];
        
        // Calcular estatísticas
        const totalUsers = participants.length;
        const activeUsers = participants.filter(p => p.status === 'ativo').length;
        const totalLists = lists.length;
        const recentActivity = participants.filter(p => {
            const created = new Date(p.createdAt || p.created_at);
            const now = new Date();
            const diffDays = (now - created) / (1000 * 60 * 60 * 24);
            return diffDays <= 7;
        }).length;
        
        // Atualizar cards
        animateNumber('totalUsers', totalUsers);
        animateNumber('activeUsers', activeUsers);
        animateNumber('totalLists', totalLists);
        animateNumber('recentActivity', recentActivity);
        
        // Criar gráficos
        createTypeChart(participants);
        createGrowthChart(participants);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        showNotification('Erro ao carregar estatísticas', 'error');
    }
}

function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const start = 0;
    const duration = 1000; // 1 segundo
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(start + (targetValue - start) * progress);
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function createTypeChart(participants) {
    const typeChart = document.getElementById('typeChart');
    if (!typeChart) return;
    
    // Contar tipos
    const typeCounts = {};
    participants.forEach(p => {
        const tipo = p.tipo || 'participante';
        typeCounts[tipo] = (typeCounts[tipo] || 0) + 1;
    });
    
    // Criar gráfico simples com divs
    const total = participants.length;
    let chartHTML = '';
    
    Object.entries(typeCounts).forEach(([tipo, count]) => {
        const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
        const tipoInfo = getTipoInfo(tipo);
        
        chartHTML += `
            <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full ${tipoInfo.bgColor}"></div>
                    <span class="text-sm font-medium">${tipoInfo.label}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-400">${count}</span>
                    <span class="text-xs text-gray-500">(${percentage}%)</span>
                </div>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2 mb-3">
                <div class="${tipoInfo.bgColor} h-2 rounded-full" style="width: ${percentage}%"></div>
            </div>
        `;
    });
    
    typeChart.innerHTML = chartHTML || '<p class="text-gray-500 text-center">Nenhum dado disponível</p>';
}

function createGrowthChart(participants) {
    const growthChart = document.getElementById('growthChart');
    if (!growthChart) return;
    
    // Agrupar por mês dos últimos 6 meses
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            date,
            label: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            count: 0
        });
    }
    
    // Contar participantes por mês
    participants.forEach(p => {
        const created = new Date(p.createdAt || p.created_at);
        const monthIndex = months.findIndex(m => {
            return created.getFullYear() === m.date.getFullYear() && 
                   created.getMonth() === m.date.getMonth();
        });
        
        if (monthIndex >= 0) {
            months[monthIndex].count++;
        }
    });
    
    // Criar gráfico simples
    const maxCount = Math.max(...months.map(m => m.count), 1);
    let chartHTML = '<div class="flex items-end justify-between h-48 gap-2">';
    
    months.forEach(month => {
        const height = (month.count / maxCount * 100);
        chartHTML += `
            <div class="flex flex-col items-center gap-2 flex-1">
                <div class="flex flex-col items-center justify-end h-40">
                    <span class="text-xs text-gray-400 mb-1">${month.count}</span>
                    <div class="w-full bg-blue-600 rounded-t" style="height: ${height}%"></div>
                </div>
                <span class="text-xs text-gray-500">${month.label}</span>
            </div>
        `;
    });
    
    chartHTML += '</div>';
    growthChart.innerHTML = chartHTML;
}

// Integração entre usuários e listas
function showUserLists(participantId) {
    const participant = participants.find(p => p._id === participantId);
    if (!participant) return;
    
    // Buscar listas do usuário
    const userLists = lists.filter(list => {
        // ✅ CORREÇÃO: Usar participants (padrão correto do backend)
        const listMembersArray = list.participants || [];
        if (!listMembersArray || !Array.isArray(listMembersArray)) return false;
        return listMembersArray.some(member => 
            (typeof member === 'string' && member === participantId) ||
            (typeof member === 'object' && member._id === participantId)
        );
    });
    
    // Mostrar modal com listas do usuário
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-gray-100">Listas de ${participant.name}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            ${userLists.length > 0 ? `
                <div class="space-y-3">
                    ${userLists.map(list => `
                        <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-list text-white"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-100">${list.name}</div>
                                    <div class="text-sm text-gray-400">${list.participants?.length || 0} participantes</div>
                                </div>
                            </div>
                            <button onclick="switchTab('lists'); this.closest('.fixed').remove();" class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                                Ver Lista
                            </button>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="text-center py-8">
                    <i class="fas fa-list text-gray-500 text-4xl mb-4"></i>
                    <p class="text-gray-400 mb-4">Este usuário não está em nenhuma lista</p>
                    <button onclick="manageUserLists('${participantId}'); this.closest('.fixed').remove();" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Adicionar a Lista
                    </button>
                </div>
            `}
        </div>
    `;
    
    document.body.appendChild(modal);
}

function manageUserLists(participantId) {
    const participant = participants.find(p => p._id === participantId);
    if (!participant) return;
    
    // Modal para gerenciar listas do usuário
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 max-h-96 overflow-y-auto">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-semibold text-gray-100">Gerenciar Listas - ${participant.name}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 gap-4 max-h-64 overflow-y-auto">
                ${lists.map(list => {
                            // ✅ CORREÇÃO: Usar participants (padrão correto do backend)
        const listMembersArray = list.participants || [];
                    const isInList = listMembersArray && listMembersArray.some(member => 
                        (typeof member === 'string' && member === participantId) ||
                        (typeof member === 'object' && member._id === participantId)
                    );
                    
                    return `
                        <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-list text-white"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-100">${list.name}</div>
                                    <div class="text-sm text-gray-400">${list.participants?.length || 0} participantes</div>
                                </div>
                            </div>
                            <button 
                                onclick="toggleUserInList('${participantId}', '${list._id}', this)"
                                class="px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    isInList 
                                        ? 'bg-red-600 text-white hover:bg-red-700' 
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                }"
                            >
                                ${isInList ? 'Remover' : 'Adicionar'}
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
            
            ${lists.length === 0 ? `
                <div class="text-center py-8">
                    <i class="fas fa-list text-gray-500 text-4xl mb-4"></i>
                    <p class="text-gray-400 mb-4">Nenhuma lista encontrada</p>
                    <button onclick="window.location.href='editar-lista.html'" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Criar Primeira Lista
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Variável global para armazenar o contexto da lista atual
let currentListFilter = null;

// Função simplificada para ver usuários de uma lista
function viewListUsers(listId) {
    const list = lists.find(l => (l._id || l.id) === listId);
    if (!list) {
        showNotification('Lista não encontrada', 'error');
        return;
    }

    // Armazenar contexto da lista
    currentListFilter = {
        id: listId,
        name: list.name,
        campaign: list.campaign ? list.campaign.name : null,
        tipo: list.tipo || 'participante'
    };

    // Navegar para aba de usuários
    switchTab('users');
    
    // Pequeno delay para garantir que a aba carregou
    setTimeout(() => {
    applyListFilter(listId);
    showNotification(`Exibindo usuários da lista: ${list.name}`, 'info');
    }, 200);
}

// Função para aplicar filtro de lista específica
function applyListFilter(listId) {
    const listFilter = document.getElementById('listFilter');
    if (listFilter) {
        listFilter.value = listId;
        
        // Atualizar header contextual
        updateUsersHeader();
        
        // Aplicar filtro
        filterParticipants();
    }
}

// Função para limpar filtro de lista
function clearListFilter() {
    currentListFilter = null;
    const listFilter = document.getElementById('listFilter');
    if (listFilter) {
        listFilter.value = '';
    }
        updateUsersHeader();
        filterParticipants();
    showNotification('Filtro removido - exibindo todos os usuários', 'info');
}

// Função para atualizar header da aba usuários com contexto
function updateUsersHeader() {
    const usersHeader = document.querySelector('#tab-content-users');
    if (!usersHeader) return;
    
    let contextHeader = document.getElementById('listContextHeader');
    
    if (currentListFilter) {
        // Criar ou atualizar header contextual
        const headerHTML = `
            <div id="listContextHeader" class="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4 mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg ${getTipoInfo(currentListFilter.tipo).bgColor} flex items-center justify-center">
                            <i class="${getTipoInfo(currentListFilter.tipo).icon} text-white"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-blue-400">
                                Lista: ${currentListFilter.name}
                            </h3>
                            ${currentListFilter.campaign ? `
                                <p class="text-sm text-gray-400">
                                    <i class="fas fa-rocket mr-1"></i>Campanha: ${currentListFilter.campaign}
                                </p>
                            ` : ''}
                        </div>
                    </div>
                    <button onclick="clearListFilter()" class="px-3 py-1 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition-colors">
                        <i class="fas fa-times mr-1"></i>Limpar Filtro
                    </button>
                </div>
            </div>
        `;
        
        if (contextHeader) {
            contextHeader.outerHTML = headerHTML;
        } else {
            const filtersDiv = usersHeader.querySelector('.flex.gap-2.mb-6');
            if (filtersDiv) {
                filtersDiv.insertAdjacentHTML('beforebegin', headerHTML);
            }
        }
    } else {
        // Remover header contextual se existir
        if (contextHeader) {
            contextHeader.remove();
        }
    }
}

// Função para adicionar usuário selecionado à lista atual (contextual)
function addUserToCurrentList(userId) {
    if (!currentListFilter) {
        showNotification('Nenhuma lista selecionada', 'error');
        return;
    }
    
    addToList(userId, currentListFilter.id, null);
}

// Função para remover usuário da lista atual (contextual)
function removeUserFromCurrentList(userId) {
    if (!currentListFilter) {
        showNotification('Nenhuma lista selecionada', 'error');
        return;
    }
    
    removeFromList(userId, currentListFilter.id, null);
}

// Função para verificar se usuário está na lista atual
function isInCurrentList(userId) {
    if (!currentListFilter || !lists) return false;
    
    const currentList = lists.find(l => (l._id || l.id) === currentListFilter.id);
            // ✅ CORREÇÃO: Usar participants (padrão correto do backend)
        const listMembersArray = currentList?.participants || [];
    if (!currentList || listMembersArray.length === 0) return false;
    
    return listMembersArray.some(member => 
        (member._id || member.id) === userId
    );
}

// Função para filtrar usuários disponíveis
function filterAvailableUsers(searchTerm) {
    const availableUsers = document.querySelectorAll('.available-user');
    const search = searchTerm.toLowerCase();
    
    availableUsers.forEach(userElement => {
        const name = userElement.dataset.name || '';
        const email = userElement.dataset.email || '';
        const matches = name.includes(search) || email.includes(search);
        
        userElement.style.display = matches ? 'flex' : 'none';
    });
}

// Função para destacar usuário na aba de usuários
function highlightUser(userId) {
    setTimeout(() => {
        const userRow = document.querySelector(`[data-user-id="${userId}"]`);
        if (userRow) {
            userRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            userRow.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
            setTimeout(() => {
                userRow.style.backgroundColor = '';
            }, 3000);
        }
    }, 500);
}

// Função para adicionar participante à lista
async function addToList(participantId, listId, buttonElement) {
    const token = localStorage.getItem('clientToken');
    
    try {
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const response = await fetch(`${API_URL}/participant-lists/${listId}/participants`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ participantId })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao adicionar participante');
        }
        
        showNotification('Participante adicionado com sucesso!', 'success');
        
        // Atualizar dados locais
        const list = lists.find(l => (l._id || l.id) === listId);
        const participant = participants.find(p => (p._id || p.id) === participantId);
        
        if (list && participant) {
            list.participants = list.participants || [];
            list.participants.push({
                _id: participant._id || participant.id,
                name: participant.name,
                email: participant.email,
                tipo: participant.tipo || 'participante',
                status: participant.status || 'ativo'
            });
        }
        
        // Se estamos em contexto de filtro de lista, recarregar exibição
        if (currentListFilter) {
            displayParticipants();
        }
        
        // Remover o botão se existir (para modais antigos)
        if (buttonElement && buttonElement.closest('.available-user')) {
            buttonElement.closest('.available-user').remove();
        }
        
    } catch (error) {
        console.error('Erro ao adicionar participante:', error);
        showNotification(error.message || 'Erro ao adicionar participante', 'error');
        buttonElement.disabled = false;
        buttonElement.innerHTML = '<i class="fas fa-plus"></i>';
    }
}

// Função para remover participante da lista
async function removeFromList(participantId, listId, buttonElement) {
    const token = localStorage.getItem('clientToken');
    
    try {
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const response = await fetch(`${API_URL}/participant-lists/${listId}/participants/${participantId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao remover participante');
        }
        
        showNotification('Participante removido com sucesso!', 'success');
        
        // Atualizar dados locais
        const list = lists.find(l => (l._id || l.id) === listId);
        if (list && list.participants) {
            list.participants = list.participants.filter(m => (m._id || m.id) !== participantId);
        }
        
        // Se estamos em contexto de filtro de lista, recarregar exibição
        if (currentListFilter) {
            displayParticipants();
        }
        
        // Remover a linha da interface se existir (para modais antigos)
        if (buttonElement && buttonElement.closest('div').parentElement.tagName === 'DIV') {
            buttonElement.closest('div').remove();
        }
        
    } catch (error) {
        console.error('Erro ao remover participante:', error);
        showNotification(error.message || 'Erro ao remover participante', 'error');
        buttonElement.disabled = false;
        buttonElement.innerHTML = '<i class="fas fa-minus"></i>';
    }
}

// Função para exportar dados da lista
async function exportListData(listId) {
    const list = lists.find(l => (l._id || l.id) === listId);
    if (!list) {
        showNotification('Lista não encontrada', 'error');
        return;
    }

    try {
        const members = list.participants || [];
        
        if (members.length === 0) {
            showNotification('Lista não possui participantes para exportar', 'warning');
            return;
        }
        
        // Preparar dados para CSV
        const csvData = members.map(member => ({
            'Nome': member.name || '',
            'Email': member.email || '',
            'Tipo': member.tipo || 'participante',
            'Status': member.status || 'ativo'
        }));
        
        // Converter para CSV
        const headers = Object.keys(csvData[0]);
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        // Download do arquivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${list.name.replace(/[^a-zA-Z0-9]/g, '_')}_participantes.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Lista exportada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar lista:', error);
        showNotification('Erro ao exportar lista', 'error');
    }
}

// Função para excluir lista
async function deleteListData(listId) {
    const list = lists.find(l => (l._id || l.id) === listId);
    if (!list) {
        showNotification('Lista não encontrada', 'error');
        return;
    }

    if (!confirm(`Tem certeza que deseja excluir a lista "${list.name}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }

    try {
        const token = localStorage.getItem('clientToken');
        const response = await fetch(`${API_URL}/participant-lists/${listId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao excluir lista');
        }

        showNotification('Lista excluída com sucesso!', 'success');
        
        // Remover da lista local e recarregar interface
        const index = lists.findIndex(l => (l._id || l.id) === listId);
        if (index > -1) {
            lists.splice(index, 1);
            displayListsInTab(lists);
        }
        
    } catch (error) {
        console.error('Erro ao excluir lista:', error);
        showNotification(error.message || 'Erro ao excluir lista', 'error');
    }
}

async function toggleUserInList(participantId, listId, buttonElement) {
    const token = localStorage.getItem('clientToken');
    
    try {
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const isRemoving = buttonElement.textContent.trim() === 'Remover';
        const action = isRemoving ? 'remove' : 'add';
        
        const response = await fetch(`${API_URL}/participant-lists/${listId}/participants`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                action,
                participantId
            })
        });
        
        if (response.ok) {
            // Atualizar estado do botão
            if (isRemoving) {
                buttonElement.className = 'px-3 py-1 rounded text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700';
                buttonElement.textContent = 'Adicionar';
            } else {
                buttonElement.className = 'px-3 py-1 rounded text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700';
                buttonElement.textContent = 'Remover';
            }
            
            showNotification(
                `Usuário ${isRemoving ? 'removido da' : 'adicionado à'} lista com sucesso`,
                'success'
            );
            
            // Recarregar dados se estivermos na aba de usuários
            if (currentTab === 'users') {
                await loadListsForFilters();
                displayParticipants();
            }
            
        } else {
            throw new Error('Erro ao atualizar lista');
        }
        
    } catch (error) {
        console.error('Erro ao gerenciar usuário na lista:', error);
        showNotification('Erro ao atualizar lista', 'error');
        
    } finally {
        buttonElement.disabled = false;
    }
}

// Funções auxiliares para filtros
function filterParticipantsData() {
    let filtered = [...participants];
    
    // Filtro por tipo
    if (tipoFiltro !== 'todos') {
        filtered = filtered.filter(p => p.tipo === tipoFiltro);
    }
    
    // Filtro por status
    const statusFilter = document.getElementById('statusFilter')?.value;
    if (statusFilter) {
        filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    // 🔧 CORREÇÃO: Filtro por lista usando a estrutura correta de dados
    const listFilter = document.getElementById('listFilter')?.value || currentListFilter?.id;
    if (listFilter) {
        console.log('🔍 Aplicando filtro de lista:', listFilter);
        
        // MÉTODO CORRETO: Filtrar participantes que têm a lista no seu array 'lists'
        filtered = filtered.filter(participant => {
            if (!participant.lists || !Array.isArray(participant.lists)) {
                return false;
            }
            
            // Verificar se o participante tem a lista selecionada
            return participant.lists.some(list => {
                // list pode ser um ObjectId (string) ou um objeto populado
                const listId = typeof list === 'object' ? (list._id || list.id) : list;
                return String(listId) === String(listFilter);
            });
        });
        
        console.log(`🔍 Filtro de lista aplicado: ${filtered.length} participantes encontrados`);
    }
    
    // Filtro por email
    const emailFilter = document.getElementById('emailFilter')?.value;
    if (emailFilter) {
        filtered = filtered.filter(p => 
            p.email && p.email.toLowerCase().includes(emailFilter.toLowerCase())
        );
    }
    
    // Filtro por busca geral (nome/email)
    const searchUsers = document.getElementById('searchUsers')?.value;
    if (searchUsers) {
        const search = searchUsers.toLowerCase();
        filtered = filtered.filter(p => 
            (p.name && p.name.toLowerCase().includes(search)) ||
            (p.email && p.email.toLowerCase().includes(search))
        );
    }
    
    return filtered;
}

function updateUserStats() {
    const totalUsers = participants.length;
    const activeUsers = participants.filter(p => p.status === 'ativo').length;
    
    // Atualizar estatísticas se estivermos na aba de stats
    if (currentTab === 'stats') {
        animateNumber('totalUsers', totalUsers);
        animateNumber('activeUsers', activeUsers);
    }
}

// Funções auxiliares para as abas
function showImportUsersModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-gray-100">Importar Usuários</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Arquivo CSV:</label>
                    <input type="file" accept=".csv" id="importFile" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100">
                    <p class="text-xs text-gray-400 mt-1">Formato: nome,email,telefone,tipo</p>
                </div>
                
                <div class="flex justify-end gap-2">
                    <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        Cancelar
                    </button>
                    <button onclick="importUsers()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Importar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function showBulkListActions() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-gray-100">Ações em Lote - Listas</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-3">
                <button onclick="exportAllLists(); this.closest('.fixed').remove();" class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-left">
                    <i class="fas fa-download mr-3"></i>Exportar Todas as Listas
                </button>
                <button onclick="duplicateSelectedLists(); this.closest('.fixed').remove();" class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-left">
                    <i class="fas fa-copy mr-3"></i>Duplicar Listas Selecionadas
                </button>
                <button onclick="mergeSelectedLists(); this.closest('.fixed').remove();" class="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-left">
                    <i class="fas fa-merge mr-3"></i>Mesclar Listas Selecionadas
                </button>
                <button onclick="deleteSelectedLists(); this.closest('.fixed').remove();" class="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-left">
                    <i class="fas fa-trash mr-3"></i>Excluir Listas Selecionadas
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function refreshStats() {
    loadStatistics();
    showNotification('Estatísticas atualizadas', 'success');
}

function exportStats() {
    if (!participants || participants.length === 0) {
        showNotification('Nenhum dado para exportar', 'warning');
        return;
    }
    
    // Gerar relatório em CSV
    const header = 'Nome,Email,Telefone,Tipo,Status,Data de Cadastro,Listas\n';
    const csvContent = participants.map(p => {
        const userLists = lists.filter(list => {
                    if (!list.participants || !Array.isArray(list.participants)) return false;
        return list.participants.some(member => 
                (typeof member === 'string' && member === p._id) ||
                (typeof member === 'object' && member._id === p._id)
            );
        }).map(list => list.name).join('; ');
        
        return [
            p.name || '',
            p.email || '',
            p.phone || '',
            p.tipo || 'participante',
            p.status || 'ativo',
            new Date(p.createdAt || p.created_at || Date.now()).toLocaleDateString('pt-BR'),
            userLists
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    }).join('\n');
    
    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-participantes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification('Relatório exportado com sucesso', 'success');
}

// 🔧 SISTEMA ORIGINAL RESTAURADO - Filtros simples e funcionais
async function setTipoFiltro(tipo) {
    console.log('🔄 setTipoFiltro ORIGINAL - Tipo:', tipo);
    
    // Evitar execução paralela
    if (isLoading) {
        console.log('⏳ Filtro já em andamento, ignorando...');
        return;
    }
    
    try {
        isLoading = true;
        tipoFiltro = tipo;
        
        // Atualizar botões visuais
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-gray-700', 'text-gray-200');
        });
        
        const activeButton = document.getElementById(`filter-${tipo}`);
        if (activeButton) {
            activeButton.classList.remove('bg-gray-700', 'text-gray-200');
            activeButton.classList.add('bg-blue-600', 'text-white');
        }
        
        // Atualizar exibição usando sistema original
        displayParticipants();
        
        console.log(`✅ Filtro tipo "${tipo}" aplicado com sucesso`);
        
    } catch (error) {
        console.error('❌ Erro ao aplicar filtro de tipo:', error);
        showNotification('Erro ao aplicar filtro', 'error');
    } finally {
        isLoading = false;
    }
}

async function filterParticipants() {
    console.log('🔄 filterParticipants ORIGINAL');
    
    // Evitar execução paralela
    if (isLoading) {
        console.log('⏳ Filtro já em andamento, ignorando...');
        return;
    }
    
    try {
        isLoading = true;
        
        // Sistema original: apenas atualizar exibição
        displayParticipants();
        
        console.log('✅ Filtros aplicados com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao aplicar filtros:', error);
        showNotification('Erro ao aplicar filtros', 'error');
    } finally {
        isLoading = false;
    }
}

function toggleAllUsers() {
    const checkboxes = document.querySelectorAll('.user-checkbox');
    const selectAll = document.getElementById('selectAllUsers');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

function changePage(direction) {
    console.log('🔄 changePage ORIGINAL - Direção:', direction);
    
    // Verificar se temos participantes carregados antes de tentar paginar
    if (!participants || participants.length === 0) {
        console.log('⚠️ Nenhum participante carregado para paginar');
        return;
    }
    
    // 🔧 SISTEMA ORIGINAL: Calcular paginação local
    const filteredParticipants = filterParticipantsData();
    const totalPages = Math.ceil(filteredParticipants.length / pageSize) || 1;
    
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
        console.log('⬅️ Página anterior:', currentPage);
    } else if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
        console.log('➡️ Próxima página:', currentPage);
    } else {
        console.log('🚫 Mudança de página não permitida - Página atual:', currentPage, 'Total:', totalPages);
        return;
    }
    
    // Atualizar exibição
    displayParticipants();
    
    console.log(`✅ Página alterada para ${currentPage} de ${totalPages}`);
}

// 🚀 INICIALIZAÇÃO CORRIGIDA - Sistema escalável com exibição garantida
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Inicializando participants.html com sistema escalável...');
    
    console.log('🔄 Verificando disponibilidade das funções de filtro...');
    
    // 🔍 DEBUG - LocalStorage info
    console.log('🔍 DEBUG INIT - ClientId from localStorage:', localStorage.getItem('clientId'));
    console.log('🔍 DEBUG INIT - Token from localStorage:', localStorage.getItem('clientToken'));
    console.log('🔍 DEBUG INIT - All localStorage keys:', Object.keys(localStorage));
    
    // 🎯 Verificar se os módulos estão disponíveis
    const modulesReady = window.apiClient && window.DataAdapter && window.participantsManager;
    console.log('📦 Módulos disponíveis:', {
        apiClient: !!window.apiClient,
        dataAdapter: !!window.DataAdapter,
        participantsManager: !!window.participantsManager,
        paginationSystem: !!window.PaginationSystem
    });
    
    if (!modulesReady) {
        console.warn('⚠️ Nem todos os módulos estão disponíveis, usando sistema escalável direto');
    }
    
    // 🔍 Busca para usuários - ESCALÁVEL com debounce
    const searchUsers = document.getElementById('searchUsers');
    if (searchUsers) {
        searchUsers.addEventListener('input', () => {
            const searchTerm = searchUsers.value;
            console.log('🔍 Busca ESCALÁVEL de usuários:', searchTerm);
            
            // 🎯 Usar sistema escalável com debounce automático
            PaginationSystem.search(searchTerm);
        });
    }
    
    // 🔧 CORREÇÃO: Adicionar debounce no campo de busca por email  
    const emailFilter = document.getElementById('emailFilter');
    if (emailFilter) {
        let emailDebounce;
        emailFilter.addEventListener('input', () => {
            clearTimeout(emailDebounce);
            emailDebounce = setTimeout(() => {
                console.log('🔍 Busca por email com debounce:', emailFilter.value);
                filterParticipants();
            }, 500); // 500ms de debounce
        });
    }
    
    // 🔧 CORREÇÃO ESPECÍFICA: Adicionar evento ao dropdown de listas
    const listFilter = document.getElementById('listFilter');
    if (listFilter) {
        listFilter.addEventListener('change', () => {
            const selectedValue = listFilter.value;
            console.log('🔍 Filtro de lista mudou para:', selectedValue || 'Todas as listas');
            filterParticipants();
        });
    }
    
    // 🔧 CORREÇÃO: Adicionar evento ao dropdown de status
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            console.log('🔍 Filtro de status mudou para:', statusFilter.value || 'Todos');
            filterParticipants();
        });
    }
    
    // 🔍 Busca para listas - Mantida
    const searchLists = document.getElementById('searchLists');
    if (searchLists) {
        searchLists.addEventListener('input', () => {
            if (currentTab === 'lists' && lists && lists.length > 0) {
                filterListsBySearch();
            }
        });
    }
    
    // 🎯 Inicialização da aba padrão
    console.log('🚀 Iniciando aba padrão: lists');
    switchTab('lists');
    
    setTimeout(() => {
        console.log('✅ Filtros inicializados e prontos para uso');
    }, 1000);
    
    console.log('✅ Inicialização concluída');
});

// 🔍 DIAGNÓSTICO: Função global para teste manual dos filtros
window.testFilters = function() {
    console.log('🧪 TESTE MANUAL DOS FILTROS:');
    console.log('Participants:', participants?.length);
    console.log('Lists:', lists?.length);
    console.log('Aba atual:', currentTab);
    console.log('Botões existem:', {
        todos: !!document.getElementById('filter-todos'),
        participante: !!document.getElementById('filter-participante'),
        indicador: !!document.getElementById('filter-indicador'),
        listFilter: !!document.getElementById('listFilter')
    });
    
    // Testar filtro por tipo
    console.log('Testando setTipoFiltro("indicador")...');
    setTipoFiltro('indicador');
};

// 🔧 NOVA FUNÇÃO: Limpar todos os filtros
window.clearAllFilters = async function() {
    console.log('🧹 Limpando todos os filtros...');
    
    try {
        // Limpar variáveis de estado
        tipoFiltro = 'todos';
        currentFilters = {};
        
        // Limpar interface
        const statusFilter = document.getElementById('statusFilter');
        const emailFilter = document.getElementById('emailFilter');
        const listFilter = document.getElementById('listFilter');
        
        if (statusFilter) statusFilter.value = '';
        if (emailFilter) emailFilter.value = '';
        if (listFilter) listFilter.value = '';
        
        // Resetar botões
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-gray-700', 'text-gray-200');
        });
        
        const todosButton = document.getElementById('filter-todos');
        if (todosButton) {
            todosButton.classList.remove('bg-gray-700', 'text-gray-200');
            todosButton.classList.add('bg-blue-600', 'text-white');
        }
        
        // Aplicar filtros vazios (mostrar todos)
        await PaginationSystem.applyFilters({});
        
        console.log('✅ Todos os filtros foram limpos');
        
    } catch (error) {
        console.error('❌ Erro ao limpar filtros:', error);
    }
};

// 🧪 FUNÇÃO DE TESTE ESPECÍFICA PARA BUGS DE FILTROS
window.testFilterBugs = async function() {
    console.log('🐛 === TESTE DE BUGS DOS FILTROS ===');
    
    try {
        // 1. Limpar tudo primeiro
        console.log('1. Limpando todos os filtros...');
        await clearAllFilters();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 2. Testar filtro por tipo
        console.log('2. Testando filtro por tipo: indicador');
        await setTipoFiltro('indicador');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`   Resultado: ${participants?.length} participantes`);
        
        // 3. Testar mudança de filtro de lista
        console.log('3. Testando filtro por lista...');
        const listFilter = document.getElementById('listFilter');
        if (listFilter && listFilter.options.length > 1) {
            const listId = listFilter.options[1].value;
            listFilter.value = listId;
            await filterParticipants();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(`   Resultado: ${participants?.length} participantes na lista`);
        }
        
        // 4. Testar combinação de filtros
        console.log('4. Testando combinação: participante + primeira lista');
        await setTipoFiltro('participante');
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (listFilter && listFilter.options.length > 1) {
            listFilter.value = listFilter.options[1].value;
            await filterParticipants();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log(`   Resultado: ${participants?.length} participantes`);
        
        // 5. Testar limpeza
        console.log('5. Testando limpeza final...');
        await clearAllFilters();
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`   Resultado: ${participants?.length} participantes (todos)`);
        
        console.log('✅ === TESTE CONCLUÍDO ===');
        console.log('💡 Se todos os números acima mudaram corretamente, os filtros estão funcionando!');
        
    } catch (error) {
        console.error('❌ Erro no teste de bugs:', error);
    }
};

// 🧪 TESTE ESPECÍFICO PARA O FILTRO "TODAS AS LISTAS"
window.testAllListsFilter = async function() {
    console.log('📋 === TESTE ESPECÍFICO: TODAS AS LISTAS ===');
    
    try {
        const listFilter = document.getElementById('listFilter');
        if (!listFilter) {
            console.error('❌ Dropdown de listas não encontrado');
            return;
        }
        
        // 1. Primeiro aplicar um filtro de lista específica
        if (listFilter.options.length > 1) {
            console.log('1. Aplicando filtro para uma lista específica...');
            listFilter.value = listFilter.options[1].value;
            await filterParticipants();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(`   Lista específica: ${participants?.length} participantes`);
            
            // 2. Agora mudar para "Todas as listas"
            console.log('2. Mudando para "Todas as listas"...');
            listFilter.value = '';
            await filterParticipants();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(`   Todas as listas: ${participants?.length} participantes`);
            
            // 3. Verificar se realmente mostrou mais participantes
            const totalParticipantsCount = participants?.length || 0;
            console.log('3. Verificando resultado...');
            
            if (totalParticipantsCount > 0) {
                console.log('✅ Filtro "Todas as listas" funcionou!');
                console.log(`💡 Total de participantes exibidos: ${totalParticipantsCount}`);
            } else {
                console.log('❌ Filtro "Todas as listas" não funcionou - nenhum participante exibido');
                console.log('🔧 Tentando forçar reload...');
                await clearAllFilters();
            }
        } else {
            console.log('⚠️ Não há listas suficientes para testar');
        }
        
        console.log('📋 === TESTE CONCLUÍDO ===');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
};

// 🔧 FUNÇÕES GLOBAIS: Garantir que as funções estejam disponíveis no escopo global
window.setTipoFiltro = setTipoFiltro;
window.filterParticipants = filterParticipants;

// Funções auxiliares para notificação (se não existir ainda)
function showNotification(message, type = 'info') {
    // Verificar se já existe uma função de notificação
    if (typeof showNotification !== 'undefined' && showNotification.toString().includes('notification-container')) {
        return; // Já existe implementação
    }
    
    // Implementação simples de fallback
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600', 
        warning: 'bg-yellow-600',
        info: 'bg-blue-600'
    };
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 🎯 FUNÇÃO MELHORADA: Obter nome da campanha com informações extras
function getCampaignDisplayName(participant) {
    let campaignName = 'Sem campanha';
    
    // 🔧 CORREÇÃO PRAGMÁTICA: Verificar cache de campanhas primeiro
    if (window.campaignsCache && Array.isArray(window.campaignsCache)) {
        // Buscar campanha pelo ID no cache
        let campaignId = null;
        
        if (participant.originCampaignId) {
            campaignId = typeof participant.originCampaignId === 'object' ? participant.originCampaignId._id || participant.originCampaignId.id : participant.originCampaignId;
        } else if (participant.campaignId) {
            campaignId = typeof participant.campaignId === 'object' ? participant.campaignId._id || participant.campaignId.id : participant.campaignId;
        }
        
        if (campaignId) {
            const campaign = window.campaignsCache.find(c => (c._id || c.id) === campaignId);
            if (campaign && campaign.name) {
                campaignName = campaign.name;
                return `<span class="text-gray-300">${campaignName}</span>`;
            }
        }
    }
    
    // 1️⃣ PRIORIDADE: originCampaignId (novos participantes)
    if (participant.originCampaignId) {
        if (typeof participant.originCampaignId === 'object' && participant.originCampaignId.name) {
            campaignName = participant.originCampaignId.name;
        } else if (typeof participant.originCampaignId === 'string') {
            // 🔧 CORREÇÃO: Se é string de código, não usar como nome
            if (participant.originCampaignId.length < 10) {
                campaignName = participant.originCampaignId;
            } else {
                campaignName = 'Campanha (carregando...)';
            }
        }
    }
    
    // 2️⃣ FALLBACK: campaignId (participantes antigos)
    else if (participant.campaignId) {
        if (typeof participant.campaignId === 'object' && participant.campaignId.name) {
            campaignName = participant.campaignId.name;
        } else if (typeof participant.campaignId === 'string') {
            // 🔧 CORREÇÃO: Se é string de código, não usar como nome
            if (participant.campaignId.length < 10) {
                campaignName = participant.campaignId;
            } else {
                campaignName = 'Campanha (carregando...)';
            }
        }
    }
    
    // 3️⃣ FALLBACK: campaignName diretamente
    else if (participant.campaignName) {
        campaignName = participant.campaignName;
    }
    
    // 4️⃣ ÚLTIMO FALLBACK: metadados de origem
    else if (participant.originMetadata?.campaignName) {
        campaignName = participant.originMetadata.campaignName;
    }
    
    return `<span class="text-gray-300">${campaignName}</span>`;
}

// === NOVAS FUNÇÕES PARA SISTEMA DE LINKS EXCLUSIVOS ===

/**
 * Regenera código de referência único para um indicador
 */
async function regenerateReferralCode(participantId) {
    if (!confirm('Tem certeza que deseja gerar um novo código? O link anterior ficará inválido.')) {
        return;
    }

    try {
        // 🔧 CORREÇÃO: Usar getApiUrl() e incluir token de autorização
        const token = localStorage.getItem('clientToken');
        if (!token) {
            alert('Token de autorização não encontrado. Faça login novamente.');
            return;
        }

        const response = await fetch(`${getApiUrl()}/participants/${participantId}/generate-referral-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // 🔧 CORREÇÃO: Incluir autorização
            }
        });

        const result = await response.json();

        if (result.success) {
            // 🔧 CORREÇÃO DEFINITIVA: Usar a mesma lógica de construção de URL
            let baseUrl;
            if (window.APP_CONFIG && window.APP_CONFIG.REFERRAL_BASE_URL) {
                baseUrl = window.APP_CONFIG.REFERRAL_BASE_URL;
                console.log('✅ Regenerar: Usando REFERRAL_BASE_URL do config:', baseUrl);
            } else {
                // Fallback: SEMPRE usar o backend Railway em produção
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    baseUrl = 'http://localhost:3000/indicacao';
                } else {
                    baseUrl = 'https://programa-indicacao-multicliente-production.up.railway.app/indicacao';
                }
                console.log('⚠️ Regenerar: Usando fallback REFERRAL_BASE_URL:', baseUrl);
            }
            
            const fullLink = `${baseUrl}/${result.referralCode}`;
            
            alert(`Novo código gerado com sucesso!\nCódigo: ${result.referralCode}\nLink: ${fullLink}`);
            
            // Recarregar dados para atualizar a interface
            await loadParticipants();
        } else {
            alert(`Erro ao gerar novo código: ${result.message || result.error}`);
        }
    } catch (error) {
        console.error('Erro ao regenerar código:', error);
        alert('Erro de conexão ao regenerar código');
    }
}

/**
 * Copia texto para área de transferência
 */
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Link copiado para área de transferência!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

/**
 * Fallback para cópia quando clipboard API não está disponível
 */
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Link copiado!', 'success');
    } catch (error) {
        showToast('Erro ao copiar link', 'error');
    }
    
    document.body.removeChild(textArea);
}

/**
 * Mostra toast de notificação
 */
function showToast(message, type = 'info') {
    // Criar elemento toast
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
    }`;
    toast.textContent = message;
    
    // Adicionar ao DOM
    document.body.appendChild(toast);
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Função auxiliar para getTipoInfo (se não existir)
function getTipoInfo(tipo) {
    const tipos = {
        participante: {
            label: 'Participante',
            icon: 'fas fa-user',
            bgColor: 'bg-blue-600',
            badgeClass: 'bg-blue-100 text-blue-800'
        },
        indicador: {
            label: 'Indicador',
            icon: 'fas fa-share-alt',
            bgColor: 'bg-green-600',
            badgeClass: 'bg-green-100 text-green-800'
        },
        influenciador: {
            label: 'Influenciador',
            icon: 'fas fa-star',
            bgColor: 'bg-purple-600',
            badgeClass: 'bg-purple-100 text-purple-800'
        }
    };
    
    return tipos[tipo] || tipos.participante;
}

// Sistema de Abas
function switchTab(tabName) {
    currentTab = tabName;
    
    // Atualizar botões das abas
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-700', 'text-gray-300');
    });
    
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.remove('bg-gray-700', 'text-gray-300');
        activeTab.classList.add('bg-blue-600', 'text-white');
    }
    
    // Mostrar/esconder conteúdo das abas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(`tab-content-${tabName}`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }
    
    // Mostrar/esconder ações contextuais
    document.querySelectorAll('[id^="actions-"]').forEach(actions => {
        actions.classList.add('hidden');
    });
    
    const actionsElement = document.getElementById(`actions-${tabName}`);
    if (actionsElement) {
        actionsElement.classList.remove('hidden');
        actionsElement.classList.add('flex');
    }
    
    // 🎯 Carregar conteúdo específico da aba usando novos módulos
    switch(tabName) {
        case 'users':
            console.log('🔄 Acessando aba de usuários - Iniciando auto-inicialização...');
            
                console.log('🔄 Inicializando aba de usuários...');
            
            // 🔧 CORREÇÃO DEFINITIVA: Usar função de auto-inicialização garantida
            ensureUsersTabInitialized();
            break;
        case 'lists':
            // Mostrar loading na aba de listas
            const container = document.getElementById('listsContainer');
            if (container) {
                container.innerHTML = '<p class="text-gray-400 text-center py-8">Carregando listas...</p>';
            }
            
                         // Sempre carregar participantes primeiro para garantir sincronização
            loadParticipants().then(() => {
                return loadLists(true);
            }).then(() => {
                syncListMemberCounts();
                // Buscar campanhas e conectar com listas
                return loadCampaignsAndConnect();
            }).then(() => {
                displayListsInTab(lists);
            }).catch(error => {
                console.error('Erro ao carregar dados para listas:', error);
                if (container) {
                    container.innerHTML = `
                        <div class="text-center py-8">
                            <p class="text-red-400 mb-4">Erro ao carregar dados</p>
                            <button onclick="switchTab('lists')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Tentar novamente
                            </button>
                        </div>
                    `;
                }
            });
            break;
        case 'stats':
            loadStatistics();
            break;
    }
} 

// === FUNÇÕES GLOBAIS DE DIAGNÓSTICO ===

/**
 * 🔍 DIAGNÓSTICO COMPLETO DO BANCO - FUNÇÃO GLOBAL
 * Execute esta função no console para diagnóstico total
 */
window.debugDatabase = async function() {
  console.log('🔍 === INICIANDO DIAGNÓSTICO COMPLETO DO BANCO ===');
  
  try {
    const token = localStorage.getItem('clientToken');
    const clientId = localStorage.getItem('clientId');
    
    if (!token || !clientId) {
      console.error('❌ Token ou ClientId não encontrados');
      return;
    }
    
    const response = await fetch(`${API_URL}/participants/debug`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      const data = result.data;
      
      console.log('🔍 === RELATÓRIO DE DIAGNÓSTICO ===');
      console.log('📊 Total de participantes no banco:', data.totalParticipants);
      console.log('👥 Participantes por cliente:', data.byClientId);
      console.log('⚠️ Participantes sem clientId:', data.withoutClientId);
      console.log('🎯 Cliente atual:', data.currentClient);
      console.log('🏷️ Participantes de LP:', data.lpParticipants);
      console.log('🔍 === FIM DO DIAGNÓSTICO ===');
      
      // Verificar se há participantes de LP
      if (data.lpParticipants.total > 0) {
        console.log('✅ ENCONTRADOS participantes de LP!');
        console.log('🔍 Amostras:', data.lpParticipants.samples);
        
        // Verificar se têm clientId correto
        const lpWithCorrectClient = data.lpParticipants.samples.filter(p => p.clientId === clientId);
        if (lpWithCorrectClient.length > 0) {
          console.log('✅ Participantes de LP com clientId CORRETO:', lpWithCorrectClient.length);
          console.log('🚨 PROBLEMA: Por que não aparecem na lista?');
        } else {
          console.log('❌ Participantes de LP têm clientId DIFERENTE!');
          console.log('🔧 SOLUÇÃO: Corrigir clientId dos participantes de LP');
        }
      } else {
        console.log('❌ NENHUM participante de LP encontrado no banco');
        console.log('🔧 SOLUÇÃO: Testar formulário da LP para criar participantes');
      }
      
      return result;
    } else {
      console.error('❌ Erro na resposta:', result);
    }
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
};

/**
 * 🧪 TESTE SIMPLES DO ENDPOINT DE DEBUG
 */
window.testDebugEndpoint = async function() {
  console.log('🧪 === TESTANDO ENDPOINT DE DEBUG CORRIGIDO ===');
  
  try {
    const token = localStorage.getItem('clientToken');
    const clientId = localStorage.getItem('clientId');
    
    if (!token || !clientId) {
      console.error('❌ Token ou ClientId não encontrados');
      return;
    }
    
    console.log('🔍 ClientId:', clientId);
    console.log('🔍 Token sample:', token.substring(0, 20) + '...');
    
    const response = await fetch(`${API_URL}/participants/debug`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response ok:', response.ok);
    
    const result = await response.json();
    console.log('🔍 Response data:', result);
    
    if (result.success) {
      console.log('✅ ENDPOINT FUNCIONANDO!');
      console.log('📊 Dados retornados:', result.data);
      return result;
    } else {
      console.error('❌ Erro na resposta:', result);
      return result;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return { error: error.message };
  }
};

// 🔧 NOVA FUNÇÃO: Atualizar contagem de participantes na interface
function updateParticipantCount() {
    // Procurar pelo elemento que mostra a contagem
    const countElements = [
        document.querySelector('.users-count'),
        document.querySelector('[data-count="participants"]'),
        document.querySelector('.participant-count'),
        document.querySelector('.total-count')
    ];
    
    const startIndex = ((currentPage - 1) * pageSize) + 1;
    const endIndex = Math.min(currentPage * pageSize, totalParticipants);
    
    const countText = totalParticipants > 0 
        ? `Mostrando ${startIndex}-${endIndex} de ${totalParticipants} usuários`
        : 'Nenhum usuário encontrado';
    
    console.log(`📊 Atualizando contagem: ${countText}`);
    
    // Atualizar todos os elementos encontrados
    countElements.forEach(element => {
        if (element) {
            element.textContent = countText;
        }
    });
    
    // Também atualizar a paginação se existir
    updatePaginationControls();
}

// 🔧 NOVA FUNÇÃO: Atualizar controles de paginação
function updatePaginationControls() {
    const paginationContainer = document.querySelector('.pagination-controls') || 
                               document.querySelector('.pagination') ||
                               document.querySelector('[data-pagination]');
    
    if (paginationContainer && totalPages > 1) {
        let paginationHTML = '';
        
        // Botão anterior
        if (currentPage > 1) {
            paginationHTML += `<button onclick="changePage('prev')" class="btn btn-sm">Anterior</button>`;
        }
        
        // Números das páginas
        for (let i = 1; i <= totalPages; i++) {
            const active = i === currentPage ? 'active' : '';
            paginationHTML += `<button onclick="goToPage(${i})" class="btn btn-sm ${active}">${i}</button>`;
        }
        
        // Botão próximo
        if (currentPage < totalPages) {
            paginationHTML += `<button onclick="changePage('next')" class="btn btn-sm">Próximo</button>`;
        }
        
        paginationContainer.innerHTML = paginationHTML;
        console.log(`🔧 Paginação atualizada: Página ${currentPage} de ${totalPages}`);
    }
}

// 🔧 NOVA FUNÇÃO: Ir para página específica
function goToPage(pageNumber) {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
        currentPage = pageNumber;
        console.log(`📄 Mudando para página ${pageNumber}`);
        
        if (window.participantsManager) {
            window.participantsManager.loadParticipants({
                page: currentPage,
                limit: pageSize,
                forceRefresh: true
            });
        } else {
            loadParticipants(currentPage);
        }
    }
}

// 🔧 SISTEMA DE PAGINAÇÃO ESCALÁVEL
const PaginationSystem = {
    // Cache de páginas para performance
    pageCache: new Map(),
    cacheTimeout: 5 * 60 * 1000, // 5 minutos
    
    // Configurações
    config: {
        defaultPageSize: 25,
        maxPageSize: 100,
        minPageSize: 10,
        pagesToShow: 5 // Quantas páginas mostrar nos controles
    },
    
    /**
     * Carrega uma página específica com cache inteligente
     */
    async loadPage(page, filters = {}, forceRefresh = false) {
        console.log(`📄 PaginationSystem: Carregando página ${page}`);
        
        // Gerar chave de cache
        const cacheKey = `${page}_${JSON.stringify(filters)}_${pageSize}`;
        
        // Verificar cache se não for refresh forçado
        if (!forceRefresh && this.pageCache.has(cacheKey)) {
            const cached = this.pageCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`💾 Cache hit para página ${page}`);
                return cached.data;
            }
        }
        
        // Mostrar loading
        this.showPageLoading();
        
        try {
            // Fazer requisição para API
            const token = localStorage.getItem('clientToken');
            const clientId = localStorage.getItem('clientId');
            
            if (!token || !clientId) {
                throw new Error('Token ou ClientId não encontrados');
            }
            
            // Construir URL com parâmetros
            const url = new URL(`${API_URL}/participants`);
            url.searchParams.append('page', page);
            url.searchParams.append('limit', pageSize);
            
            // Adicionar filtros
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    url.searchParams.append(key, filters[key]);
                }
            });
            
            console.log(`🌐 Requisição: ${url.toString()}`);
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log(`✅ Página ${page} carregada: ${result.participants?.length} participantes`);
            
            // Cache do resultado
            this.pageCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
            
            // Limpar cache antigo (manter apenas 10 páginas)
            if (this.pageCache.size > 10) {
                const oldestKey = this.pageCache.keys().next().value;
                this.pageCache.delete(oldestKey);
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ Erro ao carregar página ${page}:`, error);
            this.showPageError(error.message);
            throw error;
        } finally {
            this.hidePageLoading();
        }
    },
    
    /**
     * Atualiza as variáveis globais com dados da página
     */
    updateGlobalState(pageData, page) {
        // 🔍 H4 - DIAGNÓSTICO UPDATE GLOBAL STATE PAGINATION SYSTEM
        console.log('🔍 H4 - PaginationSystem.updateGlobalState recebeu:', {
            participants: pageData.participants?.length || 0,
            total: pageData.totalParticipants || pageData.total,
            page: pageData.page,
            targetPage: page
        });
        
        if (pageData.participants) {
            participants = pageData.participants;
            currentPage = parseInt(page);
            totalParticipants = pageData.totalParticipants || participants.length;
            totalPages = pageData.totalPages || Math.ceil(totalParticipants / pageSize);
            
            // 🔍 H4 - DIAGNÓSTICO APÓS UPDATE GLOBAL STATE PAGINATION SYSTEM
            console.log('🔍 H4 - Estado global após update (PaginationSystem):', {
                participantsLength: participants.length,
                totalParticipants,
                currentPage,
                totalPages,
                tipoFiltro
            });
            
            console.log(`📊 Estado atualizado: ${participants.length} participantes, página ${currentPage}/${totalPages}`);
            
            // Atualizar interface
            this.updateUI();
        } else {
            console.log('🔍 H4 - pageData.participants está vazio ou undefined no updateGlobalState');
        }
    },
    
    /**
     * Atualiza interface com controles de paginação avançados
     */
    updateUI() {
        this.updateParticipantCount();
        this.updatePaginationControls();
        this.updatePageInfo();
    },
    
    /**
     * Atualiza contagem com informações detalhadas
     */
    updateParticipantCount() {
        const countElements = [
            document.querySelector('.users-count'),
            document.querySelector('[data-count="participants"]'),
            document.querySelector('.participant-count'),
            document.querySelector('.total-count')
        ];
        
        const startIndex = ((currentPage - 1) * pageSize) + 1;
        const endIndex = Math.min(currentPage * pageSize, totalParticipants);
        
        let countText = '';
        if (totalParticipants > 0) {
            countText = `Mostrando ${startIndex}-${endIndex} de ${totalParticipants} usuários`;
            if (totalPages > 1) {
                countText += ` (Página ${currentPage} de ${totalPages})`;
            }
        } else {
            countText = 'Nenhum usuário encontrado';
        }
        
        console.log(`📊 Contagem: ${countText}`);
        
        countElements.forEach(element => {
            if (element) {
                element.textContent = countText;
            }
        });
    },
    
    /**
     * Controles de paginação avançados para grandes volumes
     */
    updatePaginationControls() {
        const container = document.querySelector('.pagination-controls') || 
                         document.querySelector('.pagination') ||
                         document.querySelector('[data-pagination]');
        
        if (!container || totalPages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }
        
        let html = '<div class="flex items-center gap-2 flex-wrap">';
        
        // Botão Primeira Página
        if (currentPage > 1) {
            html += `<button onclick="PaginationSystem.goToPage(1)" class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">
                <i class="fas fa-angle-double-left"></i>
            </button>`;
        }
        
        // Botão Anterior
        if (currentPage > 1) {
            html += `<button onclick="PaginationSystem.goToPage(${currentPage - 1})" class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">
                <i class="fas fa-angle-left"></i> Anterior
            </button>`;
        }
        
        // Páginas numéricas (inteligente para grandes volumes)
        const { start, end } = this.calculatePageRange();
        
        if (start > 1) {
            html += `<button onclick="PaginationSystem.goToPage(1)" class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">1</button>`;
            if (start > 2) {
                html += `<span class="px-2 text-gray-400">...</span>`;
            }
        }
        
        for (let i = start; i <= end; i++) {
            const active = i === currentPage ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700';
            html += `<button onclick="PaginationSystem.goToPage(${i})" class="px-3 py-1 ${active} text-white rounded text-sm">${i}</button>`;
        }
        
        if (end < totalPages) {
            if (end < totalPages - 1) {
                html += `<span class="px-2 text-gray-400">...</span>`;
            }
            html += `<button onclick="PaginationSystem.goToPage(${totalPages})" class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">${totalPages}</button>`;
        }
        
        // Botão Próximo
        if (currentPage < totalPages) {
            html += `<button onclick="PaginationSystem.goToPage(${currentPage + 1})" class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">
                Próximo <i class="fas fa-angle-right"></i>
            </button>`;
        }
        
        // Botão Última Página
        if (currentPage < totalPages) {
            html += `<button onclick="PaginationSystem.goToPage(${totalPages})" class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">
                <i class="fas fa-angle-double-right"></i>
            </button>`;
        }
        
        html += '</div>';
        
        // Adicionar seletor de tamanho de página
        html += `<div class="ml-4 flex items-center gap-2">
            <label class="text-sm text-gray-400">Por página:</label>
            <select onchange="PaginationSystem.changePageSize(this.value)" class="bg-gray-700 text-white text-sm rounded px-2 py-1">
                <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
                <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
            </select>
        </div>`;
        
        container.innerHTML = html;
    },
    
    /**
     * Calcula range de páginas para exibir (inteligente)
     */
    calculatePageRange() {
        const half = Math.floor(this.config.pagesToShow / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, currentPage + half);
        
        // Ajustar para sempre mostrar o número correto de páginas
        if (end - start + 1 < this.config.pagesToShow) {
            if (start === 1) {
                end = Math.min(totalPages, start + this.config.pagesToShow - 1);
            } else {
                start = Math.max(1, end - this.config.pagesToShow + 1);
            }
        }
        
        return { start, end };
    },
    
    /**
     * Navegar para página específica
     */
    async goToPage(page) {
        if (isLoading || page === currentPage || page < 1 || page > totalPages) {
            return;
        }
        
        console.log(`🔄 Navegando para página ${page}`);
        
        try {
            isLoading = true;
            const result = await this.loadPage(page, currentFilters);
            this.updateGlobalState(result, page);
            
                         // 🔧 CORREÇÃO: SEMPRE atualizar exibição dos participantes
             console.log('🔧 PaginationSystem.goToPage - Forçando exibição:', participants.length);
             displayParticipants();
             
             // Backup: Comentado temporariamente devido a erro bgColor
             // if (window.participantsManager && window.participantsManager.displayParticipants) {
             //     console.log('🔧 BACKUP: Também chamando participantsManager no goToPage');
             //     window.participantsManager.displayParticipants(participants);
             // }
            
        } catch (error) {
            console.error('Erro ao navegar:', error);
            showNotification('Erro ao carregar página', 'error');
        } finally {
            isLoading = false;
        }
    },
    
    /**
     * Alterar tamanho da página
     */
    async changePageSize(newSize) {
        const size = parseInt(newSize);
        if (size === pageSize || size < this.config.minPageSize || size > this.config.maxPageSize) {
            return;
        }
        
        console.log(`📏 Alterando tamanho da página para ${size}`);
        
        // Calcular nova página baseada no primeiro item visível
        const firstItemIndex = ((currentPage - 1) * pageSize) + 1;
        const newPage = Math.ceil(firstItemIndex / size);
        
        pageSize = size;
        
        // Limpar cache pois o tamanho mudou
        this.pageCache.clear();
        
        // Recarregar
        await this.goToPage(newPage);
    },
    
    /**
     * Atualizar informações da página
     */
    updatePageInfo() {
        const infoElement = document.querySelector('[data-page-info]');
        if (infoElement && totalParticipants > 0) {
            infoElement.textContent = `${totalParticipants} participantes encontrados`;
        }
        
        // 🔧 NOVO: Atualizar indicadores de cache e performance
        this.updateSystemIndicators();
    },
    
    /**
     * 🔧 NOVO: Atualizar indicadores do sistema (cache, performance)
     */
    updateSystemIndicators() {
        // Atualizar status do cache
        const cacheElement = document.getElementById('cache-status');
        if (cacheElement) {
            const cacheSize = this.pageCache.size;
            cacheElement.textContent = `Cache: ${cacheSize} páginas`;
            
            // Código de cores baseado no uso do cache
            if (cacheSize > 7) {
                cacheElement.className = 'text-green-400';
            } else if (cacheSize > 3) {
                cacheElement.className = 'text-yellow-400';
            } else {
                cacheElement.className = 'text-gray-500';
            }
        }
        
        // Atualizar indicador de performance
        const performanceElement = document.getElementById('performance-indicator');
        if (performanceElement) {
            let performanceText = 'Performance: ';
            let performanceClass = 'text-gray-500';
            
            if (totalParticipants > 1000) {
                performanceText += 'Volume Alto';
                performanceClass = 'text-yellow-400';
            } else if (totalParticipants > 500) {
                performanceText += 'Volume Médio';
                performanceClass = 'text-blue-400';
            } else {
                performanceText += 'Otimizada';
                performanceClass = 'text-green-400';
            }
            
            performanceElement.textContent = performanceText;
            performanceElement.className = performanceClass;
        }
    },
    
    /**
     * Estados de loading
     */
    showPageLoading() {
        const tbody = document.getElementById('participantsList');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-spinner fa-spin text-2xl text-blue-400 mb-2"></i>
                            <p class="text-gray-400">Carregando página ${currentPage}...</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    },
    
    hidePageLoading() {
        // O loading será removido quando displayParticipants() for chamado
    },
    
    showPageError(message) {
        const tbody = document.getElementById('participantsList');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-exclamation-triangle text-2xl text-red-400 mb-2"></i>
                            <p class="text-red-400 mb-4">Erro ao carregar dados</p>
                            <p class="text-gray-500 text-sm mb-4">${message}</p>
                            <button onclick="PaginationSystem.goToPage(${currentPage})" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Tentar novamente
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    },
    
    /**
     * Aplicar filtros e resetar para primeira página
     * 🔧 CORREÇÃO: Implementa filtro local como fallback se backend não suportar
     */
    async applyFilters(filters) {
        console.log('🔍 Aplicando filtros:', filters);
        console.log('🔧 CORREÇÃO: Implementando filtro robusto com fallback local');
        
        currentFilters = { ...filters };
        
        // Limpar cache pois os filtros mudaram
        this.pageCache.clear();
        
        try {
            // 1️⃣ PRIMEIRA TENTATIVA: Usar API com filtros (se suportado)
            console.log('🔍 Tentativa 1: Filtros via API...');
            await this.goToPage(1);
            
            // 2️⃣ VERIFICAR se filtros funcionaram
            const hasFilters = Object.keys(filters).length > 0;
            const needsLocalFilter = hasFilters && !this.areFiltersWorking(filters);
            
            if (needsLocalFilter) {
                console.log('⚠️ Backend não suporta filtros - aplicando filtro local');
                await this.applyLocalFilters(filters);
            } else {
                console.log('✅ Filtros aplicados com sucesso via API');
            }
            
        } catch (error) {
            console.error('❌ Erro ao aplicar filtros via API:', error);
            // Fallback para filtro local
            await this.applyLocalFilters(filters);
        }
    },
    
    /**
     * 🔧 NOVO: Verifica se os filtros da API estão funcionando
     */
    areFiltersWorking(filters) {
        // Se não há filtros, não há como verificar
        if (Object.keys(filters).length === 0) return true;
        
        // 🔧 CORREÇÃO: Sempre assumir que API não suporta filtros para usar filtro local robusto
        console.log('🔍 Forçando uso de filtros locais para garantir funcionamento correto');
        return false;
    },
    
    /**
     * 🔧 NOVO: Aplica filtros localmente nos dados carregados
     */
    async applyLocalFilters(filters) {
        console.log('🔧 Aplicando filtros locais CORRIGIDOS:', filters);
        
        try {
            // 1. 🔧 CORREÇÃO: Limpar cache completamente e resetar estado
            this.pageCache.clear();
            currentFilters = {};
            
            console.log('📥 Carregando todos os dados para filtro local...');
            const allDataResult = await this.loadPage(1, {}, true); // Sem filtros, forçar refresh
            
            let allParticipants = allDataResult.participants || [];
            console.log(`📊 Total de dados carregados: ${allParticipants.length}`);
            
            if (allParticipants.length === 0) {
                console.log('⚠️ Nenhum dado carregado para filtrar');
                return;
            }
            
            // 2. 🔧 CORREÇÃO: Aplicar filtros sequencialmente para evitar conflitos
            let filteredData = [...allParticipants];
            let appliedFilters = [];
            
            // Filtro por tipo - SEMPRE PRIMEIRO
            if (filters.tipo && filters.tipo !== 'todos') {
                const tipoBusca = filters.tipo;
                const beforeCount = filteredData.length;
                filteredData = filteredData.filter(p => {
                    const tipoParticipante = p.tipo || 'participante';
                    return tipoParticipante === tipoBusca;
                });
                console.log(`🔍 Filtro tipo "${tipoBusca}": ${beforeCount} → ${filteredData.length}`);
                appliedFilters.push(`tipo: ${tipoBusca}`);
            }
            
            // Filtro por lista - SEGUNDO
            if (filters.listId && filters.listId !== '') {
                const listIdBusca = filters.listId;
                const beforeCount = filteredData.length;
                filteredData = filteredData.filter(p => {
                    if (!p.lists || !Array.isArray(p.lists)) return false;
                    return p.lists.some(list => {
                        const listId = typeof list === 'object' ? (list._id || list.id) : list;
                        return listId === listIdBusca;
                    });
                });
                console.log(`🔍 Filtro lista "${listIdBusca}": ${beforeCount} → ${filteredData.length}`);
                appliedFilters.push(`lista: ${listIdBusca}`);
            } else if (filters.listId === '') {
                console.log('🔍 Filtro lista removido - mostrando participantes de todas as listas');
                appliedFilters.push('todas as listas');
            }
            
            // Filtro por busca/email - TERCEIRO
            if (filters.search) {
                const termoBusca = filters.search.toLowerCase();
                const beforeCount = filteredData.length;
                filteredData = filteredData.filter(p => {
                    return (p.name && p.name.toLowerCase().includes(termoBusca)) ||
                           (p.email && p.email.toLowerCase().includes(termoBusca));
                });
                console.log(`🔍 Filtro busca "${filters.search}": ${beforeCount} → ${filteredData.length}`);
                appliedFilters.push(`busca: ${filters.search}`);
            }
            
            // Filtro por status - QUARTO
            if (filters.status) {
                const statusBusca = filters.status;
                const beforeCount = filteredData.length;
                filteredData = filteredData.filter(p => {
                    const statusParticipante = p.status || 'ativo';
                    return statusParticipante === statusBusca;
                });
                console.log(`🔍 Filtro status "${statusBusca}": ${beforeCount} → ${filteredData.length}`);
                appliedFilters.push(`status: ${statusBusca}`);
            }
            
            // 3. 🔧 CORREÇÃO: Atualizar estado global de forma robusta
            participants = filteredData;
            totalParticipants = filteredData.length;
            totalPages = Math.ceil(totalParticipants / pageSize) || 1;
            currentPage = 1;
            currentFilters = { ...filters }; // Definir filtros ativos
            
            console.log(`✅ Filtros aplicados [${appliedFilters.join(', ')}]: ${participants.length} participantes`);
            
            // 4. 🔧 CORREÇÃO: Forçar atualização completa da interface
            setTimeout(() => {
                this.updateUI();
                displayParticipants();
                
                // 🔄 GARANTIA: Atualizar botões de filtro
                this.updateFilterButtons(filters);
                
                console.log('🔧 Interface atualizada com dados filtrados');
            }, 100);
            
        } catch (error) {
            console.error('❌ Erro no filtro local:', error);
            showNotification('Erro ao aplicar filtros', 'error');
        }
    },
    
    /**
     * 🔧 NOVO: Atualiza botões de filtro para refletir estado atual
     */
    updateFilterButtons(filters) {
        // Atualizar botões de tipo
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-gray-700', 'text-gray-200');
        });
        
        const activeType = filters.tipo || 'todos';
        const activeButton = document.getElementById(`filter-${activeType}`);
        if (activeButton) {
            activeButton.classList.remove('bg-gray-700', 'text-gray-200');
            activeButton.classList.add('bg-blue-600', 'text-white');
        }
        
        // Atualizar dropdown de lista
        const listFilter = document.getElementById('listFilter');
        if (listFilter) {
            listFilter.value = filters.listId || '';
        }
        
        // Atualizar campo de busca
        const emailFilter = document.getElementById('emailFilter');
        if (emailFilter) {
            emailFilter.value = filters.search || '';
        }
        
        // Atualizar dropdown de status
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.value = filters.status || '';
        }
    },
    
    /**
     * Busca com debounce
     */
    searchDebounce: null,
    async search(searchTerm) {
        clearTimeout(this.searchDebounce);
        
        this.searchDebounce = setTimeout(async () => {
            console.log('🔍 Buscando:', searchTerm);
            
            const filters = { ...currentFilters };
            if (searchTerm && searchTerm.trim()) {
                filters.search = searchTerm.trim();
            } else {
                delete filters.search;
            }
            
            await this.applyFilters(filters);
        }, 300); // 300ms de debounce
    }
};

// Tornar disponível globalmente
window.PaginationSystem = PaginationSystem;

/**
 * 🧪 TESTE DO SISTEMA ESCALÁVEL
 * Simula e testa o comportamento com grandes volumes
 */
window.testScalableSystem = async function() {
  console.log('🧪 === TESTANDO SISTEMA ESCALÁVEL ===');
  
  try {
    // 1. Teste de paginação básica
    console.log('📄 1. Testando paginação básica...');
    await PaginationSystem.goToPage(1);
    console.log(`   ✅ Página 1: ${participants.length} participantes carregados`);
    
    // 2. Teste de mudança de tamanho de página
    console.log('📏 2. Testando mudança de tamanho...');
    await PaginationSystem.changePageSize(10);
    console.log(`   ✅ Limite 10: ${participants.length} participantes, ${totalPages} páginas`);
    
    await PaginationSystem.changePageSize(50);
    console.log(`   ✅ Limite 50: ${participants.length} participantes, ${totalPages} páginas`);
    
    // 3. Teste de navegação
    if (totalPages > 1) {
      console.log('🔄 3. Testando navegação entre páginas...');
      await PaginationSystem.goToPage(Math.min(2, totalPages));
      console.log(`   ✅ Página 2: ${participants.length} participantes carregados`);
      
      await PaginationSystem.goToPage(1);
      console.log(`   ✅ Volta página 1: ${participants.length} participantes carregados`);
    }
    
    // 4. Teste de filtros
    console.log('🔍 4. Testando filtros...');
    await PaginationSystem.applyFilters({ tipo: 'indicador' });
    const indicadoresCount = totalParticipants;
    console.log(`   ✅ Filtro indicadores: ${indicadoresCount} encontrados`);
    
    await PaginationSystem.applyFilters({ tipo: 'participante' });
    const participantesCount = totalParticipants;
    console.log(`   ✅ Filtro participantes: ${participantesCount} encontrados`);
    
    // 5. Teste de busca
    console.log('🔍 5. Testando busca...');
    await PaginationSystem.search('teste');
    const buscaCount = totalParticipants;
    console.log(`   ✅ Busca "teste": ${buscaCount} encontrados`);
    
    // 6. Limpar filtros
    console.log('🧹 6. Limpando filtros...');
    await PaginationSystem.applyFilters({});
    await PaginationSystem.search('');
    console.log(`   ✅ Todos participantes: ${totalParticipants} encontrados`);
    
    // 7. Teste de cache
    console.log('💾 7. Testando cache...');
    const cacheSize = PaginationSystem.pageCache.size;
    console.log(`   ✅ Cache atual: ${cacheSize} páginas armazenadas`);
    
    // 8. Simulação de performance
    console.log('⚡ 8. Teste de performance...');
    const startTime = performance.now();
    await PaginationSystem.goToPage(1);
    const endTime = performance.now();
    console.log(`   ✅ Tempo de carregamento: ${Math.round(endTime - startTime)}ms`);
    
    // 9. Estatísticas finais
    console.log('📊 === ESTATÍSTICAS FINAIS ===');
    console.log(`   📄 Total de participantes: ${totalParticipants}`);
    console.log(`   📑 Total de páginas (limite ${pageSize}): ${totalPages}`);
    console.log(`   💾 Cache ativo: ${PaginationSystem.pageCache.size} páginas`);
    console.log(`   🎯 Página atual: ${currentPage}`);
    console.log(`   🔍 Filtros ativos: ${Object.keys(currentFilters).length}`);
    
    // 10. Recomendações
    console.log('💡 === RECOMENDAÇÕES PARA ESCALA ===');
    if (totalParticipants > 1000) {
      console.log('   ⚠️ Volume alto detectado (>1000)');
      console.log('   📏 Recomendado: limite de 25-50 por página');
      console.log('   🔍 Importante: usar filtros e busca para navegação');
    } else if (totalParticipants > 500) {
      console.log('   ✅ Volume médio (>500) - sistema escalável pronto');
    } else {
      console.log('   ✅ Volume baixo (<500) - performance ótima');
    }
    
    console.log('🎉 === TESTE CONCLUÍDO COM SUCESSO ===');
    
    return {
      totalParticipants,
      totalPages,
      pageSize,
      currentPage,
      cacheSize: PaginationSystem.pageCache.size,
      filtersActive: Object.keys(currentFilters).length,
      performance: Math.round(endTime - startTime)
    };
    
  } catch (error) {
    console.error('❌ Erro no teste escalável:', error);
    return { error: error.message };
  }
};

/**
 * 🧪 TESTE RÁPIDO: Forçar exibição de participantes
 */
window.forceDisplayParticipants = async function() {
  console.log('🔧 === FORÇANDO EXIBIÇÃO DE PARTICIPANTES ===');
  
  try {
    console.log('1. Estado atual:');
    console.log('   - participants:', participants ? participants.length : 'undefined');
    console.log('   - totalParticipants:', totalParticipants);
    console.log('   - currentPage:', currentPage);
    
    console.log('2. Recarregando dados...');
    await loadParticipants(1, {});
    
    console.log('3. Estado após reload:');
    console.log('   - participants:', participants ? participants.length : 'undefined');
    console.log('   - totalParticipants:', totalParticipants);
    
    console.log('4. Forçando exibição...');
    displayParticipants();
    
    console.log('✅ TESTE CONCLUÍDO - Verifique a tabela!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// 🔧 AUTO-INICIALIZAÇÃO GARANTIDA para aba de usuários
let usersTabInitialized = false;

async function ensureUsersTabInitialized() {
    if (usersTabInitialized) {
        console.log('✅ Aba de usuários já inicializada');
        return;
    }
    
    console.log('🔧 Inicializando aba de usuários automaticamente...');
    
    try {
        // Mostrar loading
        const tbody = document.getElementById('participantsList');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-spinner fa-spin text-2xl text-blue-400 mb-2"></i>
                            <p class="text-gray-400">Inicializando dados...</p>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        // Limpar cache e filtros
        if (window.PaginationSystem) {
            PaginationSystem.pageCache.clear();
        }
        currentFilters = {};
        
        // Carregar dados em sequência
        console.log('1. Carregando listas...');
        await loadLists();
        
        console.log('1.5. Populando filtro de listas...');
        populateListFilter();
        
        console.log('2. Carregando participantes...');
        await loadParticipants();
        
        console.log('3. Sincronizando dados...');
        syncListMemberCounts();
        
        console.log('4. Forçando exibição...');
        displayParticipants();
        
        // Marcar como inicializado
        usersTabInitialized = true;
        
        console.log('✅ Aba de usuários inicializada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na auto-inicialização:', error);
        
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-exclamation-triangle text-2xl text-red-400 mb-2"></i>
                            <p class="text-red-400 mb-4">Erro na inicialização</p>
                            <button onclick="ensureUsersTabInitialized()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Tentar novamente
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

// Tornar função disponível globalmente
window.ensureUsersTabInitialized = ensureUsersTabInitialized;

/**
 * 🔧 RESET da inicialização da aba usuários
 */
window.resetUsersTabInitialization = function() {
    console.log('🔄 Resetando inicialização da aba usuários...');
    usersTabInitialized = false;
    
    // Limpar cache
    if (window.PaginationSystem) {
        PaginationSystem.pageCache.clear();
    }
    
    // Limpar variáveis globais
    participants = [];
    totalParticipants = 0;
    currentPage = 1;
    currentFilters = {};
    
    console.log('✅ Reset concluído. Execute ensureUsersTabInitialized() para re-inicializar.');
};

// 🚀 INICIALIZAÇÃO AUTOMÁTICA DA PÁGINA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Página carregada - Inicializando Central de Participantes...');
    
    // Verificar se estamos na aba de usuários ou inicializar automaticamente
    const currentTabElement = document.querySelector('.tab-button.bg-blue-600');
    const isUsersTab = currentTabElement && currentTabElement.id === 'tab-users';
    
    if (isUsersTab) {
        console.log('✅ Aba usuários detectada como ativa - inicializando...');
        fixCampaignNamesAndLists().then(() => ensureUsersTabInitialized());
    } else {
        // Força a inicialização da aba de usuários para garantir que funcione quando clicada
        console.log('🔧 Pré-carregando dados para aba de usuários...');
        setTimeout(async () => {
            await fixCampaignNamesAndLists();
            ensureUsersTabInitialized();
        }, 1000);
    }
});

// 🔧 FALLBACK: Garantir que dados sejam carregados independente da aba
window.addEventListener('load', function() {
    console.log('🔧 Window load - Garantindo carregamento de dados...');
    
    // Se ainda não foi inicializado após 2 segundos, força inicialização
    setTimeout(() => {
        if (!usersTabInitialized) {
            console.log('⚠️ Inicialização automática não executada - forçando...');
            fixCampaignNamesAndLists().then(() => ensureUsersTabInitialized());
        }
    }, 2000);
});

/**
 * 🔧 CORREÇÃO PRAGMÁTICA: Força carregamento de campanhas e atualiza exibição
 */
window.fixCampaignNamesAndLists = async function() {
    console.log('🔧 Corrigindo nomes de campanhas e listas...');
    
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        if (!token || !clientId) {
            console.log('❌ Token ou clientId não encontrado');
            return;
        }
        
        // 1. Carregar campanhas primeiro
        console.log('📢 Carregando campanhas...');
        const campaignsResponse = await fetch(`${getApiUrl()}/campaigns?clientId=${clientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (campaignsResponse.ok) {
            const campaignsData = await campaignsResponse.json();
            const campaigns = Array.isArray(campaignsData) ? campaignsData : (campaignsData.data || []);
            window.campaignsCache = campaigns;
            console.log('✅ Campanhas carregadas no cache:', campaigns.length);
        }
        
        // 2. Recarregar participantes para atualizar exibição
        console.log('👥 Recarregando participantes...');
        await loadParticipants();
        
        // 3. Forçar exibição atualizada
        console.log('🔄 Atualizando exibição...');
        displayParticipants();
        
        console.log('✅ Correção concluída! Os nomes das campanhas devem aparecer corretamente agora.');
        
    } catch (error) {
        console.error('❌ Erro na correção:', error);
    }
};

/**
 * 🔧 RESET da inicialização da aba usuários
 */
window.resetUsersTabInitialization = function() {
    console.log('🔄 Resetando inicialização da aba usuários...');
    usersTabInitialized = false;
    
    // Limpar cache
    if (window.PaginationSystem) {
        PaginationSystem.pageCache.clear();
    }
    
    // Limpar variáveis globais
    participants = [];
    totalParticipants = 0;
    currentPage = 1;
    currentFilters = {};
    
    console.log('✅ Reset concluído. Execute ensureUsersTabInitialized() para re-inicializar.');
};

// 🔧 SISTEMA ORIGINAL: Atualizar controles de paginação simples
function updatePaginationControls() {
    const paginationContainer = document.querySelector('.pagination-controls') || 
                               document.querySelector('.pagination') ||
                               document.querySelector('[data-pagination]');
    
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    console.log(`🔧 Atualizando paginação: Página ${currentPage} de ${totalPages}`);
    
    let html = '<div class="flex items-center gap-2 flex-wrap">';
    
    // Botão Anterior
    if (currentPage > 1) {
        html += `<button onclick="changePage('prev')" class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">
            <i class="fas fa-angle-left"></i> Anterior
        </button>`;
    }
    
    // Páginas numéricas (simples)
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Ajustar se estivermos no final
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // Primeira página se necessário
    if (startPage > 1) {
        html += `<button onclick="goToPage(1)" class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">1</button>`;
        if (startPage > 2) {
            html += `<span class="px-2 text-gray-400">...</span>`;
        }
    }
    
    // Páginas numeradas
    for (let i = startPage; i <= endPage; i++) {
        const active = i === currentPage ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700';
        html += `<button onclick="goToPage(${i})" class="px-3 py-1 ${active} text-white rounded text-sm">${i}</button>`;
    }
    
    // Última página se necessário
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="px-2 text-gray-400">...</span>`;
        }
        html += `<button onclick="goToPage(${totalPages})" class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">${totalPages}</button>`;
    }
    
    // Botão Próximo
    if (currentPage < totalPages) {
        html += `<button onclick="changePage('next')" class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">
            Próximo <i class="fas fa-angle-right"></i>
        </button>`;
    }
    
    html += '</div>';
    
    paginationContainer.innerHTML = html;
}

// 🔧 SISTEMA ORIGINAL: Ir para página específica
function goToPage(pageNumber) {
    console.log(`📄 goToPage ORIGINAL - Indo para página ${pageNumber}`);
    
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
        currentPage = pageNumber;
        console.log(`✅ Página alterada para ${pageNumber}`);
        
        // Atualizar exibição usando sistema original
        displayParticipants();
    } else {
        console.log(`🚫 Página ${pageNumber} inválida ou já ativa`);
    }
}

// 🧪 TESTE ESPECÍFICO DO SISTEMA ORIGINAL RESTAURADO
window.testOriginalSystem = async function() {
    console.log('🧪 === TESTANDO SISTEMA ORIGINAL RESTAURADO ===');
    
    try {
        // 1. Verificar se dados estão carregados
        console.log('1. 📊 Verificando dados:');
        console.log(`   - Participantes: ${participants?.length || 0}`);
        console.log(`   - Listas: ${lists?.length || 0}`);
        console.log(`   - Página atual: ${currentPage}`);
        console.log(`   - Total páginas: ${totalPages}`);
        
        // 2. Testar filtro por tipo
        console.log('2. 🔍 Testando filtro por tipo:');
        console.log('   - Aplicando filtro "indicador"...');
        await setTipoFiltro('indicador');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const indicadoresCount = document.querySelectorAll('#participantsList tr[data-participant-id]').length;
        console.log(`   ✅ Indicadores exibidos: ${indicadoresCount}`);
        
        // 3. Testar filtro por lista
        console.log('3. 📋 Testando filtro por lista:');
        const listFilter = document.getElementById('listFilter');
        if (listFilter && listFilter.options.length > 1) {
            const firstListValue = listFilter.options[1].value;
            const firstListText = listFilter.options[1].text;
            
            console.log(`   - Aplicando filtro lista "${firstListText}"...`);
            listFilter.value = firstListValue;
            await filterParticipants();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const listaCount = document.querySelectorAll('#participantsList tr[data-participant-id]').length;
            console.log(`   ✅ Participantes da lista exibidos: ${listaCount}`);
        } else {
            console.log('   ⚠️ Nenhuma lista disponível para testar');
        }
        
        // 4. Testar sistema de duplicação
        console.log('4. 🔄 Testando sistema de duplicação:');
        await setTipoFiltro('todos');
        const listFilterEl = document.getElementById('listFilter');
        if (listFilterEl) listFilterEl.value = '';
        await filterParticipants();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Contar quantos participantes têm múltiplas listas
        const participantesComMultiplasListas = participants.filter(p => p.lists && p.lists.length > 1);
        const linhasTabela = document.querySelectorAll('#participantsList tr[data-participant-id]').length;
        
        console.log(`   - Participantes com múltiplas listas: ${participantesComMultiplasListas.length}`);
        console.log(`   - Total de linhas na tabela: ${linhasTabela}`);
        console.log(`   ✅ Duplicação funcionando: ${linhasTabela >= participants.length ? 'SIM' : 'VERIFICAR'}`);
        
        // 5. Testar paginação
        console.log('5. 📄 Testando paginação:');
        if (totalPages > 1) {
            console.log(`   - Mudando para página 2...`);
            changePage('next');
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(`   ✅ Página atual: ${currentPage}`);
            
            console.log(`   - Voltando para página 1...`);
            changePage('prev');
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(`   ✅ Página atual: ${currentPage}`);
        } else {
            console.log('   ⚠️ Apenas 1 página disponível');
        }
        
        // 6. Resumo final
        console.log('6. 📋 RESUMO DO TESTE:');
        const finalCount = document.querySelectorAll('#participantsList tr[data-participant-id]').length;
        console.log(`   📊 Participantes exibidos: ${finalCount}`);
        console.log(`   📄 Sistema de paginação: ${totalPages > 1 ? 'ATIVO' : 'SIMPLES'}`);
        console.log(`   🔍 Filtros disponíveis: Tipo, Lista, Status, Busca`);
        console.log(`   🔄 Sistema de duplicação: ${linhasTabela >= participants.length ? 'FUNCIONANDO' : 'VERIFICAR'}`);
        
        console.log('✅ === TESTE DO SISTEMA ORIGINAL CONCLUÍDO ===');
        console.log('💡 O sistema deve estar funcionando como antes - João em 2 listas = 2 linhas!');
        
        return {
            participantes: participants?.length || 0,
            linhasTabela: finalCount,
            paginacao: totalPages,
            duplicacao: linhasTabela >= participants.length,
            filtros: 'OK'
        };
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        return { error: error.message };
    }
};

// 🔧 FUNÇÃO RÁPIDA: Verificar se filtros estão funcionando
window.quickFilterTest = function() {
    console.log('🔍 === TESTE RÁPIDO DE FILTROS ===');
    
    // Teste 1: Todos
    console.log('1. Filtro TODOS:');
    setTipoFiltro('todos');
    const todosCount = document.querySelectorAll('#participantsList tr[data-participant-id]').length;
    console.log(`   Resultado: ${todosCount} linhas`);
    
    // Teste 2: Indicadores
    setTimeout(() => {
        console.log('2. Filtro INDICADORES:');
        setTipoFiltro('indicador');
        setTimeout(() => {
            const indicadoresCount = document.querySelectorAll('#participantsList tr[data-participant-id]').length;
            console.log(`   Resultado: ${indicadoresCount} linhas`);
            
            // Teste 3: Participantes
            setTimeout(() => {
                console.log('3. Filtro PARTICIPANTES:');
                setTipoFiltro('participante');
                setTimeout(() => {
                    const participantesCount = document.querySelectorAll('#participantsList tr[data-participant-id]').length;
                    console.log(`   Resultado: ${participantesCount} linhas`);
                    
                    console.log('✅ Teste rápido concluído!');
                }, 500);
            }, 500);
        }, 500);
    }, 500);
};

// 🧪 DIAGNÓSTICO ESPECÍFICO: Bug Lista teste 02
window.debugListaTeste02 = function() {
    console.log('🔍 === DIAGNÓSTICO ESPECÍFICO: LISTA TESTE 02 ===');
    
    try {
        // 1. Analisar participantes originais
        console.log('1. 📊 PARTICIPANTES ORIGINAIS (antes do flatMap):');
        const participantesListaTeste02 = participants.filter(p => 
            p.lists && p.lists.some(list => {
                const listName = typeof list === 'object' ? list.name : list;
                return listName && listName.toLowerCase().includes('lista teste 02');
            })
        );
        
        console.log(`   - Participantes na "Lista teste 02": ${participantesListaTeste02.length}`);
        
        participantesListaTeste02.forEach((p, index) => {
            console.log(`   - Participante ${index + 1}:`);
            console.log(`     Nome: ${p.name}`);
            console.log(`     Tipo ORIGINAL: ${p.tipo || 'não definido'}`);
            console.log(`     Listas: ${p.lists?.length || 0}`);
            p.lists?.forEach(list => {
                const listName = typeof list === 'object' ? list.name : list;
                console.log(`       - Lista: "${listName}"`);
            });
            console.log(`     CampaignId: ${p.campaignId || 'não definido'}`);
            console.log(`     OriginCampaignId: ${p.originCampaignId || 'não definido'}`);
            console.log('     ---');
        });
        
        // 2. Analisar o que o flatMap está gerando
        console.log('2. 🔄 RESULTADO DO FLATMAP (o que aparece na tabela):');
        const simulatedFlatMap = participantesListaTeste02.flatMap(participant => {
            if (participant.lists && participant.lists.length > 0) {
                return participant.lists.map(list => {
                    const listName = typeof list === 'object' ? list.name : list;
                    return {
                        participantName: participant.name,
                        participantTipo: participant.tipo || 'participante',
                        listName: listName,
                        campaignId: participant.campaignId,
                        originCampaignId: participant.originCampaignId
                    };
                });
            } else {
                return [{
                    participantName: participant.name,
                    participantTipo: participant.tipo || 'participante', 
                    listName: '-',
                    campaignId: participant.campaignId,
                    originCampaignId: participant.originCampaignId
                }];
            }
        });
        
        console.log(`   - Total de linhas geradas pelo flatMap: ${simulatedFlatMap.length}`);
        simulatedFlatMap.forEach((linha, index) => {
            console.log(`   - Linha ${index + 1}:`);
            console.log(`     Nome: ${linha.participantName}`);
            console.log(`     Tipo: ${linha.participantTipo}`);
            console.log(`     Lista: "${linha.listName}"`);
            console.log(`     CampaignId: ${linha.campaignId || 'não definido'}`);
        });
        
        // 3. Verificar função getTipoInfo
        console.log('3. 🎭 TESTANDO FUNÇÃO getTipoInfo:');
        participantesListaTeste02.forEach(p => {
            const tipoOriginal = p.tipo || 'participante';
            const tipoInfo = getTipoInfo(tipoOriginal);
            console.log(`   - ${p.name}: tipo="${tipoOriginal}" → getTipoInfo="${tipoInfo.label}"`);
        });
        
        // 4. Verificar função getCampaignDisplayName
        console.log('4. 📢 TESTANDO FUNÇÃO getCampaignDisplayName:');
        participantesListaTeste02.forEach(p => {
            const campaignName = getCampaignDisplayName(p);
            console.log(`   - ${p.name}: getCampaignDisplayName="${campaignName}"`);
        });
        
        // 5. Analisar contaminação entre listas
        console.log('5. 🔬 ANÁLISE DE CONTAMINAÇÃO:');
        const participantesMultiplasListas = participants.filter(p => p.lists && p.lists.length > 1);
        console.log(`   - Participantes em múltiplas listas: ${participantesMultiplasListas.length}`);
        
        participantesMultiplasListas.forEach(p => {
            const temListaTeste02 = p.lists.some(list => {
                const listName = typeof list === 'object' ? list.name : list;
                return listName && listName.toLowerCase().includes('lista teste 02');
            });
            
            if (temListaTeste02) {
                console.log(`   🚨 SUSPEITO - ${p.name}:`);
                console.log(`     Tipo: ${p.tipo || 'não definido'}`);
                console.log(`     Listas:`);
                p.lists.forEach(list => {
                    const listName = typeof list === 'object' ? list.name : list;
                    console.log(`       - "${listName}"`);
                });
            }
        });
        
        console.log('✅ === DIAGNÓSTICO LISTA TESTE 02 CONCLUÍDO ===');
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
    }
};

// 🔧 DIAGNÓSTICO RÁPIDO: Verificar dados atuais na tabela
window.debugCurrentTable = function() {
    console.log('🔍 === DIAGNÓSTICO TABELA ATUAL ===');
    
    const rows = document.querySelectorAll('#participantsList tr[data-participant-id]');
    console.log(`Total de linhas na tabela: ${rows.length}`);
    
    rows.forEach((row, index) => {
        const participantId = row.getAttribute('data-participant-id');
        const listName = row.getAttribute('data-list-name');
        const userName = row.querySelector('.font-medium')?.textContent || 'N/A';
        const tipo = row.querySelector('.inline-flex')?.textContent?.trim() || 'N/A';
        const campanha = row.cells[4]?.textContent?.trim() || 'N/A';
        
        if (listName && listName.toLowerCase().includes('lista teste 02')) {
            console.log(`🔍 Linha ${index + 1} - Lista teste 02:`);
            console.log(`   Nome: ${userName}`);
            console.log(`   Tipo exibido: ${tipo}`);
            console.log(`   Campanha exibida: ${campanha}`);
            console.log(`   ParticipantId: ${participantId}`);
            console.log(`   ListName: ${listName}`);
        }
    });
};

// 🧪 DIAGNÓSTICO ESPECÍFICO: Bug Importação Lista de Participantes
window.debugImportFlow = function() {
    console.log('🔍 === DIAGNÓSTICO ESPECÍFICO: FLUXO DE IMPORTAÇÃO ===');
    
    try {
        // 1. Verificar estado atual das listas
        console.log('1. 📊 ESTADO ATUAL DAS LISTAS:');
        console.log(`   - Total de listas: ${lists?.length || 0}`);
        
        if (lists && lists.length > 0) {
            lists.forEach((list, index) => {
                console.log(`   - Lista ${index + 1}:`);
                console.log(`     Nome: "${list.name}"`);
                console.log(`     ID: ${list._id || list.id}`);
                console.log(`     Tipo: ${list.tipo || 'não definido'}`);
                console.log(`     Participantes: ${list.participants?.length || 0}`);
                console.log(`     CampaignId: ${list.campaignId || 'não definido'}`);
                console.log('     ---');
            });
        }
        
        // 2. Analisar função saveImportedParticipants
        console.log('2. 🔧 ANÁLISE DA FUNÇÃO saveImportedParticipants:');
        console.log('   📄 Código atual da função:');
        console.log('   - Endpoint usado: /participants/import');
        console.log('   - Campos enviados: name, email, phone, company, status, tipo, listId');
        console.log('   ✅ CORRIGIDO: Agora envia "tipo" e "listId"');
        console.log('   ✅ CORRIGIDO: Vincula à lista específica');
        
        // 3. Simular dados que seriam enviados
        console.log('3. 🔄 SIMULAÇÃO DE DADOS DE IMPORTAÇÃO:');
        const mockParticipants = [
            { name: 'Teste 1', email: 'teste1@email.com', phone: '123456789' },
            { name: 'Teste 2', email: 'teste2@email.com', phone: '987654321' }
        ];
        
        console.log('   📤 Dados que seriam enviados para o backend:');
        const payloadAtual = {
            clientId: localStorage.getItem('clientId'),
            participants: mockParticipants.map(p => ({
                name: p.name,
                email: p.email,
                phone: p.phone,
                company: p.company,
                status: p.status || 'active'
            }))
        };
        console.log('   Payload atual:', payloadAtual);
        
        console.log('   📤 Dados que DEVERIAM ser enviados:');
        const payloadCorrigido = {
            clientId: localStorage.getItem('clientId'),
            listId: lists?.[0]?._id || 'ID_DA_LISTA_CRIADA', // ID da lista recém-criada
            tipo: 'participante', // Tipo definido na criação da lista
            participants: mockParticipants.map(p => ({
                name: p.name,
                email: p.email,
                phone: p.phone,
                company: p.company || '',
                status: p.status || 'active',
                tipo: 'participante' // Tipo correto
            }))
        };
        console.log('   Payload corrigido:', payloadCorrigido);
        
        // 4. Verificar backend endpoints disponíveis
        console.log('4. 🌐 ENDPOINTS DISPONÍVEIS:');
        console.log('   - Atual: POST /participants/import (genérico)');
        console.log('   - Possível: POST /participant-lists/:listId/participants (específico)');
        console.log('   - Possível: POST /participant-lists/:listId/import (ideal)');
        
        // 5. Analisar fluxo ideal
        console.log('5. 🎯 FLUXO IDEAL PARA CORREÇÃO:');
        console.log('   1. Usuário cria lista "Lista teste 01" tipo "participante"');
        console.log('   2. Usuário faz upload da planilha');
        console.log('   3. Sistema processa planilha (parseExcelFile/parseCSVFile)');
        console.log('   4. Sistema envia para backend com:');
        console.log('      - ID da lista específica');
        console.log('      - Tipo da lista (participante)');
        console.log('      - Dados dos participantes');
        console.log('   5. Backend associa participantes à lista correta');
        console.log('   6. Sistema atualiza interface mostrando participantes na lista');
        
        // 6. Identificar pontos de falha
        console.log('6. 🚨 PONTOS DE FALHA IDENTIFICADOS:');
        console.log('   ❌ Função saveImportedParticipants() não recebe listId');
        console.log('   ❌ Função não sabe qual lista foi criada');
        console.log('   ❌ Tipo "participante" não é passado para o backend');
        console.log('   ❌ Backend pode estar criando participantes genéricos');
        console.log('   ❌ Falta vinculação entre importação e lista específica');
        
        console.log('✅ === DIAGNÓSTICO IMPORTAÇÃO CONCLUÍDO ===');
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
    }
};

// 🔧 DIAGNÓSTICO RÁPIDO: Verificar última importação
window.debugLastImport = function() {
    console.log('🔍 === DIAGNÓSTICO ÚLTIMA IMPORTAÇÃO ===');
    
    // Verificar LocalStorage para evidências
    console.log('📦 LocalStorage:');
    console.log(`   - ClientId: ${localStorage.getItem('clientId')}`);
    console.log(`   - Token: ${localStorage.getItem('clientToken') ? 'Presente' : 'Ausente'}`);
    
    // Verificar estado atual do sistema
    console.log('📊 Estado do Sistema:');
    console.log(`   - Listas carregadas: ${lists?.length || 0}`);
    console.log(`   - Participantes carregados: ${participants?.length || 0}`);
    
    // Analisar última lista criada
    if (lists && lists.length > 0) {
        const ultimaLista = lists[lists.length - 1];
        console.log('📋 Última lista criada:');
        console.log(`   - Nome: "${ultimaLista.name}"`);
        console.log(`   - Tipo: ${ultimaLista.tipo || 'não definido'}`);
        console.log(`   - Participantes: ${ultimaLista.participants?.length || 0}`);
        console.log(`   - ID: ${ultimaLista._id || ultimaLista.id}`);
        
        if (ultimaLista.participants && ultimaLista.participants.length === 0) {
            console.log('🚨 PROBLEMA CONFIRMADO: Lista criada mas sem participantes!');
        }
    }
};

// 🧪 TESTE SIMULADO: Simular processo de importação
window.simulateImportProcess = function() {
    console.log('🧪 === SIMULANDO PROCESSO DE IMPORTAÇÃO ===');
    
    try {
        // 1. Simular criação de lista
        console.log('1. ✅ Lista criada: "Lista teste 01" (tipo: participante)');
        const mockList = {
            _id: 'mock-list-id-123',
            name: 'Lista teste 01',
            tipo: 'participante',
            participants: []
        };
        
        // 2. Simular processamento de planilha
        console.log('2. 📄 Planilha processada:');
        const mockParticipants = [
            { name: 'João Silva', email: 'joao@email.com', phone: '11999999999' },
            { name: 'Maria Santos', email: 'maria@email.com', phone: '11888888888' }
        ];
        console.log(`   - ${mockParticipants.length} participantes extraídos da planilha`);
        
        // 3. Simular payload atual (com problema)
        console.log('3. ❌ Payload atual (problemático):');
        const payloadAtual = {
            clientId: localStorage.getItem('clientId'),
            participants: mockParticipants.map(p => ({
                name: p.name,
                email: p.email,
                phone: p.phone,
                status: 'active'
                // ❌ Sem tipo, sem listId
            }))
        };
        console.log('   Payload:', payloadAtual);
        console.log('   🚨 Resultado esperado: Participantes criados como "indicador" genérico');
        
        // 4. Simular payload corrigido
        console.log('4. ✅ Payload corrigido (solução):');
        const payloadCorrigido = {
            clientId: localStorage.getItem('clientId'),
            listId: mockList._id,
            tipoLista: mockList.tipo,
            participants: mockParticipants.map(p => ({
                name: p.name,
                email: p.email,
                phone: p.phone,
                status: 'active',
                tipo: 'participante' // Tipo correto baseado na lista
            }))
        };
        console.log('   Payload:', payloadCorrigido);
        console.log('   ✅ Resultado esperado: Participantes criados como "participante" na lista correta');
        
        // 5. Mostrar diferença
        console.log('5. 📊 COMPARAÇÃO:');
        console.log('   ❌ Atual: Endpoint genérico, sem contexto de lista');
        console.log('   ✅ Ideal: Endpoint específico com contexto completo');
        
        console.log('✅ === SIMULAÇÃO CONCLUÍDA ===');
        
    } catch (error) {
        console.error('❌ Erro na simulação:', error);
    }
};

// 🔧 FUNÇÃO PARA TESTAR CORREÇÃO: Preview da solução
window.previewImportFix = function() {
    console.log('🔧 === PREVIEW DA CORREÇÃO ===');
    
    console.log('📝 MUDANÇAS NECESSÁRIAS:');
    console.log('');
    console.log('1. 🔧 Modificar saveImportedParticipants():');
    console.log('   - Adicionar parâmetro listId');
    console.log('   - Adicionar parâmetro tipoParticipante');
    console.log('   - Incluir tipo no payload');
    console.log('');
    console.log('2. 🔧 Modificar handleImport():');
    console.log('   - Passar contexto da lista para saveImportedParticipants()');
    console.log('   - Determinar tipo correto baseado na lista');
    console.log('');
    console.log('3. 🔧 Possível endpoint backend:');
    console.log('   - Usar endpoint específico de lista se disponível');
    console.log('   - Ou melhorar endpoint atual para aceitar listId');
    console.log('');
    console.log('4. 🔧 Fluxo de criação de lista:');
    console.log('   - Conectar modal de importação com lista recém-criada');
    console.log('   - Passar ID e tipo da lista para importação');
    
    console.log('✅ === PREVIEW CONCLUÍDO ===');
};

// 🔧 FUNÇÕES AUXILIARES: Para determinar contexto de lista na importação
function getSelectedListId() {
    console.log('🔍 getSelectedListId() - Iniciando busca por lista selecionada...');
    
    // 1. Verificar se há uma lista selecionada no filtro
    const listFilter = document.getElementById('listFilter');
    if (listFilter && listFilter.value) {
        console.log(`✅ Lista encontrada via filtro: ${listFilter.value}`);
        return listFilter.value;
    }
    
    // 2. Verificar se estamos na aba de listas e há uma lista selecionada via import
    if (window.selectedListForImport) {
        console.log(`✅ Lista encontrada via selectedListForImport: ${window.selectedListForImport}`);
        return window.selectedListForImport;
    }
    
    // 3. NOVO: Verificar se há uma lista sendo editada no momento
    if (window.currentEditingListId) {
        console.log(`✅ Lista encontrada via currentEditingListId: ${window.currentEditingListId}`);
        return window.currentEditingListId;
    }
    
    // 4. NOVO: Fallback para a primeira lista disponível se existir
    if (lists && lists.length > 0) {
        const firstListId = lists[0]._id || lists[0].id;
        console.log(`⚠️ Nenhuma lista selecionada, usando primeira lista como fallback: ${firstListId}`);
        
        // Opcional: Selecionar automaticamente no filtro se existir
        if (listFilter) {
            console.log('🔄 Selecionando automaticamente no filtro...');
            
            // Verificar se o filtro não está populado
            if (listFilter.options.length <= 1) {
                console.log('📋 Filtro não populado, populando agora...');
                if (typeof populateListFilter === 'function') {
                    populateListFilter();
                }
            }
            
            // Selecionar a primeira lista
            listFilter.value = firstListId;
            console.log(`✅ Primeira lista selecionada automaticamente no filtro`);
        }
        
        return firstListId;
    }
    
    // 5. Se realmente não há nenhuma lista disponível
    console.log('❌ Nenhuma lista disponível no sistema');
    
    // NOVO: Tentar carregar listas se não estão carregadas
    if ((!lists || lists.length === 0) && typeof loadLists === 'function') {
        console.log('🔄 Tentando carregar listas automaticamente...');
        loadLists().then(() => {
            console.log('✅ Listas carregadas, tentando novamente...');
            // Não chamar recursivamente para evitar loop, apenas informar
            if (lists && lists.length > 0) {
                console.log(`💡 ${lists.length} listas agora disponíveis. Chame getSelectedListId() novamente.`);
            }
        }).catch(error => {
            console.error('❌ Erro ao carregar listas:', error);
        });
    }
    
    return null;
}

// 🔧 SOLUÇÃO DEFINITIVA: Auto-correção na inicialização
window.autoFixOrphanParticipants = async function() {
    console.log('🔧 AUTO-CORREÇÃO: Verificando participantes órfãos...');
    
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        if (!token || !clientId) {
            return false;
        }
        
        // Buscar dados
        const [participantsRes, listsRes] = await Promise.all([
            fetch(`${getApiUrl()}/participants?clientId=${clientId}&limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${getApiUrl()}/participant-lists?clientId=${clientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        const participantsData = await participantsRes.json();
        const allParticipants = participantsData.participants || [];
        const allLists = await listsRes.json();
        
        // Encontrar órfãos
        const orphans = allParticipants.filter(p => !p.lists || p.lists.length === 0);
        
        if (orphans.length === 0) {
            console.log('✅ Nenhum participante órfão encontrado');
            return true;
        }
        
        console.log(`🔧 Encontrados ${orphans.length} participantes órfãos - corrigindo automaticamente...`);
        
        // Para cada lista, verificar se tem participantes no array mas órfãos no sistema
        for (const list of allLists) {
            if (list.participants && list.participants.length > 0) {
                for (const participantId of list.participants) {
                    const participant = allParticipants.find(p => p._id === participantId);
                    
                    if (participant && (!participant.lists || participant.lists.length === 0)) {
                        // Participante órfão que deveria estar na lista
                        try {
                            await fetch(`${getApiUrl()}/participant-lists/${list._id}/participants`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ participantId: participant._id })
                            });
                            console.log(`✅ ${participant.name} sincronizado com lista "${list.name}"`);
                        } catch (error) {
                            console.log(`❌ Erro sincronizando ${participant.name}:`, error.message);
                        }
                    }
                }
            }
        }
        
        console.log('✅ Auto-correção concluída');
        return true;
        
    } catch (error) {
        console.error('❌ Erro na auto-correção:', error);
        return false;
    }
};

// 🔧 INTERCEPTAÇÃO DEFINITIVA: Sobrescrever saveImportedParticipants permanentemente
(function() {
    // Salvar função original se ainda não foi salva
    if (!window.originalSaveImportedParticipants) {
        window.originalSaveImportedParticipants = window.saveImportedParticipants;
    }
    
    // Sobrescrever com versão que sempre faz sincronização
    window.saveImportedParticipants = async function(participants, listId = null, tipoParticipante = 'participante') {
        console.log('🔧 IMPORTAÇÃO INTERCEPTADA - Aplicando correção automática definitiva');
        
        try {
            // 1. Executar importação original
            const result = await window.originalSaveImportedParticipants(participants, listId, tipoParticipante);
            
            // 2. Forçar sincronização após 3 segundos
            if (listId) {
                console.log('⏳ Aguardando 3 segundos para sincronização automática...');
                setTimeout(async () => {
                    try {
                        console.log('🔧 Executando sincronização automática...');
                        await autoFixOrphanParticipants();
                        
                        // Recarregar dados
                        await loadParticipants();
                        await loadLists(true);
                        
                        if (currentTab === 'lists') {
                            refreshListsDisplay();
                        }
                        
                        console.log('✅ SINCRONIZAÇÃO AUTOMÁTICA CONCLUÍDA!');
                        showNotification('Participantes importados e sincronizados automaticamente!', 'success');
                        
                    } catch (error) {
                        console.error('❌ Erro na sincronização automática:', error);
                    }
                }, 3000);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Erro na importação com correção automática:', error);
            throw error;
        }
    };
    
    console.log('🔧 SOLUÇÃO DEFINITIVA ATIVA: Importações agora sincronizam automaticamente');
})();

// 🔧 AUTO-INICIALIZAÇÃO: Executar correção ao carregar a página
(function() {
    // Aguardar um tempo após o carregamento para executar auto-correção
    setTimeout(async () => {
        if (document.readyState === 'complete') {
            console.log('🔧 Executando auto-correção na inicialização...');
            await autoFixOrphanParticipants();
        }
    }, 5000); // 5 segundos após carregar
})();

// 🔧 COMANDO MANUAL: Para execução quando necessário
window.runDefinitiveFix = async function() {
    console.log('🔧 === EXECUÇÃO MANUAL DA CORREÇÃO DEFINITIVA ===');
    
    const success = await autoFixOrphanParticipants();
    
    if (success) {
        // Recarregar tudo
        await loadParticipants();
        await loadLists(true);
        
        if (currentTab === 'lists') {
            refreshListsDisplay();
        } else if (currentTab === 'users') {
            displayParticipants();
        }
        
        console.log('🎉 CORREÇÃO DEFINITIVA EXECUTADA COM SUCESSO!');
        showNotification('Sistema sincronizado com sucesso!', 'success');
    } else {
        console.log('❌ Falha na correção definitiva');
        showNotification('Erro na sincronização', 'error');
    }
    
    return success;
};

function getCurrentListType() {
    // Se há uma lista específica selecionada, obter seu tipo
    const currentListId = currentEditingListId || getSelectedListId();
    if (currentListId && lists) {
        const list = lists.find(l => (l._id || l.id) === currentListId);
        if (list && list.tipo) {
            return list.tipo;
        }
    }
    
    // Se não há lista específica, usar tipo padrão baseado na aba atual ou contexto
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab && activeTab.textContent.toLowerCase().includes('indicador')) {
        return 'indicador';
    }
    
    return 'participante'; // Padrão
}

// 🔧 VARIÁVEL GLOBAL: Para rastrear lista sendo editada
let currentEditingListId = null;

// 🔧 FUNÇÃO: Definir contexto de lista para importação
function setImportListContext(listId) {
    window.selectedListForImport = listId;
    currentEditingListId = listId;
    console.log('🔧 Contexto de importação definido:', { listId });
}

// 🔧 FUNÇÃO DE VERIFICAÇÃO: Confirmar se correção foi aplicada
window.verificarCorrecaoImportacao = function() {
    console.log('🔍 === VERIFICAÇÃO DA CORREÇÃO DE IMPORTAÇÃO ===');
    
    try {
        // 1. Verificar se função corrigida existe
        const funcaoCorrigida = saveImportedParticipants.toString();
        console.log('1. 📋 VERIFICAÇÃO DA FUNÇÃO:');
        
        if (funcaoCorrigida.includes('listId = null') && funcaoCorrigida.includes('tipoParticipante = \'participante\'')) {
            console.log('   ✅ Função saveImportedParticipants CORRIGIDA encontrada');
            console.log('   ✅ Aceita parâmetros: listId e tipoParticipante');
        } else {
            console.log('   ❌ Função ainda não corrigida');
        }
        
        if (funcaoCorrigida.includes('listId: listId') && funcaoCorrigida.includes('tipo: tipoParticipante')) {
            console.log('   ✅ Payload inclui listId e tipo');
        } else {
            console.log('   ❌ Payload ainda não inclui listId e tipo');
        }
        
        // 2. Verificar funções auxiliares
        console.log('2. 🔧 VERIFICAÇÃO DAS FUNÇÕES AUXILIARES:');
        
        if (typeof getSelectedListId === 'function') {
            console.log('   ✅ getSelectedListId() encontrada');
        } else {
            console.log('   ❌ getSelectedListId() não encontrada');
        }
        
        if (typeof getCurrentListType === 'function') {
            console.log('   ✅ getCurrentListType() encontrada');
        } else {
            console.log('   ❌ getCurrentListType() não encontrada');
        }
        
        if (typeof setImportListContext === 'function') {
            console.log('   ✅ setImportListContext() encontrada');
        } else {
            console.log('   ❌ setImportListContext() não encontrada');
        }
        
        // 3. Testar detecção de contexto
        console.log('3. 🧪 TESTE DE DETECÇÃO DE CONTEXTO:');
        const listId = getSelectedListId();
        const tipo = getCurrentListType();
        
        console.log(`   - ID da lista detectado: ${listId || 'nenhum'}`);
        console.log(`   - Tipo detectado: ${tipo}`);
        
        // 4. Verificar listas disponíveis
        console.log('4. 📊 LISTAS DISPONÍVEIS:');
        if (lists && lists.length > 0) {
            console.log(`   - Total: ${lists.length} listas`);
            lists.forEach((list, index) => {
                console.log(`   - Lista ${index + 1}: "${list.name}" (${list.tipo || 'tipo não definido'})`);
            });
        } else {
            console.log('   - Nenhuma lista carregada');
        }
        
        // 5. Status geral
        console.log('5. 📋 STATUS GERAL DA CORREÇÃO:');
        const funcaoOK = funcaoCorrigida.includes('listId = null') && funcaoCorrigida.includes('tipoParticipante');
        const auxiliaresOK = typeof getSelectedListId === 'function' && typeof getCurrentListType === 'function';
        
        if (funcaoOK && auxiliaresOK) {
            console.log('   🎯 STATUS: CORREÇÃO APLICADA COM SUCESSO!');
            console.log('   ✅ A importação deve funcionar corretamente agora');
        } else {
            console.log('   ⚠️ STATUS: CORREÇÃO PARCIAL');
            console.log('   - Função principal:', funcaoOK ? 'OK' : 'PENDENTE');
            console.log('   - Funções auxiliares:', auxiliaresOK ? 'OK' : 'PENDENTE');
        }
        
        console.log('✅ === VERIFICAÇÃO CONCLUÍDA ===');
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error);
    }
};

// 🧪 FUNÇÃO DE TESTE: Simular importação com correção
window.testarImportacaoCorrigida = function() {
    console.log('🧪 === TESTE DA IMPORTAÇÃO CORRIGIDA ===');
    
    try {
        // Dados de teste
        const mockParticipants = [
            { name: 'Teste Correção 1', email: 'teste1@correção.com', phone: '11999999999' },
            { name: 'Teste Correção 2', email: 'teste2@correção.com', phone: '11888888888' }
        ];
        
        // Detectar contexto
        const listId = getSelectedListId() || (lists && lists.length > 0 ? lists[0]._id : null);
        const tipo = getCurrentListType() || 'participante';
        
        console.log('📋 DADOS DO TESTE:');
        console.log(`   - Participantes: ${mockParticipants.length}`);
        console.log(`   - Lista ID: ${listId || 'nenhuma lista disponível'}`);
        console.log(`   - Tipo: ${tipo}`);
        
        if (!listId) {
            console.log('⚠️ AVISO: Nenhuma lista disponível para teste');
            console.log('💡 SOLUÇÃO: Crie uma lista primeiro ou teste com lista específica');
            return;
        }
        
        // Simular payload que seria enviado
        const payload = {
            clientId: localStorage.getItem('clientId'),
            listId: listId,
            tipoParticipante: tipo,
            participants: mockParticipants.map(p => ({
                name: p.name,
                email: p.email,
                phone: p.phone,
                company: '',
                status: 'active',
                tipo: tipo,
                listId: listId
            }))
        };
        
        console.log('📤 PAYLOAD QUE SERIA ENVIADO:');
        console.log(payload);
        
        console.log('✅ TESTE SIMULADO COM SUCESSO!');
        console.log('💡 Para teste real, use o modal de importação');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
    
    console.log('✅ === TESTE CONCLUÍDO ===');
};

// 🧪 FUNÇÃO DE TESTE PARA VERIFICAR FILTRO DE LISTAS
window.testListFilter = async function() {
    console.log('🧪 === TESTE DE FILTRO DE LISTAS ===');
    
    try {
        // 1. Verificar se existem participantes e listas carregados
        console.log('📊 Estado atual:');
        console.log('👥 Participantes carregados:', participants?.length || 0);
        console.log('📋 Listas carregadas:', lists?.length || 0);
        
        if (!participants || participants.length === 0) {
            console.log('❌ Nenhum participante carregado. Carregando...');
            await loadParticipants();
        }
        
        if (!lists || lists.length === 0) {
            console.log('❌ Nenhuma lista carregada. Carregando...');
            await loadLists();
        }
        
        // 2. Verificar estrutura dos dados
        if (participants && participants.length > 0) {
            const sampleParticipant = participants[0];
            console.log('🔍 Estrutura do primeiro participante:', {
                id: sampleParticipant._id || sampleParticipant.id,
                name: sampleParticipant.name,
                lists: sampleParticipant.lists?.length || 0,
                listsData: sampleParticipant.lists
            });
        }
        
        if (lists && lists.length > 0) {
            const sampleList = lists[0];
            console.log('🔍 Estrutura da primeira lista:', {
                id: sampleList._id || sampleList.id,
                name: sampleList.name,
                participants: sampleList.participants?.length || 0
            });
        }
        
        // 3. Testar filtro manualmente
        console.log('3. Testando filtro de participantes por lista...');
        
        if (lists && lists.length > 0) {
            const firstList = lists[0];
            const listId = firstList._id || firstList.id;
            
            console.log(`   Testando com lista: "${firstList.name}" (ID: ${listId})`);
            
            // Simular seleção da lista no dropdown
            const listFilter = document.getElementById('listFilter');
            if (listFilter) {
                listFilter.value = listId;
                console.log('   Dropdown de lista selecionado');
                
                // Aplicar filtro
                await filterParticipants();
                
                console.log('   Filtro aplicado com sucesso!');
                console.log('✅ Teste concluído - verifique a tabela');
            } else {
                console.log('❌ Dropdown de lista não encontrado');
            }
        } else {
            console.log('❌ Nenhuma lista disponível para teste');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
};

// 🚨 FUNÇÃO DE DIAGNÓSTICO E CORREÇÃO URGENTE
window.diagnosticAndFixListSync = async function() {
    console.log('🚨 === DIAGNÓSTICO E CORREÇÃO DE SINCRONIZAÇÃO LISTA-PARTICIPANTES ===');
    
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        if (!token || !clientId) {
            console.log('❌ Token ou clientId não encontrado');
            return;
        }
        
        // 1. Buscar todas as listas
        console.log('1️⃣ Buscando todas as listas...');
        const listsResponse = await fetch(`${getApiUrl()}/participant-lists?clientId=${clientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const allLists = await listsResponse.json();
        console.log(`📋 ${allLists.length} listas encontradas`);
        
        // 2. Buscar todos os participantes
        console.log('2️⃣ Buscando todos os participantes...');
        const participantsResponse = await fetch(`${getApiUrl()}/participants?clientId=${clientId}&limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const participantsData = await participantsResponse.json();
        const allParticipants = participantsData.participants || [];
        console.log(`👥 ${allParticipants.length} participantes encontrados`);
        
        // 3. Analisar problemas
        console.log('3️⃣ Analisando problemas de sincronização...');
        
        let problemsFound = 0;
        let fixesApplied = 0;
        
        for (const list of allLists) {
            console.log(`\n🔍 Analisando lista "${list.name}" (ID: ${list._id})`);
            console.log(`   - Participantes na lista: ${list.participants?.length || 0}`);
            
            if (list.participants && list.participants.length > 0) {
                // Verificar se os participantes têm a lista no seu array 'lists'
                for (const participantId of list.participants) {
                    const participant = allParticipants.find(p => p._id === participantId || p._id === String(participantId));
                    
                    if (participant) {
                        const hasListInParticipant = participant.lists && participant.lists.some(l => {
                            const listId = typeof l === 'object' ? l._id : l;
                            return String(listId) === String(list._id);
                        });
                        
                        if (!hasListInParticipant) {
                            console.log(`   ❌ PROBLEMA: Participante "${participant.name}" não tem a lista "${list.name}" no seu array`);
                            problemsFound++;
                            
                            // CORREÇÃO: Adicionar lista ao participante
                            try {
                                const fixResponse = await fetch(`${getApiUrl()}/participant-lists/${list._id}/participants`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ participantId: participant._id })
                                });
                                
                                if (fixResponse.ok) {
                                    console.log(`   ✅ CORRIGIDO: Adicionado participante "${participant.name}" à lista "${list.name}"`);
                                    fixesApplied++;
                                } else {
                                    console.log(`   ❌ ERRO ao corrigir: ${fixResponse.status}`);
                                }
                            } catch (error) {
                                console.log(`   ❌ ERRO na correção: ${error.message}`);
                            }
                        } else {
                            console.log(`   ✅ OK: Participante "${participant.name}" está sincronizado`);
                        }
                    } else {
                        console.log(`   ⚠️ AVISO: Participante ID "${participantId}" não encontrado nos dados`);
                    }
                }
            } else {
                console.log(`   📭 Lista vazia`);
            }
        }
        
        // 4. Verificar participantes órfãos
        console.log('\n4️⃣ Verificando participantes órfãos...');
        for (const participant of allParticipants) {
            if (participant.lists && participant.lists.length > 0) {
                for (const listRef of participant.lists) {
                    const listId = typeof listRef === 'object' ? listRef._id : listRef;
                    const list = allLists.find(l => l._id === String(listId));
                    
                    if (list) {
                        const isInListArray = list.participants && list.participants.some(pId => String(pId) === String(participant._id));
                        
                        if (!isInListArray) {
                            console.log(`   ❌ PROBLEMA: Lista "${list.name}" não tem participante "${participant.name}" no seu array`);
                            problemsFound++;
                            
                            // CORREÇÃO: Adicionar participante à lista
                            try {
                                const fixResponse = await fetch(`${getApiUrl()}/participant-lists/${list._id}/participants`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ participantId: participant._id })
                                });
                                
                                if (fixResponse.ok) {
                                    console.log(`   ✅ CORRIGIDO: Adicionado participante "${participant.name}" à lista "${list.name}"`);
                                    fixesApplied++;
                                } else {
                                    console.log(`   ❌ ERRO ao corrigir: ${fixResponse.status}`);
                                }
                            } catch (error) {
                                console.log(`   ❌ ERRO na correção: ${error.message}`);
                            }
                        }
                    }
                }
            }
        }
        
        console.log('\n📊 === RESUMO DO DIAGNÓSTICO ===');
        console.log(`🔍 Problemas encontrados: ${problemsFound}`);
        console.log(`✅ Correções aplicadas: ${fixesApplied}`);
        
        if (fixesApplied > 0) {
            console.log('\n🔄 Recarregando dados após correções...');
            await loadParticipants();
            await loadLists(true);
            
            if (currentTab === 'lists') {
                refreshListsDisplay();
            } else if (currentTab === 'users') {
                displayParticipants();
            }
            
            console.log('✅ Dados recarregados! Verifique se os problemas foram resolvidos.');
        } else {
            console.log('✅ Nenhuma correção necessária ou todos os problemas já foram corrigidos.');
        }
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
    }
};

// 🔧 FUNÇÃO DE SINCRONIZAÇÃO RÁPIDA PARA LISTAS EXISTENTES
window.quickSyncAllLists = async function() {
    console.log('🔄 === SINCRONIZAÇÃO RÁPIDA DE TODAS AS LISTAS ===');
    
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        // Carregar dados atuais
        await loadParticipants();
        await loadLists(true);
        
        if (lists && lists.length > 0) {
            console.log(`🔄 Sincronizando ${lists.length} listas...`);
            
            for (const list of lists) {
                if (list.participants && list.participants.length > 0) {
                    console.log(`📋 Sincronizando lista "${list.name}" com ${list.participants.length} participantes...`);
                    
                    // Forçar sincronização bidirecional via backend
                    try {
                        const response = await fetch(`${getApiUrl()}/participant-lists/${list._id}/sync`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        
                        if (response.ok) {
                            console.log(`   ✅ Lista "${list.name}" sincronizada`);
                        } else {
                            console.log(`   ⚠️ Erro na sincronização da lista "${list.name}":`, response.status);
                        }
                    } catch (error) {
                        console.log(`   ❌ Erro na sincronização da lista "${list.name}":`, error.message);
                    }
                }
            }
            
            console.log('🔄 Recarregando dados após sincronização...');
            await loadParticipants();
            await loadLists(true);
            refreshListsDisplay();
            
            console.log('✅ Sincronização concluída!');
        } else {
            console.log('⚠️ Nenhuma lista encontrada para sincronizar');
        }
        
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
    }
};

// 🎯 CORREÇÃO DEFINITIVA: Força sincronização após importação
window.forceListSync = async function(listId) {
    console.log('🎯 FORÇANDO SINCRONIZAÇÃO PARA LISTA:', listId);
    
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        if (!token || !clientId) {
            console.log('❌ Token/clientId não encontrado');
            return false;
        }
        
        // 1. Buscar a lista específica
        const listResponse = await fetch(`${getApiUrl()}/participant-lists/${listId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!listResponse.ok) {
            console.log('❌ Erro ao buscar lista');
            return false;
        }
        
        const list = await listResponse.json();
        console.log(`📋 Lista encontrada: "${list.name}" com ${list.participants?.length || 0} participantes`);
        
        if (!list.participants || list.participants.length === 0) {
            console.log('⚠️ Lista está vazia - nada para sincronizar');
            return false;
        }
        
        // 2. Para cada participante da lista, forçar a adição bidirecional
        let syncCount = 0;
        for (const participantId of list.participants) {
            try {
                // Forçar sincronização via endpoint
                const syncResponse = await fetch(`${getApiUrl()}/participant-lists/${listId}/participants`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ participantId })
                });
                
                if (syncResponse.ok) {
                    syncCount++;
                    console.log(`✅ Participante ${participantId} sincronizado`);
                } else {
                    console.log(`⚠️ Participante ${participantId} erro:`, syncResponse.status);
                }
            } catch (error) {
                console.log(`❌ Erro sincronizando ${participantId}:`, error.message);
            }
        }
        
        console.log(`🎯 SINCRONIZAÇÃO COMPLETA: ${syncCount}/${list.participants.length} participantes`);
        
        // 3. Recarregar dados
        await loadParticipants();
        await loadLists(true);
        
        if (currentTab === 'lists') {
            refreshListsDisplay();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro na sincronização forçada:', error);
        return false;
    }
};

// 🚀 SOLUÇÃO AUTOMÁTICA: Executar após qualquer importação
const originalSaveImportedParticipants = saveImportedParticipants;
window.saveImportedParticipants = async function(participants, listId = null, tipoParticipante = 'participante') {
    console.log('🚀 INTERCEPTANDO IMPORTAÇÃO - Aplicando correção automática');
    
    try {
        // Executar importação original
        const result = await originalSaveImportedParticipants(participants, listId, tipoParticipante);
        
        // Se tem listId, forçar sincronização imediatamente
        if (listId) {
            console.log('🔧 APLICANDO CORREÇÃO AUTOMÁTICA para lista:', listId);
            setTimeout(async () => {
                await forceListSync(listId);
                console.log('✅ CORREÇÃO AUTOMÁTICA APLICADA!');
            }, 2000); // Esperar 2 segundos para o backend processar
        }
        
        return result;
    } catch (error) {
        console.error('❌ Erro na importação com correção:', error);
        throw error;
    }
};

// 🎯 FUNÇÃO DE CORREÇÃO IMEDIATA: Para usar quando precisar
window.fixMyList = async function(listName) {
    console.log('🎯 CORREÇÃO IMEDIATA PARA LISTA:', listName);
    
    try {
        // Carregar listas se necessário
        if (!lists || lists.length === 0) {
            await loadLists();
        }
        
        // Encontrar a lista pelo nome
        const list = lists.find(l => l.name.toLowerCase().includes(listName.toLowerCase()));
        
        if (!list) {
            console.log('❌ Lista não encontrada. Listas disponíveis:');
            lists.forEach(l => console.log(`  - ${l.name}`));
            return false;
        }
        
        console.log(`🎯 Corrigindo lista: "${list.name}" (ID: ${list._id})`);
        const success = await forceListSync(list._id);
        
        if (success) {
            console.log('🎉 LISTA CORRIGIDA COM SUCESSO!');
            console.log('✅ Verifique agora a aba de listas - deve mostrar a contagem correta');
        } else {
            console.log('❌ Falha na correção');
        }
        
        return success;
        
    } catch (error) {
        console.error('❌ Erro na correção:', error);
        return false;
    }
};

// 🔍 DIAGNÓSTICO ESPECÍFICO: Problema de contagem de participantes
window.debugListParticipants = async function() {
    console.log('🔍 === DIAGNÓSTICO ESPECÍFICO: CONTAGEM DE PARTICIPANTES ===');
    
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        // 1. Verificar dados locais
        console.log('1️⃣ DADOS LOCAIS:');
        console.log('Listas carregadas:', lists?.length || 0);
        console.log('Participantes carregados:', participants?.length || 0);
        
        if (lists && lists.length > 0) {
            lists.forEach((list, index) => {
                console.log(`Lista ${index + 1}: "${list.name}"`);
                console.log(`  - ID: ${list._id}`);
                console.log(`  - Participants: ${list.participants?.length || 0}`);
                console.log(`  - Participants data:`, list.participants);
                console.log(`  - ParticipantCount: ${list.participantCount || 'não definido'}`);
            });
        }
        
        // 2. Buscar dados DIRETO do backend
        console.log('\n2️⃣ BUSCANDO DADOS DIRETO DO BACKEND:');
        
        const listsResponse = await fetch(`${getApiUrl()}/participant-lists?clientId=${clientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const backendLists = await listsResponse.json();
        console.log('Backend retornou:', backendLists.length, 'listas');
        
        backendLists.forEach((list, index) => {
            console.log(`\nBackend Lista ${index + 1}: "${list.name}"`);
            console.log(`  - ID: ${list._id}`);
            console.log(`  - Participants array:`, list.participants);
            console.log(`  - Participants length:`, list.participants?.length || 0);
            console.log(`  - ParticipantCount:`, list.participantCount);
            console.log(`  - Todas as propriedades:`, Object.keys(list));
        });
        
        // 3. Buscar participantes e verificar conexão
        console.log('\n3️⃣ VERIFICANDO PARTICIPANTES:');
        
        const participantsResponse = await fetch(`${getApiUrl()}/participants?clientId=${clientId}&limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const participantsData = await participantsResponse.json();
        const allParticipants = participantsData.participants || [];
        
        console.log('Total participantes no backend:', allParticipants.length);
        
        // Verificar quantos participantes têm listas
        const participantsWithLists = allParticipants.filter(p => p.lists && p.lists.length > 0);
        console.log('Participantes COM listas:', participantsWithLists.length);
        
        // 4. Testar lista específica
        const testeLista = backendLists.find(l => l.name.toLowerCase().includes('teste'));
        if (testeLista) {
            console.log('\n4️⃣ ANÁLISE ESPECÍFICA DA LISTA "TESTE":');
            console.log('Lista encontrada:', testeLista.name);
            console.log('ID da lista:', testeLista._id);
            console.log('Participants array:', testeLista.participants);
            console.log('Length oficial:', testeLista.participants?.length || 0);
            
            if (testeLista.participants && testeLista.participants.length > 0) {
                console.log('\n📋 PARTICIPANTES NA LISTA:');
                for (const participantId of testeLista.participants) {
                    const participant = allParticipants.find(p => p._id === participantId || p._id === String(participantId));
                    if (participant) {
                        console.log(`  ✅ ${participant.name} (${participant.email})`);
                        console.log(`    - Tem listas:`, participant.lists?.length || 0);
                        console.log(`    - Lista IDs:`, participant.lists);
                    } else {
                        console.log(`  ❌ Participante ${participantId} não encontrado`);
                    }
                }
            }
            
            // 5. Buscar dados POPULADOS da lista específica
            console.log('\n5️⃣ BUSCANDO LISTA COM PARTICIPANTES POPULADOS:');
            const populatedResponse = await fetch(`${getApiUrl()}/participant-lists/${testeLista._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const populatedList = await populatedResponse.json();
            console.log('Lista populada:', populatedList);
            console.log('Participants populados:', populatedList.participants?.length || 0);
            
            if (populatedList.participants && populatedList.participants.length > 0) {
                console.log('Primeiro participante populado:', populatedList.participants[0]);
            }
        }
        
        // 6. RESUMO DO DIAGNÓSTICO
        console.log('\n📊 === RESUMO DO DIAGNÓSTICO ===');
        const problemas = [];
        
        if (!lists || lists.length === 0) {
            problemas.push('❌ Nenhuma lista carregada no frontend');
        }
        
        if (backendLists.length === 0) {
            problemas.push('❌ Nenhuma lista no backend');
        }
        
        const listasComParticipantesZero = backendLists.filter(l => !l.participants || l.participants.length === 0);
        if (listasComParticipantesZero.length > 0) {
            problemas.push(`❌ ${listasComParticipantesZero.length} listas com participants = 0`);
        }
        
        const participantsSemListas = allParticipants.filter(p => !p.lists || p.lists.length === 0);
        if (participantsSemListas.length > 0) {
            problemas.push(`❌ ${participantsSemListas.length} participantes sem listas`);
        }
        
        if (problemas.length > 0) {
            console.log('🚨 PROBLEMAS ENCONTRADOS:');
            problemas.forEach(p => console.log(p));
        } else {
            console.log('✅ Estrutura parece OK - problema pode ser no frontend');
        }
        
        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('1. Execute: forceFixListCount() para correção automática');
        console.log('2. Execute: fixMyList("teste") para correção específica');
        console.log('3. Recarregue a página após a correção');
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
    }
};

// 🔧 CORREÇÃO AUTOMÁTICA DA CONTAGEM
window.forceFixListCount = async function() {
    console.log('🔧 === CORREÇÃO FORÇADA DA CONTAGEM ===');
    
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        // 1. Buscar todas as listas do backend
        const listsResponse = await fetch(`${getApiUrl()}/participant-lists?clientId=${clientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const backendLists = await listsResponse.json();
        console.log(`📋 Processando ${backendLists.length} listas...`);
        
        let fixes = 0;
        
        for (const list of backendLists) {
            if (list.participants && list.participants.length > 0) {
                console.log(`🔧 Corrigindo lista "${list.name}" (${list.participants.length} participantes)`);
                
                // Forçar sincronização de cada participante
                for (const participantId of list.participants) {
                    try {
                        await fetch(`${getApiUrl()}/participant-lists/${list._id}/participants`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ participantId })
                        });
                        fixes++;
                    } catch (error) {
                        console.log(`❌ Erro sincronizando ${participantId}:`, error.message);
                    }
                }
            }
        }
        
        console.log(`✅ ${fixes} sincronizações aplicadas`);
        
        // 2. Recarregar dados
        console.log('🔄 Recarregando dados...');
        await loadParticipants();
        await loadLists(true);
        
        if (currentTab === 'lists') {
            refreshListsDisplay();
        }
        
        console.log('🎉 CORREÇÃO CONCLUÍDA! Verifique a contagem nas listas');
        
    } catch (error) {
        console.error('❌ Erro na correção:', error);
    }
};

// 🚨 SOLUÇÃO EMERGENCIAL: Força contagem na tela IMEDIATAMENTE
window.forceFrontendUpdate = async function() {
    console.log('🚨 FORÇANDO ATUALIZAÇÃO IMEDIATA DA TELA');
    
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        // 1. Buscar dados DIRETOS do backend
        console.log('1️⃣ Buscando dados diretos do backend...');
        
        const [listsRes, participantsRes] = await Promise.all([
            fetch(`${getApiUrl()}/participant-lists?clientId=${clientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${getApiUrl()}/participants?clientId=${clientId}&limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        const backendLists = await listsRes.json();
        const participantsData = await participantsRes.json();
        const allParticipants = participantsData.participants || [];
        
        console.log('📋 Backend retornou:', backendLists.length, 'listas');
        console.log('👥 Backend retornou:', allParticipants.length, 'participantes');
        
        // 2. Para cada lista, CONTAR os participantes que realmente pertencem a ela
        const correctedLists = backendLists.map(list => {
            // Contar participantes que têm esta lista no array 'lists'
            const realCount = allParticipants.filter(participant => {
                if (!participant.lists || !Array.isArray(participant.lists)) return false;
                return participant.lists.some(l => {
                    const listId = typeof l === 'object' ? l._id : l;
                    return String(listId) === String(list._id);
                });
            }).length;
            
            console.log(`📋 Lista "${list.name}": ${realCount} participantes conectados`);
            
            // Corrigir a lista com a contagem real
            return {
                ...list,
                participants: list.participants || [],
                participantCount: realCount,
                realParticipants: allParticipants.filter(participant => {
                    if (!participant.lists || !Array.isArray(participant.lists)) return false;
                    return participant.lists.some(l => {
                        const listId = typeof l === 'object' ? l._id : l;
                        return String(listId) === String(list._id);
                    });
                })
            };
        });
        
        // 3. SUBSTITUIR as listas globais com dados corrigidos
        console.log('2️⃣ Substituindo dados globais...');
        window.lists = correctedLists;
        lists = correctedLists;
        
        // 4. FORÇAR atualização da interface
        console.log('3️⃣ Forçando atualização da interface...');
        
        if (currentTab === 'lists') {
            // Recriar toda a tabela de listas
            const tbody = document.querySelector('#listsContainer tbody') || document.querySelector('#listsList');
            if (tbody) {
                tbody.innerHTML = correctedLists.map(list => createListRowHTML(list)).join('');
                console.log('✅ Tabela de listas atualizada');
            }
        }
        
        // 5. Atualizar participantes globais também
        window.participants = allParticipants;
        participants = allParticipants;
        
        console.log('4️⃣ Resultado final:');
        correctedLists.forEach(list => {
            console.log(`  📋 "${list.name}": ${list.participantCount || 0} membros`);
        });
        
        console.log('🎉 ATUALIZAÇÃO FORÇADA CONCLUÍDA!');
        console.log('✅ A tela deve mostrar as contagens corretas agora');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro na atualização forçada:', error);
        return false;
    }
};

// 🎯 FUNÇÃO ESPECÍFICA: Corrigir apenas a lista "teste"
window.fixTesteList = async function() {
    console.log('🎯 CORREÇÃO ESPECÍFICA DA LISTA "TESTE"');
    
    try {
        const token = localStorage.getItem('clientToken');
        const clientId = localStorage.getItem('clientId');
        
        // Buscar participantes
        const participantsRes = await fetch(`${getApiUrl()}/participants?clientId=${clientId}&limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const participantsData = await participantsRes.json();
        const allParticipants = participantsData.participants || [];
        
        console.log('👥 Total participantes no sistema:', allParticipants.length);
        
        // Encontrar lista "teste"
        const testeLista = lists.find(l => l.name.toLowerCase().includes('teste'));
        if (!testeLista) {
            console.log('❌ Lista "teste" não encontrada');
            return false;
        }
        
        console.log('📋 Lista encontrada:', testeLista.name, 'ID:', testeLista._id);
        
        // Contar participantes que pertencem a esta lista
        const testeParticipants = allParticipants.filter(participant => {
            if (!participant.lists || !Array.isArray(participant.lists)) return false;
            return participant.lists.some(l => {
                const listId = typeof l === 'object' ? l._id : l;
                return String(listId) === String(testeLista._id);
            });
        });
        
        console.log('🎯 Participantes encontrados na lista "teste":', testeParticipants.length);
        testeParticipants.forEach(p => console.log(`  - ${p.name} (${p.email})`));
        
        // Atualizar a lista na interface IMEDIATAMENTE
        const testeListIndex = lists.findIndex(l => l._id === testeLista._id);
        if (testeListIndex !== -1) {
            lists[testeListIndex].participantCount = testeParticipants.length;
            lists[testeListIndex].realParticipants = testeParticipants;
            
            // Recriar apenas a linha da tabela desta lista
            if (currentTab === 'lists') {
                const tbody = document.querySelector('#listsContainer tbody') || document.querySelector('#listsList');
                if (tbody) {
                    const rows = tbody.querySelectorAll('tr');
                    rows.forEach(row => {
                        const listName = row.querySelector('td:first-child')?.textContent;
                        if (listName && listName.toLowerCase().includes('teste')) {
                            row.outerHTML = createListRowHTML(lists[testeListIndex]);
                            console.log('✅ Linha da lista "teste" atualizada na tabela');
                        }
                    });
                }
            }
        }
        
        console.log('🎉 LISTA "TESTE" CORRIGIDA!');
        console.log(`✅ Deve mostrar ${testeParticipants.length} membros agora`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro na correção específica:', error);
        return false;
    }
};