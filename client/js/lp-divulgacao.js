// MVP: Listagem de LPs de Divulgação salvas pelo GrapesJS (apenas 1 por enquanto)

// 🔧 CORREÇÃO: Função para obter API_URL de forma segura (similar ao rewards.js)
function getApiUrl() {
    return window.API_URL || 
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
           (window.location.hostname === 'localhost' ? 
            'http://localhost:3000/api' : 
            'https://programa-indicacao-multicliente-production.up.railway.app/api'));
}

// 🔧 CORREÇÃO: Variável global para armazenar lista de LPs
let lpDivulgacaoList = [];

document.addEventListener('DOMContentLoaded', function() {
  console.log('📊 [LP-DIV] Página carregada, inicializando...');
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
        const API_URL = getApiUrl(); // 🔧 CORREÇÃO: usar função getApiUrl()
        const token = localStorage.getItem('clientToken'); // 🔧 CORREÇÃO: clientToken
        const referrerEmail = localStorage.getItem('referrerEmail') || '';
        const campaign = localStorage.getItem('campaign') || '';
        
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
        console.error('❌ [LP-DIV] Erro ao enviar indicação:', err);
        alert('Erro ao enviar indicação. Tente novamente.');
      }
    });
  });
});

function renderLPDivulgacaoList() {
  console.log('🔍 [LP-DIV] Carregando LPs de divulgação...');
  const tbody = document.getElementById('formsListBodyDivulgacao');
  if (!tbody) {
    console.error('❌ [LP-DIV] Elemento formsListBodyDivulgacao não encontrado!');
    return;
  }
  
  tbody.innerHTML = '';
  const clientId = localStorage.getItem('clientId');
  const token = localStorage.getItem('clientToken'); // 🔧 CORREÇÃO: clientToken
  
  if (!clientId) {
    console.error('❌ [LP-DIV] ClientId não encontrado');
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-bullhorn"></i><h3>Não autenticado</h3><p>Faça login novamente para ver suas LPs de divulgação</p></td></tr>';
    return;
  }
  
  const API_URL = getApiUrl(); // 🔧 CORREÇÃO: usar função getApiUrl()
  console.log(`🔗 [LP-DIV] Fazendo requisição para: ${API_URL}/lp-divulgacao?clientId=${clientId}`);
  
  fetch(`${API_URL}/lp-divulgacao?clientId=${clientId}`, {
    headers: {
      'Authorization': `Bearer ${token}` // 🔧 CORREÇÃO: adicionar autenticação
    }
  })
    .then(response => {
      console.log(`📡 [LP-DIV] Status da resposta: ${response.status}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('📊 [LP-DIV] Dados recebidos:', data);
      lpDivulgacaoList = data.data || data || [];
      console.log(`✅ [LP-DIV] ${lpDivulgacaoList.length} LPs carregadas`);
      renderLPList(); // 🔧 CORREÇÃO: chamar função de renderização
    })
    .catch(error => {
      console.error('❌ [LP-DIV] Erro ao carregar LPs:', error);
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>Erro ao carregar</h3><p>Erro: ' + error.message + '</p></td></tr>';
      showNotification('Erro ao carregar LPs de Divulgação: ' + error.message, 'error');
    });
}

// 🆕 FUNÇÃO RENDERIZAR LISTA (que estava faltando)
function renderLPList() {
  console.log(`🎨 [LP-DIV] Renderizando ${lpDivulgacaoList.length} LPs na tabela`);
  const tbody = document.getElementById('formsListBodyDivulgacao');
  
  if (!lpDivulgacaoList || lpDivulgacaoList.length === 0) {
    console.log('📝 [LP-DIV] Nenhuma LP encontrada, mostrando mensagem vazia');
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><div class="text-center py-12"><div class="text-gray-400 text-xl mb-4"><i class="fas fa-bullhorn fa-3x"></i></div><p class="text-gray-300 text-lg">Nenhuma LP de Divulgação criada</p><p class="text-gray-500 text-sm mt-2">Clique em "Nova LP de Divulgação" para começar.</p></div></td></tr>';
    return;
  }
  
  tbody.innerHTML = lpDivulgacaoList.map((lp, index) => {
    console.log(`🔍 [LP-DIV] LP ${index}:`, lp);
    
    // Status toggle button
    const statusToggle = `
      <div class="flex items-center gap-2">
        <button 
          onclick="toggleLPStatus('${lp._id || lp.id}', '${lp.status || 'draft'}')" 
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            lp.status === 'published' 
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
          }"
          title="Clique para ${lp.status === 'published' ? 'despublicar' : 'publicar'}"
        >
          <i class="fas ${lp.status === 'published' ? 'fa-eye' : 'fa-eye-slash'} text-xs"></i>
          <span class="text-xs font-medium">${lp.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
        </button>
      </div>
    `;
    
    return `
      <tr class="hover:bg-gray-800 transition-colors">
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-bullhorn text-purple-400"></i>
            </div>
            <div>
              <div class="font-medium text-gray-200">${lp.name || lp.title || 'Sem nome'}</div>
              <div class="text-xs text-gray-400 mt-1">
                <span><i class="fas fa-eye mr-1"></i>${lp.views || 0} visualizações</span>
              </div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="text-sm text-gray-300">
            <i class="fas fa-calendar text-gray-400 mr-1"></i>
            ${lp.createdAt ? new Date(lp.createdAt).toLocaleDateString('pt-BR') : '-'}
          </div>
        </td>
        <td class="px-4 py-3">${statusToggle}</td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-1">
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-blue-400 hover:text-blue-300" 
                    title="Visualizar" 
                    onclick="window.open('lp-preview-divulgacao.html?id=${lp._id || lp.id}','_blank')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-green-400 hover:text-green-300" 
                    title="Editar" 
                    onclick="editLPDivulgacao('${lp._id || lp.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-purple-400 hover:text-purple-300" 
                    title="Código de Incorporação" 
                    onclick="showEmbedCodeDivulgacao('${lp._id || lp.id}')">
              <i class="fas fa-code"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-red-400 hover:text-red-300" 
                    title="Excluir" 
                    onclick="deleteLPDivulgacao('${lp._id || lp.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  console.log('✅ [LP-DIV] Lista renderizada com sucesso!');
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