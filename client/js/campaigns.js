// 🔧 CORREÇÃO: Função para obter API_URL de forma segura
function getApiUrl() {
    // 🔍 DEBUG: Logs para verificar detecção de ambiente
    console.log('[DEBUG-API] 🔍 Calculando API URL:');
    console.log('[DEBUG-API] window.API_URL:', window.API_URL);
    console.log('[DEBUG-API] window.APP_CONFIG:', window.APP_CONFIG);
    console.log('[DEBUG-API] window.APP_CONFIG?.API_URL:', window.APP_CONFIG?.API_URL);
    console.log('[DEBUG-API] window.location.hostname:', window.location.hostname);
    
    const finalApiUrl = window.API_URL || 
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
           (window.location.hostname === 'localhost' ? 
            'http://localhost:3000/api' : 
            'https://programa-indicacao-multicliente-production.up.railway.app/api'));
    
    console.log('[DEBUG-API] 🎯 URL final da API calculada:', finalApiUrl);
    console.log('[DEBUG-API] 🔍 Verificar se esta API está correta!');
    
    return finalApiUrl;
}

// Variáveis globais
let campaigns = [];
let currentStep = 1;
const totalSteps = 5;
let formData = {
    campaignType: null,
    rewardType: null
};

// 🔍 DEBUG: Verificar cache/localStorage que pode estar causando problemas
console.log('[DEBUG-CACHE] 🔍 Verificando cache/localStorage:');
console.log('[DEBUG-CACHE] clientToken:', localStorage.getItem('clientToken'));
console.log('[DEBUG-CACHE] token:', localStorage.getItem('token'));
console.log('[DEBUG-CACHE] API_URL no localStorage:', localStorage.getItem('API_URL'));
console.log('[DEBUG-CACHE] CLIENT_URL no localStorage:', localStorage.getItem('CLIENT_URL'));
console.log('[DEBUG-CACHE] Todas as chaves no localStorage:', Object.keys(localStorage));
console.log('[DEBUG-CACHE] localStorage completo:', localStorage);

// Funções para gerenciamento de páginas replicáveis
let currentPages = [];

function configurePagesModal() {
    document.getElementById('pagesConfigModal').style.display = 'block';
}

function closePagesConfigModal() {
    document.getElementById('pagesConfigModal').style.display = 'none';
}

function savePageConfig() {
    const formData = {
        domain: document.getElementById('pageDomain').value,
        originalUrl: document.getElementById('pageOriginalUrl').value,
        slug: document.getElementById('pageSlug').value,
        customElements: Array.from(document.querySelectorAll('input[name="customElements"]:checked'))
            .map(el => el.value),
        tracking: Array.from(document.querySelectorAll('input[name="tracking"]:checked'))
            .map(el => el.value)
    };

    // Validações básicas
    if (!formData.domain || !formData.originalUrl || !formData.slug) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    // Validar formato do domínio
    try {
        new URL(formData.domain);
        new URL(formData.originalUrl);
    } catch (e) {
        alert('Por favor, insira URLs válidas.');
        return;
    }

    // Validar slug (apenas letras, números e hífens)
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        alert('O slug deve conter apenas letras minúsculas, números e hífens.');
        return;
    }

    // Aqui você faria a chamada para a API para salvar a configuração
    savePagesConfiguration(formData).then(() => {
        closePagesConfigModal();
        loadPages();
    }).catch(error => {
        alert('Erro ao salvar configuração: ' + error.message);
    });
}

async function savePagesConfiguration(config) {
    // Simulação de chamada à API
    console.log('Salvando configuração:', config);
    return new Promise(resolve => setTimeout(resolve, 1000));
}

function loadPages() {
    // Simulação de carregamento das páginas
    const pages = [
        {
            id: 1,
            title: 'Página de Vendas - Produto Premium',
            originalUrl: 'https://seusite.com.br/produto-premium',
            slug: 'produto-premium',
            customElements: ['name', 'code', 'contact'],
            stats: {
                views: 150,
                conversions: 12,
                revenue: 1200.00
            }
        }
    ];

    currentPages = pages;
    renderPages();
}

