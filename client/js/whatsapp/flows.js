// Fluxos WhatsApp - Gestão de fluxos de mensagens
// Sistema multicliente - JWT Authentication

// Variáveis globais
let flows = [];
let templates = [];
let campaigns = [];
let currentFlow = null;
let messageCounter = 1;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    await initWhatsAppFlows();
});

async function initWhatsAppFlows() {
    try {
        console.log('🔍 [DEBUG] ===== INICIANDO INIT WHATSAPP FLOWS =====');
        
        // Verificar autenticação
        console.log('🔍 [DEBUG] Verificando autenticação...');
        if (!checkAuth()) {
            console.error('❌ [DEBUG] Autenticação falhou - saindo da inicialização');
            return;
        }
        console.log('✅ [DEBUG] Autenticação OK');

        // Carregar dados iniciais
        console.log('🔍 [DEBUG] Carregando fluxos...');
        await loadFlows();
        
        console.log('🔍 [DEBUG] Carregando templates...');
        await loadTemplates();
        
        console.log('🔍 [DEBUG] Carregando campanhas...');
        await loadCampaigns();
        
        // Configurar eventos
        console.log('🔍 [DEBUG] Configurando event listeners...');
        setupEventListeners();
        
        console.log('✅ [DEBUG] ===== INIT WHATSAPP FLOWS CONCLUÍDO COM SUCESSO =====');
        
    } catch (error) {
        console.error('❌ [DEBUG] Erro crítico em initWhatsAppFlows:', error);
        console.error('❌ [DEBUG] Stack trace completo:', error.stack);
        showError('Erro ao carregar fluxos');
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

async function loadFlows() {
    try {
        console.log('🔍 [DEBUG] Iniciando loadFlows()');
        
        const token = getToken();
        console.log('🔍 [DEBUG] Token obtido:', token ? 'SIM' : 'NÃO');
        
        if (!token) {
            console.error('❌ [DEBUG] Token não encontrado - redirecionando para login');
            throw new Error('Token não encontrado');
        }
        
        // CONFIGURAÇÃO DA API (igual às outras funções)
        const isProduction = window.location.hostname === 'app.virallead.com.br';
        const apiBaseUrl = isProduction 
            ? 'https://programa-indicacao-multicliente-production.up.railway.app'
            : 'http://localhost:3000';
        
        console.log('🔍 [DEBUG] Hostname para fluxos:', window.location.hostname);
        console.log('🔍 [DEBUG] Is Production para fluxos:', isProduction);
        console.log('🔍 [DEBUG] API Base URL para fluxos:', apiBaseUrl);
        
        // URL COMPLETA para fluxos (corrigida sem prefixo /api)
        const fullUrl = `${apiBaseUrl}/whatsapp/flows`;
        console.log('🔍 [DEBUG] URL completa para fluxos:', fullUrl);
        
        const response = await fetch(fullUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('🔍 [DEBUG] Response status:', response.status);
        console.log('🔍 [DEBUG] Response ok:', response.ok);
        console.log('🔍 [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [DEBUG] Response não ok. Status:', response.status);
            console.error('❌ [DEBUG] Response text:', errorText);
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('✅ [DEBUG] Dados recebidos:', responseData);
        
        // Normalizar IDs dos fluxos (MongoDB usa _id, mas precisamos de id)
        flows = responseData.map(flow => ({
            ...flow,
            id: flow._id || flow.id // Garantir que sempre tenha 'id'
        }));
        
        console.log('🔍 [DEBUG] Fluxos normalizados:', flows);
        renderFlows();
        console.log('✅ [DEBUG] Fluxos carregados com sucesso:', flows.length);
        
    } catch (error) {
        console.error('❌ [DEBUG] Erro completo em loadFlows:', error);
        console.error('❌ [DEBUG] Stack trace:', error.stack);
        
        // NÃO usar fallback - mostrar erro real
        console.error('❌ [DEBUG] API de fluxos falhou - sem fallback');
        flows = [];
        renderFlows();
        showError('Erro ao carregar fluxos do servidor: ' + error.message);
        console.log('❌ [DEBUG] Fluxos vazios - API falhou');
    }
}

async function loadTemplates() {
    try {
        console.log('🔍 [DEBUG] Iniciando loadTemplates()');
        
        // 1. OBTER CREDENCIAIS DE AUTENTICAÇÃO
        const token = getToken();
        console.log('🔍 [DEBUG] Token para templates:', token ? 'SIM' : 'NÃO');
        
        if (!token) {
            console.error('❌ [DEBUG] Token não encontrado para templates');
            return;
        }
        
        // 2. CONFIGURAÇÃO DA API
        const isProduction = window.location.hostname === 'app.virallead.com.br';
        const apiBaseUrl = isProduction 
            ? 'https://programa-indicacao-multicliente-production.up.railway.app'
            : 'http://localhost:3000';
        
        console.log('🔍 [DEBUG] Hostname:', window.location.hostname);
        console.log('🔍 [DEBUG] Is Production:', isProduction);
        console.log('🔍 [DEBUG] API Base URL:', apiBaseUrl);
        
        // 3. REQUISIÇÃO PARA API (Padrão JWT Multicliente)
        const fullUrl = `${apiBaseUrl}/client/whatsapp/templates`;
        console.log('🔍 [DEBUG] URL completa para templates:', fullUrl);
        
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('🔍 [DEBUG] Response templates status:', response.status);
        console.log('🔍 [DEBUG] Response templates ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [DEBUG] Erro ao carregar templates. Status:', response.status);
            console.error('❌ [DEBUG] Response text:', errorText);
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('✅ [DEBUG] Templates carregados da API:', responseData);
        
        // 4. EXTRAIR ARRAY DE TEMPLATES
        let templatesData = responseData.data || responseData;
        
        // Normalizar IDs dos templates (MongoDB usa _id, mas precisamos de id)
        templates = templatesData.map(template => ({
            ...template,
            id: template._id || template.id // Garantir que sempre tenha 'id'
        }));
        
        console.log(`📋 [DEBUG] ${templates.length} templates carregados para fluxos`);
        
        // 5. ATUALIZAR DROPDOWNS EXISTENTES
        updateTemplateDropdowns();
        
    } catch (error) {
        console.error('❌ [DEBUG] Erro completo em loadTemplates:', error);
        console.error('❌ [DEBUG] Stack trace:', error.stack);
        showError('Erro ao carregar templates da API');
        
        // NÃO usar fallback - mostrar erro real
        console.error('❌ [DEBUG] API de templates falhou - sem fallback');
        templates = [];
        console.log('❌ [DEBUG] Templates vazios - API falhou');
    }
}

async function loadCampaigns() {
    try {
        console.log('🔍 [DEBUG] Iniciando loadCampaigns()');
        
        // 1. OBTER CREDENCIAIS DE AUTENTICAÇÃO
        const token = getToken();
        console.log('🔍 [DEBUG] Token para campanhas:', token ? 'SIM' : 'NÃO');
        
        if (!token) {
            console.error('❌ [DEBUG] Token não encontrado para campanhas');
            return;
        }
        
        // 2. CONFIGURAÇÃO DA API
        const isProduction = window.location.hostname === 'app.virallead.com.br';
        const apiBaseUrl = isProduction 
            ? 'https://programa-indicacao-multicliente-production.up.railway.app'
            : 'http://localhost:3000';
        
        console.log('🔍 [DEBUG] Hostname para campanhas:', window.location.hostname);
        console.log('🔍 [DEBUG] Is Production para campanhas:', isProduction);
        console.log('🔍 [DEBUG] API Base URL para campanhas:', apiBaseUrl);
        
        // 3. REQUISIÇÃO PARA API (Padrão JWT Multicliente)
        const fullUrl = `${apiBaseUrl}/campaigns`;
        console.log('🔍 [DEBUG] URL completa para campanhas:', fullUrl);
        
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('🔍 [DEBUG] Response campanhas status:', response.status);
        console.log('🔍 [DEBUG] Response campanhas ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [DEBUG] Erro ao carregar campanhas. Status:', response.status);
            console.error('❌ [DEBUG] Response text:', errorText);
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('✅ [DEBUG] Campanhas carregadas da API:', responseData);
        
        // 4. EXTRAIR ARRAY DE CAMPANHAS
        campaigns = responseData.data || responseData;
        console.log(`📋 [DEBUG] ${campaigns.length} campanhas carregadas para fluxos`);
        
        // 5. POPULAR DROPDOWN DE CAMPANHAS
        populateCampaignDropdown();
        
    } catch (error) {
        console.error('❌ [DEBUG] Erro completo em loadCampaigns:', error);
        console.error('❌ [DEBUG] Stack trace:', error.stack);
        showError('Erro ao carregar campanhas da API');
        
        // Em caso de erro, não mostrar campanhas mockadas
        console.log('🔄 [DEBUG] Usando fallback para campanhas vazias');
        campaigns = [];
        populateCampaignDropdown();
        console.log('🔄 [DEBUG] Fallback de campanhas aplicado:', campaigns.length);
    }
}

function populateCampaignDropdown() {
    const campaignSelect = document.getElementById('flow-campaign');
    if (!campaignSelect) return;
    
    // Limpar opções existentes (exceto a primeira)
    campaignSelect.innerHTML = '<option value="">Selecione uma campanha</option>';
    
    // Adicionar campanhas ativas (baseado no schema real)
    campaigns.forEach(campaign => {
        // Status pode ser 'draft', 'active', 'published', etc.
        if (campaign.status !== 'inactive' && campaign.status !== 'deleted') {
            const option = document.createElement('option');
            option.value = campaign._id || campaign.id;
            option.textContent = campaign.name;
            campaignSelect.appendChild(option);
        }
    });
    
    const activeCampaignsCount = campaigns.filter(c => c.status !== 'inactive' && c.status !== 'deleted').length;
    console.log(`✅ Dropdown de campanhas populado com ${activeCampaignsCount} campanhas ativas`);
}

async function updateAudienceOptions() {
    const campaignSelect = document.getElementById('flow-campaign');
    const audienceSelect = document.getElementById('flow-audience');
    
    if (!campaignSelect || !audienceSelect) return;
    
    const selectedCampaignId = campaignSelect.value;
    
    if (!selectedCampaignId) {
        // Nenhuma campanha selecionada - desabilitar público-alvo
        audienceSelect.disabled = true;
        audienceSelect.innerHTML = '<option value="">Primeiro selecione uma campanha</option>';
        return;
    }
    
    // Campanha selecionada - habilitar e popular opções
    audienceSelect.disabled = false;
    audienceSelect.innerHTML = '<option value="">Carregando público-alvo...</option>';
    
    try {
        // Buscar dados reais da campanha selecionada
        const [indicatorsCount, leadsCount] = await Promise.all([
            getIndicatorsCount(selectedCampaignId),
            getLeadsCount(selectedCampaignId)
        ]);
        
        // Popular opções com contadores reais
        audienceSelect.innerHTML = `
            <option value="">Selecione o público-alvo</option>
            <option value="indicators">Indicadores da Campanha (${indicatorsCount})</option>
            <option value="leads">Leads da Campanha (${leadsCount})</option>
            <option value="mixed">Indicadores e Leads da Campanha (${indicatorsCount + leadsCount})</option>
        `;
        
        console.log(`✅ Público-alvo carregado para campanha ${selectedCampaignId}: ${indicatorsCount} indicadores, ${leadsCount} leads`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar público-alvo:', error);
        // Fallback para opções básicas
        audienceSelect.innerHTML = `
            <option value="">Selecione o público-alvo</option>
            <option value="indicators">Indicadores da Campanha</option>
            <option value="leads">Leads da Campanha</option>
            <option value="mixed">Indicadores e Leads da Campanha</option>
        `;
    }
}

// Função para buscar contagem de indicadores por campanha
async function getIndicatorsCount(campaignId) {
    try {
        const apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : 'https://programa-indicacao-multicliente-production.up.railway.app';
        
        const token = getToken();
        if (!token) {
            console.warn('⚠️ Token não encontrado para buscar indicadores');
            return 0;
        }
        
        // Buscar todos os participantes e filtrar por campanha e tipo
        const response = await fetch(`${apiBaseUrl}/participants`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.warn(`⚠️ Erro ao buscar participantes: ${response.status}`);
            return 0;
        }
        
        const data = await response.json();
        const participants = data.participants || data.data || data || [];
        
        // Filtrar indicadores da campanha específica
        const indicators = participants.filter(p => 
            p.tipo === 'indicador' && 
            (p.campaignId === campaignId || p.campaignName === campaigns.find(c => c._id === campaignId)?.name)
        );
        
        console.log(`📊 ${indicators.length} indicadores encontrados para campanha ${campaignId}`);
        return indicators.length;
        
    } catch (error) {
        console.error('❌ Erro ao buscar indicadores:', error);
        return 0;
    }
}

// Função para buscar contagem de leads por campanha
async function getLeadsCount(campaignId) {
    try {
        const apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : 'https://programa-indicacao-multicliente-production.up.railway.app';
        
        const token = getToken();
        if (!token) {
            console.warn('⚠️ Token não encontrado para buscar leads');
            return 0;
        }
        
        // Buscar todos os referrals e filtrar por campanha
        const response = await fetch(`${apiBaseUrl}/referrals`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.warn(`⚠️ Erro ao buscar referrals: ${response.status}`);
            return 0;
        }
        
        const data = await response.json();
        const referrals = data.data || data || [];
        
        // Filtrar leads da campanha específica (referrals com referralSource = 'landing-page')
        const leads = referrals.filter(r => 
            r.referralSource === 'landing-page' && 
            (r.campaignId === campaignId || r.campaignName === campaigns.find(c => c._id === campaignId)?.name)
        );
        
        console.log(`📊 ${leads.length} leads encontrados para campanha ${campaignId}`);
        return leads.length;
        
    } catch (error) {
        console.error('❌ Erro ao buscar leads:', error);
        return 0;
    }
}

function setupEventListeners() {
    // Busca
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterFlows();
        });
    }

    // Filtros
    const audienceFilter = document.getElementById('filter-audience');
    const statusFilter = document.getElementById('filter-status');
    
    if (audienceFilter) {
        audienceFilter.addEventListener('change', filterFlows);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterFlows);
    }
}

