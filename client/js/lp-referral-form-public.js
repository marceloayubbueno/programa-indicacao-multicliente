// [LOG DIAGNÓSTICO] Início do script
console.log('[DEBUG] APP_CONFIG:', window.APP_CONFIG);
if (!window.APP_CONFIG) {
  console.error('[ERRO CRÍTICO] window.APP_CONFIG está undefined! Verifique se config.js foi carregado corretamente.');
}
console.log('[DEBUG] Location:', window.location.href, 'Base:', window.location.origin);

// Função principal para submeter formulário de referral da LP de Divulgação
window.submitReferralForm = async function(event, form) {
  // === DIAGNOSIS H1: Config e inicialização ===
  console.log('[DIAGNOSIS-H1] 🚀 === INÍCIO submitReferralForm ===');
  console.log('[DIAGNOSIS-H1] window.APP_CONFIG:', window.APP_CONFIG);
  console.log('[DIAGNOSIS-H1] window.API_URL:', window.API_URL);
  console.log('[DIAGNOSIS-H1] document carregado?:', document.readyState);
  
  console.log('📝 [REFERRAL-FORM] Iniciando submit do formulário de referral');
  event.preventDefault();

  const feedback = form.querySelector('.feedback') || form.querySelector('[class*="feedback"]');
  
  // Capturar dados do formulário
  const formData = new FormData(form);
  const name = formData.get('name') || '';
  const email = formData.get('email') || '';
  const phone = formData.get('phone') || '';
  const company = formData.get('company') || '';

  console.log('📋 [REFERRAL-FORM] Dados do formulário:', { name, email, phone, company });

  // Validação básica
  if (!name || !email) {
    const message = 'Por favor, preencha nome e e-mail.';
    console.warn('⚠️ [REFERRAL-FORM] Validação falhou:', message);
    if (feedback) { 
      feedback.textContent = message; 
      feedback.style.color = 'red'; 
    }
    return false;
  }

  // Buscar ID da LP
  const lpId = localStorage.getItem('currentLpDivulgacaoId');
  console.log('🆔 [REFERRAL-FORM] ID da LP:', lpId);
  
  if (!lpId) {
    console.error('❌ [REFERRAL-FORM] ID da LP não encontrado no localStorage');
    console.log('[DIAGNOSIS-H1] localStorage atual:', {
      currentLpDivulgacaoId: localStorage.getItem('currentLpDivulgacaoId'),
      currentIndicatorCode: localStorage.getItem('currentIndicatorCode'),
      currentIndicatorName: localStorage.getItem('currentIndicatorName')
    });
    if (feedback) { 
      feedback.textContent = 'Erro: Contexto da LP não encontrado.'; 
      feedback.style.color = 'red'; 
    }
    return false;
  }

  // 🆕 NOVO: Buscar informações do indicador do localStorage
  const indicatorCode = localStorage.getItem('currentIndicatorCode');
  const indicatorName = localStorage.getItem('currentIndicatorName');
  
  console.log('👤 [REFERRAL-FORM] Informações do Indicador:', {
    indicatorCode,
    indicatorName
  });

  // Tentar buscar utmParams do backend primeiro, depois fallback para localStorage
  let utmParams = {};
  if (lpId) {
    try {
      // Tenta buscar do backend
      console.log('🌐 [REFERRAL-FORM] Buscando UTM params do backend...');
      
      // === DIAGNOSIS H2: URL da API ===
      const finalApiUrl = window.API_URL || 
                         (window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                         (window.location.hostname === 'localhost' ? 
                          'http://localhost:3000/api' : 
                          'https://programa-indicacao-multicliente-production.up.railway.app/api'));
      
      console.log('[DIAGNOSIS-H2] === URL CONSTRUCTION DEBUG ===');
      console.log('[DIAGNOSIS-H2] window.API_URL:', window.API_URL);
      console.log('[DIAGNOSIS-H2] window.APP_CONFIG:', window.APP_CONFIG);
      console.log('[DIAGNOSIS-H2] window.location.hostname:', window.location.hostname);
      console.log('[DIAGNOSIS-H2] hostname === localhost:', window.location.hostname === 'localhost');
      console.log('[DIAGNOSIS-H2] finalApiUrl construída:', finalApiUrl);
      
      const res = await fetch(`${finalApiUrl}/lp-divulgacao/${lpId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.data && data.data.utmParams) {
          utmParams = data.data.utmParams;
          console.log('✅ [REFERRAL-FORM] UTM params do backend:', utmParams);
        } else {
          console.log('ℹ️ [REFERRAL-FORM] UTM params não encontrados no backend:', data);
        }
      }
    } catch (e) {
      console.warn('⚠️ [REFERRAL-FORM] Erro ao buscar UTM do backend, usando localStorage');
      console.log('[DIAGNOSIS-H2] Erro na requisição:', e.message);
      console.log('[DIAGNOSIS-H2] Stack trace:', e.stack);
      // fallback para localStorage
      const local = localStorage.getItem('lpRedirectUtm_' + lpId);
      if (local) {
        utmParams = JSON.parse(local);
        console.log('📦 [REFERRAL-FORM] UTM params do localStorage:', utmParams);
      } else {
        console.log('ℹ️ [REFERRAL-FORM] UTM params não encontrados no localStorage');
      }
    }
  }
  
  console.log('🎯 [REFERRAL-FORM] UTM params final:', utmParams);

  // Captura dados de origem (UTM, referrer, userAgent, etc)
  const urlParams = new URL(window.location.href).searchParams;
  const utmSource = urlParams.get('utm_source') || '';
  const utmMedium = urlParams.get('utm_medium') || '';
  const utmCampaign = urlParams.get('utm_campaign') || '';
  const utmTerm = urlParams.get('utm_term') || '';
  const utmContent = urlParams.get('utm_content') || '';
  const referrerUrl = document.referrer;
  const userAgent = navigator.userAgent;
  const language = navigator.language;

  // === ATUALIZADO: Capturar código do indicador da URL OU localStorage ===
  const indicatorCodeFromUrl = urlParams.get('ref') || '';
  const finalIndicatorCode = indicatorCodeFromUrl || indicatorCode || '';
  
  console.log('🔗 [REFERRAL-FORM] Código do indicador (URL vs localStorage):', {
    fromUrl: indicatorCodeFromUrl,
    fromStorage: indicatorCode,
    final: finalIndicatorCode
  });
  
  if (finalIndicatorCode) {
    console.log('✅ [REFERRAL-FORM] Código do indicador detectado:', finalIndicatorCode);
  } else {
    console.log('ℹ️ [REFERRAL-FORM] Nenhum código de indicador encontrado');
  }

  // Monta payload com código do indicador
  const payload = {
    name, email, phone, company, lpId,
    utmParams,
    referrerUrl, userAgent, language,
    // === CAMPOS ATUALIZADOS ===
    indicatorCode: finalIndicatorCode || null,
    indicatorName: indicatorName || null
  };
  
  console.log('📦 [REFERRAL-FORM] Payload completo para envio:', payload);

  try {
    console.log('🚀 [REFERRAL-FORM] Enviando requisição para o backend...');
    
    // === DIAGNOSIS H2: URL final da requisição ===
    const finalApiUrl = window.API_URL || 
                       (window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                       (window.location.hostname === 'localhost' ? 
                        'http://localhost:3000/api' : 
                        'https://programa-indicacao-multicliente-production.up.railway.app/api'));
    const fullUrl = `${finalApiUrl}/lp-divulgacao/submit-referral`;
    
    console.log('[DIAGNOSIS-H2] === REQUISIÇÃO FINAL DEBUG ===');
    console.log('[DIAGNOSIS-H2] finalApiUrl:', finalApiUrl);
    console.log('[DIAGNOSIS-H2] fullUrl final:', fullUrl);
    console.log('[DIAGNOSIS-H2] payload stringify length:', JSON.stringify(payload).length);
    console.log('[DIAGNOSIS-H2] payload stringified:', JSON.stringify(payload));
    
    console.log('🔍 URL da requisição:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log('[DIAGNOSIS-H2] Response status:', response.status);
    console.log('[DIAGNOSIS-H2] Response ok:', response.ok);
    console.log('[DIAGNOSIS-H2] Response headers:', Object.fromEntries(response.headers));
    
    console.log('📥 Response status:', response.status);
    
    const result = await response.json();
    console.log('📥 [REFERRAL-FORM] Resposta do backend:', result);
    
    if (response.ok && result.success) {
      console.log('✅ [REFERRAL-FORM] Formulário enviado com sucesso!');
      if (feedback) { 
        feedback.textContent = 'Envio concluído! Obrigado pela indicação.'; 
        feedback.style.color = 'green'; 
      }
      form.reset();
      
      // Buscar redirectUrl da LP e redirecionar se existir
      try {
        console.log('🔍 [REFERRAL-FORM] Verificando URL de redirecionamento...');
        const res = await fetch(`${finalApiUrl}/lp-divulgacao/${lpId}`);
        if (res.ok) {
          const data = await res.json();
          const redirectUrl = data && data.data && data.data.redirectUrl;
          console.log('🎯 [REFERRAL-FORM] URL de redirecionamento:', redirectUrl);
          
          if (redirectUrl) {
            // Montar URL com UTMs se existirem
            let url = redirectUrl;
            if (utmParams && Object.keys(utmParams).length > 0) {
              const params = new URLSearchParams(utmParams).toString();
              url += (url.includes('?') ? '&' : '?') + params;
            }
            console.log('🚀 [REFERRAL-FORM] Redirecionando para:', url);
            window.location.href = url;
            return;
          }
        }
      } catch (e) {
        console.warn('⚠️ [REFERRAL-FORM] Erro ao buscar URL de redirecionamento:', e);
      }
    } else {
      console.error('❌ [REFERRAL-FORM] Erro na resposta do backend:', result);
      console.log('[DIAGNOSIS-H2] Response text raw:', await response.clone().text());
      if (feedback) { 
        feedback.textContent = result.message || 'Erro ao enviar indicação.'; 
        feedback.style.color = 'red'; 
      }
    }
  } catch (err) {
    console.error('💥 [REFERRAL-FORM] Erro de conexão:', err);
    console.log('[DIAGNOSIS-H2] === ERRO DE REQUISIÇÃO ===');
    console.log('[DIAGNOSIS-H2] Error message:', err.message);
    console.log('[DIAGNOSIS-H2] Error stack:', err.stack);
    console.log('[DIAGNOSIS-H2] Error name:', err.name);
    console.log('[DIAGNOSIS-H2] Network connectivity test...');
    
    // Teste de conectividade básico
    try {
      const testResponse = await fetch('https://google.com', { mode: 'no-cors' });
      console.log('[DIAGNOSIS-H2] Internet connectivity: OK');
    } catch (testErr) {
      console.log('[DIAGNOSIS-H2] Internet connectivity: FAILED');
    }
    
    if (feedback) { 
      feedback.textContent = 'Erro de conexão. Tente novamente.'; 
      feedback.style.color = 'red'; 
    }
  }
  return false;
};

// === FUNÇÃO PARA AUTO-BIND DOS FORMULÁRIOS ===

window.bindReferralForms = function() {
  console.log('[DIAGNOSIS-H1] 🔗 Executando bindReferralForms...');
  console.log('[DIAGNOSIS-H1] document.readyState:', document.readyState);
  console.log('[DIAGNOSIS-H1] DOM elements count:', document.querySelectorAll('*').length);
  
  console.log('🔗 [REFERRAL-FORM] Executando bindReferralForms...');
  const forms = document.querySelectorAll('.lp-referral-form, form[data-type="referral"], form');
  console.log(`📋 [REFERRAL-FORM] Formulários encontrados: ${forms.length}`);
  
  console.log('[DIAGNOSIS-H1] Forms details:');
  forms.forEach((form, index) => {
    console.log(`[DIAGNOSIS-H1] Form ${index + 1}:`, {
      tagName: form.tagName,
      className: form.className,
      id: form.id,
      hasOnSubmit: !!form.onsubmit,
      children: form.children.length
    });
  });
  
  forms.forEach((form, index) => {
    console.log(`🔧 [REFERRAL-FORM] Configurando formulário ${index + 1}:`, form);
    
    if (!form.onsubmit) {
      form.onsubmit = function(event) {
        console.log(`📝 [REFERRAL-FORM] Submit interceptado do formulário ${index + 1}`);
        return window.submitReferralForm(event, form);
      };
      console.log(`✅ [REFERRAL-FORM] Formulário ${index + 1} configurado`);
    } else {
      console.log(`ℹ️ [REFERRAL-FORM] Formulário ${index + 1} já possui handler`);
    }
  });
};

// Auto-bind quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.bindReferralForms);
} else {
  window.bindReferralForms();
}

console.log('[DIAGNOSIS-H1] ✅ Script lp-referral-form-public.js carregado e pronto'); 
console.log('[DIAGNOSIS-H1] Timestamp:', new Date().toISOString()); 