function renderPages() {
    const container = document.querySelector('.links-grid');
    container.innerHTML = currentPages.map(page => `
        <div class="link-card">
            <div class="link-info">
                <h3>${page.title}</h3>
                <div class="link-url-preview">
                    <code>https://seudominio.com.br/p/<span class="dynamic-param">{participante}</span>/${page.slug}</code>
                    <button class="btn-icon copy-url" onclick="copyPageUrl('${page.id}')" title="Copiar estrutura do link">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div class="link-params">
                    <h4>Informações da Página:</h4>
                    <div class="param-list">
                        <div class="param-item">
                            <span class="param-name">URL Original</span>
                            <span class="param-desc">${page.originalUrl}</span>
                        </div>
                        <div class="param-item">
                            <span class="param-name">Elementos Personalizáveis</span>
                            <span class="param-desc">${page.customElements.join(', ')}</span>
                        </div>
                    </div>
                </div>
                <div class="link-preview-section">
                    <h4>Preview do Link</h4>
                    <select class="participant-select" onchange="updatePagePreview(${page.id}, this.value)">
                        <option value="">Selecione um participante...</option>
                        ${getParticipantsOptions()}
                    </select>
                    <div class="preview-url">
                        <code id="previewPageUrl-${page.id}">https://seudominio.com.br/p/123/${page.slug}</code>
                        <button class="btn-icon copy-preview" onclick="copySpecificPageUrl(${page.id})" title="Copiar link específico">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                <p class="link-stats">
                    <span><i class="fas fa-eye"></i> <span id="pageViewCount-${page.id}">${page.stats.views}</span> visualizações</span>
                    <span><i class="fas fa-shopping-cart"></i> <span id="conversionCount-${page.id}">${page.stats.conversions}</span> vendas</span>
                    <span><i class="fas fa-dollar-sign"></i> <span id="revenueAmount-${page.id}">R$ ${page.stats.revenue.toFixed(2)}</span></span>
                </p>
            </div>
            <div class="link-actions">
                <button class="btn-secondary" onclick="previewPage(${page.id})">
                    <i class="fas fa-eye"></i> Visualizar Página
                </button>
                <button class="btn-secondary" onclick="editPageSettings(${page.id})">
                    <i class="fas fa-cog"></i> Configurações
                </button>
                <button class="btn-danger" onclick="deletePage(${page.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getParticipantsOptions() {
    // Simulação de lista de participantes
    const participants = [
        { id: 1, name: 'João Silva' },
        { id: 2, name: 'Maria Santos' },
        { id: 3, name: 'Pedro Oliveira' }
    ];

    return participants.map(p => `
        <option value="${p.id}">${p.name}</option>
    `).join('');
}

function updatePagePreview(pageId, participantId) {
    if (!participantId) return;

    const page = currentPages.find(p => p.id === pageId);
    const previewElement = document.getElementById(`previewPageUrl-${pageId}`);
    
    // Simulação de geração de URL personalizada
    const previewUrl = `https://seudominio.com.br/p/${participantId}/${page.slug}`;
    previewElement.textContent = previewUrl;
}

function copyPageUrl(pageId) {
    const page = currentPages.find(p => p.id === pageId);
    const url = `https://seudominio.com.br/p/{participante}/${page.slug}`;
    
    navigator.clipboard.writeText(url).then(() => {
        alert('URL copiada com sucesso!');
    }).catch(err => {
        console.error('Erro ao copiar URL:', err);
        alert('Erro ao copiar URL');
    });
}

function copySpecificPageUrl(pageId) {
    const urlElement = document.getElementById(`previewPageUrl-${pageId}`);
    
    navigator.clipboard.writeText(urlElement.textContent).then(() => {
        alert('URL específica copiada com sucesso!');
    }).catch(err => {
        console.error('Erro ao copiar URL:', err);
        alert('Erro ao copiar URL');
    });
}

function previewPage(pageId) {
    const page = currentPages.find(p => p.id === pageId);
    const participantSelect = document.querySelector(`select[onchange*="${pageId}"]`);
    const participantId = participantSelect.value;

    if (!participantId) {
        alert('Por favor, selecione um participante para visualizar a página.');
        return;
    }

    const previewUrl = `https://seudominio.com.br/p/${participantId}/${page.slug}`;
    window.open(previewUrl, '_blank');
}

function editPageSettings(pageId) {
    const page = currentPages.find(p => p.id === pageId);
    
    // Preencher o formulário com os dados da página
    document.getElementById('pageDomain').value = 'https://seudominio.com.br';
    document.getElementById('pageOriginalUrl').value = page.originalUrl;
    document.getElementById('pageSlug').value = page.slug;

    // Marcar os checkboxes apropriados
    page.customElements.forEach(element => {
        const checkbox = document.querySelector(`input[name="customElements"][value="${element}"]`);
        if (checkbox) checkbox.checked = true;
    });

    configurePagesModal();
}

function deletePage(pageId) {
    if (!confirm('Tem certeza que deseja excluir esta página?')) return;

    // Aqui você faria a chamada para a API para deletar a página
    currentPages = currentPages.filter(p => p.id !== pageId);
    renderPages();
}

// Funções do Modal
function showNewCampaignModal() {
    document.getElementById('newCampaignModal').style.display = 'block';
    resetQuiz();
}

function closeNewCampaignModal() {
    document.getElementById('newCampaignModal').style.display = 'none';
    document.getElementById('newCampaignForm').reset();
    resetQuiz();
}

function showCampaignDetailsModal() {
    document.getElementById('campaignDetailsModal').style.display = 'block';
}

function closeCampaignDetailsModal() {
    document.getElementById('campaignDetailsModal').style.display = 'none';
}

// Fechar modais ao clicar fora deles
window.onclick = function(event) {
    const newCampaignModal = document.getElementById('newCampaignModal');
    const detailsModal = document.getElementById('campaignDetailsModal');
    
    if (event.target == newCampaignModal) {
        closeNewCampaignModal();
    }
    if (event.target == detailsModal) {
        closeCampaignDetailsModal();
    }
}

// Funções de toggle de campos do formulário
function toggleFormFields() {
    const campaignType = document.getElementById('campaignType').value;
    const formFieldsSection = document.getElementById('formFieldsSection');
    const linkFieldsSection = document.getElementById('linkFieldsSection');
    const landingPageSection = document.getElementById('landingPageSection');
    
    // Oculta todas as seções primeiro
    formFieldsSection.style.display = 'none';
    linkFieldsSection.style.display = 'none';
    landingPageSection.style.display = 'none';

    // Mostra a seção apropriada baseada no tipo selecionado
    switch(campaignType) {
        case 'form':
            formFieldsSection.style.display = 'block';
            break;
        case 'link':
            linkFieldsSection.style.display = 'block';
            break;
        case 'landing':
            landingPageSection.style.display = 'block';
            break;
    }
}

function toggleRewardFields() {
    const rewardType = formData.rewardType;
    const selectGroup = document.getElementById('rewardTypeSelect');
    const productGroup = document.getElementById('rewardProductGroup');
    const productInput = document.getElementById('rewardProduct'); // Obter o input

    if (rewardType === 'product') {
        selectGroup.style.display = 'none';
        productGroup.style.display = 'block';
        if (productInput) productInput.required = true; // Adiciona required
    } else if (rewardType) { // Se for pix, points, discount
        selectGroup.style.display = 'block';
        productGroup.style.display = 'none';
        if (productInput) productInput.required = false; // Remove required
    } else { // Nenhum tipo selecionado
        selectGroup.style.display = 'none';
        productGroup.style.display = 'none';
        if (productInput) productInput.required = false; // Remove required
    }
    console.log(`toggleRewardFields: Tipo=${rewardType}, productInput.required=${productInput?.required}`); // Log
}

// Funções de navegação do quiz
function updateQuizProgress() {
    document.getElementById('currentStep').textContent = currentStep;
    document.getElementById('progressBar').style.width = `${(currentStep / totalSteps) * 100}%`;
}

function showStep(step) {
    // Esconder todas as etapas
    document.querySelectorAll('.quiz-step').forEach(el => {
        el.style.display = 'none';
    });
    
    // Mostrar a etapa atual
    const currentStep = document.getElementById(`step${step}`);
    if (currentStep) {
        currentStep.style.display = 'block';
    }
    
    // Atualizar indicador de etapa
    document.getElementById('currentStep').textContent = step;
    
    // Atualizar botões de navegação
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const submitButton = document.getElementById('submitButton');
    
    if (prevButton) {
        prevButton.style.display = step > 1 ? 'block' : 'none';
    }
    
    if (nextButton) {
        nextButton.style.display = step < totalSteps ? 'block' : 'none';
    }
    
    if (submitButton) {
        submitButton.style.display = step === totalSteps ? 'block' : 'none';
    }
    
    // Atualizar revisão na última etapa
    if (step === totalSteps) {
        updateReview();
    }
}

function nextStep() {
    // Validar a etapa atual ANTES de prosseguir
    if (!validateCurrentStep()) {
        return; // Impede de avançar se a validação falhar
    }

    const currentStep = parseInt(document.getElementById('currentStep').textContent);
    const totalSteps = parseInt(document.getElementById('totalSteps').textContent);
    
    if (currentStep < totalSteps) {
        // Esconder o passo atual
        document.getElementById(`step${currentStep}`).style.display = 'none';
        
        // Mostrar o próximo passo
        const nextStepElement = document.getElementById(`step${currentStep + 1}`);
        if (nextStepElement) {
            nextStepElement.style.display = 'block';
        }
        
        // Atualizar o indicador de progresso
        document.getElementById('currentStep').textContent = currentStep + 1;
        document.getElementById('progressBar').style.width = `${((currentStep + 1) / totalSteps) * 100}%`;
        
        // Atualizar os botões de navegação
        document.getElementById('prevButton').style.display = 'block';
        if (currentStep + 1 === totalSteps) {
            document.getElementById('nextButton').style.display = 'none';
            document.getElementById('submitButton').style.display = 'block';
            updateReview(); // Chamar updateReview ao chegar na última etapa
        } else {
            document.getElementById('nextButton').style.display = 'block';
            document.getElementById('submitButton').style.display = 'none';
        }
        
        // Se for a etapa 4, carregar as listas
        if (currentStep + 1 === 4) {
            loadListsForCampaign();
        }

        // Atualizar os campos específicos ao chegar na etapa 4
        if (currentStep + 1 === 4) {
           showSpecificFields(); // Garante que os campos corretos sejam exibidos
        }
    }
}

function prevStep() {
    const currentStep = parseInt(document.getElementById('currentStep').textContent);
    if (currentStep > 1) {
        // Esconder etapa atual
        document.getElementById(`step${currentStep}`).style.display = 'none';
        
        // Mostrar etapa anterior
        const prevStepElement = document.getElementById(`step${currentStep - 1}`);
         if (prevStepElement) {
            prevStepElement.style.display = 'block';
        }

        // Atualizar indicador e progresso
        document.getElementById('currentStep').textContent = currentStep - 1;
        document.getElementById('progressBar').style.width = `${((currentStep - 1) / totalSteps) * 100}%`;

        // Atualizar botões
        document.getElementById('prevButton').style.display = (currentStep - 1) > 1 ? 'block' : 'none';
        document.getElementById('nextButton').style.display = 'block';
        document.getElementById('submitButton').style.display = 'none';
    }
}

function validateCurrentStep() {
    console.log(`validateCurrentStep: Validando etapa ${currentStep}`);
    switch (currentStep) {
        case 1: // Tipo de Campanha
            if (!formData.campaignType) {
                alert('Por favor, selecione o tipo de campanha.');
                return false;
            }
            break;
        case 2: // Informações Básicas
            const campaignName = document.getElementById('campaignName')?.value.trim();
            if (!campaignName) {
                alert('Por favor, preencha o nome da campanha.');
                return false;
            }
            break;
        case 3: // Recompensa
            if (!formData.rewardType) {
                alert('Por favor, selecione um tipo de recompensa.');
                return false;
            }
            if (formData.rewardType === 'product') {
                if (!document.getElementById('rewardProduct')?.value.trim()) {
                    alert('Por favor, preencha o nome do produto de recompensa.');
                    return false;
                }
            } else {
                if (!document.getElementById('selectedRewardType')?.value) {
                    alert('Por favor, selecione a recompensa específica.');
                    return false;
                }
            }
            break;
        case 4: // Configurações Específicas e Listas
            if (formData.campaignType === 'landing' && !document.getElementById('landingTitle')?.value.trim()) {
                 alert('Por favor, preencha o título da Landing Page.');
                 return false;
            }
            // Poderia adicionar validação para listas, se obrigatório
            // if (window.selectedCampaignLists.size === 0) {
            //     alert('Por favor, selecione pelo menos uma lista de participantes.');
            //     return false;
            // }
            break;
        // Etapa 5 (Revisão) não precisa de validação aqui, só no handleNewCampaign
    }
    console.log(`validateCurrentStep: Etapa ${currentStep} OK.`);
    return true;
}

function selectOption(field, value) {
    formData[field] = value;
    console.log(`selectOption: ${field} = ${value}. formData atual:`, JSON.stringify(formData)); // Log

    // Atualizar visual
    const stepElement = document.getElementById(`step${currentStep}`);
    stepElement.querySelectorAll(`.quiz-option`).forEach(el => el.classList.remove('selected'));
    stepElement.querySelector(`.quiz-option[data-value="${value}"]`)?.classList.add('selected');

    // Lógica específica para tipo de recompensa
    if (field === 'rewardType') {
        loadRewardTypes(); // Tenta carregar tipos específicos
        toggleRewardFields();
    }

    // Ativar botão Continuar
    document.getElementById('nextButton').classList.add('active');

    // Se for formulário de captação, carregar os templates
    if (field === 'campaignType' && value === 'form') {
        loadTemplatesIntoSelect();
    }
    
    // Mostrar/esconder seções específicas
    const formFieldsSection = document.getElementById('formFieldsSection');
    const linkFieldsSection = document.getElementById('linkFieldsSection');
    const landingPageSection = document.getElementById('landingPageSection');
    
    formFieldsSection.style.display = value === 'form' ? 'block' : 'none';
    linkFieldsSection.style.display = value === 'link' ? 'block' : 'none';
    landingPageSection.style.display = value === 'landing' ? 'block' : 'none';
}

function loadRewardTypes() {
    console.log("loadRewardTypes: Tentando carregar...");
    const rewardType = formData.rewardType;
    const selectElement = document.getElementById('selectedRewardType');
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="">Carregando...</option>'; // Feedback

    if (rewardType === 'product' || !rewardType) {
        console.log("loadRewardTypes: Tipo é produto ou nulo, não carrega select.");
        selectElement.innerHTML = '<option value="">N/A para Produto</option>';
        return; // Não carrega select para produto
    }

    try {
        const storedRewardTypes = localStorage.getItem('rewardTypes');
        if (!storedRewardTypes) {
             console.error("loadRewardTypes: ERRO CRÍTICO - 'rewardTypes' não encontrado no localStorage.");
             alert("Erro: Tipos de recompensa não configurados no sistema. Não é possível continuar.");
             selectElement.innerHTML = '<option value="">Erro ao carregar</option>';
             document.getElementById('nextButton').classList.remove('active'); // Impede avanço
             return;
        }

        const rewardTypes = JSON.parse(storedRewardTypes);
        console.log("loadRewardTypes: rewardTypes do localStorage:", rewardTypes);
        
        if (!Array.isArray(rewardTypes) || rewardTypes.length === 0) {
            console.error("loadRewardTypes: ERRO CRÍTICO - 'rewardTypes' está vazio ou não é um array.");
            alert("Erro: Nenhum tipo de recompensa encontrado. Verifique a configuração.");
            selectElement.innerHTML = '<option value="">Nenhuma recompensa</option>';
            document.getElementById('nextButton').classList.remove('active'); // Impede avanço
            return;
        }

        // Filtrar recompensas que correspondem ao TIPO selecionado (pix, points, discount)
        const relevantRewards = rewardTypes.filter(rt => rt.type === rewardType);
        console.log(`loadRewardTypes: Recompensas relevantes para tipo '${rewardType}':`, relevantRewards);

        if(relevantRewards.length === 0) {
             selectElement.innerHTML = `<option value="">Nenhuma recompensa do tipo ${rewardType} cadastrada</option>`;
        } else {
            selectElement.innerHTML = '<option value="">Selecione a recompensa</option>';
            relevantRewards.forEach(reward => {
                const option = document.createElement('option');
                option.value = reward.id; // Usar ID como valor
                // Mostrar valor ou nome descritivo
                option.textContent = `${reward.name || rewardType} - ${reward.value}${rewardType === 'pix' ? ' BRL' : rewardType === 'discount' ? '%' : ''}`;
                selectElement.appendChild(option);
            });
        }
        
    } catch (e) {
        console.error("loadRewardTypes: ERRO ao parsear ou processar 'rewardTypes':", e);
        alert("Erro interno ao carregar tipos de recompensa. Verifique o console.");
        selectElement.innerHTML = '<option value="">Erro</option>';
        document.getElementById('nextButton').classList.remove('active'); // Impede avanço
    }
}

function updateSelectionProgress() {
    // Atualizar barra de progresso com animação suave
    const progressBar = document.getElementById('progressBar');
    progressBar.style.transition = 'width 0.5s ease';
    
    // Calcular progresso baseado nas seleções feitas
    let progress = 0;
    if (formData.campaignType) progress += 20;
    if (document.getElementById('campaignName').value) progress += 20;
    if (formData.rewardType) progress += 20;
    if (currentStep >= 4) progress += 20;
    if (currentStep === 5) progress += 20;
    
    progressBar.style.width = `${progress}%`;
}

function resetQuiz() {
    console.log("resetQuiz: Limpando estado...");
    currentStep = 1;
    formData = { campaignType: null, rewardType: null };
    window.selectedCampaignLists = new Set(); // Limpar listas selecionadas
    
    // Reset visual das opções
    document.querySelectorAll('.quiz-option.selected').forEach(el => el.classList.remove('selected'));
    
    // Resetar campos de formulário (pode precisar ser mais específico)
    const form = document.getElementById('newCampaignForm');
    if (form) form.reset(); 
    
    // Resetar campos de recompensa específicos
    const rewardSelect = document.getElementById('selectedRewardType');
    const rewardProduct = document.getElementById('rewardProduct');
    if(rewardSelect) rewardSelect.innerHTML = '<option value="">Selecione um tipo de recompensa</option>'; 
    if(rewardProduct) {
         rewardProduct.value = '';
         rewardProduct.required = false; // Garantir que required seja removido
    }
    const rewardTypeSelect = document.getElementById('rewardTypeSelect');
    const rewardProductGroup = document.getElementById('rewardProductGroup');
    if (rewardTypeSelect) rewardTypeSelect.style.display = 'none';
    if (rewardProductGroup) rewardProductGroup.style.display = 'none';

    // Resetar contador de listas
    updateSelectedListsCount();
    // Limpar a área de revisão
    const reviewArea = document.getElementById('campaignReview');
    if (reviewArea) reviewArea.innerHTML = '';

    // Resetar barra de progresso e indicadores
    document.getElementById('currentStep').textContent = '1';
    document.getElementById('progressBar').style.width = `${(1 / totalSteps) * 100}%`;
    
    // Mostrar apenas a primeira etapa
    document.querySelectorAll('.quiz-step').forEach((stepEl, index) => {
        stepEl.style.display = index === 0 ? 'block' : 'none';
    });
    
    // Configurar botões
    document.getElementById('prevButton').style.display = 'none';
    document.getElementById('nextButton').style.display = 'block';
    document.getElementById('submitButton').style.display = 'none';
    document.getElementById('nextButton').classList.remove('active'); // Desativar inicialmente
    console.log("resetQuiz: Estado limpo.");
}

function showSpecificFields() {
    const formFieldsSection = document.getElementById('formFieldsSection');
    const linkFieldsSection = document.getElementById('linkFieldsSection');
    const landingPageSection = document.getElementById('landingPageSection');
    
    formFieldsSection.style.display = 'none';
    linkFieldsSection.style.display = 'none';
    landingPageSection.style.display = 'none';
    
    switch(formData.campaignType) {
        case 'form':
            formFieldsSection.style.display = 'block';
            break;
        case 'link':
            linkFieldsSection.style.display = 'block';
            break;
        case 'landing':
            landingPageSection.style.display = 'block';
            break;
    }
}

function updateReview() {
    console.log("updateReview: Iniciando..."); // Log
    const campaignReview = document.getElementById('campaignReview');
    const campaignName = document.getElementById('campaignName').value;
    const campaignDescription = document.getElementById('campaignDescription').value;
    
    // Buscar listas selecionadas
    const selectedLists = Array.from(window.selectedCampaignLists || []); 
    let allLists = [];
    try {
        allLists = JSON.parse(localStorage.getItem('participantLists') || '[]');
    } catch (e) {
        console.error("updateReview: Erro ao parsear participantLists do localStorage", e);
    }
    
    console.log("updateReview: IDs das listas selecionadas (selectedLists):"); // Log
    console.log(selectedLists);
    console.log("updateReview: Todas as listas do localStorage (allLists):"); // Log
    console.log(allLists);

    // Filtrar detalhes das listas selecionadas (GARANTINDO COMPARAÇÃO DE STRINGS)
    const selectedListsDetails = allLists
        .filter(list => selectedLists.includes(String(list.id))) // Convert list.id para String
        .map(list => ({
            id: list.id, // manter ID para debug
            name: list.name,
            participants: list.participants ? list.participants.length : 0
        }));
        
    console.log("updateReview: Detalhes das listas filtradas (selectedListsDetails):"); // Log
    console.log(selectedListsDetails);
    
    let rewardDetailsHTML = '';
    if (formData.rewardType) {
        try {
            if (formData.rewardType === 'product') {
                const productName = document.getElementById('rewardProduct')?.value.trim();
                if (productName) {
                     rewardDetailsHTML = `
                        <div class="review-item">
                            <span class="review-label">Produto:</span>
                            <span class="review-value">${productName}</span>
                        </div>`;
                }
            } else {
                const selectedRewardElement = document.getElementById('selectedRewardType');
                const selectedRewardId = selectedRewardElement?.value;
                if (selectedRewardId) {
                    const rewardTypes = JSON.parse(localStorage.getItem('rewardTypes') || '[]');
                    const selectedReward = rewardTypes.find(type => String(type.id) === selectedRewardId);
                    if (selectedReward) {
                        rewardDetailsHTML = `
                        <div class="review-item">
                            <span class="review-label">Recompensa Específica:</span>
                            <span class="review-value">${selectedReward.name || selectedReward.type} - ${selectedReward.value}</span>
                        </div>`;
                    }
                }
            }
        } catch (e) {
             console.error("updateReview: Erro ao buscar detalhes da recompensa específica:", e);
             rewardDetailsHTML = '<div class="review-item"><span class="review-label">Recompensa:</span><span class="review-value" style="color:red;">Erro ao carregar</span></div>';
        }
    }
    
    let html = `
        <div class="review-section">
            <h4>Informações Básicas</h4>
            <div class="review-item">
                <span class="review-label">Nome da Campanha:</span>
                <span class="review-value">${campaignName || 'Não definido'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Tipo:</span>
                <span class="review-value">${getCampaignTypeLabel(formData.campaignType) || 'Não definido'}</span>
            </div>
            ${campaignDescription ? `
            <div class="review-item">
                <span class="review-label">Descrição:</span>
                <span class="review-value">${campaignDescription}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="review-section">
            <h4>Recompensa</h4>
            <div class="review-item">
                <span class="review-label">Tipo:</span>
                <span class="review-value">${getRewardTypeLabel(formData.rewardType) || 'Não definido'}</span>
            </div>
            ${rewardDetailsHTML}
        </div>

        <div class="review-section">
            <h4>Listas de Participantes</h4>
            ${selectedListsDetails.length > 0 ? `
                <div class="selected-lists">
                    ${selectedListsDetails.map(list => `
                        <div class="review-item" data-list-id="${list.id}"> <!-- Adicionado data-list-id para debug -->
                            <span class="review-label">${list.name || 'Lista sem nome'}</span>
                            <span class="review-value">${list.participants} participante(s)</span>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="no-lists">Nenhuma lista selecionada</p>'}
        </div>
    `;
    
    // Adicionar detalhes específicos baseado no tipo de campanha
    console.log("updateReview: Adicionando detalhes específicos para tipo:", formData.campaignType); // Log
    try {
        switch(formData.campaignType) {
            case 'form':
                const formTheme = document.getElementById('formTheme')?.value;
                const formRedirect = document.getElementById('formRedirect')?.value;
                html += `
                    <div class="review-section">
                        <h4>Configurações do Formulário</h4>
                        ${formTheme ? `<div class="review-item">
                            <span class="review-label">Tema:</span>
                            <span class="review-value">${getThemeLabel(formTheme)}</span>
                        </div>` : ''}
                        ${formRedirect ? `
                        <div class="review-item">
                            <span class="review-label">Redirecionamento:</span>
                            <span class="review-value">${formRedirect}</span>
                        </div>
                        ` : ''}
                    </div>
                `;
                break;
                
            case 'link':
                const linkMessage = document.getElementById('linkMessage')?.value;
                const linkImage = document.getElementById('linkImage')?.value;
                html += `
                    <div class="review-section">
                        <h4>Configurações do Link</h4>
                        ${linkMessage ? `
                        <div class="review-item">
                            <span class="review-label">Mensagem:</span>
                            <span class="review-value">${linkMessage}</span>
                        </div>
                        ` : ''}
                        ${linkImage ? `
                        <div class="review-item">
                            <span class="review-label">Imagem:</span>
                            <span class="review-value">${linkImage}</span>
                        </div>
                        ` : ''}
                    </div>
                `;
                break;
                
            case 'landing':
                const landingTitle = document.getElementById('landingTitle')?.value;
                const landingSubtitle = document.getElementById('landingSubtitle')?.value;
                const landingDescription = document.getElementById('landingDescription')?.value;
                const selectedFields = Array.from(document.querySelectorAll('input[name="formFields"]:checked'))
                    .map(cb => cb.value);
                
                html += `
                    <div class="review-section">
                        <h4>Configurações da Landing Page</h4>
                        ${landingTitle ? `<div class="review-item">
                            <span class="review-label">Título:</span>
                            <span class="review-value">${landingTitle}</span>
                        </div>` : ''}
                        ${landingSubtitle ? `
                        <div class="review-item">
                            <span class="review-label">Subtítulo:</span>
                            <span class="review-value">${landingSubtitle}</span>
                        </div>
                        ` : ''}
                        ${landingDescription ? `
                        <div class="review-item">
                            <span class="review-label">Descrição:</span>
                            <span class="review-value">${landingDescription}</span>
                        </div>
                        ` : ''}
                        ${selectedFields.length > 0 ? `<div class="review-item">
                            <span class="review-label">Campos do Formulário:</span>
                            <span class="review-value">${getFieldLabels(selectedFields)}</span>
                        </div>` : ''}
                    </div>
                `;
                break;
            default:
                 console.warn("updateReview: Tipo de campanha não reconhecido para detalhes específicos:", formData.campaignType);
        }
    } catch(e) {
        console.error("updateReview: Erro ao adicionar detalhes específicos:", e);
        html += '<p style="color: red;">Erro ao carregar detalhes específicos.</p>';
    }
    
    if (campaignReview) {
        campaignReview.innerHTML = html;
        console.log("updateReview: HTML do review atualizado."); // Log
    } else {
        console.error("updateReview: Elemento #campaignReview não encontrado."); // Log
    }
    console.log("updateReview: Fim da execução."); // Log
}

function getRewardTypeLabel(type) {
    const types = {
        'points': 'Pontos',
        'pix': 'PIX',
        'discount': 'Desconto',
        'product': 'Produto'
    };
    return types[type] || type;
}

function getThemeLabel(theme) {
    const themes = {
        'light': 'Tema Claro',
        'dark': 'Tema Escuro',
        'custom': 'Personalizado'
    };
    return themes[theme] || theme;
}

function getFieldLabels(fields) {
    const labels = {
        'nome': 'Nome',
        'email': 'Email',
        'telefone': 'Telefone',
        'empresa': 'Empresa',
        'cargo': 'Cargo'
    };
    return fields.map(field => labels[field] || field).join(', ');
}

// Funções de gerenciamento de campanhas
function editCampaign(campaignId) {
    // Salvar o ID da campanha no localStorage
    localStorage.setItem('campaignId', campaignId);
    
    // Redirecionar para a página de formulário
    window.location.href = 'campaign-form.html';
}

// 🆕 NOVA FUNCIONALIDADE: Acessar LP de Indicadores da campanha
async function accessLPIndicadores(campaignId) {
    try {
        const token = localStorage.getItem('clientToken') || localStorage.getItem('token');
        
        if (!token) {
            alert('Token de autenticação não encontrado. Faça login novamente.');
            return;
        }
        
        const response = await fetch(`${getApiUrl()}/campaigns/${campaignId}/lp-indicadores`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        // 🔍 DEBUG: Verificar dados recebidos do backend
        console.log('[DEBUG-ACCESS] 🔍 Dados recebidos do backend:');
        console.log('[DEBUG-ACCESS] response.ok:', response.ok);
        console.log('[DEBUG-ACCESS] result.success:', result.success);
        console.log('[DEBUG-ACCESS] result.data completo:', result.data);
        if (result.data && result.data.lpIndicadores) {
            console.log('[DEBUG-ACCESS] URLs da LP recebidas:');
            console.log('[DEBUG-ACCESS] publicUrl:', result.data.lpIndicadores.publicUrl);
            console.log('[DEBUG-ACCESS] editUrl:', result.data.lpIndicadores.editUrl);
            console.log('[DEBUG-ACCESS] previewUrl:', result.data.lpIndicadores.previewUrl);
        }
        
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Erro ao buscar LP de Indicadores');
        }
        
        if (!result.data) {
            alert('Esta campanha não possui LP de Indicadores vinculada.');
            return;
        }
        
        // Exibir modal com opções da LP
        showLPIndicadoresModal(result.data);
        
    } catch (error) {
        console.error('Erro ao acessar LP:', error);
        alert('Erro ao carregar LP de Indicadores: ' + error.message);
    }
}

// Modal para exibir opções da LP de Indicadores
function showLPIndicadoresModal(data) {
    const { campaign, lpIndicadores } = data;
    
    // Criar o modal
    const modalHtml = `
        <div id="lpIndicadoresModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-gray-800 rounded-xl p-8 shadow-lg w-full max-w-lg relative">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-gray-100 flex items-center">
                        <i class="fas fa-clipboard-list text-green-400 mr-2"></i>
                        LP de Indicadores
                    </h2>
                    <button class="text-2xl text-gray-400 hover:text-gray-200" onclick="closeLPIndicadoresModal()">
                        &times;
                    </button>
                </div>
                
                <div class="mb-6">
                    <div class="bg-gray-700 rounded-lg p-4 mb-4">
                        <h3 class="font-semibold text-blue-400 mb-2">Campanha: ${campaign.name}</h3>
                        <p class="text-sm text-gray-300">Tipo: ${getCampaignTypeLabel(campaign.type)}</p>
                    </div>
                    
                    <div class="bg-gray-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-semibold text-green-400">${lpIndicadores.name}</h4>
                            <span class="px-2 py-1 text-xs rounded-full ${
                                lpIndicadores.status === 'published' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-yellow-500/20 text-yellow-400'
                            }">
                                ${lpIndicadores.status === 'published' ? 'Publicada' : 'Rascunho'}
                            </span>
                        </div>
                        
                        <div class="text-sm text-gray-300 mb-4">
                            <div class="flex justify-between mb-2">
                                <span>Total de visualizações:</span>
                                <span class="font-medium">${lpIndicadores.statistics?.totalViews || 0}</span>
                            </div>
                            <div class="flex justify-between mb-2">
                                <span>Total de indicadores:</span>
                                <span class="font-medium">${lpIndicadores.statistics?.totalIndicadoresCadastrados || 0}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Taxa de conversão:</span>
                                <span class="font-medium">${lpIndicadores.statistics?.conversionRate || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col gap-3">
                    ${lpIndicadores.publicUrl ? `
                    <button 
                        onclick="window.open('${lpIndicadores.publicUrl}', '_blank')" 
                        class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center">
                        <i class="fas fa-external-link-alt mr-2"></i>
                        Visualizar LP Publicada
                    </button>
                    ` : ''}
                    
                    <button 
                        onclick="window.open('${lpIndicadores.previewUrl}', '_blank')" 
                        class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center">
                        <i class="fas fa-eye mr-2"></i>
                        Preview da LP
                    </button>
                    
                    <button 
                        onclick="window.open('${lpIndicadores.editUrl}', '_blank')" 
                        class="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center">
                        <i class="fas fa-edit mr-2"></i>
                        Editar LP
                    </button>
                    
                    ${lpIndicadores.publicUrl ? `
                    <button 
                        onclick="copyLPLink('${lpIndicadores.publicUrl}')" 
                        class="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center">
                        <i class="fas fa-copy mr-2"></i>
                        Copiar Link da LP
                    </button>
                    ` : ''}
                </div>
                
                <div class="mt-4 flex justify-end">
                    <button 
                        onclick="closeLPIndicadoresModal()" 
                        class="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar ao DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Fechar modal da LP
function closeLPIndicadoresModal() {
    const modal = document.getElementById('lpIndicadoresModal');
    if (modal) {
        modal.remove();
    }
}

// Copiar link da LP
async function copyLPLink(url) {
    try {
        // 🔍 DEBUG: Logs para identificar problema de construção de URL
        console.log('[DEBUG-COPY] 🔍 Copiando link da LP:');
        console.log('[DEBUG-COPY] URL recebida do backend:', url);
        console.log('[DEBUG-COPY] window.APP_CONFIG:', window.APP_CONFIG);
        console.log('[DEBUG-COPY] window.APP_CONFIG?.CLIENT_URL:', window.APP_CONFIG?.CLIENT_URL);
        console.log('[DEBUG-COPY] window.location.hostname:', window.location.hostname);
        console.log('[DEBUG-COPY] window.location.origin:', window.location.origin);
        
        // 🔧 CORREÇÃO: Usar configuração dinâmica em vez de window.location.origin
        let baseUrl;
        if (window.APP_CONFIG && window.APP_CONFIG.CLIENT_URL) {
            baseUrl = window.APP_CONFIG.CLIENT_URL;
            console.log('[DEBUG-COPY] ✅ Usando APP_CONFIG.CLIENT_URL:', baseUrl);
        } else {
            // Fallback baseado no ambiente
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                baseUrl = 'http://localhost:5501';
                console.log('[DEBUG-COPY] ⚠️ Usando fallback localhost:', baseUrl);
            } else {
                baseUrl = 'https://programa-indicacao-multicliente.vercel.app';
                console.log('[DEBUG-COPY] ⚠️ Usando fallback produção:', baseUrl);
            }
        }
        
        const finalUrl = baseUrl + url;
        console.log('[DEBUG-COPY] 🎯 URL final calculada:', finalUrl);
        console.log('[DEBUG-COPY] 🔍 Verificar se esta URL está correta!');
        
        await navigator.clipboard.writeText(finalUrl);
        alert('Link copiado para a área de transferência!');
    } catch (error) {
        console.error('Erro ao copiar link:', error);
        alert('Erro ao copiar link');
    }
}

function viewCampaignDetails(campaignId) {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;
    
    const detailsContent = document.getElementById('campaignDetailsContent');
    detailsContent.innerHTML = `
        <div class="campaign-details">
            <div class="detail-section">
                <h3>Informações Gerais</h3>
                <div class="detail-group">
                    <label>Nome:</label>
                    <span>${campaign.name}</span>
                </div>
                <div class="detail-group">
                    <label>Tipo:</label>
                    <span>${campaign.type === 'form' ? 'Formulário' : campaign.type === 'link' ? 'Link' : 'Landing Page'}</span>
                </div>
                <div class="detail-group">
                    <label>Status:</label>
                    <span class="status ${campaign.status}">${campaign.status}</span>
                </div>
                <div class="detail-group">
                    <label>Data de Criação:</label>
                    <span>${new Date(campaign.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Recompensa</h3>
                <div class="detail-group">
                    <label>Tipo:</label>
                    <span>${campaign.reward.type}</span>
                </div>
                <div class="detail-group">
                    <label>Valor:</label>
                    <span>${campaign.reward.value}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Estatísticas</h3>
                <div class="stats-grid">
                    <div class="stat">
                        <span class="label">Participantes</span>
                        <span class="value">${campaign.participants}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Indicações</span>
                        <span class="value">${campaign.referrals}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Conversão</span>
                        <span class="value">${campaign.conversion}%</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showCampaignDetailsModal();
}

function copyCampaignLink(campaignId) {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;
    
    const link = `https://seu-dominio.com/campaign/${campaignId}`;
    navigator.clipboard.writeText(link).then(() => {
        alert('Link copiado para a área de transferência!');
    });
}

function deleteCampaign(campaignId) {
    if (confirm('Tem certeza que deseja excluir esta campanha?')) {
        try {
            // Recuperar campanhas existentes
            const existingCampaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
            
            // Remover a campanha
            const updatedCampaigns = existingCampaigns.filter(c => c.id !== campaignId);
            
            // Salvar no localStorage
            localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));
            
            // Atualizar array de campanhas
            campaigns = updatedCampaigns;
            
            // Recarregar a página
            window.location.reload();
            
        } catch (error) {
            console.error('Erro ao excluir campanha:', error);
            alert('Erro ao excluir campanha. Por favor, tente novamente.');
        }
    }
}

