// Blocos Pré-definidos para Templates WhatsApp
// Substitui os templates globais do admin

const TEMPLATE_BLOCKS = {
  welcome: {
    id: 'welcome',
    name: 'Boas-vindas',
    icon: '📧',
    category: 'marketing',
    description: 'Mensagem de boas-vindas para novos indicadores',
    content: {
      body: 'Olá {{nome}}! Bem-vindo ao nosso programa de indicação. Você está pronto para começar sua jornada de sucesso? 🚀',
      footer: 'Entre em contato conosco para mais informações.'
    },
    variables: ['nome'],
    color: 'bg-blue-500'
  },
  
  offer: {
    id: 'offer',
    name: 'Oferta Especial',
    icon: '🎁',
    category: 'marketing',
    description: 'Ofertas e promoções especiais',
    content: {
      body: '{{nome}}, temos uma oferta especial para você! {{oferta}} 🎉\n\nAproveite esta oportunidade única!',
      footer: 'Válido até {{data_limite}}'
    },
    variables: ['nome', 'oferta', 'data_limite'],
    color: 'bg-green-500'
  },
  
  report: {
    id: 'report',
    name: 'Relatório de Performance',
    icon: '📊',
    category: 'utility',
    description: 'Relatórios e métricas de performance',
    content: {
      body: '📈 Relatório de Performance - {{nome}}\n\n✅ Indicações realizadas: {{total_indicacoes}}\n💰 Ganhos totais: R$ {{ganhos}}\n🏆 Ranking: {{posicao}}º lugar\n\nContinue assim! 💪',
      footer: 'Acesse seu dashboard para mais detalhes.'
    },
    variables: ['nome', 'total_indicacoes', 'ganhos', 'posicao'],
    color: 'bg-purple-500'
  },
  
  congratulations: {
    id: 'congratulations',
    name: 'Parabéns (Conquista)',
    icon: '🏆',
    category: 'marketing',
    description: 'Parabéns por conquistas e metas atingidas',
    content: {
      body: '🎉 PARABÉNS, {{nome}}! 🎉\n\nVocê atingiu a meta de {{meta}} indicações!\n\n🏆 Conquista desbloqueada: {{conquista}}\n💰 Bônus adicional: R$ {{bonus}}\n\nContinue se superando! 👏',
      footer: 'Compartilhe sua conquista nas redes sociais!'
    },
    variables: ['nome', 'meta', 'conquista', 'bonus'],
    color: 'bg-yellow-500'
  },
  
  reminder: {
    id: 'reminder',
    name: 'Lembrete de Ação',
    icon: '⏰',
    category: 'utility',
    description: 'Lembretes e notificações importantes',
    content: {
      body: '⏰ Lembrete Importante\n\n{{nome}}, não esqueça de {{acao}} até {{prazo}}.\n\nEsta ação é essencial para manter seu progresso no programa de indicação.',
      footer: 'Em caso de dúvidas, entre em contato conosco.'
    },
    variables: ['nome', 'acao', 'prazo'],
    color: 'bg-orange-500'
  },
  
  contact: {
    id: 'contact',
    name: 'Contato/Suporte',
    icon: '📞',
    category: 'utility',
    description: 'Informações de contato e suporte',
    content: {
      body: '📞 Precisa de ajuda?\n\n{{nome}}, nossa equipe está aqui para te ajudar!\n\n📧 Email: {{email}}\n📱 WhatsApp: {{whatsapp}}\n🌐 Site: {{site}}\n\nHorário de atendimento: {{horario}}',
      footer: 'Responderemos em até 24 horas.'
    },
    variables: ['nome', 'email', 'whatsapp', 'site', 'horario'],
    color: 'bg-teal-500'
  },
  
  callToAction: {
    id: 'callToAction',
    name: 'Call-to-Action',
    icon: '🎯',
    category: 'marketing',
    description: 'Chamadas para ação e conversão',
    content: {
      body: '🎯 {{nome}}, não perca esta oportunidade!\n\n{{oferta_especial}}\n\n⏰ Tempo limitado: {{tempo_restante}}\n\nClique aqui para aproveitar: {{link_acao}}',
      footer: 'Oferta válida apenas para indicadores ativos.'
    },
    variables: ['nome', 'oferta_especial', 'tempo_restante', 'link_acao'],
    color: 'bg-red-500'
  }
};

