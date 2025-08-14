/**
 * 📱 WHATSAPP COMPANY HEADER - CONFIGURAÇÃO FLEXÍVEL
 * Sistema de configuração da empresa e cabeçalho configurável para WhatsApp
 * 
 * NOVA FUNCIONALIDADE: Checkboxes individuais para cada campo
 * Cliente escolhe exatamente o que quer no cabeçalho
 *
 * Funcionalidades:
 * - Configuração flexível da empresa (checkboxes por campo)
 * - Preview em tempo real das mensagens
 * - Integração com sistema JWT multicliente
 * - Validações e tratamento de erros
 *
 * Autor: Sistema de Indicação
 * Versão: 2.0.0 - Flexível por Campo
 * Data: 2025
 */

// ============================================================================
// VARIÁVEIS GLOBAIS E CONFIGURAÇÃO
// ============================================================================

let companyHeaderConfig = null;
let clientId = null;
let isInitialized = false;

// Mapeamento dos checkboxes para campos
const fieldMappings = {
    'includeDescription': 'businessDescription',
    'includeWebsite': 'website',
    'includePhone': 'phone',
    'includeEmail': 'email',
    'includeInstagram': 'instagram',
    'includeFacebook': 'facebook',
    'includeLinkedin': 'linkedin',
    'includeWhatsapp': 'whatsappBusiness'
};

// ============================================================================
// INICIALIZAÇÃO E AUTENTICAÇÃO
// ============================================================================

// Inicialização quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando WhatsApp Company Header Flexível...');
    await initCompanyHeader();
});

// Função principal de inicialização
async function initCompanyHeader() {
    try {
        console.log('📋 Iniciando sistema de cabeçalho flexível da empresa...');

        // Verificar se API_BASE_URL está definido
        if (!window.API_BASE_URL) {
            console.error('❌ API_BASE_URL não está definido!');
            showError('Erro de configuração: API_BASE_URL não encontrado');
            return;
        }

        console.log('✅ API_BASE_URL:', window.API_BASE_URL);

        // Verificar autenticação
        if (!checkAuth()) {
            console.log('❌ Falha na autenticação');
            return;
        }

        // Obter clientId do token JWT
        clientId = getClientIdFromToken();
        if (!clientId) {
            console.error('❌ ClientId não encontrado no token');
            showError('Token inválido - clientId não encontrado');
            return;
        }

        console.log('✅ ClientId extraído:', clientId);

        // Carregar dados iniciais
        await loadCompanyHeader();
        await loadActivityLogs();

        // Configurar eventos de preview em tempo real
        setupRealTimePreview();
        setupCheckboxHandlers();

        isInitialized = true;
        console.log('✅ WhatsApp Company Header Flexível inicializado com sucesso');

    } catch (error) {
        console.error('❌ Erro ao inicializar Company Header:', error);
        showError('Erro ao carregar configurações: ' + error.message);
    }
}

// Verificar autenticação
function checkAuth() {
    const token = getToken();
    if (!token) {
        console.log('❌ Token não encontrado, redirecionando para login');
        window.location.href = 'login.html';
        return false;
    }
    console.log('✅ Token encontrado');
    return true;
}

// Obter token do localStorage
function getToken() {
    return localStorage.getItem('clientToken');
}

// Extrair clientId do token JWT
function getClientIdFromToken() {
    const token = getToken();
    if (!token) return null;

    try {
        // Decodificar JWT para extrair clientId
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('📋 Payload do token:', payload);
        return payload.clientId || payload.sub;
    } catch (error) {
        console.error('❌ Erro ao decodificar token:', error);
        return null;
    }
}

// ============================================================================
// CONFIGURAÇÃO DOS CHECKBOXES
// ============================================================================

// Configurar handlers dos checkboxes
function setupCheckboxHandlers() {
    Object.keys(fieldMappings).forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId);
        const field = document.getElementById(fieldMappings[checkboxId]);
        
        if (checkbox && field) {
            // Handler para mudança do checkbox
            checkbox.addEventListener('change', function() {
                toggleField(field, this.checked);
                updateMessagePreview();
            });
            
            // Handler para mudança do campo
            field.addEventListener('input', updateMessagePreview);
        }
    });
}

// Ativar/desativar campo baseado no checkbox
function toggleField(field, enabled) {
    if (enabled) {
        field.disabled = false;
        field.classList.remove('opacity-50');
        field.classList.add('focus:ring-2', 'focus:ring-blue-500');
    } else {
        field.disabled = true;
        field.classList.add('opacity-50');
        field.classList.remove('focus:ring-2', 'focus:ring-blue-500');
        field.value = ''; // Limpar campo quando desabilitado
    }
}

// ============================================================================
// CARREGAMENTO E PERSISTÊNCIA DE DADOS
// ============================================================================

