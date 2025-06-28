// Função global para submit do formulário de indicador (público)
window.submitIndicadorForm = async function(event, form) {
  event.preventDefault();
  const nameInput = form.querySelector('input[name="name"]');
  const emailInput = form.querySelector('input[name="email"]');
  const phoneInput = form.querySelector('input[name="phone"]') || form.querySelector('input[name="whatsapp"]');
  const companyInput = form.querySelector('input[name="company"]');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const company = companyInput ? companyInput.value.trim() : undefined;
  const lpId = localStorage.getItem('currentLpId');
  const clientId = localStorage.getItem('currentClientId');
  const feedback = form.querySelector('.lp-indicador-feedback');
  feedback.textContent = '';

  // Validação simples de e-mail no frontend
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    feedback.textContent = 'Por favor, informe um e-mail válido.';
    feedback.style.color = 'red';
    return false;
  }
  if (!name) {
    feedback.textContent = 'Por favor, informe seu nome.';
    feedback.style.color = 'red';
    return false;
  }
  if (!phone) {
    feedback.textContent = 'Por favor, informe seu telefone.';
    feedback.style.color = 'red';
    return false;
  }
  if (!lpId) {
    feedback.textContent = 'Erro: dados de contexto não encontrados. Recarregue a página.';
    feedback.style.color = 'red';
    return false;
  }
  if (!clientId) {
    feedback.textContent = 'Erro: dados do cliente não encontrados. Recarregue a página.';
    feedback.style.color = 'red';
    return false;
  }
  // Captura dados de origem
  const urlParams = new URL(window.location.href).searchParams;
  const utmSource = urlParams.get('utm_source') || '';
  const utmMedium = urlParams.get('utm_medium') || '';
  const utmCampaign = urlParams.get('utm_campaign') || '';
  const utmTerm = urlParams.get('utm_term') || '';
  const utmContent = urlParams.get('utm_content') || '';
  const referrerUrl = document.referrer;
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const payload = {
    name, email, phone, company, lpId,
    utmSource, utmMedium, utmCampaign, utmTerm, utmContent,
    referrerUrl, userAgent, language
  };
  try {
    // 🌍 USAR CONFIGURAÇÃO DINÂMICA
    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                  (window.location.hostname === 'localhost' ? 
                   'http://localhost:3000/api' : 
                   'https://programa-indicacao-multicliente-production.up.railway.app/api');
    const response = await fetch(`${apiUrl}/lp-indicadores/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (response.ok && result.success) {
      // 🆕 NOVA FUNCIONALIDADE: Redirecionar para página de sucesso
      const participantId = result.participantId || result.data?._id;
      if (participantId) {
        console.log('✅ [LP-FORM] Redirecionando para página de sucesso com ID:', participantId);
        window.location.href = `lp-indicadores-success.html?id=${participantId}`;
      } else {
        feedback.textContent = 'Cadastro realizado com sucesso!';
        feedback.style.color = 'green';
        form.reset();
      }
    } else {
      feedback.textContent = result.message || 'Erro ao cadastrar indicador.';
      feedback.style.color = 'red';
    }
  } catch (err) {
    feedback.textContent = 'Erro de conexão. Tente novamente.';
    feedback.style.color = 'red';
  }
  return false;
};

// Função global para associar o submit ao formulário
window.bindIndicadorForms = function() {
  document.querySelectorAll('.lp-indicador-form').forEach(form => {
    form.onsubmit = function(event) { return window.submitIndicadorForm(event, form); };
  });
}; 