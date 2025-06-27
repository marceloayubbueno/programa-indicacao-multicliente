// Gerenciamento de estado
let templates = JSON.parse(localStorage.getItem('formTemplates')) || [];
let currentTemplate = null;
let isEditing = false;

// Funções de manipulação de templates
function showNewTemplateModal() {
    isEditing = false;
    currentTemplate = null;
    document.getElementById('templateModalTitle').textContent = 'Nova Landing Page';
    document.getElementById('templateForm').reset();
    document.getElementById('fieldList').innerHTML = '';
    document.getElementById('templateModal').style.display = 'block';
}

function closeTemplateModal() {
    document.getElementById('templateModal').style.display = 'none';
}

function addNewField() {
    const fieldList = document.getElementById('fieldList');
    const fieldId = `field_${Date.now()}`;
    
    const fieldHtml = `
        <div class="field-item" data-field-id="${fieldId}">
            <div class="field-content">
                <input type="text" placeholder="Nome do Campo" class="field-name-input">
                <select class="field-type-select">
                    <option value="text">Texto</option>
                    <option value="email">Email</option>
                    <option value="tel">Telefone</option>
                    <option value="number">Número</option>
                    <option value="textarea">Área de Texto</option>
                    <option value="select">Lista de Seleção</option>
                    <option value="radio">Botões de Opção</option>
                    <option value="checkbox">Caixas de Seleção</option>
                </select>
            </div>
            <div class="field-controls">
                <label class="field-required">
                    <input type="checkbox"> Obrigatório
                </label>
                <i class="fas fa-grip-vertical field-handle"></i>
                <button type="button" class="btn-field-remove" onclick="removeField('${fieldId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    fieldList.insertAdjacentHTML('beforeend', fieldHtml);
    initializeSortable();
}

function removeField(fieldId) {
    const field = document.querySelector(`[data-field-id="${fieldId}"]`);
    field.remove();
}

function handleImageUpload(input, previewId) {
    const preview = document.getElementById(previewId);
    const file = input.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            preview.nextElementSibling.style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
}

function saveTemplate() {
    const form = document.getElementById('templateForm');
    const fieldList = document.getElementById('fieldList');
    const fields = [];
    
    // Coleta os campos do formulário
    fieldList.querySelectorAll('.field-item').forEach(fieldItem => {
        fields.push({
            id: fieldItem.dataset.fieldId,
            name: fieldItem.querySelector('.field-name-input').value,
            type: fieldItem.querySelector('.field-type-select').value,
            required: fieldItem.querySelector('.field-required input').checked
        });
    });
    
    // Coleta os elementos da landing page
    const landingElements = {
        logo: document.getElementById('logoPreview').src,
        mainTitle: {
            text: document.getElementById('mainTitle').value,
            font: document.getElementById('titleFont').value,
            size: document.getElementById('titleSize').value,
            color: document.getElementById('titleColor').value
        },
        subtitle: {
            text: document.getElementById('subtitle').value,
            font: document.getElementById('subtitleFont').value,
            size: document.getElementById('subtitleSize').value,
            color: document.getElementById('subtitleColor').value
        },
        highlightText: document.getElementById('highlightText').value,
        featureImage: document.getElementById('featureImagePreview').src,
        layout: document.querySelector('input[name="layout"]:checked')?.value || 'side-by-side'
    };
    
    const template = {
        id: isEditing ? currentTemplate.id : Date.now(),
        name: document.getElementById('templateName').value,
        description: document.getElementById('templateDescription').value,
        theme: document.getElementById('formTheme').value,
        width: document.getElementById('formWidth').value,
        fields: fields,
        landingElements: landingElements,
        customColors: document.getElementById('formTheme').value === 'custom' ? {
            primary: document.getElementById('primaryColor').value,
            background: document.getElementById('backgroundColor').value
        } : null
    };
    
    if (isEditing) {
        const index = templates.findIndex(t => t.id === template.id);
        templates[index] = template;
    } else {
        templates.push(template);
    }
    
    localStorage.setItem('formTemplates', JSON.stringify(templates));
    loadTemplates();
    closeTemplateModal();
}

function editTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    isEditing = true;
    currentTemplate = template;
    
    document.getElementById('templateModalTitle').textContent = 'Editar Landing Page';
    document.getElementById('templateName').value = template.name;
    document.getElementById('templateDescription').value = template.description;
    document.getElementById('formTheme').value = template.theme;
    document.getElementById('formWidth').value = template.width;
    
    // Carregar elementos da landing page
    if (template.landingElements) {
        if (template.landingElements.logo) {
            document.getElementById('logoPreview').src = template.landingElements.logo;
            document.getElementById('logoPreview').style.display = 'block';
            document.getElementById('logoPreview').nextElementSibling.style.display = 'none';
        }
        
        document.getElementById('mainTitle').value = template.landingElements.mainTitle.text;
        document.getElementById('titleFont').value = template.landingElements.mainTitle.font;
        document.getElementById('titleSize').value = template.landingElements.mainTitle.size;
        document.getElementById('titleColor').value = template.landingElements.mainTitle.color;
        
        document.getElementById('subtitle').value = template.landingElements.subtitle.text;
        document.getElementById('subtitleFont').value = template.landingElements.subtitle.font;
        document.getElementById('subtitleSize').value = template.landingElements.subtitle.size;
        document.getElementById('subtitleColor').value = template.landingElements.subtitle.color;
        
        document.getElementById('highlightText').value = template.landingElements.highlightText;
        
        if (template.landingElements.featureImage) {
            document.getElementById('featureImagePreview').src = template.landingElements.featureImage;
            document.getElementById('featureImagePreview').style.display = 'block';
            document.getElementById('featureImagePreview').nextElementSibling.style.display = 'none';
        }
        
        const layoutInput = document.querySelector(`input[name="layout"][value="${template.landingElements.layout}"]`);
        if (layoutInput) layoutInput.checked = true;
    }
    
    // Carregar campos do formulário
    const fieldList = document.getElementById('fieldList');
    fieldList.innerHTML = '';
    
    template.fields.forEach(field => {
        const fieldHtml = `
            <div class="field-item" data-field-id="${field.id}">
                <div class="field-content">
                    <input type="text" placeholder="Nome do Campo" class="field-name-input" value="${field.name}">
                    <select class="field-type-select">
                        ${getFieldTypeOptions(field.type)}
                    </select>
                </div>
                <div class="field-controls">
                    <label class="field-required">
                        <input type="checkbox" ${field.required ? 'checked' : ''}> Obrigatório
                    </label>
                    <i class="fas fa-grip-vertical field-handle"></i>
                    <button type="button" class="btn-field-remove" onclick="removeField('${field.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        fieldList.insertAdjacentHTML('beforeend', fieldHtml);
    });
    
    if (template.theme === 'custom' && template.customColors) {
        document.getElementById('customColors').style.display = 'block';
        document.getElementById('primaryColor').value = template.customColors.primary;
        document.getElementById('backgroundColor').value = template.customColors.background;
    }
    
    document.getElementById('templateModal').style.display = 'block';
    initializeSortable();
}

function duplicateTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    const newTemplate = {
        ...template,
        id: Date.now(),
        name: `${template.name} (Cópia)`,
        fields: template.fields.map(field => ({...field, id: `field_${Date.now()}_${field.id}`}))
    };
    
    templates.push(newTemplate);
    localStorage.setItem('formTemplates', JSON.stringify(templates));
    loadTemplates();
}

function deleteTemplate(templateId) {
    if (!confirm('Tem certeza que deseja excluir este modelo?')) return;
    
    templates = templates.filter(t => t.id !== templateId);
    localStorage.setItem('formTemplates', JSON.stringify(templates));
    loadTemplates();
}

function getTemplateCode(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Abrir o modal
    const modal = document.getElementById('templateCodeModal');
    modal.style.display = 'block';

    // Gerar o código HTML
    const code = generateHtmlCode(template);
    
    // Exibir o código gerado
    const codePreview = document.querySelector('.code-content pre');
    codePreview.textContent = code;
}

function generateHtmlCode(template) {
    let html = `<form class="form-template" method="POST">\n`;
    
    template.fields.forEach(field => {
        const required = field.required ? 'required' : '';
        const requiredClass = field.required ? 'required' : '';
        
        html += `    <div class="form-group">\n`;
        html += `        <label class="${requiredClass}" for="${field.id}">${field.name}</label>\n`;
        
        switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'number':
                html += `        <input type="${field.type}" id="${field.id}" name="${field.id}" ${required}>\n`;
                break;
            case 'textarea':
                html += `        <textarea id="${field.id}" name="${field.id}" rows="3" ${required}></textarea>\n`;
                break;
            case 'select':
                html += `        <select id="${field.id}" name="${field.id}" ${required}>\n`;
                html += `            <option value="">Selecione uma opção</option>\n`;
                if (field.options) {
                    field.options.forEach(option => {
                        html += `            <option value="${option}">${option}</option>\n`;
                    });
                }
                html += `        </select>\n`;
                break;
            case 'radio':
                if (field.options) {
                    field.options.forEach((option, index) => {
                        html += `        <div class="radio-option">\n`;
                        html += `            <input type="radio" id="${field.id}_${index}" name="${field.id}" value="${option}" ${required}>\n`;
                        html += `            <label for="${field.id}_${index}">${option}</label>\n`;
                        html += `        </div>\n`;
                    });
                }
                break;
            case 'checkbox':
                if (field.options) {
                    field.options.forEach((option, index) => {
                        html += `        <div class="checkbox-option">\n`;
                        html += `            <input type="checkbox" id="${field.id}_${index}" name="${field.id}[]" value="${option}">\n`;
                        html += `            <label for="${field.id}_${index}">${option}</label>\n`;
                        html += `        </div>\n`;
                    });
                }
                break;
        }
        
        html += `    </div>\n`;
    });
    
    html += `    <button type="submit">Enviar</button>\n`;
    html += `</form>`;
    
    return html;
}