// Carregar configuração da empresa e cabeçalho
async function loadCompanyHeader() {
    try {
        console.log('📥 Carregando configuração da empresa para clientId:', clientId);

        // Por enquanto, usar dados mock para desenvolvimento
        // TODO: Implementar API real quando backend estiver pronto
        const mockData = getMockCompanyHeader();

        companyHeaderConfig = mockData;
        console.log('✅ Configuração carregada (mock):', companyHeaderConfig);

        // Preencher formulário
        populateForm(companyHeaderConfig);

        // Atualizar preview
        updateMessagePreview();

    } catch (error) {
        console.error('❌ Erro ao carregar configuração:', error);
        showError('Erro ao carregar configuração: ' + error.message);

        // Usar dados padrão em caso de erro
        companyHeaderConfig = getDefaultCompanyHeader();
        populateForm(companyHeaderConfig);
    }
}

// Dados mock para desenvolvimento
function getMockCompanyHeader() {
    return {
        companyInfo: {
            name: 'Empresa Exemplo Ltda',
            description: 'Soluções inovadoras para seu negócio',
            website: 'https://www.empresaexemplo.com.br',
            phone: '(11) 99999-9999',
            email: 'contato@empresaexemplo.com.br',
            address: 'São Paulo, SP'
        },
        socialMedia: {
            instagram: '@empresaexemplo',
            facebook: 'facebook.com/empresaexemplo',
            linkedin: 'linkedin.com/company/empresaexemplo',
            whatsapp: '(11) 99999-9999'
        },
        headerConfig: {
            enabled: true,
            separator: '---',
            customText: 'Entre em contato conosco!'
        },
        // NOVA: Configuração de campos ativos
        activeFields: {
            description: true,
            website: true,
            phone: true,
            email: false,
            instagram: true,
            facebook: false,
            linkedin: false,
            whatsapp: true
        }
    };
}

// Dados padrão para novos clientes
function getDefaultCompanyHeader() {
    return {
        companyInfo: {
            name: '',
            description: '',
            website: '',
            phone: '',
            email: '',
            address: ''
        },
        socialMedia: {
            instagram: '',
            facebook: '',
            linkedin: '',
            whatsapp: ''
        },
        headerConfig: {
            enabled: true,
            separator: '---',
            customText: ''
        },
        // NOVA: Todos os campos desabilitados por padrão
        activeFields: {
            description: false,
            website: false,
            phone: false,
            email: false,
            instagram: false,
            facebook: false,
            linkedin: false,
            whatsapp: false
        }
    };
}

// Preencher formulário com dados
function populateForm(config) {
    if (!config) return;

    // Dados da empresa
    document.getElementById('companyName').value = config.companyInfo?.name || '';
    document.getElementById('businessDescription').value = config.companyInfo?.description || '';
    document.getElementById('website').value = config.companyInfo?.website || '';
    document.getElementById('phone').value = config.companyInfo?.phone || '';
    document.getElementById('email').value = config.companyInfo?.email || '';

    // Redes sociais
    document.getElementById('instagram').value = config.socialMedia?.instagram || '';
    document.getElementById('facebook').value = config.socialMedia?.facebook || '';
    document.getElementById('linkedin').value = config.socialMedia?.linkedin || '';
    document.getElementById('whatsappBusiness').value = config.socialMedia?.whatsapp || '';

    // Configuração do cabeçalho
    document.getElementById('headerEnabled').checked = config.headerConfig?.enabled || false;
    document.getElementById('separator').value = config.headerConfig?.separator || '---';
    document.getElementById('customText').value = config.headerConfig?.customText || '';

    // NOVA: Configurar checkboxes baseado nos campos ativos
    if (config.activeFields) {
        document.getElementById('includeDescription').checked = config.activeFields.description || false;
        document.getElementById('includeWebsite').checked = config.activeFields.website || false;
        document.getElementById('includePhone').checked = config.activeFields.phone || false;
        document.getElementById('includeEmail').checked = config.activeFields.email || false;
        document.getElementById('includeInstagram').checked = config.activeFields.instagram || false;
        document.getElementById('includeFacebook').checked = config.activeFields.facebook || false;
        document.getElementById('includeLinkedin').checked = config.activeFields.linkedin || false;
        document.getElementById('includeWhatsapp').checked = config.activeFields.whatsapp || false;

        // Aplicar estado dos campos
        Object.keys(fieldMappings).forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            const field = document.getElementById(fieldMappings[checkboxId]);
            if (checkbox && field) {
                toggleField(field, checkbox.checked);
            }
        });
    }
}

// ============================================================================
// SALVAMENTO E VALIDAÇÃO
// ============================================================================

