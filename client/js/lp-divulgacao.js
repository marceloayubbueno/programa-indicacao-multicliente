// MVP: Listagem de LPs de Divulgação salvas pelo GrapesJS (apenas 1 por enquanto)

document.addEventListener('DOMContentLoaded', function() {
  renderLPDivulgacaoList();
  // Seleciona todos os formulários do bloco Hero c/ Cadastro
  document.querySelectorAll('form').forEach(function(form) {
    // Heurística: checa se o form tem campos name, email, phone (Hero c/ Cadastro)
    const hasHeroFields = form.querySelector('input[name="name"]') && form.querySelector('input[name="email"]') && form.querySelector('input[name="phone"]');
    if (!hasHeroFields) return;
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Remove mensagens antigas
      const oldMsg = form.parentNode.querySelector('.lp-success-message');
      if (oldMsg) oldMsg.remove();

      const leadName = form.querySelector('input[name="name"]').value.trim();
      const leadEmail = form.querySelector('input[name="email"]').value.trim();
      const leadPhone = form.querySelector('input[name="phone"]').value.trim();
      if (!leadName || !leadEmail || !leadPhone) {
        alert('Preencha todos os campos obrigatórios.');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/referrals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            referredName: leadName,
            referredEmail: leadEmail,
            referredPhone: leadPhone,
            referrerEmail: referrerEmail,
            source: 'lp-divulgacao',
            campaign: campaign
          })
        });
        const data = await res.json();
        if (data.success) {
          // Mensagem de sucesso na própria página
          const msg = document.createElement('div');
          msg.textContent = 'Envio concluído! Obrigado pela indicação.';
          msg.className = 'lp-success-message';
          msg.style = 'background: #d4edda; color: #155724; padding: 16px; border-radius: 8px; margin-top: 18px; text-align: center; font-weight: 600;';
          form.parentNode.insertBefore(msg, form.nextSibling);
          form.reset();
        } else {
          alert(data.message || 'Erro ao enviar indicação.');
        }
      } catch (err) {
        alert('Erro ao enviar indicação. Tente novamente.');
      }
    });
  });
});

function renderLPDivulgacaoList() {
  const tbody = document.getElementById('formsListBodyDivulgacao');
  tbody.innerHTML = '';
  const clientId = localStorage.getItem('clientId');
  if (!clientId) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-bullhorn"></i><h3>Não autenticado</h3><p>Faça login novamente para ver suas LPs de divulgação</p></td></tr>';
    return;
  }
  fetch(`${API_URL}/lp-divulgacao?clientId=${clientId}`)
    .then(response => response.json())
    .then(data => {
      lpDivulgacaoList = data.data || [];
      renderLPList();
    })
    .catch(error => {
      console.error('Erro ao carregar LPs:', error);
      showNotification('Erro ao carregar LPs de Divulgação', 'error');
    });
}

window.viewLPDivulgacao = function() {
  const html = localStorage.getItem('grapesLPDivulgacaoHtml');
  const css = localStorage.getItem('grapesLPDivulgacaoCss');
  if (!html || html.trim() === '') {
    alert('Nenhum conteúdo salvo na LP. Crie e salve uma LP no editor antes de visualizar.');
    return;
  }
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Preview LP de Divulgação</title>
    <link rel='stylesheet' href='https://unpkg.com/grapesjs/dist/css/grapes.min.css'>
    <style>body { background: #f5f6fa; } ${css || ''}</style>
    </head><body>${html}</body></html>`);
};

window.editLPDivulgacao = function(id) {
  // Redireciona para o editor com o id da LP
  window.location.href = `lp-editor-grapes-divulgacao.html?id=${id}&edit=true`;
};

window.deleteLPDivulgacao = function(id) {
  if (confirm('Tem certeza que deseja excluir esta LP?')) {
    fetch(`${API_URL}/lp-divulgacao/${id}`, {
      method: 'DELETE'
    })
      .then(res => {
        if (res.ok) {
          renderLPDivulgacaoList();
        } else {
          alert('Erro ao excluir a LP. Tente novamente.');
        }
      })
      .catch(() => {
        alert('Erro ao excluir a LP. Tente novamente.');
      });
  }
};

window.showEmbedCodeDivulgacao = function() {
  const html = localStorage.getItem('grapesLPDivulgacaoHtml');
  if (!html) return;
  const code = `<iframe srcdoc='${html.replace(/'/g, "&apos;")}' width="100%" height="600" frameborder="0"></iframe>`;
  document.getElementById('embedCodeViewDivulgacao').value = code;
  document.getElementById('embedCodeModalDivulgacao').style.display = 'block';
};

window.closeEmbedCodeModalDivulgacao = function() {
  document.getElementById('embedCodeModalDivulgacao').style.display = 'none';
};

window.copyEmbedCodeViewDivulgacao = function() {
  const textarea = document.getElementById('embedCodeViewDivulgacao');
  textarea.select();
    document.execCommand('copy');
  alert('Código copiado!');
};

// Função para alternar status da LP (Publicado/Rascunho)
window.toggleLPStatus = async function(lpId, currentStatus) {
  try {
    // Determinar ação baseada no status atual
    const action = currentStatus === 'published' ? 'unpublish' : 'publish';
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    // Feedback visual imediato - desabilitar botão
    const button = event.target.closest('button');
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i><span class="text-xs">Alterando...</span>';
    
    // Fazer requisição para o backend
    const response = await fetch(`${API_URL}/lp-divulgacao/${lpId}/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      // Sucesso - atualizar interface
      showNotification(
        `LP ${newStatus === 'published' ? 'publicada' : 'despublicada'} com sucesso!`, 
        'success'
      );
      
      // Recarregar a lista para mostrar o novo status
      renderLPDivulgacaoList();
      
    } else {
      // Erro - reverter botão e mostrar mensagem
      button.disabled = false;
      button.innerHTML = originalContent;
      
      const errorData = await response.json();
      showNotification(
        errorData.message || 'Erro ao alterar status da LP',
        'error'
      );
    }
    
  } catch (error) {
    // Erro de rede - reverter botão e mostrar mensagem
    button.disabled = false;
    button.innerHTML = originalContent;
    
    showNotification('Erro de conexão ao alterar status', 'error');
    console.error('Erro ao alternar status:', error);
  }
};

// Função para mostrar notificações
function showNotification(message, type = 'info') {
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
    type === 'success' ? 'bg-green-600 text-white' :
    type === 'error' ? 'bg-red-600 text-white' :
    'bg-blue-600 text-white'
  }`;
  
  notification.innerHTML = `
    <div class="flex items-center gap-2">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  // Adicionar ao DOM
  document.body.appendChild(notification);
  
  // Animar entrada
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);
  
  // Remover após 3 segundos
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}; 