function copyTemplateCode() {
    const codePreview = document.querySelector('.code-content pre');
    navigator.clipboard.writeText(codePreview.textContent)
        .then(() => {
            alert('Código copiado para a área de transferência!');
        })
        .catch(err => {
            console.error('Erro ao copiar código:', err);
            alert('Erro ao copiar código. Por favor, tente novamente.');
        });
}

function testTemplateCode() {
    const codePreview = document.querySelector('.code-content pre');
    const code = codePreview.textContent;
    
    // Criar uma nova janela com o código
    const win = window.open('', '_blank');
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Visualização do Template</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    padding: 20px;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                }
                input, select, textarea {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .radio-option, .checkbox-option {
                    margin: 5px 0;
                }
                .radio-option input, .checkbox-option input {
                    width: auto;
                    margin-right: 8px;
                }
                .radio-option label, .checkbox-option label {
                    display: inline;
                }
                button {
                    background: #3498db;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:hover {
                    background: #2980b9;
                }
                .required:after {
                    content: " *";
                    color: red;
                }
            </style>
        </head>
        <body>
            <h2>Visualização do Formulário</h2>
            ${code}
        </body>
        </html>
    `);
    win.document.close();
}

function closeTemplateCodeModal() {
    const modal = document.getElementById('templateCodeModal');
    modal.style.display = 'none';
}

// Fechar o modal quando clicar no X ou fora dele
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('templateCodeModal');
    const closeBtn = modal.querySelector('.close-modal');

    // Fechar quando clicar no X
    closeBtn.onclick = function() {
        closeTemplateCodeModal();
    }

    // Fechar quando clicar fora do modal
    window.onclick = function(event) {
        if (event.target == modal) {
            closeTemplateCodeModal();
        }
    }

    // Atualizar o código quando as opções mudarem
    const codeOptions = document.querySelectorAll('#templateCodeModal input');
    codeOptions.forEach(option => {
        option.addEventListener('change', function() {
            const templateId = document.querySelector('.code-preview').dataset.templateId;
            const template = templates.find(t => t.id === templateId);
            if (template) {
                generateTemplateCode(template);
            }
        });
    });
});

// Funções auxiliares
function getFieldTypeOptions(selectedType) {
    const types = [
        {value: 'text', label: 'Texto'},
        {value: 'email', label: 'Email'},
        {value: 'tel', label: 'Telefone'},
        {value: 'number', label: 'Número'},
        {value: 'textarea', label: 'Área de Texto'},
        {value: 'select', label: 'Lista de Seleção'},
        {value: 'radio', label: 'Botões de Opção'},
        {value: 'checkbox', label: 'Caixas de Seleção'}
    ];
    
    return types.map(type => 
        `<option value="${type.value}" ${type.value === selectedType ? 'selected' : ''}>${type.label}</option>`
    ).join('');
}

function initializeSortable() {
    const fieldList = document.getElementById('fieldList');
    new Sortable(fieldList, {
        handle: '.field-handle',
        animation: 150
    });
}

// Carregamento inicial
function loadTemplates() {
    const templatesGrid = document.querySelector('.templates-grid');
    templatesGrid.innerHTML = '';
    
    if (templates.length === 0) {
        templatesGrid.innerHTML = `
            <div class="no-templates">
                <p>Nenhum modelo de formulário criado ainda.</p>
                <button class="btn-primary" onclick="showNewTemplateModal()">
                    <i class="fas fa-plus"></i> Criar Primeiro Modelo
                </button>
            </div>
        `;
        return;
    }
    
    templates.forEach(template => {
        const templateHtml = `
            <div class="template-card">
                <div class="template-header">
                    <h3>${template.name}</h3>
                    <span class="template-status active">Ativo</span>
                </div>
                <div class="template-preview">
                    <div class="field-list">
                        ${template.fields.map(field => `
                            <div class="field-item">
                                <span class="field-name">${field.name}</span>
                                <span class="field-type">${field.type}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="template-actions">
                    <button class="btn-secondary" onclick="editTemplate(${template.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-secondary" onclick="duplicateTemplate(${template.id})">
                        <i class="fas fa-copy"></i> Duplicar
                    </button>
                    <button class="btn-secondary" onclick="getTemplateCode(${template.id})">
                        <i class="fas fa-code"></i> Código
                    </button>
                    <button class="btn-danger" onclick="deleteTemplate(${template.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        templatesGrid.insertAdjacentHTML('beforeend', templateHtml);
    });
}

// Event Listeners
document.getElementById('formTheme').addEventListener('change', function(e) {
    const customColors = document.getElementById('customColors');
    customColors.style.display = e.target.value === 'custom' ? 'block' : 'none';
});

// Adicionar event listeners para upload de imagens
document.addEventListener('DOMContentLoaded', function() {
    // Event listener para upload de logo
    document.getElementById('logoUpload').addEventListener('change', function() {
        handleImageUpload(this, 'logoPreview');
    });
    
    // Event listener para upload de imagem de destaque
    document.getElementById('featureImageUpload').addEventListener('change', function() {
        handleImageUpload(this, 'featureImagePreview');
    });
    
    // Drag and drop para uploads
    const uploadAreas = document.querySelectorAll('.logo-upload, .image-upload');
    uploadAreas.forEach(area => {
        area.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#3498db';
            this.style.backgroundColor = '#f8f9fa';
        });
        
        area.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '#ddd';
            this.style.backgroundColor = '';
        });
        
        area.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#ddd';
            this.style.backgroundColor = '';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                const input = this.querySelector('input[type="file"]');
                const previewId = input.id === 'logoUpload' ? 'logoPreview' : 'featureImagePreview';
                input.files = e.dataTransfer.files;
                handleImageUpload(input, previewId);
            }
        });
    });
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
}); 