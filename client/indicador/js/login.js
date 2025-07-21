// Lógica inicial de login do participante

document.getElementById('login-form').addEventListener('submit', async function(event) {
  event.preventDefault();
  // TODO: Implementar integração com backend
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  // Exemplo de validação básica
  if (!email || !password) {
    document.getElementById('login-error').textContent = 'Preencha todos os campos.';
    return;
  }
  // Placeholder para integração futura
  document.getElementById('login-error').textContent = '';
  alert('Login submetido (integração pendente)');
}); 