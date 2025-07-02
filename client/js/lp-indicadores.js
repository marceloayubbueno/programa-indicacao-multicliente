// ===== FUNÇÕES PRINCIPAIS =====

// Função para alternar status da LP de Indicadores (Publicado/Rascunho)
window.toggleLPIndicadoresStatus = async function(event, lpId, currentStatus) {
  let originalContent = '';
  
  try {
    // Determinar ação baseada no status atual
    const action = currentStatus === 'published' ? 'unpublish' : 'publish';
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    // Feedback visual imediato - desabilitar botão
    const button = event.target.closest('button');
    
    if (!button) {
      showNotificationIndicadores('Erro: Botão não encontrado', 'error');
      return;
    }
    
    originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i><span class="text-xs">Alterando...</span>';
    
    // Fazer requisição para o backend
    // 🌍 USAR CONFIGURAÇÃO DINÂMICA
    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                  (window.location.hostname === 'localhost' ? 
                   'http://localhost:3000/api' : 
                   'https://programa-indicacao-multicliente-production.up.railway.app/api');
    const response = await fetch(`${apiUrl}/lp-indicadores/${lpId}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      // Sucesso - atualizar interface
      showNotificationIndicadores(
        `LP ${newStatus === 'published' ? 'publicada' : 'despublicada'} com sucesso!`, 
        'success'
      );
      
      // Recarregar a lista para mostrar o novo status
      loadLPsFromBackend();
      
    } else {
      // Erro - reverter botão e mostrar mensagem
      button.disabled = false;
      button.innerHTML = originalContent;
      
      const errorData = await response.json();
      showNotificationIndicadores(
        errorData.message || 'Erro ao alterar status da LP',
        'error'
      );
    }
    
  } catch (error) {
    // Erro de rede - reverter botão e mostrar mensagem
    const button = event && event.target ? event.target.closest('button') : null;
    if (button) {
      button.disabled = false;
      button.innerHTML = originalContent;
    }
    
    showNotificationIndicadores('Erro de conexão ao alterar status', 'error');
    console.error('Erro ao alternar status:', error);
  }
};

// Função para mostrar notificações específica para LP de Indicadores
function showNotificationIndicadores(message, type = 'info') {
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
}

// ===== INÍCIO DAS FUNÇÕES EXISTENTES =====

// Carregar listas disponíveis
async function loadLists() {
    try {
        const token = localStorage.getItem('clientToken');
        // 🌍 USAR CONFIGURAÇÃO DINÂMICA
        const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                      (window.location.hostname === 'localhost' ? 
                       'http://localhost:3000/api' : 
                       'https://programa-indicacao-multicliente-production.up.railway.app/api');
        const response = await fetch(`${apiUrl}/lists`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar listas');
        }

        const { listas } = await response.json();
        const selectList = document.getElementById('selectList');
        
        // Limpar opções existentes
        selectList.innerHTML = '<option value="">Selecione uma lista...</option>';
        
        // Adicionar apenas listas ativas
        listas.filter(list => list.status === 'active')
            .forEach(list => {
                const option = document.createElement('option');
                option.value = list._id;
                option.textContent = list.nome;
                selectList.appendChild(option);
            });

        updateFormPreview();
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao carregar listas', 'error');
    }
}

// Atualizar a pré-visualização do formulário
function updateFormPreview() {
    const selectedList = document.getElementById('selectList').value;
    const formTitle = document.getElementById('formTitle').value;
    const successMessage = document.getElementById('successMessage').value;
    const submitButtonText = document.getElementById('submitButtonText').value;
    
    // Campos visíveis
    const showCompany = document.getElementById('showCompany').checked;
    const showPosition = document.getElementById('showPosition').checked;
    const showDepartment = document.getElementById('showDepartment').checked;
    const showLinkedin = document.getElementById('showLinkedin').checked;
    
    // Cores
    const primaryColor = document.getElementById('primaryColor').value;
    const textColor = document.getElementById('textColor').value;
    const backgroundColor = document.getElementById('backgroundColor').value;
    const borderColor = document.getElementById('borderColor').value;

    // Atualiza previews de cores
    document.getElementById('primaryColorPreview').style.backgroundColor = primaryColor;
    document.getElementById('textColorPreview').style.backgroundColor = textColor;
    document.getElementById('backgroundColorPreview').style.backgroundColor = backgroundColor;
    document.getElementById('borderColorPreview').style.backgroundColor = borderColor;

    const formHtml = `
        <div class="external-form" style="background-color: ${backgroundColor}; color: ${textColor}; border: 1px solid ${borderColor}; padding: 20px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: ${primaryColor}; margin-bottom: 20px;">${formTitle}</h2>
            <form id="indicatorForm" class="lp-indicador-form" onsubmit="return false;">
                <div class="form-group">
                    <label for="name">Nome Completo:*</label>
                    <input type="text" id="name" name="name" required placeholder="Digite seu nome completo"
                           style="border: 1px solid ${borderColor}; color: ${textColor};">
                </div>
                <div class="form-group">
                    <label for="email">E-mail:*</label>
                    <input type="email" id="email" name="email" required placeholder="Digite seu e-mail"
                           style="border: 1px solid ${borderColor}; color: ${textColor};">
                </div>
                <div class="form-group">
                    <label for="phone">Telefone:*</label>
                    <input type="tel" id="phone" name="phone" required placeholder="(00) 00000-0000"
                           style="border: 1px solid ${borderColor}; color: ${textColor};">
                </div>
                ${showCompany ? `
                <div class="form-group">
                    <label for="company">Empresa:*</label>
                    <input type="text" id="company" name="company" required placeholder="Digite o nome da empresa"
                           style="border: 1px solid ${borderColor}; color: ${textColor};">
                </div>` : ''}
                ${showPosition ? `
                <div class="form-group">
                    <label for="position">Cargo:</label>
                    <input type="text" id="position" name="position" placeholder="Digite seu cargo"
                           style="border: 1px solid ${borderColor}; color: ${textColor};">
                </div>` : ''}
                ${showDepartment ? `
                <div class="form-group">
                    <label for="department">Departamento:</label>
                    <input type="text" id="department" name="department" placeholder="Digite seu departamento"
                           style="border: 1px solid ${borderColor}; color: ${textColor};">
                </div>` : ''}
                ${showLinkedin ? `
                <div class="form-group">
                    <label for="linkedin">LinkedIn:</label>
                    <input type="url" id="linkedin" name="linkedin" placeholder="Cole o link do seu perfil"
                           style="border: 1px solid ${borderColor}; color: ${textColor};">
                </div>` : ''}
                <button type="submit" style="background-color: ${primaryColor}; color: white; border: none; padding: 10px 20px; cursor: pointer;">
                    ${submitButtonText}
                </button>
            </form>
        </div>
    `;

    const embedCode = `
<div id="indicator-form-container"></div>
<script>
(function() {
    const container = document.getElementById('indicator-form-container');
    container.innerHTML = \`${formHtml}\`;
    
    // Adiciona máscara ao telefone
    const phoneInput = container.querySelector('#phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                if (value.length <= 2) {
                    value = value.replace(/^(\d{0,2})/, '($1');
                } else if (value.length <= 7) {
                    value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
                } else {
                    value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                }
                e.target.value = value;
            }
        });
    }

    // Adiciona handler de submit
    const form = container.querySelector('#indicatorForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('[LP-PUBLIC] Iniciando submit do formulário de indicador');
        const formData = {
            nome: form.querySelector('#name').value,
            email: form.querySelector('#email').value,
            telefone: form.querySelector('#phone').value,
            empresa: form.querySelector('#company')?.value,
            cargo: form.querySelector('#position')?.value,
            departamento: form.querySelector('#department')?.value,
            linkedin: form.querySelector('#linkedin')?.value,
            listaId: \`${selectedList}\`
        };

        try {
            // 🌍 URL DINÂMICA PARA EMBED CODE
            const apiUrl = window.location.hostname === 'localhost' ? 
                           'http://localhost:3000/api' : 
                           'https://programa-indicacao-multicliente-production.up.railway.app/api';
            const response = await fetch(`${apiUrl}/participants/external`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log('[LP-PUBLIC] Resposta da API:', data);
            if (response.ok) {
                // Se a API retornar um ID de participante, logar e preparar para redirecionamento
                if (data && (data.participantId || data._id || (data.data && data.data._id))) {
                    const participantId = data.participantId || data._id || (data.data && data.data._id);
                    const url = \`https://programa-indicacao-multicliente.vercel.app/client/pages/lp-indicadores-success.html?id=${participantId}\`;
                    console.log('[LP-PUBLIC] Cadastro realizado, redirecionando para:', url);
                    // window.location.href = url; // Descomentar para ativar redirecionamento real
                } else {
                    alert('${successMessage}');
                }
                form.reset();
            } else {
                throw new Error(data.message || 'Erro ao enviar formulário');
            }
        } catch (error) {
            alert(error.message || 'Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.');
        }
    });
})();
</script>`;

    document.getElementById('formPreview').innerHTML = formHtml;
    document.getElementById('embedCode').value = embedCode;

    // Adiciona máscara ao telefone no preview
    const phoneInput = document.querySelector('#formPreview #phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                if (value.length <= 2) {
                    value = value.replace(/^(\d{0,2})/, '($1');
                } else if (value.length <= 7) {
                    value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
                } else {
                    value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                }
                e.target.value = value;
            }
        });
    }
}

