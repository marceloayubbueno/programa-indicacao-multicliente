// MVP: JS para configuração de redirecionamento/UTM da LP de divulgação

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const lpId = urlParams.get('id');
  if (!lpId) {
    alert('ID da LP não encontrado. Volte e selecione uma LP.');
    window.location.href = 'lp-divulgacao.html';
    return;
  }

  // Mock: carregar dados do localStorage (ajustar para backend depois)
  const savedData = JSON.parse(localStorage.getItem('lpRedirectUtm_' + lpId) || '{}');
  document.getElementById('redirectUrl').value = savedData.redirectUrl || '';
  document.getElementById('utm_source').value = savedData.utm_source || '';
  document.getElementById('utm_medium').value = savedData.utm_medium || '';
  document.getElementById('utm_campaign').value = savedData.utm_campaign || '';
  document.getElementById('utm_content').value = savedData.utm_content || '';
  document.getElementById('utm_source_platform').value = savedData.utm_source_platform || '';
  document.getElementById('utm_creative_format').value = savedData.utm_creative_format || '';
  document.getElementById('utm_marketing_tactic').value = savedData.utm_marketing_tactic || '';
  document.getElementById('utm_term').value = savedData.utm_term || '';

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
    // Log do payload
    console.log('[CONFIG] Payload para salvar UTM/redirecionamento:', data);
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
    // Enviar para o backend (PUT)
    try {
      // 🌍 USAR CONFIGURAÇÃO DINÂMICA
      const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                    (window.location.hostname === 'localhost' ? 
                     'http://localhost:3000/api' : 
                     'https://programa-indicacao-multicliente-production.up.railway.app/api');
      const response = await fetch(`${apiUrl}/landing-pages/redirect-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectUrl: data.redirectUrl, utmParams })
      });
      const result = await response.json();
      console.log('[CONFIG] Resposta do backend ao salvar:', result);
      if (response.ok && result.success) {
        alert('Configuração salva com sucesso!');
        window.location.href = 'lp-divulgacao.html';
      } else {
        alert('Erro ao salvar configuração: ' + (result.message || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('[CONFIG] Erro ao salvar configuração no backend:', err);
      alert('Erro de conexão ao salvar configuração.');
    }
  });
}); 