// Função para obter todos os blocos
function getAllTemplateBlocks() {
  return Object.values(TEMPLATE_BLOCKS);
}

// Função para obter bloco por ID
function getTemplateBlockById(blockId) {
  return TEMPLATE_BLOCKS[blockId];
}

// Função para obter blocos por categoria
function getTemplateBlocksByCategory(category) {
  return Object.values(TEMPLATE_BLOCKS).filter(block => block.category === category);
}

// Função para criar template a partir de bloco
function createTemplateFromBlock(blockId, customName = null) {
  const block = getTemplateBlockById(blockId);
  if (!block) return null;
  
  return {
    name: customName || block.name,
    category: block.category,
    language: 'pt_BR',
    content: {
      body: block.content.body,
      footer: block.content.footer
    },
    variables: block.variables,
    status: 'draft',
    isGlobal: false
  };
}

// Função para renderizar blocos na interface
function renderTemplateBlocks(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const blocksHTML = getAllTemplateBlocks().map(block => `
    <div class="template-block" data-block-id="${block.id}" draggable="true">
      <div class="block-header ${block.color}">
        <span class="block-icon">${block.icon}</span>
        <h4 class="block-name">${block.name}</h4>
      </div>
      <div class="block-content">
        <p class="block-description">${block.description}</p>
        <div class="block-preview">
          <p class="preview-text">${block.content.body.substring(0, 100)}...</p>
        </div>
        <div class="block-variables">
          <span class="variables-label">Variáveis:</span>
          <span class="variables-list">${block.variables.join(', ')}</span>
        </div>
      </div>
      <div class="block-actions">
        <button onclick="useTemplateBlock('${block.id}')" class="btn-use-block">
          <i class="fas fa-plus"></i> Usar Bloco
        </button>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = blocksHTML;
}

// Função para usar bloco (drag & drop ou clique)
function useTemplateBlock(blockId) {
  const block = getTemplateBlockById(blockId);
  if (!block) return;
  
  // Preencher formulário com dados do bloco
  document.getElementById('template-name').value = block.name;
  document.getElementById('template-category').value = block.category;
  document.getElementById('template-body').value = block.content.body;
  document.getElementById('template-footer').value = block.content.footer || '';
  document.getElementById('template-variables').value = block.variables.join(', ');
  
  // Abrir modal de edição
  openCreateTemplateModal();
  
  // Atualizar título do modal
  document.getElementById('modal-title').textContent = `Editar ${block.name}`;
}

// Configurar drag & drop
function setupTemplateBlocksDragAndDrop() {
  const blocks = document.querySelectorAll('.template-block');
  const editorArea = document.getElementById('template-editor-area');
  
  blocks.forEach(block => {
    block.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', block.dataset.blockId);
      block.classList.add('dragging');
    });
    
    block.addEventListener('dragend', () => {
      block.classList.remove('dragging');
    });
  });
  
  if (editorArea) {
    editorArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      editorArea.classList.add('drag-over');
    });
    
    editorArea.addEventListener('dragleave', () => {
      editorArea.classList.remove('drag-over');
    });
    
    editorArea.addEventListener('drop', (e) => {
      e.preventDefault();
      editorArea.classList.remove('drag-over');
      
      const blockId = e.dataTransfer.getData('text/plain');
      useTemplateBlock(blockId);
    });
  }
}

// Exportar funções para uso global
window.TemplateBlocks = {
  getAll: getAllTemplateBlocks,
  getById: getTemplateBlockById,
  getByCategory: getTemplateBlocksByCategory,
  createFromBlock: createTemplateFromBlock,
  render: renderTemplateBlocks,
  use: useTemplateBlock,
  setupDragAndDrop: setupTemplateBlocksDragAndDrop
}; 