// Salvar configuração da empresa e cabeçalho
async function saveCompanyHeader() {
    try {
        console.log('💾 Salvando configuração da empresa...');

        // Validar dados obrigatórios
        if (!validateCompanyData()) {
            return;
        }

        // Coletar dados do formulário
        const configData = collectFormData();
        console.log('📋 Dados coletados:', configData);

        // Por enquanto, salvar localmente (mock)
        // TODO: Implementar API real quando backend estiver pronto
        companyHeaderConfig = configData;

        // Salvar no localStorage para persistência
        localStorage.setItem('companyHeaderConfig', JSON.stringify(configData));

        showSuccess('✅ Configuração salva com sucesso!');

        // Atualizar preview
        updateMessagePreview();

        console.log('✅ Configuração salva com sucesso');

    } catch (error) {
        console.error('❌ Erro ao salvar configuração:', error);
        showError('Erro ao salvar configuração: ' + error.message);
    }
}

// Validar dados da empresa
function validateCompanyData() {
    const companyName = document.getElementById('companyName').value.trim();

    if (!companyName || companyName.length < 2) {
        showError('❌ Nome da empresa é obrigatório (mínimo 2 caracteres)');
        return false;
    }

    return true;
}

// Coletar dados do formulário
function collectFormData() {
    return {
        companyInfo: {
            name: document.getElementById('companyName').value.trim(),
            description: document.getElementById('businessDescription').value.trim(),
            website: document.getElementById('website').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            address: '' // TODO: Adicionar campo de endereço se necessário
        },
        socialMedia: {
            instagram: document.getElementById('instagram').value.trim(),
            facebook: document.getElementById('facebook').value.trim(),
            linkedin: document.getElementById('linkedin').value.trim(),
            whatsapp: document.getElementById('whatsappBusiness').value.trim()
        },
        headerConfig: {
            enabled: document.getElementById('headerEnabled').checked,
            separator: document.getElementById('separator').value.trim() || '---',
            customText: document.getElementById('customText').value.trim()
        },
        // NOVA: Coletar estado dos campos ativos
        activeFields: {
            description: document.getElementById('includeDescription').checked,
            website: document.getElementById('includeWebsite').checked,
            phone: document.getElementById('includePhone').checked,
            email: document.getElementById('includeEmail').checked,
            instagram: document.getElementById('includeInstagram').checked,
            facebook: document.getElementById('includeFacebook').checked,
            linkedin: document.getElementById('includeLinkedin').checked,
            whatsapp: document.getElementById('includeWhatsapp').checked
        }
    };
}

// Resetar configuração
function resetCompanyHeader() {
    if (confirm('🔄 Tem certeza que deseja resetar a configuração?')) {
        companyHeaderConfig = getDefaultCompanyHeader();
        populateForm(companyHeaderConfig);
        updateMessagePreview();
        showSuccess('✅ Configuração resetada');
    }
}

// ============================================================================
// PREVIEW E VISUALIZAÇÃO
// ============================================================================

// Configurar preview em tempo real
function setupRealTimePreview() {
    const inputs = [
        'companyName', 'businessDescription', 'website', 'phone', 'email',
        'instagram', 'facebook', 'linkedin', 'whatsappBusiness',
        'headerEnabled', 'separator', 'customText'
    ];

    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            if (element.type === 'checkbox') {
                element.addEventListener('change', updateMessagePreview);
            } else {
                element.addEventListener('input', updateMessagePreview);
            }
        }
    });
}

// Atualizar preview da mensagem
function updateMessagePreview() {
    const previewContainer = document.getElementById('messagePreview');
    if (!previewContainer) return;

    try {
        const headerContent = generateHeaderContent();
        const templateContent = getTemplateContent();

        let preview = '';

        // Adicionar cabeçalho se estiver ativado
        if (headerContent) {
            preview += headerContent + '\n\n';
        }

        // Adicionar separador
        if (headerContent && templateContent) {
            const separator = document.getElementById('separator').value || '---';
            preview += separator + '\n\n';
        }

        // Adicionar conteúdo do template
        if (templateContent) {
            preview += templateContent;
        }

        // Se não houver conteúdo, mostrar mensagem padrão
        if (!preview.trim()) {
            preview = 'Configure os dados da empresa para ver o preview da mensagem...';
        }

        previewContainer.innerHTML = preview.replace(/\n/g, '<br>');

    } catch (error) {
        console.error('❌ Erro ao gerar preview:', error);
        previewContainer.innerHTML = '<p class="text-red-400">Erro ao gerar preview</p>';
    }
}

