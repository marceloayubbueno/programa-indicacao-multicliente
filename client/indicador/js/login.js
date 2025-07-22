// Lógica inicial de login do participante

const API_BASE = '/indicator-auth';

document.getElementById('login-form').addEventListener('submit', async function(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');
  if (!email || !password) {
    errorEl.textContent = 'Preencha todos os campos.';
    return;
  }
  errorEl.textContent = '';
  try {
    const res = await fetch(API_BASE + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem('indicator_token', data.token);
      window.location.href = 'dashboard.html';
    } else {
      errorEl.textContent = data.message || 'Falha no login. Verifique suas credenciais.';
    }
  } catch (e) {
    errorEl.textContent = 'Erro de conexão. Tente novamente.';
  }
}); 