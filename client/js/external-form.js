// Carregar listas disponíveis
async function loadLists() {
    try {
        const token = localStorage.getItem('clientToken');
        const response = await fetch('http://localhost:5501/api/lists', {
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
            <form id="indicatorForm" onsubmit="return false;">
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
        
        const formData = {
            name: form.querySelector('#name').value,
            email: form.querySelector('#email').value,
            telefone: form.querySelector('#phone').value,
            empresa: form.querySelector('#company')?.value,
            cargo: form.querySelector('#position')?.value,
            departamento: form.querySelector('#department')?.value,
            linkedin: form.querySelector('#linkedin')?.value,
            listaId: '${selectedList}'
        };

        try {
            const response = await fetch('http://localhost:5501/api/participants/external', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('${successMessage}');
                form.reset();
            } else {
                const data = await response.json();
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
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888;">Nenhum formulário cadastrado.</td></tr>';
        return;
    }
    forms.forEach(form => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${form.name}</td>
            <td>${formatDate(form.createdAt)}</td>
            <td>${form.status}</td>
            <td>
                <button class="btn-table" title="Editar" onclick="editForm('${form.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-table" title="Excluir" onclick="confirmDeleteForm('${form.id}')"><i class="fas fa-trash"></i></button>
                <button class="btn-table" title="Código de Incorporação" onclick="showEmbedCode('${form.id}')"><i class="fas fa-code"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editForm(id) {
    window.location.href = 'external-form-edit.html?id=' + encodeURIComponent(id);
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

document.addEventListener('DOMContentLoaded', renderFormsList);

// MVP: Listagem de LPs salvas pelo GrapesJS (apenas 1 por enquanto)

document.addEventListener('DOMContentLoaded', function() {
  renderLPList();
});

function renderLPList() {
  const tbody = document.getElementById('formsListBody');
  tbody.innerHTML = '';
  const html = localStorage.getItem('grapesLPHtml');
  const css = localStorage.getItem('grapesLPCss');
  if (!html) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888;">Nenhuma LP cadastrada.</td></tr>';
    return;
  }
  // Simulação de dados
  const name = 'LP de Indicadores';
  const createdAt = localStorage.getItem('grapesLPCreatedAt') || new Date().toLocaleString('pt-BR');
  const status = 'Ativo';
  tbody.innerHTML = `
    <tr>
      <td>${name}</td>
      <td>${createdAt}</td>
      <td>${status}</td>
      <td>
        <button class="btn-table" title="Visualizar" onclick="viewLP()"><i class="fas fa-eye"></i></button>
        <button class="btn-table" title="Excluir" onclick="deleteLP()"><i class="fas fa-trash"></i></button>
        <button class="btn-table" title="Código de Incorporação" onclick="showEmbedCode()"><i class="fas fa-code"></i></button>
      </td>
    </tr>
  `;
}

window.viewLP = function() {
  const html = localStorage.getItem('grapesLPHtml');
  const css = localStorage.getItem('grapesLPCss');
  if (!html || html.trim() === '') {
    alert('Nenhum conteúdo salvo na LP. Crie e salve uma LP no editor antes de visualizar.');
    return;
  }
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Preview LP</title>
    <link rel='stylesheet' href='https://unpkg.com/grapesjs/dist/css/grapes.min.css'>
    <style>body { background: #f5f6fa; } ${css || ''}</style>
    </head><body>${html}</body></html>`);
};

window.deleteLP = function() {
  if (confirm('Tem certeza que deseja excluir esta LP?')) {
    localStorage.removeItem('grapesLPHtml');
    localStorage.removeItem('grapesLPCss');
    localStorage.removeItem('grapesLPCreatedAt');
    renderLPList();
  }
};

window.showEmbedCode = function() {
  const html = localStorage.getItem('grapesLPHtml');
  if (!html) return;
  const code = `<iframe srcdoc='${html.replace(/'/g, "&apos;")}' width="100%" height="600" frameborder="0"></iframe>`;
  document.getElementById('embedCodeView').value = code;
  document.getElementById('embedCodeModal').style.display = 'block';
};

window.closeEmbedCodeModal = function() {
  document.getElementById('embedCodeModal').style.display = 'none';
};

window.copyEmbedCodeView = function() {
  const textarea = document.getElementById('embedCodeView');
  textarea.select();
  document.execCommand('copy');
  alert('Código copiado!');
}; 