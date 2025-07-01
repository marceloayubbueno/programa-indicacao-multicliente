// Função principal para submeter formulário de referral da LP de Divulgação
window.submitReferralForm = async function(event, form) {
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
      const finalApiUrl = window.API_URL || 
                         (window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                         (window.location.hostname === 'localhost' ? 
                          'http://localhost:3000/api' : 
                          'https://programa-indicacao-multicliente-production.up.railway.app/api'));
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
    
    const finalApiUrl = window.API_URL || 
                       (window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                       (window.location.hostname === 'localhost' ? 
                        'http://localhost:3000/api' : 
                        'https://programa-indicacao-multicliente-production.up.railway.app/api'));
    const fullUrl = `${finalApiUrl}/lp-divulgacao/submit-referral`;
    console.log('🔍 URL da requisição:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
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
      if (feedback) { 
        feedback.textContent = result.message || 'Erro ao enviar indicação.'; 
        feedback.style.color = 'red'; 
      }
    }
  } catch (err) {
    console.error('💥 [REFERRAL-FORM] Erro de conexão:', err);
    if (feedback) { 
      feedback.textContent = 'Erro de conexão. Tente novamente.'; 
      feedback.style.color = 'red'; 
    }
  }
  return false;
};

// === FUNÇÃO PARA AUTO-BIND DOS FORMULÁRIOS ===

window.bindReferralForms = function() {
  console.log('🔗 [REFERRAL-FORM] Executando bindReferralForms...');
  const forms = document.querySelectorAll('.lp-referral-form, form[data-type="referral"], form');
  console.log(`📋 [REFERRAL-FORM] Formulários encontrados: ${forms.length}`);
  
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

console.log('✅ [REFERRAL-FORM] Script carregado e pronto'); 