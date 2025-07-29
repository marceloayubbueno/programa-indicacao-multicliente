// Página de Sucesso - LP de Indicadores
// 🌍 CONFIGURAÇÃO DINÂMICA: usar config.js quando disponível
const API_URL = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
               (window.location.hostname === 'localhost' ? 
                'http://localhost:3000/api' : 
                'https://programa-indicacao-multicliente-production.up.railway.app/api');

// Dados carregados do indicador
let indicatorData = null;

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 [SUCCESS] Página de sucesso carregada');
    loadIndicatorData();
});

/**
 * Carregar dados do indicador a partir da URL
 */
async function loadIndicatorData() {
    console.log('📊 [SUCCESS] Iniciando carregamento dos dados...');
    
    try {
        // Buscar ID do participante na URL
        const urlParams = new URLSearchParams(window.location.search);
        const participantId = urlParams.get('id');
        
        if (!participantId) {
            throw new Error('ID do participante não encontrado na URL');
        }
        
        console.log('🆔 [SUCCESS] ID do participante:', participantId);
        
        // Fazer requisição para o backend
        showLoadingState();
        const response = await fetch(`${API_URL}/lp-indicadores/success/${participantId}`);
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Erro ao carregar dados do indicador');
        }
        
        indicatorData = result.data;
        console.log('✅ [SUCCESS] Dados carregados:', indicatorData);
        
        // Renderizar dados na página
        renderIndicatorData();
        showSuccessContent();
        
    } catch (error) {
        console.error('❌ [SUCCESS] Erro ao carregar dados:', error);
        showErrorState(error.message);
    }
}

/**
 * Renderizar dados do indicador na página
 */
function renderIndicatorData() {
    if (!indicatorData) return;
    
    const { indicator, campaign, landingPage } = indicatorData;
    
    // Nome do indicador
    const nameElement = document.getElementById('indicatorName');
    if (nameElement) {
        nameElement.textContent = indicator.name || 'Indicador';
    }
    
    // Informações da campanha
    const campaignInfoElement = document.getElementById('campaignInfo');
    if (campaignInfoElement && campaign) {
        campaignInfoElement.innerHTML = `Você está participando da campanha <strong>"${campaign.name}"</strong>. Compartilhe seu link exclusivo e comece a ganhar recompensas!`;
    }
    
    // Link de compartilhamento
    const linkElement = document.getElementById('referralLink');
    if (linkElement && indicator.referralLink) {
        linkElement.value = indicator.referralLink;
    }
    
    // Estatísticas
    updateStats(indicator);
    
    console.log('🎨 [SUCCESS] Interface atualizada com os dados do indicador');
}

/**
 * Atualizar estatísticas na interface
 */
function updateStats(indicator) {
    // Total de indicações
    const totalElement = document.getElementById('totalIndicacoes');
    if (totalElement) {
        animateNumber(totalElement, indicator.totalIndicacoes || 0);
    }
    
    // Indicações aprovadas
    const approvedElement = document.getElementById('indicacoesAprovadas');
    if (approvedElement) {
        animateNumber(approvedElement, indicator.indicacoesAprovadas || 0);
    }
    
    // Taxa de conversão
    const conversionElement = document.getElementById('conversionRate');
    if (conversionElement) {
        const total = indicator.totalIndicacoes || 0;
        const approved = indicator.indicacoesAprovadas || 0;
        const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
        animateNumber(conversionElement, rate);
    }
}

/**
 * Animar números com efeito de contagem
 */
function animateNumber(element, targetValue) {
    const startValue = 0;
    const duration = 1500;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function para animação suave
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutCubic);
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

/**
 * Copiar link de compartilhamento
 */
async function copyReferralLink() {
    const linkInput = document.getElementById('referralLink');
    const copyBtn = document.getElementById('copyLinkBtn');
    
    if (!linkInput || !copyBtn) return;
    
    try {
        // Selecionar e copiar o texto
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // Para mobile
        
        await navigator.clipboard.writeText(linkInput.value);
        
        // Feedback visual
        const originalText = copyBtn.innerHTML;
        const originalClass = copyBtn.className;
        
        copyBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Copiado!';
        copyBtn.className = originalClass.replace('bg-blue-600', 'bg-green-600').replace('hover:bg-blue-700', 'hover:bg-green-700');
        
        // Restaurar após 2 segundos
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.className = originalClass;
        }, 2000);
        
        console.log('📋 [SUCCESS] Link copiado para a área de transferência');
        
    } catch (error) {
        console.error('❌ [SUCCESS] Erro ao copiar link:', error);
        
        // Fallback para browsers mais antigos
        linkInput.select();
        document.execCommand('copy');
        
        // Mostrar feedback mesmo assim
        copyBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Copiado!';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy mr-2"></i>Copiar';
        }, 2000);
    }
}

/**
 * Compartilhar no WhatsApp
 */
