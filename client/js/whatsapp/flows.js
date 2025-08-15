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
        
        // URL COMPLETA para fluxos (igual às outras funções)
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
        
        flows = responseData;
        renderFlows();
        console.log('✅ [DEBUG] Fluxos carregados com sucesso:', flows.length);
        
    } catch (error) {
        console.error('❌ [DEBUG] Erro completo em loadFlows:', error);
        console.error('❌ [DEBUG] Stack trace:', error.stack);
        
        // Fallback para mock data se a API falhar
        console.log('🔄 [DEBUG] Usando fallback para dados mockados');
        flows = [
            {
                id: '1',
                name: 'Fluxo de Boas-vindas Indicadores',
                description: 'Fluxo para novos indicadores',
                targetAudience: 'indicators',
                messages: [
                    {
                        id: '1',
                        templateId: '1',
                        templateName: 'Boas-vindas',
                        trigger: 'indicator_joined',
                        delay: 0,
                        order: 1
                    },
                    {
                        id: '2',
                        templateId: '2',
                        templateName: 'Dicas de Indicação',
                        trigger: 'indicator_joined',
                        delay: 3600, // 1 hora
                        order: 2
                    }
                ],
                status: 'active',
                createdAt: '2024-01-15T10:00:00Z'
            },
            {
                id: '2',
                name: 'Fluxo de Conversão Leads',
                description: 'Fluxo para converter leads',
                targetAudience: 'leads',
                messages: [
                    {
                        id: '3',
                        templateId: '3',
                        templateName: 'Oferta Especial',
                        trigger: 'lead_indicated',
                        delay: 1800, // 30 minutos
                        order: 1
                    }
                ],
                status: 'active',
                createdAt: '2024-01-16T14:30:00Z'
            }
        ];
        renderFlows();
        showError('Erro ao carregar fluxos do servidor - usando dados locais');
        console.log('🔄 [DEBUG] Fallback aplicado, fluxos mockados:', flows.length);
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
        const fullUrl = `${apiBaseUrl}/api/client/whatsapp/templates`;
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
        templates = responseData.data || responseData;
        console.log(`📋 [DEBUG] ${templates.length} templates carregados para fluxos`);
        
        // 5. ATUALIZAR DROPDOWNS EXISTENTES
        updateTemplateDropdowns();
        
    } catch (error) {
        console.error('❌ [DEBUG] Erro completo em loadTemplates:', error);
        console.error('❌ [DEBUG] Stack trace:', error.stack);
        showError('Erro ao carregar templates da API');
        
        // Fallback para dados mockados em caso de erro
        console.log('🔄 [DEBUG] Usando fallback para templates mockados');
        templates = [
            {
                id: '1',
                name: 'Boas-vindas',
                category: 'marketing',
                content: 'Olá {{name}}! Bem-vindo ao nosso programa de indicações!'
            },
            {
                id: '2',
                name: 'Dicas de Indicação',
                category: 'utility',
                content: 'Dica: Compartilhe seu link pessoal nas redes sociais!'
            },
            {
                id: '3',
                name: 'Oferta Especial',
                category: 'marketing',
                content: 'Oferta especial para você: {{discount}}% de desconto!'
            }
        ];
        console.log('🔄 [DEBUG] Fallback de templates aplicado:', templates.length);
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
        const fullUrl = `${apiBaseUrl}/api/campaigns`;
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
        const response = await fetch(`${apiBaseUrl}/api/participants`, {
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
        const response = await fetch(`${apiBaseUrl}/api/referrals`, {
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
                                    <button onclick="editFlow('${flow.id}')" class="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors" title="Editar">
                                        <i class="fas fa-edit"></i>
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
                                    <button onclick="editFlow('${flow.id}')" class="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors" title="Editar">
                                        <i class="fas fa-edit"></i>
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

function openCreateFlowModal() {
    currentFlow = null;
    document.getElementById('modal-title').textContent = 'Novo Fluxo';
    document.getElementById('flow-modal').classList.remove('hidden');
    resetForm();
}

function closeFlowModal() {
    document.getElementById('flow-modal').classList.add('hidden');
    currentFlow = null;
    resetForm();
}

function resetForm() {
    document.getElementById('flow-form').reset();
    
    // Resetar campo de campanha e público-alvo
    const campaignSelect = document.getElementById('flow-campaign');
    const audienceSelect = document.getElementById('flow-audience');
    if (campaignSelect) campaignSelect.value = '';
    if (audienceSelect) {
        audienceSelect.value = '';
        audienceSelect.disabled = true;
        audienceSelect.innerHTML = '<option value="">Primeiro selecione uma campanha</option>';
    }
    
    const container = document.getElementById('messages-container');
    if (container) {
        container.innerHTML = '';
    }
    messageCounter = 1;
}

function addMessage() {
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

function removeMessage(messageId) {
    const messageDiv = document.getElementById(`message-${messageId}`);
    if (messageDiv) {
        messageDiv.remove();
    }
}

// Função para mostrar preview do template selecionado
function showTemplatePreview(messageId) {
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

function toggleSendOptions(messageId) {
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

function editFlow(flowId) {
    const flow = flows.find(f => f.id === flowId);
    if (!flow) return;
    
    currentFlow = flowId;
    document.getElementById('modal-title').textContent = 'Editar Fluxo';
    
    // Preencher formulário
    if (flow.campaignId) {
        document.getElementById('flow-campaign').value = flow.campaignId;
        updateAudienceOptions(); // Atualizar opções de público-alvo
    }
    document.getElementById('flow-name').value = flow.name;
    document.getElementById('flow-audience').value = flow.targetAudience;
    document.getElementById('flow-description').value = flow.description || '';
    
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
    
    document.getElementById('flow-modal').classList.remove('hidden');
}

async function saveFlow() {
    try {
        const formData = {
            name: document.getElementById('flow-name').value,
            targetAudience: document.getElementById('flow-audience').value,
            description: document.getElementById('flow-description').value,
            messages: []
        };
        
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
        
        // Status padrão
        formData.status = 'draft';
        
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

async function deleteFlow(flowId) {
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

function showSuccess(message) {
    // Implementar notificação de sucesso
    alert(message);
}

function showError(message) {
    // Implementar notificação de erro
    alert('Erro: ' + message);
} 