function renderFlows() {
    const container = document.getElementById('flows-list');
    if (!container) return;

    if (flows.length === 0) {
        container.innerHTML = `
            <div class="p-6 text-center text-gray-400">
                <i class="fas fa-project-diagram text-6xl text-gray-500 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum fluxo criado</h3>
                <p class="text-gray-400 mb-6">Crie seu primeiro fluxo de mensagens WhatsApp</p>
                <button onclick="openCreateFlowModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                    <i class="fas fa-plus mr-2"></i>Criar Primeiro Fluxo
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-750 border-b border-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fluxo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Escopo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Público-Alvo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mensagens</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Criado</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    ${flows.map(flow => `
                        <tr class="hover:bg-gray-750 transition-colors">
                            <td class="px-6 py-4">
                                <div class="text-sm font-medium text-gray-100">${flow.name}</div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs font-medium ${getScopeColor(flow.scope)}">
                                    ${getScopeText(flow.scope)}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs font-medium bg-blue-900 text-blue-300 rounded-full">
                                    ${getTargetAudienceText(flow.targetAudience)}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(flow.status)}">
                                    ${getStatusText(flow.status)}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-gray-400">${flow.messages.length}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-gray-400">${formatDate(flow.createdAt)}</span>
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex items-center space-x-2">
                                    <button onclick="toggleFlowStatus('${flow.id}', '${flow.status}')" class="p-2 ${flow.status === 'active' ? 'text-green-400 hover:bg-green-900/20' : 'text-yellow-400 hover:bg-green-900/20'} rounded-lg transition-colors" title="${flow.status === 'active' ? 'Desativar' : 'Ativar'}">
                                        <i class="fas ${flow.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                                    </button>
                                    <button onclick="editFlow('${flow.id}')" class="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="triggerManualFlow('${flow.id}')" class="p-2 text-purple-400 hover:bg-purple-900/20 rounded-lg transition-colors" title="Disparar Manualmente">
                                        <i class="fas fa-paper-plane"></i>
                                    </button>
                                    <button onclick="deleteFlow('${flow.id}')" class="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" title="Excluir">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function getTargetAudienceText(audience) {
    switch(audience) {
        case 'indicators': return 'Indicadores';
        case 'leads': return 'Leads';
        case 'mixed': return 'Misto';
        default: return audience;
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'active': return 'bg-green-900 text-green-300';
        case 'inactive': return 'bg-gray-700 text-gray-300';
        default: return 'bg-gray-700 text-gray-300';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'active': return 'Ativo';
        case 'inactive': return 'Inativo';
        default: return status;
    }
}

// 🆕 NOVO: Função para obter cor do escopo
function getScopeColor(scope) {
    switch(scope) {
        case 'global': return 'bg-purple-900 text-purple-300';
        case 'campaign': return 'bg-blue-900 text-blue-300';
        default: return 'bg-gray-700 text-gray-300';
    }
}

// 🆕 NOVO: Função para obter texto do escopo
function getScopeText(scope) {
    switch(scope) {
        case 'global': return 'Global';
        case 'campaign': return 'Campanha';
        default: return scope || 'N/A';
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function filterFlows() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const audienceFilter = document.getElementById('filter-audience')?.value || '';
    const statusFilter = document.getElementById('filter-status')?.value || '';
    
    const filteredFlows = flows.filter(flow => {
        const matchesSearch = flow.name.toLowerCase().includes(searchTerm) ||
                            flow.description.toLowerCase().includes(searchTerm);
        const matchesAudience = !audienceFilter || flow.targetAudience === audienceFilter;
        const matchesStatus = !statusFilter || flow.status === statusFilter;
        
        return matchesSearch && matchesAudience && matchesStatus;
    });
    
    renderFilteredFlows(filteredFlows);
}

function renderFilteredFlows(filteredFlows) {
    const container = document.getElementById('flows-list');
    if (!container) return;

    if (filteredFlows.length === 0) {
        container.innerHTML = `
            <div class="p-6 text-center text-gray-400">
                <i class="fas fa-search text-6xl text-gray-500 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-300 mb-2">Nenhum fluxo encontrado</h3>
                <p class="text-gray-400">Tente ajustar os filtros de busca</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-750 border-b border-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fluxo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Escopo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Público-Alvo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mensagens</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Criado</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    ${filteredFlows.map(flow => `
                        <tr class="hover:bg-gray-750 transition-colors">
                            <td class="px-6 py-4">
                                <div class="text-sm font-medium text-gray-100">${flow.name}</div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs font-medium ${getScopeColor(flow.scope)}">
                                    ${getScopeText(flow.scope)}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs font-medium bg-blue-900 text-blue-300 rounded-full">
                                    ${getTargetAudienceText(flow.targetAudience)}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(flow.status)}">
                                    ${getStatusText(flow.status)}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-gray-400">${flow.messages.length}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-gray-400">${formatDate(flow.createdAt)}</span>
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex items-center space-x-2">
                                    <button onclick="toggleFlowStatus('${flow.id}', '${flow.status}')" class="p-2 ${flow.status === 'active' ? 'text-green-400 hover:bg-green-900/20' : 'text-yellow-400 hover:bg-green-900/20'} rounded-lg transition-colors" title="${flow.status === 'active' ? 'Desativar' : 'Ativar'}">
                                        <i class="fas ${flow.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                                    </button>
                                    <button onclick="editFlow('${flow.id}')" class="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="triggerManualFlow('${flow.id}')" class="p-2 text-purple-400 hover:bg-purple-900/20 rounded-lg transition-colors" title="Disparar Manualmente">
                                        <i class="fas fa-paper-plane"></i>
                                    </button>
                                    <button onclick="deleteFlow('${flow.id}')" class="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" title="Excluir">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Função global para abrir modal de criação
window.openCreateFlowModal = function() {
    console.log('🔍 [DEBUG] openCreateFlowModal chamado');
    currentFlow = null;
    
    const createModalTitle = document.getElementById('modal-title');
    if (createModalTitle) {
        createModalTitle.textContent = 'Novo Fluxo';
        console.log('✅ [DEBUG] Título do modal atualizado para "Novo Fluxo"');
    } else {
        console.error('❌ [DEBUG] Título do modal não encontrado');
    }
    
    const createModal = document.getElementById('flow-modal');
    if (createModal) {
        createModal.classList.remove('hidden');
        console.log('✅ [DEBUG] Modal aberto com sucesso');
    } else {
        console.error('❌ [DEBUG] Modal não encontrado');
    }
    
    resetForm();
}

// Função global para alternar campo de campanha baseado no escopo
window.toggleCampaignField = function() {
    const scope = document.getElementById('flow-scope').value;
    const campaignField = document.getElementById('campaign-field');
    const campaignSelect = document.getElementById('flow-campaign');
    const audienceSelect = document.getElementById('flow-audience');
    
    if (scope === 'global') {
        // Escopo global: ocultar campo de campanha e habilitar público-alvo
        campaignField.classList.add('hidden');
        campaignSelect.removeAttribute('required');
        campaignSelect.value = '';
        
        // Habilitar público-alvo para fluxos globais
        audienceSelect.disabled = false;
        audienceSelect.innerHTML = `
            <option value="">Selecione o público-alvo</option>
            <option value="indicators">Indicadores (Todas as Campanhas)</option>
            <option value="leads">Leads (Todas as Campanhas)</option>
            <option value="mixed">Indicadores e Leads (Todas as Campanhas)</option>
        `;
        
        console.log('✅ Campo de campanha ocultado - fluxo global configurado');
    } else {
        // Escopo de campanha: mostrar campo de campanha
        campaignField.classList.remove('hidden');
        campaignSelect.setAttribute('required', 'required');
        
        // Desabilitar público-alvo até campanha ser selecionada
        audienceSelect.disabled = true;
        audienceSelect.innerHTML = '<option value="">Primeiro selecione uma campanha</option>';
        
        console.log('✅ Campo de campanha exibido - fluxo de campanha específica');
    }
}

// Função global para fechar modal
window.closeFlowModal = function() {
    document.getElementById('flow-modal').classList.add('hidden');
    currentFlow = null;
    resetForm();
}

function resetForm() {
    document.getElementById('flow-form').reset();
    
    // Resetar campo de escopo
    const scopeSelect = document.getElementById('flow-scope');
    if (scopeSelect) scopeSelect.value = 'campaign';
    
    // Resetar campo de campanha e público-alvo
    const campaignSelect = document.getElementById('flow-campaign');
    const audienceSelect = document.getElementById('flow-audience');
    if (campaignSelect) campaignSelect.value = '';
    if (audienceSelect) {
        audienceSelect.value = '';
        audienceSelect.disabled = true;
        audienceSelect.innerHTML = '<option value="">Primeiro selecione uma campanha</option>';
    }
    
    // Mostrar campo de campanha por padrão
    const campaignField = document.getElementById('campaign-field');
    if (campaignField) campaignField.classList.remove('hidden');
    
    const container = document.getElementById('messages-container');
    if (container) {
        container.innerHTML = '';
    }
    messageCounter = 1;
}

// Função global para adicionar mensagem
window.addMessage = function() {
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    // Verificar limite de 10 mensagens
    const currentMessages = container.children.length;
    if (currentMessages >= 10) {
        showError('Máximo de 10 mensagens por fluxo');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'bg-gray-700 rounded-lg p-4 border border-gray-600';
    messageDiv.id = `message-${messageCounter}`;
    
    messageDiv.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <h4 class="text-gray-200 font-medium">Mensagem ${messageCounter}</h4>
            <button type="button" onclick="removeMessage(${messageCounter})" class="text-red-400 hover:text-red-300">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
                <label class="block text-gray-300 text-sm font-medium mb-1">Template *</label>
                <select name="templateId" required class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" onchange="showTemplatePreview(${messageCounter})">
                    <option value="">Selecione um template</option>
                    ${templates.map(template => `<option value="${template._id || template.id}" data-content="${template.content?.body || template.content || ''}" data-variables="${Array.isArray(template.variables) ? template.variables.join(', ') : template.variables || ''}">${template.name} (${template.category})</option>`).join('')}
                </select>
                <div id="template-preview-${messageCounter}" class="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-300 hidden">
                    <!-- Preview do template será mostrado aqui -->
                </div>
            </div>
            <div>
                <label class="block text-gray-300 text-sm font-medium mb-1">Gatilho *</label>
                <select name="trigger" required class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Selecione um gatilho</option>
                    <option value="indicator_joined">Indicador se juntou</option>
                    <option value="lead_indicated">Lead foi indicado</option>
                    <option value="lead_converted">Lead foi convertido</option>
                    <option value="reward_earned">Recompensa ganha</option>
                    <option value="campaign_started">Campanha iniciada</option>
                    <option value="goal_reached">Meta atingida</option>
                </select>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-gray-300 text-sm font-medium mb-1">Tipo de Envio</label>
                <select name="sendType" onchange="toggleSendOptions(${messageCounter})" class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="delay">Atraso após gatilho</option>
                    <option value="date">Data específica</option>
                </select>
            </div>
            <div id="sendOptions-${messageCounter}">
                <label class="block text-gray-300 text-sm font-medium mb-1">Atraso (segundos)</label>
                <input type="number" name="delay" value="0" min="0" class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    messageCounter++;
}

// Função global para remover mensagem
window.removeMessage = function(messageId) {
    const messageDiv = document.getElementById(`message-${messageId}`);
    if (messageDiv) {
        messageDiv.remove();
    }
}

// Função para mostrar preview do template selecionado
// Função global para mostrar preview do template
window.showTemplatePreview = function(messageId) {
    const select = document.querySelector(`#message-${messageId} select[name="templateId"]`);
    const previewDiv = document.getElementById(`template-preview-${messageId}`);
    
    if (!select || !previewDiv) return;
    
    const selectedOption = select.options[select.selectedIndex];
    if (!selectedOption || !selectedOption.value) {
        previewDiv.classList.add('hidden');
        return;
    }
    
    const content = selectedOption.dataset.content || 'Sem conteúdo';
    const variables = selectedOption.dataset.variables || '';
    
    let previewHTML = `
        <div class="space-y-2">
            <div class="font-medium text-blue-300">Preview do Template:</div>
            <div class="text-gray-300">${content}</div>
    `;
    
    if (variables) {
        previewHTML += `
            <div class="mt-2">
                <span class="text-yellow-300 font-medium">Variáveis:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                    ${variables.split(',').map(v => 
                        `<span class="px-2 py-1 bg-gray-700 text-gray-200 rounded text-xs">{{${v.trim()}}}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    previewHTML += '</div>';
    previewDiv.innerHTML = previewHTML;
    previewDiv.classList.remove('hidden');
}

// Função para atualizar dropdowns de templates existentes
function updateTemplateDropdowns() {
    console.log('🔄 Atualizando dropdowns de templates existentes...');
    
    // Buscar todos os dropdowns de template na página
    const templateDropdowns = document.querySelectorAll('select[name="templateId"]');
    
    templateDropdowns.forEach(dropdown => {
        // Salvar valor selecionado atual
        const currentValue = dropdown.value;
        
        // Limpar opções existentes (exceto a primeira)
        const firstOption = dropdown.querySelector('option:first-child');
        dropdown.innerHTML = '';
        if (firstOption) {
            dropdown.appendChild(firstOption);
        }
        
        // Adicionar novas opções dos templates carregados
        templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template._id || template.id;
            option.textContent = template.name;
            dropdown.appendChild(option);
        });
        
        // Restaurar valor selecionado se ainda existir
        if (currentValue && templates.some(t => (t._id || t.id) === currentValue)) {
            dropdown.value = currentValue;
        }
        
        console.log(`✅ Dropdown atualizado com ${templates.length} templates`);
    });
}

// Função global para alternar opções de envio
window.toggleSendOptions = function(messageId) {
    const sendType = document.querySelector(`#message-${messageId} select[name="sendType"]`).value;
    const optionsDiv = document.getElementById(`sendOptions-${messageId}`);
    
    if (sendType === 'date') {
        optionsDiv.innerHTML = `
            <label class="block text-gray-300 text-sm font-medium mb-1">Data e Hora</label>
            <input type="datetime-local" name="scheduledDate" class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
        `;
    } else {
        optionsDiv.innerHTML = `
            <label class="block text-gray-300 text-sm font-medium mb-1">Atraso (segundos)</label>
            <input type="number" name="delay" value="0" min="0" class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
        `;
    }
}

// Função global para editar fluxo
window.editFlow = function(flowId) {
    console.log('🔍 [DEBUG] editFlow chamado com ID:', flowId);
    
    const flow = flows.find(f => f.id === flowId);
    if (!flow) {
        console.error('❌ [DEBUG] Fluxo não encontrado com ID:', flowId);
        console.log('🔍 [DEBUG] Fluxos disponíveis:', flows);
        return;
    }
    
    console.log('✅ [DEBUG] Fluxo encontrado:', flow);
    
    currentFlow = flowId;
    
    // Verificar se o modal existe
    const editModal = document.getElementById('flow-modal');
    if (!editModal) {
        console.error('❌ [DEBUG] Modal não encontrado');
        return;
    }
    
    // Verificar se o título existe
    const editModalTitle = document.getElementById('modal-title');
    if (editModalTitle) {
        editModalTitle.textContent = 'Editar Fluxo';
        console.log('✅ [DEBUG] Título do modal atualizado');
    } else {
        console.error('❌ [DEBUG] Título do modal não encontrado');
    }
    
    // Preencher formulário
    console.log('🔍 [DEBUG] Preenchendo formulário...');
    
    // 🆕 NOVO: Campo de escopo
    const scopeField = document.getElementById('flow-scope');
    if (scopeField) {
        // Determinar escopo baseado na presença de campaignId
        const scope = flow.campaignId ? 'campaign' : 'global';
        scopeField.value = scope;
        console.log('✅ [DEBUG] Campo de escopo preenchido:', scope);
        
        // Aplicar lógica de exibição do campo de campanha
        toggleCampaignField();
    } else {
        console.error('❌ [DEBUG] Campo de escopo não encontrado');
    }
    
    // Campo de campanha
    const campaignField = document.getElementById('flow-campaign');
    if (campaignField && flow.campaignId) {
        campaignField.value = flow.campaignId;
        console.log('✅ [DEBUG] Campo de campanha preenchido:', flow.campaignId);
        updateAudienceOptions(); // Atualizar opções de público-alvo
    } else {
        console.warn('⚠️ [DEBUG] Campo de campanha não encontrado ou sem campaignId');
    }
    
    // Campo de nome
    const nameField = document.getElementById('flow-name');
    if (nameField) {
        nameField.value = flow.name;
        console.log('✅ [DEBUG] Campo de nome preenchido:', flow.name);
    } else {
        console.error('❌ [DEBUG] Campo de nome não encontrado');
    }
    
    // Campo de público-alvo
    const audienceField = document.getElementById('flow-audience');
    if (audienceField) {
        audienceField.value = flow.targetAudience;
        console.log('✅ [DEBUG] Campo de público-alvo preenchido:', flow.targetAudience);
    } else {
        console.error('❌ [DEBUG] Campo de público-alvo não encontrado');
    }
    
    // Campo de descrição
    const descriptionField = document.getElementById('flow-description');
    if (descriptionField) {
        descriptionField.value = flow.description || '';
        console.log('✅ [DEBUG] Campo de descrição preenchido:', flow.description);
    } else {
        console.warn('⚠️ [DEBUG] Campo de descrição não encontrado');
    }
    
    // Limpar e recriar mensagens
    const container = document.getElementById('messages-container');
    container.innerHTML = '';
    messageCounter = 1;
    
    flow.messages.forEach(message => {
        addMessage();
        const messageDiv = document.getElementById(`message-${messageCounter - 1}`);
        
        // Preencher dados da mensagem
        messageDiv.querySelector('select[name="templateId"]').value = message.templateId;
        messageDiv.querySelector('select[name="trigger"]').value = message.trigger;
        
        if (message.scheduledDate) {
            messageDiv.querySelector('select[name="sendType"]').value = 'date';
            toggleSendOptions(messageCounter - 1);
            messageDiv.querySelector('input[name="scheduledDate"]').value = new Date(message.scheduledDate).toISOString().slice(0, 16);
        } else {
            messageDiv.querySelector('input[name="delay"]').value = message.delay || 0;
        }
    });
    
    // Abrir modal
    console.log('🔍 [DEBUG] Tentando abrir modal...');
    const editModalFinal = document.getElementById('flow-modal');
    if (editModalFinal) {
        editModalFinal.classList.remove('hidden');
        console.log('✅ [DEBUG] Modal aberto com sucesso');
    } else {
        console.error('❌ [DEBUG] Modal não encontrado para abrir');
    }
}

// Função global para salvar fluxo
window.saveFlow = async function() {
    try {
        const formData = {
            name: document.getElementById('flow-name').value,
            scope: document.getElementById('flow-scope').value,
            campaignId: document.getElementById('flow-scope').value === 'campaign' ? document.getElementById('flow-campaign').value : undefined,
            targetAudience: document.getElementById('flow-audience').value,
            description: document.getElementById('flow-description').value,
            messages: []
        };
        
        // 🆕 NOVO: Validar escopo
        if (!formData.scope) {
            showError('Selecione o escopo do fluxo');
            return;
        }

        // 🆕 NOVO: Validar campanha quando escopo for 'campaign'
        if (formData.scope === 'campaign' && !formData.campaignId) {
            showError('Selecione uma campanha para fluxos de campanha específica');
            return;
        }
        
        if (!formData.name || !formData.targetAudience) {
            showError('Preencha todos os campos obrigatórios (Nome e Público-Alvo)');
            return;
        }
        
        // Coletar mensagens
        const messageDivs = document.querySelectorAll('[id^="message-"]');
        messageDivs.forEach((div, index) => {
            const templateId = div.querySelector('select[name="templateId"]').value;
            const trigger = div.querySelector('select[name="trigger"]').value;
            const sendType = div.querySelector('select[name="sendType"]').value;
            
            if (templateId && trigger) {
                const message = {
                    templateId: templateId,
                    trigger: trigger,
                    order: index + 1
                };
                
                if (sendType === 'date') {
                    const scheduledDate = div.querySelector('input[name="scheduledDate"]').value;
                    if (scheduledDate) {
                        message.scheduledDate = new Date(scheduledDate).toISOString();
                    }
                } else {
                    const delay = div.querySelector('input[name="delay"]').value;
                    message.delay = parseInt(delay) || 0;
                }
                
                formData.messages.push(message);
            }
        });
        
        if (formData.messages.length === 0) {
            showError('Adicione pelo menos uma mensagem ao fluxo');
            return;
        }

        // Configurar triggers baseado nas mensagens
        const triggers = [...new Set(formData.messages.map(m => m.trigger))];
        formData.triggers = triggers;
        
        // Status padrão - ATIVO por padrão para facilitar testes
        formData.status = 'active';
        
        // Configurar agendamento (se houver mensagens com data específica)
        const hasScheduledMessages = formData.messages.some(m => m.scheduledDate);
        if (hasScheduledMessages) {
            formData.scheduling = {
                enabled: true,
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
            };
        }

        // Chamar API real do backend
        const token = getToken();
        
        // CONFIGURAÇÃO DA API (igual às outras funções)
        const isProduction = window.location.hostname === 'app.virallead.com.br';
        const apiBaseUrl = isProduction 
            ? 'https://programa-indicacao-multicliente-production.up.railway.app'
            : 'http://localhost:3000';
        
        const fullUrl = `${apiBaseUrl}/whatsapp/flows`;
        console.log('🔍 [DEBUG] Salvando fluxo em:', fullUrl);
        
        const response = await fetch(fullUrl, {
            method: currentFlow ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(currentFlow ? { ...formData, id: currentFlow } : formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao salvar fluxo');
        }

        const savedFlow = await response.json();
        
        // Atualizar lista local
        if (currentFlow) {
            // Editar fluxo existente
            const index = flows.findIndex(f => f.id === currentFlow);
            if (index !== -1) {
                flows[index] = savedFlow;
            }
        } else {
            // Criar novo fluxo
            flows.push(savedFlow);
        }
        
        renderFlows();
        closeFlowModal();
        showSuccess(currentFlow ? 'Fluxo atualizado com sucesso!' : 'Fluxo criado com sucesso!');
        
        // Recarregar fluxos do backend
        await loadFlows();
        
    } catch (error) {
        console.error('Erro ao salvar fluxo:', error);
        showError('Erro ao salvar fluxo: ' + error.message);
    }
}

// Função global para deletar fluxo
window.deleteFlow = async function(flowId) {
    if (confirm('Tem certeza que deseja excluir este fluxo?')) {
        try {
            const token = getToken();
            
            // CONFIGURAÇÃO DA API (igual às outras funções)
            const isProduction = window.location.hostname === 'app.virallead.com.br';
            const apiBaseUrl = isProduction 
                ? 'https://programa-indicacao-multicliente-production.up.railway.app'
                : 'http://localhost:3000';
            
            const fullUrl = `${apiBaseUrl}/whatsapp/flows/${flowId}`;
            console.log('🔍 [DEBUG] Deletando fluxo em:', fullUrl);
            
            const response = await fetch(fullUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao excluir fluxo');
            }

            // Remover da lista local
            flows = flows.filter(f => f.id !== flowId);
            renderFlows();
            showSuccess('Fluxo excluído com sucesso!');
            
        } catch (error) {
            console.error('Erro ao excluir fluxo:', error);
            showError('Erro ao excluir fluxo: ' + error.message);
        }
    }
}

// Função global para alternar status do fluxo
window.toggleFlowStatus = async function(flowId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const confirmMessage = `Tem certeza que deseja ${newStatus === 'active' ? 'ativar' : 'desativar'} este fluxo?`;

    if (confirm(confirmMessage)) {
        try {
            const token = getToken();
            
            // CONFIGURAÇÃO DA API (igual às outras funções)
            const isProduction = window.location.hostname === 'app.virallead.com.br';
            const apiBaseUrl = isProduction 
                ? 'https://programa-indicacao-multicliente-production.up.railway.app'
                : 'http://localhost:3000';
            
            // Usar endpoints específicos do backend
            let fullUrl;
            if (newStatus === 'active') {
                fullUrl = `${apiBaseUrl}/whatsapp/flows/${flowId}/activate`;
            } else {
                fullUrl = `${apiBaseUrl}/whatsapp/flows/${flowId}/pause`;
            }
            
            console.log('🔍 [DEBUG] Alternando status do fluxo em:', fullUrl);
            
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erro ao ${newStatus === 'active' ? 'ativar' : 'desativar'} fluxo`);
            }

            const updatedFlow = await response.json();
            
            // Atualizar lista local
            const index = flows.findIndex(f => f.id === flowId);
            if (index !== -1) {
                flows[index].status = updatedFlow.status;
            }
            renderFlows();
            showSuccess(`Fluxo ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
            
        } catch (error) {
            console.error('Erro ao alternar status do fluxo:', error);
            showError(`Erro ao alternar status do fluxo: ${error.message}`);
        }
    }
}

// Função global para disparar fluxo manualmente
window.triggerManualFlow = async function(flowId) {
    try {
        // Buscar o fluxo para validações
        const flow = flows.find(f => f.id === flowId);
        if (!flow) {
            showError('Fluxo não encontrado');
            return;
        }

        // Verificar se o fluxo está ativo
        if (flow.status !== 'active') {
            showError('Apenas fluxos ativos podem ser disparados manualmente');
            return;
        }

        // Verificar se o fluxo tem mensagens
        if (!flow.messages || flow.messages.length === 0) {
            showError('Este fluxo não possui mensagens para disparar');
            return;
        }

        // Confirmação do usuário
        const confirmMessage = `Tem certeza que deseja disparar o fluxo "${flow.name}" manualmente?\n\nEste fluxo será enviado para todos os participantes elegíveis.`;
        if (!confirm(confirmMessage)) {
            return;
        }

        // Mostrar indicador de carregamento
        showSuccess('Disparando fluxo manualmente...');

        const token = getToken();
        if (!token) {
            showError('Token de autenticação não encontrado');
            return;
        }
        
        // CONFIGURAÇÃO DA API (igual às outras funções)
        const isProduction = window.location.hostname === 'app.virallead.com.br';
        const apiBaseUrl = isProduction 
            ? 'https://programa-indicacao-multicliente-production.up.railway.app'
            : 'http://localhost:3000';
        
        const fullUrl = `${apiBaseUrl}/whatsapp/flows/${flowId}/trigger`;
        console.log('🔍 [DEBUG] Disparando fluxo manualmente em:', fullUrl);
        console.log('🔍 [DEBUG] Dados do fluxo:', flow);
        
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                flowId: flowId,
                manualTrigger: true,
                targetAudience: flow.targetAudience,
                campaignId: flow.campaignId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ [DEBUG] Fluxo manualmente disparado com sucesso:', result);
        
        // Mostrar resultado detalhado
        const message = `Fluxo "${flow.name}" disparado manualmente com sucesso!\n\nMensagens enviadas: ${result.messagesSent || 'N/A'}\nParticipantes elegíveis: ${result.eligibleParticipants || 'N/A'}`;
        showSuccess(message);
        
    } catch (error) {
        console.error('❌ [DEBUG] Erro ao disparar fluxo manualmente:', error);
        showError('Erro ao disparar fluxo manualmente: ' + error.message);
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