// Funções de busca e filtro
function searchCampaigns() {
    const searchTerm = document.getElementById('searchCampaign').value.toLowerCase();
    filterCampaigns(searchTerm);
}

function filterCampaigns(searchTerm = '') {
    const statusFilter = document.getElementById('filterStatus').value;
    const typeFilter = document.getElementById('filterType').value;
    
    const cards = document.querySelectorAll('.campaign-card');
    
    cards.forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        const status = card.querySelector('.status').textContent.toLowerCase();
        const type = card.querySelector('.campaign-type').textContent.toLowerCase();
        
        const matchesSearch = name.includes(searchTerm);
        const matchesStatus = !statusFilter || status === statusFilter;
        const matchesType = !typeFilter || type === typeFilter;
        
        card.style.display = matchesSearch && matchesStatus && matchesType ? '' : 'none';
    });
}

// Função para carregar e exibir campanhas do backend
async function loadCampaigns() {
    console.log("loadCampaigns: Carregando campanhas do backend...");
    const tableBody = document.querySelector('#campaignsTable tbody');
    if (!tableBody) {
        console.error("loadCampaigns: Elemento #campaignsTable tbody não encontrado!");
        return;
    }
    tableBody.innerHTML = '<tr><td colspan="11" class="text-center text-gray-400 py-4">Carregando campanhas...</td></tr>';

    const clientId = localStorage.getItem('clientId');
    const token = localStorage.getItem('clientToken') || localStorage.getItem('token');

    // Buscar todas as listas e recompensas do cliente (1 fetch cada)
    let listasMap = {};
    let recompensasMap = {};
    try {
        const [listasRes, recompensasRes] = await Promise.all([
            fetch(`${getApiUrl()}/participant-lists`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${getApiUrl()}/rewards`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const listasData = await listasRes.json();
        const recompensasData = await recompensasRes.json();
        if (Array.isArray(listasData.data)) {
            listasData.data.forEach(l => { listasMap[l._id] = l.name; });
        }
        if (Array.isArray(recompensasData.data)) {
            recompensasData.data.forEach(r => { recompensasMap[r._id] = `${r.type} - ${r.value}`; });
        }
    } catch (e) {
        console.warn('Erro ao buscar listas/recompensas para exibição:', e);
    }

    // Função utilitária para buscar nome de LP (mantém cache)
    const cache = {};
    async function getNomeLP(id, tipo) {
        if (!id) return '-';
        const cacheKey = tipo + id;
        if (cache[cacheKey]) return cache[cacheKey];
        let url = '';
        if (tipo === 'indicadores') url = `${getApiUrl()}/lp-indicadores/${id}`;
        if (tipo === 'divulgacao') url = `${getApiUrl()}/lp-divulgacao/${id}`;
        if (!url) return '-';
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            const nome = data?.data?.name || '-';
            cache[cacheKey] = nome;
            return nome;
        } catch { return '-'; }
    }

    try {
        const res = await fetch(`${getApiUrl()}/campaigns`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="11" class="text-center text-gray-400 py-4">Nenhuma campanha criada ainda.</td></tr>';
            return;
        }
        tableBody.innerHTML = '';
        for (const campaign of data.data) {
            // Busca paralela dos nomes de LPs
            const [lpIndicadoresNome, lpDivulgacaoNome] = await Promise.all([
                getNomeLP(campaign.lpIndicadoresId, 'indicadores'),
                getNomeLP(campaign.lpDivulgacaoId, 'divulgacao')
            ]);
            const periodo = `${campaign.startDate ? formatDate(campaign.startDate) : '-'} até ${campaign.endDate ? formatDate(campaign.endDate) : '-'}`;
            const fonteIndicadores = campaign.lpIndicadoresId ? 'LP de Indicadores' : 'Lista de Participantes';
            const recompensaInd = campaign.rewardOnReferral ? (recompensasMap[campaign.rewardOnReferral] || '-') : '-';
            const recompensaConv = campaign.rewardOnConversion ? (recompensasMap[campaign.rewardOnConversion] || '-') : '-';
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-800 transition-colors';
            
            // Determinar status da campanha
            const isActive = campaign.status === 'active';
            const statusBadge = isActive 
                ? '<span class="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400"><i class="fas fa-check-circle mr-1"></i>Ativa</span>'
                : '<span class="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400"><i class="fas fa-pause-circle mr-1"></i>Inativa</span>';
            
            // Tipo de campanha com ícone
            const typeIcon = campaign.type === 'lp-divulgacao' 
                ? '<i class="fas fa-bullhorn text-purple-400 mr-2"></i>' 
                : '<i class="fas fa-share-alt text-blue-400 mr-2"></i>';
                
            // Badge para fonte de indicadores
            const fonteBadge = campaign.lpIndicadoresId 
                ? '<span class="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"><i class="fas fa-clipboard-list mr-1"></i>LP</span>'
                : '<span class="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded"><i class="fas fa-list mr-1"></i>Lista</span>';
                
            // Formatação de recompensas com ícones
            const formatRewardWithIcon = (rewardStr) => {
                if (!rewardStr || rewardStr === '-') return '<span class="text-gray-500">-</span>';
                if (rewardStr.includes('pix')) return `<i class="fas fa-money-bill-wave text-green-400 mr-1"></i>${rewardStr}`;
                if (rewardStr.includes('points')) return `<i class="fas fa-coins text-yellow-400 mr-1"></i>${rewardStr}`;
                if (rewardStr.includes('discount')) return `<i class="fas fa-percentage text-blue-400 mr-1"></i>${rewardStr}`;
                return `<i class="fas fa-gift text-purple-400 mr-1"></i>${rewardStr}`;
            };
            
            row.innerHTML = `
                <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                        <div>
                            <div class="font-medium text-gray-200">${campaign.name || '-'}</div>
                            ${campaign.description ? `<div class="text-xs text-gray-400 mt-1">${campaign.description}</div>` : ''}
                        </div>
                        ${statusBadge}
                    </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-300 hidden">${campaign.description || '-'}</td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-300">
                        <i class="fas fa-calendar text-gray-400 mr-1"></i>
                        ${periodo}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center">
                        ${typeIcon}
                        <span class="text-sm">${getCampaignTypeLabel(campaign.type) || '-'}</span>
                    </div>
                </td>
                <td class="px-4 py-3">${fonteBadge}</td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-300">
                        ${lpIndicadoresNome !== '-' ? `<i class="fas fa-file-alt text-gray-400 mr-1"></i>${lpIndicadoresNome}` : '<span class="text-gray-500">-</span>'}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-300">
                        ${lpDivulgacaoNome !== '-' ? `<i class="fas fa-bullhorn text-gray-400 mr-1"></i>${lpDivulgacaoNome}` : '<span class="text-gray-500">-</span>'}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm">
                        ${formatRewardWithIcon(recompensaInd)}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm">
                        ${formatRewardWithIcon(recompensaConv)}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                        <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-blue-400 hover:text-blue-300" 
                                onclick="editCampaign('${campaign._id || campaign.id}')" 
                                title="Editar campanha">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${campaign.type === 'lp-indicadores' ? `
                        <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-green-400 hover:text-green-300" 
                                onclick="accessLPIndicadores('${campaign._id || campaign.id}')"
                                title="Acessar LP de Indicadores">
                            <i class="fas fa-clipboard-list"></i>
                        </button>
                        ` : ''}
                        <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-300" 
                                onclick="viewCampaignDetails('${campaign._id || campaign.id}')"
                                title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-red-400 hover:text-red-300" 
                                onclick="deleteCampaign('${campaign._id || campaign.id}')"
                                title="Excluir campanha">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        }
        console.log("loadCampaigns: Linhas detalhadas renderizadas.");
    } catch (err) {
        console.error("loadCampaigns: Erro ao buscar campanhas do backend:", err);
        tableBody.innerHTML = '<tr><td colspan="11" class="text-center text-red-400 py-4">Erro ao carregar campanhas.</td></tr>';
    }
}

// Funções auxiliares para formatação (Exemplos)
function getCampaignTypeLabel(type) {
    const labels = {
        'lp-divulgacao': 'LP de Divulgação',
        'lp-indicadores': 'LP de Indicadores',
        'link-compartilhamento': 'Link de Compartilhamento'
    };
    return labels[type] || type;
}

function getStatusLabel(status) {
    const labels = { active: 'Ativa', inactive: 'Inativa', draft: 'Rascunho' };
    return labels[status] || status;
}

function formatDate(isoString) {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleDateString('pt-BR');
    } catch (e) {
        return 'Data inválida';
    }
}

function formatReward(reward) {
    if (!reward) return 'N/A';
    if (reward.type === 'product') return reward.name || reward.value || 'Produto sem nome';
    if (reward.type === 'pix') return `R$ ${parseFloat(reward.value || 0).toFixed(2)}`;
    if (reward.type === 'points') return `${reward.value || 0} Pontos`;
    if (reward.type === 'discount') return `${reward.value || 0}% Desconto`;
    return reward.value || 'Valor não definido';
}

function calculateConversion(participants, referrals) {
    if (!participants || participants === 0) return 0;
    return Math.round(((referrals || 0) / participants) * 100);
}

// Funções de filtro e busca (GARANTIR QUE NÃO CHAMEM loadCampaigns DIRETAMENTE)
// Elas devem manipular a visibilidade dos cards existentes ou chamar uma função de re-renderização
// que *primeiro* limpa o grid.

function filterCampaigns() {
    console.log("filterCampaigns: Aplicando filtros...");
    const statusFilter = document.getElementById('filterStatus').value;
    const typeFilter = document.getElementById('filterType').value;
    const searchTerm = document.getElementById('searchCampaign').value.toLowerCase();
    const cards = document.querySelectorAll('.campaigns-grid .campaign-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const status = card.dataset.status;
        const type = card.dataset.type;
        const name = card.querySelector('h3')?.textContent.toLowerCase() || '';

        const matchesStatus = !statusFilter || status === statusFilter;
        const matchesType = !typeFilter || type === typeFilter;
        const matchesSearch = !searchTerm || name.includes(searchTerm);

        if (matchesStatus && matchesType && matchesSearch) {
            card.style.display = ''; // Mostrar card
            visibleCount++;
        } else {
            card.style.display = 'none'; // Ocultar card
        }
    });
    console.log(`filterCampaigns: ${visibleCount} campanhas visíveis após filtro.`);
    // Opcional: Exibir mensagem se nenhum resultado for encontrado
     const grid = document.querySelector('.campaigns-grid');
     const noResultsMessage = grid.querySelector('.no-results');
     if (visibleCount === 0 && cards.length > 0) {
         if (!noResultsMessage) {
             const p = document.createElement('p');
             p.className = 'no-results no-data'; // Reutilizar estilo
             p.textContent = 'Nenhuma campanha encontrada com os filtros aplicados.';
             grid.appendChild(p);
         }
     } else if (noResultsMessage) {
         noResultsMessage.remove();
     }
}

