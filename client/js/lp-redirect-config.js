// MVP: JS para configuração de redirecionamento/UTM da LP de divulgação

// 🔧 FUNÇÃO PARA OBTER API_URL
function getApiUrl() {
    return window.API_URL || 
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
           (window.location.hostname === 'localhost' ? 
            'http://localhost:3000/api' : 
            'https://programa-indicacao-multicliente-production.up.railway.app/api'));
}

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const lpId = urlParams.get('id');
  if (!lpId) {
    alert('ID da LP não encontrado. Volte e selecione uma LP.');
    window.location.href = 'lp-divulgacao.html';
    return;
  }

  console.log(`🔗 [UTM-CONFIG] Carregando configuração da LP: ${lpId}`);

  // 🆕 CARREGAR DADOS EXISTENTES DO BACKEND
  loadExistingConfig(lpId);

  document.getElementById('redirectUtmForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Coletar dados do formulário
    const data = {
      redirectUrl: document.getElementById('redirectUrl').value.trim(),
      utm_source: document.getElementById('utm_source').value.trim(),
      utm_medium: document.getElementById('utm_medium').value.trim(),
      utm_campaign: document.getElementById('utm_campaign').value.trim(),
      utm_content: document.getElementById('utm_content').value.trim(),
      utm_source_platform: document.getElementById('utm_source_platform').value.trim(),
      utm_creative_format: document.getElementById('utm_creative_format').value.trim(),
      utm_marketing_tactic: document.getElementById('utm_marketing_tactic').value.trim(),
      utm_term: document.getElementById('utm_term').value.trim(),
    };
    
    console.log('[UTM-CONFIG] Payload para salvar:', data);
    
    // Montar objeto utmParams para o backend
    const utmParams = {
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_content: data.utm_content,
      utm_source_platform: data.utm_source_platform,
      utm_creative_format: data.utm_creative_format,
      utm_marketing_tactic: data.utm_marketing_tactic,
      utm_term: data.utm_term
    };
    
    // 🆕 USAR ENDPOINT CORRETO
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('clientToken');
      
      console.log(`[UTM-CONFIG] Enviando para: ${apiUrl}/lp-divulgacao/${lpId}/redirect-config`);
      
      const response = await fetch(`${apiUrl}/lp-divulgacao/${lpId}/redirect-config`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          redirectUrl: data.redirectUrl, 
          utmParams 
        })
      });
      
      const result = await response.json();
      console.log('[UTM-CONFIG] Resposta do backend:', result);
      
      if (response.ok && result.success) {
        alert('Configuração salva com sucesso!');
        window.location.href = 'lp-divulgacao.html';
      } else {
        alert('Erro ao salvar configuração: ' + (result.message || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('[UTM-CONFIG] Erro ao salvar:', err);
      alert('Erro de conexão ao salvar configuração.');
    }
  });
});

// 🆕 FUNÇÃO PARA CARREGAR CONFIGURAÇÃO EXISTENTE
async function loadExistingConfig(lpId) {
  try {
    const apiUrl = getApiUrl();
    const token = localStorage.getItem('clientToken');
    
    console.log(`[UTM-CONFIG] Carregando configuração existente da LP: ${lpId}`);
    
    const response = await fetch(`${apiUrl}/lp-divulgacao/${lpId}/redirect-config`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('[UTM-CONFIG] Configuração carregada:', result);
      
      if (result.success && result.data) {
        const { redirectUrl, utmParams } = result.data;
        
        // Preencher campos do formulário
        if (redirectUrl) {
          document.getElementById('redirectUrl').value = redirectUrl;
        }
        
        if (utmParams) {
          document.getElementById('utm_source').value = utmParams.utm_source || '';
          document.getElementById('utm_medium').value = utmParams.utm_medium || '';
          document.getElementById('utm_campaign').value = utmParams.utm_campaign || '';
          document.getElementById('utm_content').value = utmParams.utm_content || '';
          document.getElementById('utm_source_platform').value = utmParams.utm_source_platform || '';
          document.getElementById('utm_creative_format').value = utmParams.utm_creative_format || '';
          document.getElementById('utm_marketing_tactic').value = utmParams.utm_marketing_tactic || '';
          document.getElementById('utm_term').value = utmParams.utm_term || '';
        }
        
        console.log('✅ [UTM-CONFIG] Formulário preenchido com dados existentes');
      }
    } else {
      console.log('ℹ️ [UTM-CONFIG] Nenhuma configuração encontrada, iniciando vazio');
    }
    
  } catch (error) {
    console.error('[UTM-CONFIG] Erro ao carregar configuração:', error);
    // Não bloquear o formulário se não conseguir carregar
  }
} 