// Gerar conteúdo do cabeçalho (NOVA LÓGICA FLEXÍVEL)
function generateHeaderContent() {
    const enabled = document.getElementById('headerEnabled').checked;
    if (!enabled) return '';

    const companyName = document.getElementById('companyName').value.trim();
    const description = document.getElementById('businessDescription').value.trim();
    const website = document.getElementById('website').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const instagram = document.getElementById('instagram').value.trim();
    const facebook = document.getElementById('facebook').value.trim();
    const linkedin = document.getElementById('linkedin').value.trim();
    const whatsapp = document.getElementById('whatsappBusiness').value.trim();
    const customText = document.getElementById('customText').value.trim();

    let header = '';

    // Nome da empresa (obrigatório)
    if (companyName) {
        header += `🏢 **${companyName}**\n`;
    }

    // Descrição (só se checkbox estiver ativo)
    if (document.getElementById('includeDescription').checked && description) {
        header += `📝 ${description}\n`;
    }

    // Informações de contato (só campos ativos)
    const contactInfo = [];
    if (document.getElementById('includeWebsite').checked && website) {
        contactInfo.push(`🌐 ${website}`);
    }
    if (document.getElementById('includePhone').checked && phone) {
        contactInfo.push(`📞 ${phone}`);
    }
    if (document.getElementById('includeEmail').checked && email) {
        contactInfo.push(`📧 ${email}`);
    }

    if (contactInfo.length > 0) {
        header += contactInfo.join(' | ') + '\n';
    }

    // Redes sociais (só campos ativos)
    const socialMedia = [];
    if (document.getElementById('includeInstagram').checked && instagram) {
        socialMedia.push(`📸 ${instagram}`);
    }
    if (document.getElementById('includeFacebook').checked && facebook) {
        socialMedia.push(`👍 ${facebook}`);
    }
    if (document.getElementById('includeLinkedin').checked && linkedin) {
        socialMedia.push(`💼 ${linkedin}`);
    }
    if (document.getElementById('includeWhatsapp').checked && whatsapp) {
        socialMedia.push(`💬 ${whatsapp}`);
    }

    if (socialMedia.length > 0) {
        header += socialMedia.join(' | ') + '\n';
    }

    // Texto personalizado
    if (customText) {
        header += `\n💡 ${customText}\n`;
    }

    return header.trim();
}

// Conteúdo do template (exemplo)
function getTemplateContent() {
    return `💬 **MENSAGEM DO TEMPLATE**
Olá {nome}, seja bem-vindo ao nosso programa de indicações!

🎁 **Oferta Especial**
Ganhe R$ 50 por cada indicação aprovada!

📞 **Fale Conosco**
WhatsApp: (11) 99999-9999`;
}

// Função de preview manual
function previewHeader() {
    updateMessagePreview();
    showSuccess('👁️ Preview atualizado!');
}

// ============================================================================
// HISTÓRICO DE MENSAGENS
// ============================================================================

// Carregar logs de atividade
async function loadActivityLogs() {
    try {
        const token = getToken();
        const url = `${window.API_BASE_URL}/whatsapp/client/messages`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            renderActivityLogs(data.data || []);
        } else {
            renderActivityLogs([]);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar logs:', error);
        renderActivityLogs([]);
    }
}

// Renderizar logs de atividade
function renderActivityLogs(logs) {
    const container = document.getElementById('activityLogs');
    if (!container) return;

    if (logs.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center">Nenhuma mensagem encontrada</p>';
        return;
    }

    const html = logs.map(message => `
        <div class="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
            <div class="flex-1">
                <p class="text-sm text-gray-200">${message.message || message.content?.body || 'Mensagem'}</p>
                <p class="text-xs text-gray-400 mt-1">${new Date(message.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            <div class="flex-shrink-0">
                <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(message.status)}">${message.status}</span>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// Obter cor do status
function getStatusColor(status) {
    switch (status) {
        case 'sent': return 'bg-green-500 text-green-100';
        case 'delivered': return 'bg-blue-500 text-blue-100';
        case 'failed': return 'bg-red-500 text-red-100';
        default: return 'bg-gray-500 text-gray-100';
    }
}

// Atualizar logs
async function refreshLogs() {
    await loadActivityLogs();
    showSuccess('🔄 Logs atualizados');
}

// ============================================================================
// UTILITÁRIOS E NOTIFICAÇÕES
// ============================================================================

// Mostrar notificação de sucesso
function showSuccess(message) {
    // TODO: Implementar notificação mais elegante
    alert('✅ ' + message);
}

// Mostrar notificação de erro
function showError(message) {
    // TODO: Implementar notificação mais elegante
    alert('❌ ' + message);
}

// ============================================================================
// EXPORTAÇÃO DE FUNÇÕES PARA HTML
// ============================================================================

// Funções expostas para o HTML
window.saveCompanyHeader = saveCompanyHeader;
window.resetCompanyHeader = resetCompanyHeader;
window.previewHeader = previewHeader;
window.refreshLogs = refreshLogs;

console.log('✅ WhatsApp Company Header Flexível carregado com sucesso!');