// Função de máscara para telefone
function maskPhone(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    input.value = value;
}

// Copiar código de incorporação
function copyEmbedCode() {
    const embedCode = document.getElementById('embedCode').value;
    navigator.clipboard.writeText(embedCode).then(() => {
        showNotification('Código copiado com sucesso!', 'success');
    }).catch(() => {
        showNotification('Erro ao copiar código', 'error');
    });
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Inicializar a página
document.addEventListener('DOMContentLoaded', () => {
    loadLists();
    
    // Atualizar preview quando qualquer configuração mudar
    const configInputs = document.querySelectorAll('input, select');
    configInputs.forEach(input => {
        input.addEventListener('change', updateFormPreview);
    });
});

// Utilidades para manipular formulários no localStorage
function getForms() {
    return JSON.parse(localStorage.getItem('indicatorForms') || '[]');
}

function saveForms(forms) {
    localStorage.setItem('indicatorForms', JSON.stringify(forms));
}

function deleteForm(id) {
    const forms = getForms().filter(f => f.id !== id);
    saveForms(forms);
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
}

function renderFormsList() {
    const forms = getForms();
    const tbody = document.getElementById('formsListBody');
    tbody.innerHTML = '';
    if (!forms.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-clipboard-list"></i><h3>Nenhuma LP cadastrada</h3><p>Crie sua primeira LP de indicadores para começar</p></td></tr>';
        return;
    }
    forms.forEach(form => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${form.name}</td>
            <td>${formatDate(form.createdAt)}</td>
            <td><span class="status-badge ${form.status === 'Ativo' ? 'active' : 'inactive'}">${form.status}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon edit" title="Editar" onclick="editForm('${form.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" title="Excluir" onclick="confirmDeleteForm('${form.id}')"><i class="fas fa-trash"></i></button>
                    <button class="btn-icon view" title="Código de Incorporação" onclick="showEmbedCode('${form.id}')"><i class="fas fa-code"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editForm(id) {
    window.location.href = 'lp-indicadores-edit.html?id=' + encodeURIComponent(id);
}

function confirmDeleteForm(id) {
    if (confirm('Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita.')) {
        deleteForm(id);
        renderFormsList();
    }
}

function showEmbedCode(id) {
    const code = `<iframe src="https://seusite.com/formulario-indicador.html?id=${id}" width="100%" height="600" frameborder="0"></iframe>`;
    document.getElementById('embedCodeView').value = code;
    document.getElementById('embedCodeModal').style.display = 'block';
}

function closeEmbedCodeModal() {
    document.getElementById('embedCodeModal').style.display = 'none';
}

function copyEmbedCodeView() {
    const textarea = document.getElementById('embedCodeView');
    textarea.select();
    document.execCommand('copy');
    alert('Código copiado!');
}

// document.addEventListener('DOMContentLoaded', renderFormsList); // COMENTADO: Função substituída por loadLPsFromBackend

// MVP: Listagem de LPs salvas pelo GrapesJS (apenas 1 por enquanto)

// NOVO: Carregar LPs do backend e renderizar na tabela
async function loadLPsFromBackend() {
  console.log('[DEBUG-LP] 🚀 Iniciando loadLPsFromBackend');
  
  const tbody = document.getElementById('formsListBody');
  tbody.innerHTML = '';
  
  const clientId = localStorage.getItem('clientId');
  const token = localStorage.getItem('clientToken');
  
  // 🔐 LOGS DE AUTENTICAÇÃO
  console.log('[DEBUG-LP] 🔐 ClientId:', clientId);
  console.log('[DEBUG-LP] 🎫 Token existe:', !!token);
  console.log('[DEBUG-LP] 🎫 Token (primeiros 20 chars):', token?.substring(0, 20));
  
  if (!clientId || !token) {
    console.log('[DEBUG-LP] ❌ Erro de autenticação: clientId ou token ausentes');
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Erro de autenticação. Faça login novamente.</td></tr>';
    return;
  }
  
  try {
    // 🌍 LOGS DE CONFIGURAÇÃO DA API
    console.log('[DEBUG-LP] 🌐 Window.location.hostname:', window.location.hostname);
    console.log('[DEBUG-LP] 🔧 APP_CONFIG existe:', !!window.APP_CONFIG);
    console.log('[DEBUG-LP] 🔧 APP_CONFIG.API_URL:', window.APP_CONFIG?.API_URL);
    
    // 🌍 USAR CONFIGURAÇÃO DINÂMICA
    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                  (window.location.hostname === 'localhost' ? 
                   'http://localhost:3000/api' : 
                   'https://programa-indicacao-multicliente-production.up.railway.app/api');
                   
    console.log('[DEBUG-LP] 📡 URL da API definida:', apiUrl);
    console.log('[DEBUG-LP] 📤 Fazendo requisição para:', `${apiUrl}/lp-indicadores?clientId=${clientId}`);
    
    const response = await fetch(`${apiUrl}/lp-indicadores?clientId=${clientId}` , {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('[DEBUG-LP] 📨 Resposta HTTP status:', response.status);
    console.log('[DEBUG-LP] 📨 Resposta HTTP ok:', response.ok);
    
    if (!response.ok) {
      console.log('[DEBUG-LP] ❌ Resposta não OK, tentando ler erro...');
      const errorText = await response.text();
      console.log('[DEBUG-LP] ❌ Erro da API:', errorText);
      throw new Error('Erro ao buscar LPs');
    }
    
    const data = await response.json();
    console.log('[DEBUG-LP] 📦 Dados recebidos completos:', data);
    console.log('[DEBUG-LP] 📋 data.data existe:', !!data.data);
    console.log('[DEBUG-LP] 📋 data.data.length:', data.data?.length);
    console.log('[DEBUG-LP] 📋 Primeiro item:', data.data?.[0]);
    
    const lps = data.data || [];
    console.log('[DEBUG-LP] 📋 LPs processadas:', lps.length);
    
    if (!lps.length) {
      console.log('[DEBUG-LP] ⚠️ Nenhuma LP encontrada, mostrando estado vazio');
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-clipboard-list"></i><h3>Nenhuma LP cadastrada</h3><p>Crie sua primeira LP de indicadores para começar</p></td></tr>';
      return;
    }
    console.log('[DEBUG-LP] 🎨 Iniciando renderização das LPs na tabela');
    lps.forEach((lp, index) => {
      console.log(`[DEBUG-LP] 🎯 Renderizando LP ${index + 1}:`, {
        id: lp._id,
        name: lp.name,
        status: lp.status,
        createdAt: lp.createdAt
      });
      
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-800 transition-colors';
      const safeName = encodeURIComponent(lp.name || '');
      
      // Status toggle button
      const statusToggle = `
        <div class="flex items-center gap-2">
          <button 
            onclick="toggleLPIndicadoresStatus(event, '${lp._id}', '${lp.status}')" 
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
        
      // Contador de visualizações (exemplo)
      const viewCount = lp.views || Math.floor(Math.random() * 100);
      
      tr.innerHTML = `
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-clipboard-list text-blue-400"></i>
            </div>
            <div>
              <div class="font-medium text-gray-200">${lp.name || 'Sem nome'}</div>
              <div class="text-xs text-gray-400 flex items-center gap-2 mt-1">
                <span><i class="fas fa-eye mr-1"></i>${viewCount} visualizações</span>
                ${lp.formSubmissions ? `<span><i class="fas fa-user-check mr-1"></i>${lp.formSubmissions} cadastros</span>` : ''}
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
                    onclick="setCurrentLPContext('${lp._id}', decodeURIComponent('${safeName}')); window.open('lp-preview.html?id=${lp._id}','_blank')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-green-400 hover:text-green-300" 
                    title="Editar" 
                    onclick="window.location.href='lp-editor-grapes.html?id=${lp._id}'">
              <i class="fas fa-edit"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-purple-400 hover:text-purple-300" 
                    title="Código de Incorporação" 
                    onclick="showEmbedCodeBackend('${lp._id}')">
              <i class="fas fa-code"></i>
            </button>
            <button class="p-1.5 rounded hover:bg-gray-700 transition-colors text-red-400 hover:text-red-300" 
                    title="Excluir" 
                    onclick="deleteLPBackend('${lp._id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
    console.log('[DEBUG-LP] ✅ Renderização das LPs concluída com sucesso');
  } catch (err) {
    console.log('[DEBUG-LP] ❌ Erro no catch:', err);
    console.log('[DEBUG-LP] ❌ Erro message:', err.message);
    console.log('[DEBUG-LP] ❌ Erro stack:', err.stack);
    tbody.innerHTML = `<tr><td colspan='4' class='empty-state'>Erro ao carregar LPs: ${err.message}</td></tr>`;
  }
}

// Excluir LP do backend
window.deleteLPBackend = async function(id) {
  if (!confirm('Tem certeza que deseja excluir esta LP?')) return;
  const token = localStorage.getItem('clientToken');
  try {
            // 🌍 USAR CONFIGURAÇÃO DINÂMICA
        const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                      (window.location.hostname === 'localhost' ? 
                       'http://localhost:3000/api' : 
                       'https://programa-indicacao-multicliente-production.up.railway.app/api');
        const response = await fetch(`${apiUrl}/lp-indicadores/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Erro ao excluir LP');
    loadLPsFromBackend();
  } catch (err) {
    alert('Erro ao excluir LP: ' + err.message);
  }
};

// Mostrar código de incorporação
window.showEmbedCodeBackend = function(id) {
  const code = `<iframe src='https://seusite.com/lp/indicadores/${id}' width="100%" height="600" frameborder="0"></iframe>`;
  document.getElementById('embedCodeView').value = code;
  document.getElementById('embedCodeModal').style.display = 'block';
};

// Substituir chamada antiga por nova
// document.addEventListener('DOMContentLoaded', renderLPList);
document.addEventListener('DOMContentLoaded', () => {
  console.log('[DEBUG-LP] 🎬 DOMContentLoaded executado - inicializando página LP Indicadores');
  loadLPsFromBackend();
});

// Funções utilitárias para LP de Indicadores

// Ao visualizar uma LP de Indicadores, defina os dados de contexto no localStorage
window.setCurrentLPContext = function(lpId, lpName) {
  localStorage.setItem('currentLpId', lpId);
  localStorage.setItem('currentLpName', lpName);
};

// Garante que qualquer formulário com a classe .lp-indicador-form use o submit global
function bindIndicadorForms() {
  document.querySelectorAll('.lp-indicador-form').forEach(form => {
    form.onsubmit = function(event) { return window.submitIndicadorForm(event, form); };
  });
}

// Garante que qualquer formulário com a classe .lp-indicador-form use o submit global
// (Removida referência à função renderPreview que não existe)

// (Funções movidas para o topo do arquivo) 
console.log('Versão LP Indicadores: 20240607'); 