function searchCampaigns() {
    // A busca agora é integrada ao filterCampaigns
    filterCampaigns(); 
}

// Garantir que DOMContentLoaded chame loadCampaigns apenas uma vez
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Verificando autenticação e carregando campanhas...");
    checkAuth(); // Assume que existe
    loadCampaigns(); // Chamada inicial para carregar campanhas

    // Adicionar listeners para busca e filtros
    const searchButton = document.querySelector('.search-box button');
    const searchInput = document.getElementById('searchCampaign');
    const statusFilter = document.getElementById('filterStatus');
    const typeFilter = document.getElementById('filterType');

    if(searchButton) searchButton.addEventListener('click', searchCampaigns);
    // Filtrar ao digitar na busca também:
    if(searchInput) searchInput.addEventListener('input', filterCampaigns);
    if(statusFilter) statusFilter.addEventListener('change', filterCampaigns);
    if(typeFilter) typeFilter.addEventListener('change', filterCampaigns);
});

// Garantir que handleNewCampaign chame loadCampaigns apenas uma vez no final
async function handleNewCampaign(event) {
    console.log("handleNewCampaign: --- INÍCIO --- ");
    event.preventDefault();

    // --- 0. VERIFICAÇÃO CRUCIAL DO LOCALSTORAGE['rewardTypes'] --- 
    let storedRewardTypesRaw = null;
    try {
        storedRewardTypesRaw = localStorage.getItem('rewardTypes');
        console.log("handleNewCampaign: [0] Conteúdo BRUTO de localStorage['rewardTypes']:", storedRewardTypesRaw);
        if (!storedRewardTypesRaw) {
            alert("ERRO CRÍTICO [HC00a]: Configuração de recompensas ('rewardTypes') NÃO ENCONTRADA no localStorage. A criação não pode continuar.");
            console.error("handleNewCampaign: Falha [HC00a] - localStorage['rewardTypes'] está nulo ou vazio.");
            return;
        }
        // Tentar parsear para verificar se é JSON válido
        JSON.parse(storedRewardTypesRaw); 
        console.log("handleNewCampaign: [0] localStorage['rewardTypes'] parece ser JSON válido.");
    } catch (e) {
        alert("ERRO CRÍTICO [HC00b]: Conteúdo de 'rewardTypes' no localStorage NÃO é um JSON válido. Verifique a configuração do sistema.");
        console.error("handleNewCampaign: Falha [HC00b] - Erro ao parsear localStorage['rewardTypes']:", e, "\nConteúdo Bruto:", storedRewardTypesRaw);
        return;
    }
    // --- FIM DA VERIFICAÇÃO 0 ---
    
    // --- 1. Validação Inicial Essencial --- 
    console.log("handleNewCampaign: [1] Verificando formData inicial:", JSON.stringify(formData));
    if (!formData || !formData.campaignType || !formData.rewardType) {
        alert("Erro Crítico [HC01]: Dados essenciais (tipo de campanha/recompensa) ausentes. Volte e selecione.");
        console.error("handleNewCampaign: Falha [HC01] - formData incompleto:", JSON.stringify(formData));
        return;
    }
    console.log("handleNewCampaign: [1] formData inicial OK.");

    // --- 2. Coleta de Dados Básicos --- 
    let campaignName, campaignDescription, selectedLists;
    try {
        console.log("handleNewCampaign: [2] Coletando dados básicos...");
        campaignName = document.getElementById('campaignName')?.value.trim();
        campaignDescription = document.getElementById('campaignDescription')?.value.trim();
        selectedLists = Array.from(window.selectedCampaignLists || []);

        if (!campaignName) {
            alert("Erro [HC02]: Nome da campanha obrigatório (Etapa 2).");
            console.error("handleNewCampaign: Falha [HC02] - Nome vazio.");
            return;
        }
        console.log(`handleNewCampaign: [2] Dados básicos OK: Nome=${campaignName}, Listas=[${selectedLists.join(',')}]`);
    } catch (e) {
        alert("Erro interno [HC03] ao coletar dados básicos. Verifique o console.");
        console.error("handleNewCampaign: Erro CRÍTICO [HC03] na coleta básica:", e);
        return;
    }

    // --- 3. Coleta de Dados da Recompensa --- 
    let rewardData = { type: formData.rewardType };
    try {
        console.log(`handleNewCampaign: [3] Coletando recompensa tipo: ${formData.rewardType}`);
        if (formData.rewardType === 'product') {
             // ...(lógica para produto, igual ao anterior)... 
             const rewardProductValue = document.getElementById('rewardProduct')?.value.trim();
             if (!rewardProductValue) {
                 alert('Erro [HC04]: Nome do produto de recompensa não preenchido (Etapa 3).');
                 console.error("handleNewCampaign: Falha [HC04] - Produto vazio.");
                 return;
             }
             rewardData.value = rewardProductValue;
             rewardData.name = rewardProductValue;
             console.log("handleNewCampaign: [3] Recompensa Produto OK:", rewardData);
        } else {
            const selectedRewardId = document.getElementById('selectedRewardType')?.value;
            if (!selectedRewardId) {
                alert('Erro [HC05]: Recompensa específica não selecionada (Etapa 3).');
                console.error("handleNewCampaign: Falha [HC05] - Select recompensa vazio.");
                return;
            }
            console.log("handleNewCampaign: [3] ID recompensa selecionada:", selectedRewardId);
            
            // Usar a variável já verificada na Etapa 0
            const rewardTypes = JSON.parse(storedRewardTypesRaw); 
            console.log("handleNewCampaign: [3] rewardTypes já parseados:", rewardTypes);
            const selectedReward = rewardTypes.find(type => String(type.id) === selectedRewardId);
            
            if (selectedReward) {
                rewardData.value = selectedReward.value; 
                rewardData.name = selectedReward.name; 
                console.log("handleNewCampaign: [3] Recompensa Específica OK:", rewardData);
            } else {
                alert('Erro [HC07]: Detalhes da recompensa (ID: ' + selectedRewardId + ') não encontrados. Verifique cadastro de recompensas.');
                console.error("handleNewCampaign: Falha [HC07] - Recompensa ID", selectedRewardId, "não encontrada em:", rewardTypes);
                return;
            }
        }
    } catch (e) {
        alert('Erro interno [HC08] ao processar recompensa. Verifique o console.');
        console.error("handleNewCampaign: Erro CRÍTICO [HC08] na coleta de recompensa:", e);
        return;
    }
    // --- Fim da Coleta de Recompensa ---

    // --- 4. Coleta de Configurações Específicas ---
    let specificSettings = {};
    try {
        console.log("handleNewCampaign: [4] Coletando config. específicas para tipo:", formData.campaignType);
        switch(formData.campaignType) {
            case 'form':
                specificSettings = {
                    theme: document.getElementById('formTheme')?.value,
                    redirect: document.getElementById('formRedirect')?.value
                };
                break;
            case 'link':
                specificSettings = {
                    message: document.getElementById('linkMessage')?.value,
                    image: document.getElementById('linkImage')?.value
                };
                break;
            case 'landing':
                const landingTitleValue = document.getElementById('landingTitle')?.value.trim();
                 if (!landingTitleValue) {
                    alert("Erro [HC09]: Título da Landing Page obrigatório (Etapa 4).");
                    console.error("handleNewCampaign: Falha [HC09] - Título LP vazio.");
                    return;
                }
                specificSettings = {
                    title: landingTitleValue,
                    subtitle: document.getElementById('landingSubtitle')?.value.trim(),
                    description: document.getElementById('landingDescription')?.value.trim(),
                    fields: Array.from(document.querySelectorAll('input[name="formFields"]:checked'))
                        .map(cb => cb.value)
                };
                break;
            default:
                 alert("Erro interno [HC10]: Tipo de campanha inválido.");
                 console.warn("handleNewCampaign: Falha [HC10] - Tipo inválido:", formData.campaignType);
                 return;
        }
         console.log("handleNewCampaign: [4] Config. Específicas OK:", specificSettings);
    } catch (e) {
        alert("Erro interno [HC11] ao coletar config. específicas. Verifique console.");
        console.error("handleNewCampaign: Erro CRÍTICO [HC11] na coleta de specificSettings:", e);
        return;
    }
    
    // --- 5. Montagem do Objeto Final --- 
    let newCampaign;
    try {
        console.log("handleNewCampaign: [5] Montando objeto final...");
        newCampaign = {
            name: campaignName,
            description: campaignDescription,
            type: formData.campaignType, // campo obrigatório para o backend
            reward: rewardData, 
            status: 'active', 
            lists: selectedLists,
            settings: specificSettings,
            createdAt: new Date().toISOString(),
            participants: 0, 
            referrals: 0,
            conversion: 0
        };
        console.log("handleNewCampaign: [5] Objeto final OK:", JSON.stringify(newCampaign, null, 2));
    } catch (e) {
        alert("Erro interno [HC12] ao montar dados da campanha. Verifique console.");
        console.error("handleNewCampaign: Erro CRÍTICO [HC12] na montagem do objeto:", e);
        return;
    }
     
    // --- 6. Salvamento --- 
    try {
        console.log("handleNewCampaign: [6] Tentando salvar via API...");
        const clientId = localStorage.getItem('clientId');
        const token = localStorage.getItem('clientToken') || localStorage.getItem('token');
        const res = await fetch(`${getApiUrl()}/campaigns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ...newCampaign, clientId })
        });
        const result = await res.json();
        if (!result || !result._id) {
            alert('Erro ao criar campanha: ' + (result.message || 'Erro desconhecido.'));
            return;
        }
        alert('Campanha criada com sucesso!');
    } catch (error) {
        alert('Erro grave [HC13] ao salvar campanha na API. Verifique console.');
        console.error('handleNewCampaign: Erro CRÍTICO [HC13] no salvamento:', error);
        return; // Interrompe se o salvamento falhar
    }

    // --- 7. Finalização (após salvamento bem-sucedido) ---
    try {
        console.log("handleNewCampaign: [7] Fechando modal e atualizando UI...");
        closeNewCampaignModal();
        loadCampaigns(); // <<< CHAMADA ÚNICA AQUI APÓS SUCESSO
        console.log("handleNewCampaign: [7] Modal fechado e UI atualizada.");
    } catch (error) {
         alert('Erro [HC14] ao fechar modal ou atualizar lista de campanhas...');
        console.error('handleNewCampaign: Erro [HC14] na finalização pós-salvamento:', error);
    }

    console.log("handleNewCampaign: --- FIM --- ");
}

// Funções para gerenciar listas de participantes
function loadListsForCampaign() {
    const listsContainer = document.getElementById('listsForCampaign');
    if (!listsContainer) return;

    const storedLists = JSON.parse(localStorage.getItem('participantLists') || '[]');
    const activeLists = storedLists.filter(list => list.status === 'active');

    // Adicionar o contador de seleção
    const selectionCounter = document.createElement('div');
    selectionCounter.className = 'selection-counter';
    selectionCounter.innerHTML = `
        <span>Listas selecionadas:</span>
        <span class="count" id="selectedListsCount">0</span>
    `;

    listsContainer.innerHTML = '';
    listsContainer.appendChild(selectionCounter);

    const listItems = activeLists.map(list => `
        <div class="participant-item">
            <label>
                <input type="checkbox" value="${list.id}" 
                       onchange="toggleCampaignList('${list.id}')">
                <div class="participant-info">
                    <span class="participant-name">${list.name}</span>
                    <span class="participant-email">${list.participants ? list.participants.length : 0} participantes</span>
                </div>
            </label>
        </div>
    `).join('');

    listsContainer.insertAdjacentHTML('beforeend', listItems);
    updateSelectedListsCount();
}

function filterListsForCampaign() {
    const searchTerm = document.getElementById('listSearchInput').value.toLowerCase();
    const items = document.querySelectorAll('#listsForCampaign .participant-item');
    
    items.forEach(item => {
        const name = item.querySelector('.participant-name').textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function toggleCampaignList(listId) {
    const checkbox = document.querySelector(`#listsForCampaign input[value="${listId}"]`);
    if (!checkbox) return;

    if (!window.selectedCampaignLists) {
        window.selectedCampaignLists = new Set();
    }

    if (checkbox.checked) {
        window.selectedCampaignLists.add(listId);
    } else {
        window.selectedCampaignLists.delete(listId);
    }

    updateSelectedListsCount();
}

function updateSelectedListsCount() {
    const countElement = document.getElementById('selectedListsCount');
    if (!countElement) return;

    const count = window.selectedCampaignLists ? window.selectedCampaignLists.size : 0;
    countElement.textContent = count;

    // Atualizar o estilo do contador
    const selectionCounter = document.querySelector('.selection-counter');
    if (selectionCounter) {
        if (count > 0) {
            selectionCounter.style.backgroundColor = '#e8f5e9';
            selectionCounter.style.color = '#2e7d32';
        } else {
            selectionCounter.style.backgroundColor = '#ebf7ff';
            selectionCounter.style.color = '#2c3e50';
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Inicializando formulário de campanha...");
    checkAuth(); // Assume que existe
    // Não há edição neste fluxo, apenas criação.
    resetQuiz(); // Garante estado inicial limpo
});

// Adicionar ao CSS existente via JavaScript
document.head.insertAdjacentHTML('beforeend', `
    <style>
    .quiz-option.deselecting {
        animation: fadeOut 0.3s ease;
    }
    
    .quiz-option.selected {
        animation: selectIn 0.3s ease;
    }
    
    #nextButton {
        opacity: 0.5;
        pointer-events: none;
    }
    
    #nextButton.active {
        opacity: 1;
        pointer-events: auto;
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0.5;
            transform: scale(0.95);
        }
    }
    
    @keyframes selectIn {
        from {
            opacity: 0.5;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    </style>
`);

// Funções auxiliares
function generateId() {
    // Implementação simples para gerar ID único
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Funções para o modal de edição
function openEditCampaignModal(campaignId) {
    const modal = document.getElementById('editCampaignModal');
    const campaign = campaigns.find(c => c.id === campaignId);
    
    if (!campaign) return;
    
    // Preencher o formulário com os dados da campanha
    document.getElementById('editName').value = campaign.name;
    document.getElementById('editDescription').value = campaign.description;
    document.getElementById('editStatus').value = campaign.status;
    
    // Mostrar o modal
    modal.style.display = 'block';
    
    // Fechar o modal ao clicar no X
    modal.querySelector('.close-modal').onclick = () => {
        modal.style.display = 'none';
    };
    
    // Fechar o modal ao clicar fora dele
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Fechar o modal ao clicar em Cancelar
    modal.querySelector('.btn-cancel').onclick = () => {
        modal.style.display = 'none';
    };
    
    // Salvar as alterações ao clicar em Salvar
    modal.querySelector('.btn-save').onclick = () => {
        const form = document.getElementById('editCampaignForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Atualizar os dados da campanha
        campaign.name = document.getElementById('editName').value;
        campaign.description = document.getElementById('editDescription').value;
        campaign.status = document.getElementById('editStatus').value;
        
        // Atualizar o localStorage
        localStorage.setItem('campaigns', JSON.stringify(campaigns));
        
        // Atualizar a exibição
        displayCampaigns();
        
        // Fechar o modal
        modal.style.display = 'none';
    };
}

function displayCampaigns() {
    const tbody = document.querySelector('#campaignsTable tbody');
    tbody.innerHTML = '';

    const filteredCampaigns = campaigns.filter(campaign => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        return campaign.name.toLowerCase().includes(searchTerm) ||
               campaign.description.toLowerCase().includes(searchTerm);
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

    if (paginatedCampaigns.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Nenhuma campanha encontrada</td>
            </tr>
        `;
        return;
    }

    paginatedCampaigns.forEach(campaign => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${campaign.name}</td>
            <td>${campaign.description || '-'}</td>
            <td>${campaign.status === 'active' ? 'Ativa' : 'Inativa'}</td>
            <td>${new Date(campaign.createdAt).toLocaleDateString()}</td>
            <td>${campaign.updatedAt ? new Date(campaign.updatedAt).toLocaleDateString() : '-'}</td>
            <td>
                <button class="btn-icon edit" onclick="openEditCampaignModal('${campaign.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteCampaign('${campaign.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updatePagination(filteredCampaigns.length);
}

// Funções para gerenciar o submenu
function showCampaignList() {
    // Esconde todas as seções
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostra a seção de lista de campanhas
    document.getElementById('campaignsList').style.display = 'block';
    
    // Atualiza o submenu ativo
    updateActiveSubmenu('showCampaignList');
}

function showFormTemplates() {
    document.getElementById('campaignsList').style.display = 'none';
    document.getElementById('formTemplates').style.display = 'block';
    document.getElementById('shareLinks').style.display = 'none';
    updateActiveSubmenu('showFormTemplates');
    loadTemplates();
}

function showNewTemplateModal() {
    document.getElementById('templateModalTitle').textContent = 'Nova Landing Page';
    document.getElementById('templateForm').reset();
    document.getElementById('fieldList').innerHTML = '';
    document.getElementById('templateModal').style.display = 'block';
}

function closeTemplateModal() {
    document.getElementById('templateModal').style.display = 'none';
}

function saveTemplate() {
    const form = document.getElementById('templateForm');
    const formData = new FormData(form);
    
    // Validação básica
    if (!formData.get('templateName')) {
        showToast('Por favor, insira um nome para a Landing Page', 'error');
        return;
    }
    
    // Aqui você implementaria a lógica para salvar a Landing Page
    showToast('Landing Page salva com sucesso!', 'success');
    closeTemplateModal();
    loadTemplates();
}

function loadTemplates() {
    // Aqui você implementaria a lógica para carregar as Landing Pages
    const templatesContainer = document.querySelector('.templates-grid');
    templatesContainer.innerHTML = `
        <div class="template-card">
            <div class="template-header">
                <h3>Landing Page de Vendas</h3>
                <span class="template-status active">Ativa</span>
            </div>
            <div class="template-preview">
                <div class="field-list">
                    <div class="field-item">
                        <span class="field-name">Nome</span>
                        <span class="field-type">Texto</span>
                    </div>
                    <div class="field-item">
                        <span class="field-name">Email</span>
                        <span class="field-type">Email</span>
                    </div>
                </div>
            </div>
            <div class="template-actions">
                <button class="btn-secondary" onclick="editTemplate(1)">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-secondary" onclick="getTemplateCode(1)">
                    <i class="fas fa-code"></i> Código HTML
                </button>
                <button class="btn-danger" onclick="deleteTemplate(1)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function showFormFields() {
    // Esconde todas as seções
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostra a seção de campos personalizados
    document.getElementById('formFields').style.display = 'block';
    
    // Atualiza o submenu ativo
    updateActiveSubmenu('showFormFields');
}

function updateActiveSubmenu(activeFunction) {
    // Remove a classe active de todos os itens
    document.querySelectorAll('.submenu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Adiciona a classe active ao item clicado
    const activeItem = document.querySelector(`[onclick="${activeFunction}()"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Funções para gerenciar modelos de formulário
function createNewTemplate() {
    document.getElementById('newTemplateModal').style.display = 'block';
    loadAvailableFields();
}

function closeNewTemplateModal() {
    document.getElementById('newTemplateModal').style.display = 'none';
    document.getElementById('newTemplateForm').reset();
}

function saveTemplate() {
    const name = document.getElementById('templateName').value;
    const description = document.getElementById('templateDescription').value;
    const selectedFields = Array.from(document.querySelectorAll('.field-option input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    if (!name) {
        alert('Por favor, preencha o nome do modelo');
        return;
    }

    // Salvar o modelo (implementar lógica de salvamento)
    console.log('Salvando modelo:', { name, description, selectedFields });
    closeNewTemplateModal();
    loadTemplates();
}

function loadTemplates() {
    // Implementar carregamento de modelos do localStorage
    const templates = JSON.parse(localStorage.getItem('formTemplates')) || [];
    const templatesGrid = document.querySelector('.templates-grid');
    
    templatesGrid.innerHTML = templates.map(template => `
        <div class="template-card">
            <h3>${template.name}</h3>
            <p>${template.description || 'Sem descrição'}</p>
            <div class="template-actions">
                <button class="btn-secondary" onclick="editTemplate('${template.id}')">Editar</button>
                <button class="btn-danger" onclick="deleteTemplate('${template.id}')">Excluir</button>
            </div>
        </div>
    `).join('');
}

// Funções para gerenciar campos personalizados
function createNewField() {
    document.getElementById('newFieldModal').style.display = 'block';
}

function closeNewFieldModal() {
    document.getElementById('newFieldModal').style.display = 'none';
    document.getElementById('newFieldForm').reset();
    document.getElementById('optionsGroup').style.display = 'none';
}

function saveField() {
    const name = document.getElementById('fieldName').value;
    const type = document.getElementById('fieldType').value;
    const required = document.getElementById('fieldRequired').checked;
    const options = document.getElementById('fieldOptions').value.split('\n').filter(opt => opt.trim());

    if (!name) {
        alert('Por favor, preencha o nome do campo');
        return;
    }

    // Salvar o campo (implementar lógica de salvamento)
    console.log('Salvando campo:', { name, type, required, options });
    closeNewFieldModal();
    loadFields();
}

function loadFields() {
    // Implementar carregamento de campos do localStorage
    const fields = JSON.parse(localStorage.getItem('formFields')) || [];
    const fieldsList = document.querySelector('.fields-list');
    
    fieldsList.innerHTML = fields.map(field => `
        <div class="field-item">
            <div class="field-info">
                <h3>${field.name}</h3>
                <p>Tipo: ${field.type} ${field.required ? '(Obrigatório)' : ''}</p>
            </div>
            <div class="field-actions">
                <button class="btn-secondary" onclick="editField('${field.id}')">Editar</button>
                <button class="btn-danger" onclick="deleteField('${field.id}')">Excluir</button>
            </div>
        </div>
    `).join('');
}

function loadAvailableFields() {
    const fields = JSON.parse(localStorage.getItem('formFields')) || [];
    const fieldsSelection = document.querySelector('.fields-selection');
    
    fieldsSelection.innerHTML = fields.map(field => `
        <div class="field-option">
            <input type="checkbox" id="field_${field.id}" value="${field.id}">
            <label for="field_${field.id}">${field.name} (${field.type})</label>
        </div>
    `).join('');
}

// Event listener para mostrar/esconder opções de campo
const fieldTypeElement = document.getElementById('fieldType');
if (fieldTypeElement) {
    fieldTypeElement.addEventListener('change', function() {
        const optionsGroup = document.getElementById('optionsGroup');
        if (optionsGroup) {
            const showOptions = ['select', 'checkbox', 'radio'].includes(this.value);
            optionsGroup.style.display = showOptions ? 'block' : 'none';
        }
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página correta antes de executar funções específicas
    if (document.querySelector('.templates-grid')) {
        loadTemplates();
    }
    if (document.querySelector('.fields-list')) {
        loadFields();
    }
});

function showShareLinks() {
    document.getElementById('campaignsList').style.display = 'none';
    document.getElementById('formTemplates').style.display = 'none';
    document.getElementById('shareLinks').style.display = 'block';
    updateActiveSubmenu('showShareLinks');
    loadPages();
}

function createNewShareLink() {
    // TODO: Implementar a criação de novo link
    alert('Funcionalidade de criar novo link será implementada em breve.');
}

// Função para carregar os templates no select
function loadTemplatesIntoSelect() {
    const templates = JSON.parse(localStorage.getItem('formTemplates')) || [];
    const templateSelect = document.getElementById('templateSelect');
    
    // Limpar opções existentes
    templateSelect.innerHTML = '<option value="">Escolha um modelo...</option>';
    
    // Adicionar cada template como uma opção
    templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        templateSelect.appendChild(option);
    });
}

// Função para exibir os campos do template selecionado
function showTemplateFields(templateId) {
    const templates = JSON.parse(localStorage.getItem('formTemplates')) || [];
    const template = templates.find(t => t.id === parseInt(templateId));
    const previewDiv = document.querySelector('.template-preview');
    const fieldsList = document.getElementById('selectedTemplateFields');
    
    if (!template) {
        previewDiv.style.display = 'none';
        return;
    }
    
    // Limpar lista de campos
    fieldsList.innerHTML = '';
    
    // Adicionar cada campo à preview
    template.fields.forEach(field => {
        const fieldItem = document.createElement('div');
        fieldItem.className = 'field-item';
        
        const fieldName = document.createElement('span');
        fieldName.className = 'field-name';
        fieldName.textContent = field.name;
        
        const fieldType = document.createElement('span');
        fieldType.className = 'field-type';
        fieldType.textContent = field.type;
        
        const fieldRequired = document.createElement('span');
        fieldRequired.className = 'field-required';
        fieldRequired.textContent = field.required ? '(Obrigatório)' : '(Opcional)';
        
        fieldItem.appendChild(fieldName);
        fieldItem.appendChild(fieldType);
        fieldItem.appendChild(fieldRequired);
        fieldsList.appendChild(fieldItem);
    });
    
    previewDiv.style.display = 'block';
}

// Event listener para quando selecionar um template
document.addEventListener('DOMContentLoaded', function() {
    const templateSelect = document.getElementById('templateSelect');
    if (templateSelect) {
        templateSelect.addEventListener('change', function() {
            showTemplateFields(this.value);
        });
    }
}); 

// Objeto para armazenar os domínios registrados
let registeredDomains = [];

// Função para carregar domínios registrados
async function loadRegisteredDomains() {
    try {
        // TODO: Integrar com API
        // Simulando dados de exemplo
        registeredDomains = [
            { id: 1, domain: 'https://seudominio.com.br', isDefault: true },
            { id: 2, domain: 'https://outrodominio.com.br', isDefault: false }
        ];
        updateDomainSelects();
    } catch (error) {
        console.error('Erro ao carregar domínios:', error);
    }
}

// Função para atualizar selects de domínio
function updateDomainSelects() {
    const domainSelects = document.querySelectorAll('.domain-select');
    domainSelects.forEach(select => {
        select.innerHTML = registeredDomains.map(domain => `
            <option value="${domain.id}" ${domain.isDefault ? 'selected' : ''}>
                ${domain.domain}
            </option>
        `).join('');
    });
}

// Função para gerar link personalizado
function generatePersonalizedLink(pageConfig, participantData) {
    const domain = registeredDomains.find(d => d.id === parseInt(pageConfig.domainId));
    if (!domain) return '';

    const baseUrl = domain.domain;
    const participantSlug = participantData.code || participantData.id;
    
    return `${baseUrl}/p/${participantSlug}/${pageConfig.slug}`;
}

// Função para atualizar preview do link
function updateLinkPreview(pageId, participantId) {
    const previewUrl = document.getElementById('previewPageUrl');
    if (!previewUrl) return;

    // TODO: Integrar com API
    // Simulando dados de exemplo
    const pageConfig = {
        domainId: 1,
        slug: 'produto-premium'
    };

    const participantData = {
        id: participantId,
        code: `REF${participantId}`,
        name: 'João Silva'
    };

    const personalizedLink = generatePersonalizedLink(pageConfig, participantData);
    previewUrl.textContent = personalizedLink;
}

// Função para salvar configuração de página
async function savePageConfig(event) {
    event.preventDefault();
    
    const config = {
        domainId: document.getElementById('pageDomain').value,
        originalUrl: document.getElementById('pageOriginalUrl').value,
        slug: document.getElementById('pageSlug').value,
        customElements: Array.from(document.querySelectorAll('input[name="customElements"]:checked'))
            .map(input => input.value),
        tracking: Array.from(document.querySelectorAll('input[name="tracking"]:checked'))
            .map(input => input.value)
    };

    try {
        // Validações
        if (!config.domainId) throw new Error('Selecione um domínio');
        if (!config.originalUrl) throw new Error('Informe a URL original');
        if (!config.slug) throw new Error('Informe o slug da página');
        if (!isValidSlug(config.slug)) throw new Error('Slug inválido. Use apenas letras, números e hífens');

        await savePagesConfiguration(config);
        await loadPages();
        closePagesConfigModal();
        
        showToast('Configuração salva com sucesso!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Função para validar slug
function isValidSlug(slug) {
    return /^[a-z0-9-]+$/.test(slug);
}

// Função para mostrar toast de notificação
function showToast(message, type = 'info') {
    // Implementar sistema de notificação
    alert(message);
}

// Função para copiar link específico
function copySpecificPageUrl(pageId, participantId) {
    const url = document.getElementById('previewPageUrl')?.textContent;
    if (!url) return;

    navigator.clipboard.writeText(url)
        .then(() => showToast('Link copiado com sucesso!', 'success'))
        .catch(() => showToast('Erro ao copiar link', 'error'));
}

// Função para carregar participantes no select
async function loadParticipantsIntoSelect() {
    const select = document.querySelector('.participant-select');
    if (!select) return;

    try {
        // TODO: Integrar com API
        // Simulando dados de exemplo
        const participants = [
            { id: 1, name: 'João Silva', code: 'REF001' },
            { id: 2, name: 'Maria Santos', code: 'REF002' },
            { id: 3, name: 'Pedro Oliveira', code: 'REF003' }
        ];

        select.innerHTML = `
            <option value="">Selecione um participante...</option>
            ${participants.map(p => `
                <option value="${p.id}">${p.name} (${p.code})</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Erro ao carregar participantes:', error);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadRegisteredDomains();
    loadParticipantsIntoSelect();
}); 