function shareOnWhatsApp() {
    if (!indicatorData?.indicator?.referralLink) return;
    
    const message = encodeURIComponent(
        `🎉 Olá! Quero te indicar uma oportunidade incrível!\n\n` +
        `Acesse através do meu link exclusivo:\n${indicatorData.indicator.referralLink}\n\n` +
        `#indicacao #oportunidade`
    );
    
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    console.log('💬 [SUCCESS] Compartilhamento no WhatsApp iniciado');
}

/**
 * Compartilhar no Facebook
 */
function shareOnFacebook() {
    if (!indicatorData?.indicator?.referralLink) return;
    
    const shareUrl = encodeURIComponent(indicatorData.indicator.referralLink);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    
    console.log('👥 [SUCCESS] Compartilhamento no Facebook iniciado');
}

/**
 * Compartilhar no LinkedIn
 */
function shareOnLinkedIn() {
    if (!indicatorData?.indicator?.referralLink) return;
    
    const shareUrl = encodeURIComponent(indicatorData.indicator.referralLink);
    const title = encodeURIComponent('Indicação Especial');
    const summary = encodeURIComponent('Quero compartilhar esta oportunidade especial com você!');
    
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&title=${title}&summary=${summary}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
    
    console.log('💼 [SUCCESS] Compartilhamento no LinkedIn iniciado');
}

/**
 * Compartilhar no Twitter
 */
function shareOnTwitter() {
    if (!indicatorData?.indicator?.referralLink) return;
    
    const text = encodeURIComponent(
        `🎉 Quero compartilhar esta oportunidade incrível com vocês! Confiram: ${indicatorData.indicator.referralLink} #indicacao #oportunidade`
    );
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    
    console.log('🐦 [SUCCESS] Compartilhamento no Twitter iniciado');
}

/**
 * Ir para o dashboard
 */
function goToDashboard() {
    console.log('📊 [SUCCESS] Redirecionando para o dashboard...');
    window.location.href = 'https://app.virallead.com.br/indicador/login.html';
}

/**
 * Abrir modal de compartilhamento novamente
 */
function shareAgain() {
    // Scroll até a seção de compartilhamento
    const shareSection = document.querySelector('.mb-8 h4');
    if (shareSection) {
        shareSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight temporário na seção
        const parentDiv = shareSection.parentElement;
        if (parentDiv) {
            parentDiv.style.background = 'linear-gradient(45deg, #EBF8FF, #F0FFF4)';
            parentDiv.style.borderRadius = '12px';
            parentDiv.style.padding = '1rem';
            parentDiv.style.border = '2px solid #3B82F6';
            
            setTimeout(() => {
                parentDiv.style.background = '';
                parentDiv.style.border = '';
                parentDiv.style.padding = '';
            }, 3000);
        }
    }
    
    console.log('🔄 [SUCCESS] Foco direcionado para opções de compartilhamento');
}

/**
 * Estados da interface
 */
function showLoadingState() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('successContent').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showSuccessContent() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('successContent').classList.remove('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function showErrorState(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('successContent').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    
    const errorMessageElement = document.getElementById('errorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message || 'Erro desconhecido';
    }
}

/**
 * Utilitários
 */

// Gerar mensagem personalizada para compartilhamento
function generateShareMessage() {
    const { indicator, campaign } = indicatorData || {};
    
    let message = '🎉 Quero compartilhar uma oportunidade incrível com você!\n\n';
    
    if (campaign?.name) {
        message += `📢 ${campaign.name}\n\n`;
    }
    
    if (campaign?.description) {
        message += `${campaign.description}\n\n`;
    }
    
    message += `🔗 Acesse através do meu link exclusivo:\n${indicator?.referralLink || ''}\n\n`;
    message += `#indicacao #oportunidade`;
    
    return message;
}

// Debug: Expor função para teste
window.debugIndicatorData = () => {
    console.log('🔍 [DEBUG] Dados do indicador:', indicatorData);
    return indicatorData;
};

// Atalhos de teclado
document.addEventListener('keydown', function(event) {
    // Ctrl+C ou Cmd+C para copiar link
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && !event.target.matches('input')) {
        event.preventDefault();
        copyReferralLink();
    }
    
    // Escape para voltar
    if (event.key === 'Escape') {
        goToDashboard();
    }
});

// Analytics tracking (opcional)
function trackEvent(action, details = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: 'LP_Indicadores_Success',
            event_label: indicatorData?.indicator?.id || 'unknown',
            ...details
        });
    }
    
    console.log(`📈 [ANALYTICS] ${action}:`, details);
}

// Rastrear eventos importantes
document.addEventListener('DOMContentLoaded', function() {
    trackEvent('page_loaded');
});

// Expor funções globalmente para uso nos botões HTML
window.copyReferralLink = copyReferralLink;
window.shareOnWhatsApp = shareOnWhatsApp;
window.shareOnFacebook = shareOnFacebook;
window.shareOnLinkedIn = shareOnLinkedIn;
window.shareOnTwitter = shareOnTwitter;
window.goToDashboard = goToDashboard;
window.shareAgain = shareAgain; 