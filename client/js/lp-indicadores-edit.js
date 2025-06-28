document.addEventListener('DOMContentLoaded', function() {
  // Só inicializa o editor visual se estiver no contexto do editor (elementos existem)
  const editorCanvas = document.getElementById('editorCanvas');
  const propertiesContent = document.getElementById('propertiesContent');
  const lpPreview = document.getElementById('lpPreview');
  const canvasPlaceholder = document.getElementById('canvasPlaceholder');

  // Se não estiver no editor, apenas expõe as funções globais necessárias para o preview
  if (!editorCanvas || !propertiesContent || !lpPreview || !canvasPlaceholder) {
    // Função global para submit do formulário de indicador (já existe no arquivo)
    // Função global para bindIndicadorForms (já existe no arquivo)
    return;
  }

  // Editor Visual de LP de Indicadores

  let blocks = [];
  let selectedBlockIndex = null;
  let selectedColumn = null; // {blockIdx, colIdx} se um bloco dentro de coluna estiver selecionado

  // Blocos disponíveis
  const blockTemplates = {
    heading: { type: 'heading', text: 'Título da Seção', style: { color: '#222', fontSize: '2rem', textAlign: 'left' } },
    paragraph: { type: 'paragraph', text: 'Digite um parágrafo explicativo...', style: { color: '#444', fontSize: '1rem', textAlign: 'left' } },
    image: { type: 'image', src: '', alt: 'Imagem', style: { width: '100%', borderRadius: '8px' } },
    form: { type: 'form', fields: ['nome', 'email', 'telefone'], style: {} },
    button: { type: 'button', text: 'Chamada para Ação', style: { background: '#3498db', color: '#fff', padding: '12px 32px', borderRadius: '6px', fontWeight: 'bold', border: 'none', fontSize: '1rem' } },
    divider: { type: 'divider', style: { margin: '24px 0', borderColor: '#ddd' } },
    spacer: { type: 'spacer', height: 32 },
    columns2: { type: 'columns2', columns: [[], []], proportion: [50, 50] }
  };

  // Drag and drop da sidebar para o canvas
  const sidebarBtns = document.querySelectorAll('.block-btn');
  sidebarBtns.forEach(btn => {
    btn.addEventListener('dragstart', e => {
      console.log('[dragstart] Bloco:', btn.dataset.block);
      e.dataTransfer.setData('block-type', btn.dataset.block);
    });
  });

  editorCanvas.addEventListener('dragover', e => {
    e.preventDefault();
    console.log('[dragover] Canvas');
  });

  editorCanvas.addEventListener('drop', e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('block-type');
    console.log('[drop] Canvas, type:', type);
    if (type && blockTemplates[type]) {
      blocks.push(JSON.parse(JSON.stringify(blockTemplates[type])));
      renderCanvas();
      renderPreview();
      saveToLocalStorage();
    }
  });

  function renderCanvas() {
    editorCanvas.innerHTML = '';
    if (blocks.length === 0) {
      canvasPlaceholder.style.display = '';
      return;
    }
    canvasPlaceholder.style.display = 'none';
    blocks.forEach((block, idx) => {
      if (block.type === 'columns2') {
        // Renderizar bloco de colunas
        const div = document.createElement('div');
        div.className = 'canvas-block' + (selectedBlockIndex === idx ? ' selected' : '');
        div.style.padding = '0';
        div.onclick = () => selectBlock(idx);
        div.style.background = '#f8f9fa';
        div.style.border = '2px dashed #bbb';
        div.style.marginBottom = '18px';
        div.style.minHeight = '80px';
        div.style.display = 'flex';
        div.style.gap = '2%';
        block.columns.forEach((col, colIdx) => {
          const colDiv = document.createElement('div');
          colDiv.style.flex = block.proportion[colIdx];
          colDiv.style.background = '#fff';
          colDiv.style.minHeight = '80px';
          colDiv.style.padding = '12px';
          colDiv.style.borderRadius = '6px';
          colDiv.style.border = '1px solid #eee';
          colDiv.ondragover = e => e.preventDefault();
          colDiv.ondrop = e => {
            e.preventDefault();
            const type = e.dataTransfer.getData('block-type');
            if (type && blockTemplates[type] && type !== 'columns2') {
              block.columns[colIdx].push(JSON.parse(JSON.stringify(blockTemplates[type])));
              renderCanvas();
              renderPreview();
              saveToLocalStorage();
            }
          };
          // Renderizar blocos dentro da coluna
          col.forEach((innerBlock, innerIdx) => {
            const innerDiv = document.createElement('div');
            innerDiv.className = 'canvas-block' + (selectedColumn && selectedColumn.blockIdx === idx && selectedColumn.colIdx === colIdx && selectedColumn.innerIdx === innerIdx ? ' selected' : '');
            innerDiv.innerHTML = renderBlockContent(innerBlock);
            innerDiv.onclick = (e) => { e.stopPropagation(); selectColumnBlock(idx, colIdx, innerIdx); };
            // Remover bloco dentro da coluna
            const actions = document.createElement('div');
            actions.className = 'block-actions';
            const btnRemove = document.createElement('button');
            btnRemove.className = 'block-action-btn';
            btnRemove.title = 'Remover';
            btnRemove.innerHTML = '<i class="fas fa-trash"></i>';
            btnRemove.onclick = (e) => { e.stopPropagation(); removeColumnBlock(idx, colIdx, innerIdx); };
            actions.appendChild(btnRemove);
            innerDiv.appendChild(actions);
            colDiv.appendChild(innerDiv);
          });
          // Placeholder para coluna vazia
          if (col.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.style.color = '#bbb';
            placeholder.style.textAlign = 'center';
            placeholder.style.padding = '18px 0';
            placeholder.textContent = 'Arraste blocos aqui';
            colDiv.appendChild(placeholder);
          }
          div.appendChild(colDiv);
        });
        editorCanvas.appendChild(div);
      } else {
        const div = document.createElement('div');
        div.className = 'canvas-block' + (selectedBlockIndex === idx ? ' selected' : '');
        div.onclick = () => selectBlock(idx);
        div.draggable = true;
        div.ondragstart = e => {
          e.dataTransfer.setData('drag-index', idx);
        };
        div.ondragover = e => e.preventDefault();
        div.ondrop = e => {
          e.preventDefault();
          const from = +e.dataTransfer.getData('drag-index');
          if (from !== idx) {
            const moved = blocks.splice(from, 1)[0];
            blocks.splice(idx, 0, moved);
            renderCanvas();
            renderPreview();
            saveToLocalStorage();
          }
        };
        div.innerHTML = renderBlockContent(block);
        const actions = document.createElement('div');
        actions.className = 'block-actions';
        const btnRemove = document.createElement('button');
        btnRemove.className = 'block-action-btn';
        btnRemove.title = 'Remover';
        btnRemove.innerHTML = '<i class="fas fa-trash"></i>';
        btnRemove.onclick = (e) => { e.stopPropagation(); removeBlock(idx); };
        actions.appendChild(btnRemove);
        div.appendChild(actions);
        editorCanvas.appendChild(div);
      }
    });
  }

  function renderBlockContent(block) {
    switch (block.type) {
      case 'heading': return `<h2 style="color:${block.style.color};font-size:${block.style.fontSize};text-align:${block.style.textAlign}">${block.text}</h2>`;
      case 'paragraph': return `<p style="color:${block.style.color};font-size:${block.style.fontSize};text-align:${block.style.textAlign}">${block.text}</p>`;
      case 'image': return block.src ? `<img src="${block.src}" alt="${block.alt}" style="width:${block.style.width};border-radius:${block.style.borderRadius}">` : '<div style="color:#bbb;text-align:center;">[Imagem]</div>';
      case 'form':
        // Formulário funcional integrado ao endpoint de indicadores
        return `
          <form class="lp-indicador-form" onsubmit="return window.submitIndicadorForm(event, this)">
            <div style='margin-bottom:10px;'>
              <input name="name" type="text" placeholder="Nome completo" required style="width:100%;padding:10px;margin-bottom:8px;">
              <input name="email" type="email" placeholder="E-mail" required style="width:100%;padding:10px;margin-bottom:8px;">
              <input name="phone" type="tel" placeholder="Telefone" required style="width:100%;padding:10px;margin-bottom:8px;">
              <button type="submit" style="background:#27ae60;color:#fff;padding:12px 32px;border:none;border-radius:6px;font-weight:bold;font-size:1rem;width:100%;">Quero ser Indicador</button>
            </div>
            <div class="lp-indicador-feedback" style="margin-top:8px;font-size:0.95em;"></div>
          </form>
        `;
      case 'button': return `<button style="background:${block.style.background};color:${block.style.color};padding:${block.style.padding};border-radius:${block.style.borderRadius};font-weight:${block.style.fontWeight};border:${block.style.border};font-size:${block.style.fontSize}">${block.text}</button>`;
      case 'divider': return `<hr style="margin:${block.style.margin};border-color:${block.style.borderColor}">`;
      case 'spacer': return `<div style="height:${block.height}px"></div>`;
      case 'columns2':
        // Renderizar blocos reais de cada coluna
        return `<div style='display:flex;gap:2%;margin-bottom:16px;'>${block.columns.map((col, i) => `
          <div style='flex:${block.proportion[i]};padding:8px;background:#f8f9fa;border-radius:6px;min-width:0;'>
            ${col.length ? col.map(renderBlockContent).join('') : `<div style='color:#bbb;text-align:center;padding:18px 0;'>[Coluna ${i+1}]</div>`}
          </div>
        `).join('')}</div>`;
      default: return '';
    }
  }

  function selectBlock(idx) {
    selectedBlockIndex = idx;
    selectedColumn = null;
    renderCanvas();
    renderProperties();
  }
  function selectColumnBlock(blockIdx, colIdx, innerIdx) {
    selectedBlockIndex = blockIdx;
    selectedColumn = { blockIdx, colIdx, innerIdx };
    renderCanvas();
    renderProperties();
  }
  function removeBlock(idx) {
    blocks.splice(idx, 1);
    if (selectedBlockIndex === idx) selectedBlockIndex = null;
    renderCanvas();
    renderPreview();
    renderProperties();
    saveToLocalStorage();
  }
  function removeColumnBlock(blockIdx, colIdx, innerIdx) {
    blocks[blockIdx].columns[colIdx].splice(innerIdx, 1);
    selectedColumn = null;
    renderCanvas();
    renderPreview();
    renderProperties();
    saveToLocalStorage();
  }

  function renderProperties() {
    if (selectedBlockIndex === null || !blocks[selectedBlockIndex]) {
      propertiesContent.innerHTML = 'Selecione um bloco para editar';
      return;
    }
    const block = blocks[selectedBlockIndex];
    let html = '';
    if (block.type === 'heading' || block.type === 'paragraph') {
      html += `<label>Texto:<input type="text" value="${block.text}" onchange="updateBlockText(this.value)"></label><br>`;
      html += `<label>Cor:<input type="color" value="${block.style.color}" onchange="updateBlockStyle('color', this.value)"></label><br>`;
      html += `<label>Tamanho:<input type="text" value="${block.style.fontSize}" onchange="updateBlockStyle('fontSize', this.value)"></label><br>`;
      html += `<label>Alinhamento:<select onchange="updateBlockStyle('textAlign', this.value)">
        <option value="left"${block.style.textAlign==='left'?' selected':''}>Esquerda</option>
        <option value="center"${block.style.textAlign==='center'?' selected':''}>Centro</option>
        <option value="right"${block.style.textAlign==='right'?' selected':''}>Direita</option>
      </select></label>`;
    } else if (block.type === 'image') {
      html += `<label>URL da Imagem:<input type="text" value="${block.src}" onchange="updateBlockImageSrc(this.value)"></label><br>`;
      html += `<label>Alt:<input type="text" value="${block.alt}" onchange="updateBlockAlt(this.value)"></label><br>`;
      html += `<label>Borda Arredondada:<input type="text" value="${block.style.borderRadius}" onchange="updateBlockStyle('borderRadius', this.value)"></label><br>`;
    } else if (block.type === 'button') {
      html += `<label>Texto:<input type="text" value="${block.text}" onchange="updateBlockText(this.value)"></label><br>`;
      html += `<label>Cor de Fundo:<input type="color" value="${block.style.background}" onchange="updateBlockStyle('background', this.value)"></label><br>`;
      html += `<label>Cor do Texto:<input type="color" value="${block.style.color}" onchange="updateBlockStyle('color', this.value)"></label><br>`;
    } else if (block.type === 'divider') {
      html += `<label>Cor da Linha:<input type="color" value="${block.style.borderColor}" onchange="updateBlockStyle('borderColor', this.value)"></label><br>`;
    } else if (block.type === 'spacer') {
      html += `<label>Altura (px):<input type="number" value="${block.height}" min="8" max="128" onchange="updateBlockHeight(this.value)"></label><br>`;
    } else if (block.type === 'form') {
      html += '<div>Campos do formulário são fixos nesta versão.</div>';
    }
    propertiesContent.innerHTML = html;
  }

  window.updateBlockText = function(val) {
    if (selectedBlockIndex !== null) {
      blocks[selectedBlockIndex].text = val;
      renderCanvas();
      renderPreview();
      saveToLocalStorage();
    }
  };
  window.updateBlockStyle = function(key, val) {
    if (selectedBlockIndex !== null) {
      blocks[selectedBlockIndex].style[key] = val;
      renderCanvas();
      renderPreview();
      saveToLocalStorage();
    }
  };
  window.updateBlockImageSrc = function(val) {
    if (selectedBlockIndex !== null) {
      blocks[selectedBlockIndex].src = val;
      renderCanvas();
      renderPreview();
      saveToLocalStorage();
    }
  };
  window.updateBlockAlt = function(val) {
    if (selectedBlockIndex !== null) {
      blocks[selectedBlockIndex].alt = val;
      renderCanvas();
      renderPreview();
      saveToLocalStorage();
    }
  };
  window.updateBlockHeight = function(val) {
    if (selectedBlockIndex !== null) {
      blocks[selectedBlockIndex].height = parseInt(val, 10);
      renderCanvas();
      renderPreview();
      saveToLocalStorage();
    }
  };

  function renderPreview() {
    lpPreview.innerHTML = blocks.map(renderBlockContent).join('');
  }

  function saveToLocalStorage() {
    localStorage.setItem('lpBlocks', JSON.stringify(blocks));
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('lpBlocks');
    if (saved) {
      blocks = JSON.parse(saved);
      renderCanvas();
      renderPreview();
    }
  }

  window.saveLP = async function() {
    console.log('[saveLP] Função chamada');
    const name = document.getElementById('nomeLP') ? document.getElementById('nomeLP').value : 'LP de Indicadores';
    const clientId = localStorage.getItem('clientId');
    if (!clientId) {
      alert('ID do cliente não encontrado. Faça login novamente.');
      console.error('[saveLP] clientId não encontrado');
      return;
    }
    const grapesData = { components: blocks, styles: [], assets: [] };
    const compiledOutput = {
      html: lpPreview.innerHTML,
      css: ''
    };
    const metadata = {
      blocksUsed: blocks.map(b => b.type),
      version: '1.0'
    };
    const payload = {
      name,
      clientId,
      grapesData,
      compiledOutput,
      metadata,
      status: 'draft'
    };
    const token = localStorage.getItem('clientToken');
    console.log('[saveLP] Payload montado:', payload);
    try {
      console.log('[saveLP] Enviando fetch para backend...');
      const response = await fetch(`${API_URL}/lp-indicadores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      console.log('[saveLP] Resposta recebida:', response);
      const result = await response.json();
      console.log('[saveLP] Corpo da resposta:', result);
      if (response.ok && result.success) {
        alert('LP salva com sucesso no sistema!');
      } else {
        alert('Erro ao salvar LP: ' + (result.message || 'Erro desconhecido'));
      }
    } catch (error) {
      alert('Erro de conexão ao salvar LP: ' + error.message);
      console.error('[saveLP] Erro no fetch:', error);
    }
  };

  // Função global para submit do formulário de indicador
  window.submitIndicadorForm = async function(event, form) {
    event.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const company = form.company ? form.company.value.trim() : undefined;
    const lpId = localStorage.getItem('currentLpId'); // Defina esse valor ao carregar/editar a LP
    const feedback = form.querySelector('.lp-indicador-feedback');
    feedback.textContent = '';
    if (!lpId) {
      feedback.textContent = 'Erro: dados de contexto não encontrados. Recarregue a página.';
      feedback.style.color = 'red';
      return false;
    }
    // Captura dados de origem
    const utmSource = getUrlParam('utm_source');
    const utmMedium = getUrlParam('utm_medium');
    const utmCampaign = getUrlParam('utm_campaign');
    const utmTerm = getUrlParam('utm_term');
    const utmContent = getUrlParam('utm_content');
    const referrerUrl = document.referrer;
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    // Monta payload conforme DTO do backend de LP de Indicadores
    const payload = {
      name,
      email,
      phone,
      company,
      lpId,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      referrerUrl,
      userAgent
    };
    try {
      const response = await fetch(`${API_URL}/lp-indicadores/submit-form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok && result.success) {
        // 🆕 NOVA FUNCIONALIDADE: Redirecionar para página de sucesso no preview
        const participantId = result.participantId || result.data?._id;
        if (participantId && window.location.pathname.includes('preview')) {
          console.log('✅ [LP-EDIT] Redirecionando para página de sucesso com ID:', participantId);
          window.open(`lp-indicadores-success.html?id=${participantId}`, '_blank');
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

  // Função utilitária para pegar parâmetros da URL
  function getUrlParam(key) {
    const url = new URL(window.location.href);
    return url.searchParams.get(key) || '';
  }

  // Inicialização
  loadFromLocalStorage();
  renderCanvas();
  renderPreview();
}); 