// Editor de E-mail Marketing (GrapesJS) - Versão Moderna e Centralizada
// Este arquivo deve ser importado em engajamento-email-template-editor.html

// Tabs
function switchTab(tabName) {
  document.querySelectorAll('.panel__tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.panel__tab-content').forEach(content => content.classList.remove('active'));
  document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Configuração moderna do GrapesJS com padrão centralizado
const editor = grapesjs.init({
  container: '#gjs',
  fromElement: false,
  height: '100%',
  width: 'auto',
  storageManager: false,
  blockManager: { appendTo: '#blocks' },
  styleManager: { appendTo: '#tab-styles .styles-container' },
  
  // Configurações avançadas para melhor experiência
  deviceManager: {
    devices: [
      {
        name: 'Desktop',
        width: '600px',
        height: 'auto'
      },
      {
        name: 'Mobile',
        width: '320px',
        height: 'auto'
      }
    ]
  },
  
  // Configuração do canvas com estilos modernos e centralizados
  canvas: { 
    styles: [
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
      `
        /* Reset e estilos globais modernos */
        * {
          box-sizing: border-box;
        }
        
        body { 
          margin: 0; 
          padding: 20px; 
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Container principal centralizado - PADRÃO MODERNO */
        .email-container {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 600px;
          width: 100%;
          margin: 0 auto;
          overflow: hidden;
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
          position: relative;
        }
        
        /* Wrapper interno para garantir centralização */
        .email-wrapper {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
        }
        
        /* Estilos modernos para elementos internos */
        .email-container h1, 
        .email-container h2, 
        .email-container h3 {
          color: #1a202c;
          font-weight: 700;
          margin: 0 0 16px 0;
          line-height: 1.3;
        }
        
        .email-container h1 { font-size: 28px; }
        .email-container h2 { font-size: 24px; }
        .email-container h3 { font-size: 20px; }
        
        .email-container p {
          color: #4a5568;
          line-height: 1.6;
          margin: 0 0 16px 0;
          font-size: 16px;
        }
        
        .email-container a {
          color: #3182ce;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        
        .email-container a:hover {
          color: #2c5282;
        }
        
        /* Botões modernos */
        .email-container .btn {
          background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
          color: #ffffff;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          display: inline-block;
          box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        
        .email-container .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(49, 130, 206, 0.4);
        }
        
        /* Seções com padding consistente */
        .email-container .section {
          padding: 32px 24px;
        }
        
        /* Header moderno */
        .email-container .header {
          background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
          color: white;
          padding: 32px 24px;
          text-align: center;
          border-radius: 16px 16px 0 0;
        }
        
        /* Footer moderno */
        .email-container .footer {
          background: #2d3748;
          color: #e2e8f0;
          padding: 24px;
          text-align: center;
          font-size: 14px;
          border-radius: 0 0 16px 16px;
        }
        
        /* Responsividade */
        @media (max-width: 640px) {
          .email-container {
            margin: 0 16px;
            border-radius: 12px;
          }
          
          .email-container .section {
            padding: 24px 16px;
          }
          
          .email-container .header,
          .email-container .footer {
            padding: 24px 16px;
          }
        }
        
        /* Estilos para o editor */
        .gjs-cv-canvas {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        
        /* Centralização forçada no editor */
        .gjs-frame {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: 100vh !important;
        }
      `
    ],
    
    // Configurações do canvas para centralização
    scripts: [],
    styles: [],
    
    // Configuração de dispositivos
    device: 'Desktop'
  },
  
  // Configurações de componentes
  components: {
    wrapper: {
      tagName: 'div',
      attributes: { class: 'email-wrapper' }
    }
  },
  
  // Configurações de estilos
  cssIcons: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  
  // Configurações de painéis
  panels: {
    defaults: [
      {
        id: 'basic-actions',
        el: '.panel__basic-actions',
        buttons: [
          {
            id: 'visibility',
            active: true,
            className: 'btn-toggle-command',
            label: '<u>B</u>',
            command: 'sw-visibility',
          },
          {
            id: 'export',
            className: 'btn-open-command',
            label: 'Exp',
            command: 'export-template',
            context: 'export-template',
          },
          {
            id: 'show-json',
            className: 'btn-open-command',
            label: 'JSON',
            command: 'show-json',
          },
        ],
      },
    ],
  },
  
  // Configurações de comandos
  commands: {
    defaults: [
      {
        id: 'export-template',
        run: function(editor) {
          const html = editor.getHtml();
          const css = editor.getCss();
          const template = `<html><head><style>${css}</style></head><body>${html}</body></html>`;
          const blob = new Blob([template], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'email-template.html';
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    ]
  }
});

// Blocos modernos com padrão centralizado
editor.BlockManager.add('header', {
  label: 'Cabeçalho',
  content: `<div class="header" style="background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%); padding: 32px 24px; text-align: center; border-radius: 16px 16px 0 0; color: white;">
    <img src="https://via.placeholder.com/200x60/ffffff/3182ce?text=LOGO" alt="Logo" style="height: 60px; width: auto; margin-bottom: 16px; border-radius: 8px;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">{{empresa}}</h1>
    <p style="color: #e2e8f0; margin: 8px 0 0 0; font-size: 16px;">Sua empresa de confiança</p>
  </div>`,
  category: 'Estrutura',
  attributes: { class: 'fas fa-header' }
});
editor.BlockManager.add('content', {
  label: 'Conteúdo',
  content: `<div class="section" style="padding: 32px 24px; background: #ffffff; text-align: center;">
    <h2 style="color: #1a202c; margin-bottom: 16px; font-size: 24px; font-weight: 700;">Olá {{nome}}!</h2>
    <p style="color: #4a5568; line-height: 1.6; margin-bottom: 24px; font-size: 16px;">Bem-vindo ao nosso programa de indicação! Estamos felizes em ter você conosco.</p>
  </div>`,
  category: 'Conteúdo',
  attributes: { class: 'fas fa-envelope-open' }
});
editor.BlockManager.add('cta', {
  label: 'Botão CTA',
  content: `<div class="section" style="text-align: center; padding: 32px 24px; background: #ffffff;">
    <a href="{{linkIndicacao}}" class="btn" style="background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3); display: inline-block; transition: all 0.3s ease;">Começar a Indicar</a>
  </div>`,
  category: 'Conteúdo',
  attributes: { class: 'fas fa-mouse-pointer' }
});
editor.BlockManager.add('footer', {
  label: 'Rodapé',
  content: `<div class="footer" style="background: #2d3748; color: #e2e8f0; padding: 24px; text-align: center; font-size: 14px; border-radius: 0 0 16px 16px;">
    <p style="margin: 0 0 12px 0;">© 2024 {{empresa}}. Todos os direitos reservados.</p>
    <p style="margin: 0 0 10px 0;">
      <a href="#" style="color: #3182ce; text-decoration: none;">Cancelar inscrição</a> |
      <a href="#" style="color: #3182ce; text-decoration: none;">Política de Privacidade</a>
    </p>
  </div>`,
  category: 'Estrutura',
  attributes: { class: 'fas fa-shoe-prints' }
});
editor.BlockManager.add('alert', {
  label: 'Aviso/Alerta',
  content: `<div style="background: #fff3cd; color: #856404; padding: 20px; border-radius: 8px; border: 1px solid #ffeeba; margin: 16px 0; font-size: 16px;">
    <strong>Atenção:</strong> Esta é uma mensagem importante para o usuário.
  </div>`,
  category: 'Conteúdo',
  attributes: { class: 'fas fa-exclamation-triangle' }
});
editor.BlockManager.add('list', {
  label: 'Lista',
  content: `<ul style="padding: 24px; background: #fff; color: #2c3e50; border-radius: 8px; font-size: 16px;">
    <li style="margin-bottom: 10px;">Item 1 da lista</li>
    <li style="margin-bottom: 10px;">Item 2 da lista</li>
    <li>Item 3 da lista</li>
  </ul>`,
  category: 'Conteúdo',
  attributes: { class: 'fas fa-list' }
});
editor.BlockManager.add('image', {
  label: 'Imagem',
  content: `<div style="text-align: center; margin: 28px 0;"><img src="https://via.placeholder.com/600x300/3498db/ffffff?text=Imagem+do+Email" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 2px 8px rgba(52,152,219,0.10);" alt="Imagem"></div>`,
  category: 'Conteúdo',
  attributes: { class: 'fas fa-image' }
});
editor.BlockManager.add('divider', {
  label: 'Divisor',
  content: '<hr style="border: none; border-top: 2px solid #ddd; margin: 36px 0;">',
  category: 'Estrutura',
  attributes: { class: 'fas fa-minus' }
});
// Bloco de redes sociais (moderno)
editor.BlockManager.add('social', {
  label: 'Redes Sociais',
  content: `<div style="text-align: center; padding: 24px; background: #fff; border-radius: 8px;">
    <a href="https://facebook.com/" target="_blank" style="margin: 0 12px;"><i class="fab fa-facebook fa-2x" style="color: #3b5998;"></i></a>
    <a href="https://instagram.com/" target="_blank" style="margin: 0 12px;"><i class="fab fa-instagram fa-2x" style="color: #e4405f;"></i></a>
    <a href="https://linkedin.com/" target="_blank" style="margin: 0 12px;"><i class="fab fa-linkedin fa-2x" style="color: #0077b5;"></i></a>
    <a href="https://wa.me/" target="_blank" style="margin: 0 12px;"><i class="fab fa-whatsapp fa-2x" style="color: #25d366;"></i></a>
  </div>`,
  category: 'Conteúdo',
  attributes: { class: 'fab fa-facebook' }
});
// Bloco de vídeo (YouTube)
editor.BlockManager.add('video', {
  label: 'Vídeo (YouTube)',
  content: `<div style="text-align: center; padding: 24px; background: #fff; border-radius: 8px;">
    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank">
      <img src="https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg" alt="Vídeo" style="max-width: 100%; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(231,76,60,0.10);">
      <div style="color: #e74c3c; font-weight: bold; font-size: 18px;">Assista ao vídeo</div>
    </a>
  </div>`,
  category: 'Conteúdo',
  attributes: { class: 'fas fa-video' }
});
// Bloco de Assinatura
editor.BlockManager.add('signature', {
  label: 'Assinatura',
  content: `<div style="display: flex; align-items: center; gap: 18px; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(44,62,80,0.06); padding: 18px 24px;">
    <img src='https://via.placeholder.com/64x64/3498db/ffffff?text=Foto' alt='Foto' style='width:64px; height:64px; border-radius:50%; object-fit:cover; box-shadow:0 2px 8px #3498db22;'>
    <div>
      <div style='font-weight:600; color:#2c3e50; font-size:16px;'>Nome do Remetente</div>
      <div style='color:#555; font-size:14px;'>Cargo ou função</div>
      <div style='color:#3498db; font-size:13px; margin-top:4px;'>contato@email.com | (11) 99999-9999</div>
    </div>
  </div>`,
  category: 'Conteúdo',
  attributes: { class: 'fas fa-signature' }
});
// Bloco de Colunas (2)
editor.BlockManager.add('columns-2', {
  label: '2 Colunas',
  content: `<div style='display: flex; gap: 18px; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(44,62,80,0.06); padding: 18px;'>
    <div style='flex:1; min-width:0;'><p style='color:#2c3e50; font-size:15px;'>Coluna 1</p></div>
    <div style='flex:1; min-width:0;'><p style='color:#2c3e50; font-size:15px;'>Coluna 2</p></div>
  </div>`,
  category: 'Estrutura',
  attributes: { class: 'fas fa-columns' }
});
// Bloco de Colunas (3)
editor.BlockManager.add('columns-3', {
  label: '3 Colunas',
  content: `<div style='display: flex; gap: 18px; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(44,62,80,0.06); padding: 18px;'>
    <div style='flex:1; min-width:0;'><p style='color:#2c3e50; font-size:15px;'>Coluna 1</p></div>
    <div style='flex:1; min-width:0;'><p style='color:#2c3e50; font-size:15px;'>Coluna 2</p></div>
    <div style='flex:1; min-width:0;'><p style='color:#2c3e50; font-size:15px;'>Coluna 3</p></div>
  </div>`,
  category: 'Estrutura',
  attributes: { class: 'fas fa-table-columns' }
});
// Bloco de Banner
editor.BlockManager.add('banner', {
  label: 'Banner',
  content: `<div style='width:100%; text-align:center; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(52,152,219,0.08); padding:0;'>
    <img src='https://via.placeholder.com/600x200/3498db/ffffff?text=Banner+do+E-mail' alt='Banner' style='width:100%; max-width:100%; height:auto; border-radius:12px;'>
  </div>`,
  category: 'Conteúdo',
  attributes: { class: 'fas fa-image' }
});
// Modelo moderno padrão: Boas-vindas (PADRÃO CENTRALIZADO)
editor.BlockManager.add('welcome-template', {
  label: 'Modelo: Boas-vindas',
  content: `
    <div class="email-wrapper">
      <div class="email-container">
        <div class="header" style="background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%); padding: 32px 24px; text-align: center; border-radius: 16px 16px 0 0; color: white;">
          <img src="https://via.placeholder.com/200x60/ffffff/3182ce?text=LOGO" alt="Logo" style="height: 60px; width: auto; margin-bottom: 16px; border-radius: 8px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">{{empresa}}</h1>
          <p style="color: #e2e8f0; margin: 8px 0 0 0; font-size: 16px;">Sua empresa de confiança</p>
        </div>
        
        <div class="section" style="padding: 32px 24px; background: #ffffff; text-align: center;">
          <h2 style="color: #1a202c; margin-bottom: 16px; font-size: 24px; font-weight: 700;">Olá, {{nome}}!</h2>
          <p style="color: #4a5568; line-height: 1.6; margin-bottom: 24px; font-size: 16px;">
            Seja bem-vindo(a) ao programa da <b>{{empresa}}</b>!<br>
            Seu acesso exclusivo já está disponível.
          </p>
          <a href="{{linkAcesso}}" class="btn" style="background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3); display: inline-block; transition: all 0.3s ease;">
            Acessar minha área exclusiva
          </a>
        </div>
        
        <div class="section" style="padding: 0 24px; background: #ffffff;">
          <ul style="color: #1a202c; font-size: 15px; background: #f7fafc; border-radius: 12px; padding: 20px 24px; margin: 0; list-style: none;">
            <li style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;"><span style="color: #38a169; font-weight: bold;">✓</span> Suporte dedicado</li>
            <li style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;"><span style="color: #38a169; font-weight: bold;">✓</span> Conteúdos exclusivos</li>
            <li style="display: flex; align-items: center; gap: 8px;"><span style="color: #38a169; font-weight: bold;">✓</span> Participação em campanhas e sorteios</li>
          </ul>
        </div>
        
        <div class="section" style="padding: 24px; background: #ffffff;">
          <div style="display: flex; align-items: center; gap: 18px; background: #f7fafc; border-radius: 12px; padding: 20px 24px; border: 1px solid #e2e8f0;">
            <img src="https://via.placeholder.com/64x64/3182ce/ffffff?text=Foto" alt="Foto" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; box-shadow: 0 2px 8px rgba(49, 130, 206, 0.2);">
            <div>
              <div style="font-weight: 600; color: #1a202c; font-size: 16px;">{{nomeResponsavel}}</div>
              <div style="color: #4a5568; font-size: 14px;">Equipe {{empresa}}</div>
              <div style="color: #3182ce; font-size: 13px; margin-top: 4px;">contato@email.com</div>
            </div>
          </div>
        </div>
        
        <div class="footer" style="background: #2d3748; color: #e2e8f0; padding: 24px; text-align: center; font-size: 14px; border-radius: 0 0 16px 16px;">
          <p style="margin: 0 0 12px 0;">© 2024 {{empresa}}. Todos os direitos reservados.</p>
          <p style="margin: 0;">
            <a href="#" style="color: #3182ce; text-decoration: none;">Cancelar inscrição</a> |
            <a href="#" style="color: #3182ce; text-decoration: none;">Política de Privacidade</a>
          </p>
        </div>
      </div>
    </div>
  `,
  category: 'Modelos',
  attributes: { class: 'fas fa-star' }
});
// Preview com estrutura centralizada
window.previewEmail = function() {
  let html = editor.getHtml();
  const css = editor.getCss();
  
  // Garantir estrutura centralizada no preview
  if (!html.includes('email-wrapper')) {
    if (!html.includes('email-container')) {
      html = `<div class="email-container">${html}</div>`;
    }
    html = `<div class="email-wrapper">${html}</div>`;
  }
  
  const previewWindow = window.open('', '_blank');
  previewWindow.document.write(`
    <html>
      <head>
        <title>Preview do E-mail</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          ${css}
          body { 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);
};
// Utilidades para obter parâmetros da URL
function getUrlParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Sistema de inicialização com estrutura centralizada garantida
const templateId = getUrlParam('id');

// Função de inicialização que garante estrutura centralizada
function initializeEditor() {
  console.log('🚀 [INIT] Inicializando editor com estrutura centralizada...');
  
  if (templateId) {
    fetchTemplate(templateId);
  } else {
    // Criar estrutura centralizada vazia
    ensureEmailContainer();
  }
  
  // Forçar centralização após carregamento
  setTimeout(() => {
    ensureEmailContainer();
    console.log('✅ [INIT] Editor inicializado com sucesso');
  }, 500);
}

// Inicializar editor
setTimeout(initializeEditor, 100);

// Função para forçar estrutura centralizada em qualquer situação
window.forceCentralizedStructure = function() {
  console.log('🔧 [FORCE] Forçando estrutura centralizada...');
  ensureEmailContainer();
  
  // Verificar se o canvas está centralizado
  const canvas = document.querySelector('.gjs-cv-canvas');
  if (canvas) {
    canvas.style.display = 'flex';
    canvas.style.alignItems = 'center';
    canvas.style.justifyContent = 'center';
    canvas.style.minHeight = '100vh';
  }
  
  // Verificar se o frame está centralizado
  const frame = document.querySelector('.gjs-frame');
  if (frame) {
    frame.style.display = 'flex';
    frame.style.alignItems = 'center';
    frame.style.justifyContent = 'center';
    frame.style.minHeight = '100vh';
  }
  
  console.log('✅ [FORCE] Estrutura centralizada forçada');
};

// Chamar função de força periodicamente
setInterval(() => {
  forceCentralizedStructure();
}, 2000);

// Função para garantir container principal centralizado (PADRÃO MODERNO)
function ensureEmailContainer() {
  const wrapper = editor.getWrapper();
  const components = wrapper.getComponents();
  
  // Verificar se já existe o wrapper centralizado
  const hasWrapper = components.length > 0 && components[0].getClasses().includes('email-wrapper');
  const hasContainer = components.length > 0 && components[0].getClasses().includes('email-container');
  
  console.log('🔍 [DEBUG] Verificando estrutura:', { hasWrapper, hasContainer, componentsCount: components.length });
  
  if (components.length === 0) {
    // Criar estrutura completa vazia
    console.log('🔍 [DEBUG] Criando estrutura completa vazia...');
    wrapper.set('content', `
      <div class="email-wrapper">
        <div class="email-container">
          <!-- Conteúdo do e-mail será inserido aqui -->
        </div>
      </div>
    `);
  } else if (!hasWrapper) {
    // Se não tem wrapper, adicionar wrapper e container
    console.log('🔍 [DEBUG] Adicionando wrapper e container...');
    const content = wrapper.getInnerHTML();
    wrapper.set('content', `
      <div class="email-wrapper">
        <div class="email-container">
          ${content}
        </div>
      </div>
    `);
  } else if (!hasContainer) {
    // Se tem wrapper mas não tem container, adicionar container
    console.log('🔍 [DEBUG] Adicionando container...');
    const wrapperEl = components[0];
    const wrapperContent = wrapperEl.getInnerHTML();
    wrapperEl.set('content', `<div class="email-container">${wrapperContent}</div>`);
  }
  
  console.log('🔍 [DEBUG] Estrutura centralizada garantida');
}

function fetchTemplate(id) {
  const token = localStorage.getItem('clientToken');
  if (!token) return alert('Token não encontrado');
  fetch(`${window.APP_CONFIG ? window.APP_CONFIG.API_URL : (window.API_URL || 'http://localhost:3000/api')}/email-templates/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data && data.name) {
        document.getElementById('templateName').value = data.name;
      }
      if (data && data.type) {
        document.getElementById('templateType').value = data.type;
      }
      if (data && data.htmlContent) {
        // Garantir que o conteúdo tenha a estrutura centralizada
        let htmlContent = data.htmlContent;
        
        // Se não tem wrapper, adicionar estrutura completa
        if (!htmlContent.includes('email-wrapper')) {
          if (!htmlContent.includes('email-container')) {
            htmlContent = `<div class="email-container">${htmlContent}</div>`;
          }
          htmlContent = `<div class="email-wrapper">${htmlContent}</div>`;
        }
        
        editor.setComponents(htmlContent);
        console.log('🔍 [DEBUG] Template carregado com estrutura centralizada');
      }
      // Se quiser preencher outros campos, adicione aqui
    });
}

// Salvar template
window.saveTemplate = function() {
  console.log('🔍 [DEBUG] Função saveTemplate iniciada');
  
  const name = document.getElementById('templateName').value.trim();
  console.log('🔍 [DEBUG] Nome do template:', name);
  
  if (!name) {
    console.log('🔍 [DEBUG] Nome vazio - retornando');
    alert('Por favor, informe o nome do template.');
    return;
  }
  
  let htmlContent = editor.getHtml();
  console.log('🔍 [DEBUG] HTML content obtido, tamanho:', htmlContent.length);
  
  // Garantir que o conteúdo tenha a estrutura centralizada completa
  if (!htmlContent.includes('email-wrapper')) {
    if (!htmlContent.includes('email-container')) {
      htmlContent = `<div class="email-container">${htmlContent}</div>`;
      console.log('🔍 [DEBUG] Container principal adicionado');
    }
    htmlContent = `<div class="email-wrapper">${htmlContent}</div>`;
    console.log('🔍 [DEBUG] Wrapper centralizado adicionado');
  }
  
  const type = document.getElementById('templateType').value || 'welcome';
  console.log('🔍 [DEBUG] Tipo do template:', type);
  
  const token = localStorage.getItem('clientToken');
  console.log('🔍 [DEBUG] Token encontrado:', token ? 'SIM' : 'NÃO');
  
  if (!token) {
    console.log('🔍 [DEBUG] Token não encontrado - retornando');
    return alert('Token não encontrado');
  }
  
  const payload = {
    name,
    htmlContent,
    type
  };
  console.log('🔍 [DEBUG] Payload preparado:', payload);
  
  let url = `${window.APP_CONFIG ? window.APP_CONFIG.API_URL : (window.API_URL || 'http://localhost:3000/api')}/email-templates`;
  let method = 'POST';
  if (templateId) {
    url += `/${templateId}`;
    method = 'PATCH';
  }
  console.log('🔍 [DEBUG] URL e método:', { url, method });
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  // LOG: Exibir detalhes da requisição
  console.log('[EMAIL TEMPLATE][REQUEST]', { url, method, headers, payload });
  
  console.log('🔍 [DEBUG] Iniciando fetch...');
  fetch(url, {
    method,
    headers,
    body: JSON.stringify(payload)
  })
    .then(async res => {
      console.log('🔍 [DEBUG] Resposta recebida, status:', res.status);
      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      // LOG: Exibir resposta da API
      console.log('[EMAIL TEMPLATE][RESPONSE]', { status: res.status, data });
      if (!res.ok) {
        console.log('🔍 [DEBUG] Erro na resposta - exibindo alerta');
        alert('Erro ao salvar template: ' + (data?.message || res.status));
        return;
      }
      console.log('🔍 [DEBUG] Sucesso - exibindo alerta de sucesso');
      alert('Template salvo com sucesso!');
      // Redirecionar ou atualizar a página, se necessário
    })
    .catch((err) => {
      console.log('🔍 [DEBUG] Erro de rede capturado:', err);
      console.error('[EMAIL TEMPLATE][NETWORK ERROR]', err);
      alert('Erro de rede ao salvar template. Veja o console para detalhes.');
    });
}
// Testar (mock)
window.testEmail = function() {
  alert('Funcionalidade de teste será implementada!');
};
// Forçar grid de 2 colunas nos blocos do GrapesJS (garantia máxima)
function fixBlocksGrid() {
  const blocks = document.querySelectorAll('.blocks-container .gjs-block');
  console.log('🔧 [FIX] Aplicando grid fix em', blocks.length, 'blocos');
  
  blocks.forEach((block, index) => {
    // Forçar estilos inline (maior prioridade)
    block.style.setProperty('width', 'auto', 'important');
    block.style.setProperty('max-width', '100%', 'important');
    block.style.setProperty('min-width', '120px', 'important');
    block.style.setProperty('display', 'flex', 'important');
    block.style.setProperty('flex-direction', 'column', 'important');
    block.style.setProperty('align-items', 'center', 'important');
    block.style.setProperty('justify-content', 'center', 'important');
    block.style.setProperty('margin', '0', 'important');
    block.style.setProperty('float', 'none', 'important');
    block.style.setProperty('position', 'static', 'important');
    block.style.setProperty('clear', 'none', 'important');
    block.style.setProperty('box-sizing', 'border-box', 'important');
    
    console.log(`🔧 [FIX] Bloco ${index + 1} processado`);
  });
  
  // Forçar o container também
  const container = document.querySelector('.blocks-container');
  if (container) {
    container.style.setProperty('display', 'grid', 'important');
    container.style.setProperty('grid-template-columns', '1fr 1fr', 'important');
    container.style.setProperty('gap', '16px', 'important');
    console.log('🔧 [FIX] Container grid forçado');
  }
}
editor.on('block:add', fixBlocksGrid);
editor.on('load', fixBlocksGrid);
setTimeout(fixBlocksGrid, 1000);
setTimeout(fixBlocksGrid, 2000);
setTimeout(fixBlocksGrid, 3000);

// Sistema de eventos para manter estrutura centralizada
editor.on('component:add', function(component) {
  console.log('🔧 [EVENT] Componente adicionado, verificando estrutura...');
  setTimeout(() => ensureEmailContainer(), 100);
});

editor.on('component:update', function(component) {
  console.log('🔧 [EVENT] Componente atualizado, verificando estrutura...');
  setTimeout(() => ensureEmailContainer(), 100);
});

editor.on('component:remove', function(component) {
  console.log('🔧 [EVENT] Componente removido, verificando estrutura...');
  setTimeout(() => ensureEmailContainer(), 100);
});

// Observer para mudanças no DOM
const observer = new MutationObserver(() => {
  fixBlocksGrid();
  // Verificar estrutura centralizada periodicamente
  setTimeout(() => ensureEmailContainer(), 200);
});
observer.observe(document.body, { childList: true, subtree: true }); 

// Modelo pronto: Boas-vindas (Betterment Style)
editor.BlockManager.add('welcome-betterment', {
  label: 'Modelo: Boas-vindas (Sofisticado 1)',
  content: `
    <div style="background:#fff; border-radius:16px; box-shadow:0 2px 12px #0001; max-width:600px; margin:0 auto; padding:0 0 32px 0;">
      <img src="https://via.placeholder.com/600x180/3498db/ffffff?text=Bem-vindo%28a%29+ao+{{empresa}}" alt="Bem-vindo(a)" style="width:100%; border-radius:16px 16px 0 0;">
      <div style="padding:32px 32px 0 32px; text-align:center;">
        <h2 style="color:#2c3e50; font-size:28px; margin-bottom:12px; font-weight:700;">Olá, {{nome}}!</h2>
        <p style="color:#555; font-size:16px; margin-bottom:24px;">Seja bem-vindo(a) ao programa da <b>{{empresa}}</b>!<br>Seu acesso exclusivo já está disponível.</p>
        <a href="{{linkAcesso}}" style="background:#3498db; color:#fff; padding:16px 36px; border-radius:8px; font-weight:bold; font-size:18px; text-decoration:none; display:inline-block; margin-bottom:24px;">Acessar minha área exclusiva</a>
      </div>
      <div style="padding:0 32px;">
        <ul style="color:#2c3e50; font-size:15px; background:#f8f9fa; border-radius:8px; padding:18px 24px; margin:0; list-style:none;">
          <li style='margin-bottom:8px;'>✔️ Suporte dedicado</li>
          <li style='margin-bottom:8px;'>✔️ Conteúdos exclusivos</li>
          <li>✔️ Participação em campanhas e sorteios</li>
        </ul>
      </div>
      <div style="padding:0 32px; margin-top:32px; text-align:center; color:#aaa; font-size:13px;">Se precisar de ajuda, responda este e-mail ou fale com nosso suporte.</div>
      <div style="background:#34495e; color:white; padding:18px; text-align:center; font-size:14px; border-radius:0 0 16px 16px; margin-top:32px;">
        <p style="margin:0 0 8px 0;">© 2024 {{empresa}}. Todos os direitos reservados.</p>
        <p style="margin:0;">
          <a href="#" style="color:#3498db; text-decoration:none;">Cancelar inscrição</a> |
          <a href="#" style="color:#3498db; text-decoration:none;">Política de Privacidade</a>
        </p>
      </div>
    </div>
  `,
  category: 'Modelos',
  attributes: { class: 'fas fa-star' }
});

// Modelo pronto: Boas-vindas (Coinbase Style)
editor.BlockManager.add('welcome-coinbase', {
  label: 'Modelo: Boas-vindas (Sofisticado 2)',
  content: `
    <div style="background:#fff; border-radius:16px; box-shadow:0 2px 12px #0001; max-width:600px; margin:0 auto; padding:0 0 32px 0;">
      <img src="https://via.placeholder.com/600x160/232c3d/ffffff?text=Bem-vindo%28a%29+ao+{{empresa}}" alt="Bem-vindo(a)" style="width:100%; border-radius:16px 16px 0 0;">
      <div style="padding:32px 32px 0 32px; text-align:center;">
        <h2 style="color:#232c3d; font-size:26px; margin-bottom:10px; font-weight:700;">Bem-vindo(a), {{nome}}!</h2>
        <p style="color:#555; font-size:15px; margin-bottom:20px;">Você acaba de dar o primeiro passo para aproveitar todos os benefícios do nosso programa.<br>Confira seu acesso exclusivo abaixo:</p>
        <a href="{{linkAcesso}}" style="background:#232c3d; color:#fff; padding:14px 32px; border-radius:8px; font-weight:bold; font-size:17px; text-decoration:none; display:inline-block; margin-bottom:18px;">Acessar minha área exclusiva</a>
      </div>
      <div style="padding:0 32px; margin-top:18px;">
        <div style="background:#f8f9fa; border-radius:8px; padding:14px 18px; color:#232c3d; font-size:14px; display:flex; gap:18px; justify-content:center;">
          <div style="display:flex;align-items:center;gap:8px;"><img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" width="22" alt="">Atendimento personalizado</div>
          <div style="display:flex;align-items:center;gap:8px;"><img src="https://cdn-icons-png.flaticon.com/512/190/190406.png" width="22" alt="">Conteúdo exclusivo</div>
          <div style="display:flex;align-items:center;gap:8px;"><img src="https://cdn-icons-png.flaticon.com/512/190/190422.png" width="22" alt="">Ofertas e novidades</div>
        </div>
      </div>
      <div style="padding:0 32px; margin-top:24px; text-align:center; color:#aaa; font-size:13px;">Dúvidas? Responda este e-mail ou acesse nossa central de ajuda.</div>
      <div style="background:#232c3d; color:white; padding:18px; text-align:center; font-size:14px; border-radius:0 0 18px 18px; margin-top:28px;">
        <p style="margin:0 0 8px 0;">© 2024 {{empresa}}. Todos os direitos reservados.</p>
        <p style="margin:0;">
          <a href="#" style="color:#3498db; text-decoration:none;">Cancelar inscrição</a> |
          <a href="#" style="color:#3498db; text-decoration:none;">Política de Privacidade</a>
        </p>
      </div>
    </div>
  `,
  category: 'Modelos',
  attributes: { class: 'fas fa-star' }
}); 

// Modelo 1: Hero Impact (Betterment Style)
editor.BlockManager.add('welcome-hero-impact', {
  label: 'Modelo: Hero Impact',
  content: `
    <div style="background:#fff; border-radius:18px; box-shadow:0 4px 24px #0002; max-width:600px; margin:0 auto; overflow:hidden; font-family:'Segoe UI', Arial, sans-serif;">
      <div style="position:relative;">
        <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80" alt="Bem-vindo(a)" style="width:100%; height:180px; object-fit:cover;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,rgba(52,152,219,0.7),rgba(44,62,80,0.5));"></div>
        <h2 style="position:absolute;bottom:24px;left:32px;color:#fff;font-size:32px;font-weight:700;margin:0;">Bem-vindo(a), {{nome}}!</h2>
      </div>
      <div style="padding:32px 32px 0 32px; text-align:center;">
        <p style="color:#444; font-size:18px; margin-bottom:24px;">Você agora faz parte do <b>{{empresa}}</b>!<br>Seu acesso exclusivo já está disponível.</p>
        <a href="{{linkAcesso}}" style="background:#3498db; color:#fff; padding:16px 36px; border-radius:8px; font-weight:600; font-size:18px; text-decoration:none; display:inline-block; margin-bottom:24px;">Acessar minha área exclusiva</a>
      </div>
      <div style="padding:0 32px;">
        <ul style="color:#2c3e50; font-size:16px; background:#f8f9fa; border-radius:8px; padding:18px 24px; margin:0; list-style:none; display:flex; gap:18px; justify-content:center;">
          <li style="display:flex;align-items:center;gap:8px;"><img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" width="24" alt="">Suporte dedicado</li>
          <li style="display:flex;align-items:center;gap:8px;"><img src="https://cdn-icons-png.flaticon.com/512/190/190406.png" width="24" alt="">Conteúdos exclusivos</li>
          <li style="display:flex;align-items:center;gap:8px;"><img src="https://cdn-icons-png.flaticon.com/512/190/190422.png" width="24" alt="">Sorteios</li>
        </ul>
      </div>
      <div style="padding:0 32px; margin-top:32px; text-align:center; color:#aaa; font-size:14px;">Dúvidas? Responda este e-mail ou fale com nosso suporte.</div>
      <div style="background:#34495e; color:white; padding:18px; text-align:center; font-size:15px; border-radius:0 0 18px 18px; margin-top:32px;">
        <p style="margin:0 0 8px 0;">© 2024 {{empresa}}. Todos os direitos reservados.</p>
        <p style="margin:0;">
          <a href="#" style="color:#3498db; text-decoration:none;">Cancelar inscrição</a> |
          <a href="#" style="color:#3498db; text-decoration:none;">Política de Privacidade</a>
        </p>
      </div>
    </div>
  `,
  category: 'Modelos',
  attributes: { class: 'fas fa-star' }
});

// Modelo 2: Oferta/Onboarding (Coinbase Style)
editor.BlockManager.add('welcome-onboarding', {
  label: 'Modelo: Oferta/Onboarding',
  content: `
    <div style="background:#fff; border-radius:18px; box-shadow:0 4px 24px #0002; max-width:600px; margin:0 auto; overflow:hidden; font-family:'Segoe UI', Arial, sans-serif;">
      <img src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80" alt="Oferta" style="width:100%; height:140px; object-fit:cover;">
      <div style="padding:32px 32px 0 32px; text-align:center;">
        <h2 style="color:#232c3d; font-size:26px; margin-bottom:10px; font-weight:700;">Bem-vindo(a), {{nome}}!</h2>
        <p style="color:#555; font-size:15px; margin-bottom:20px;">Você acaba de dar o primeiro passo para aproveitar todos os benefícios do nosso programa.<br>Confira seu acesso exclusivo abaixo:</p>
        <a href="{{linkAcesso}}" style="background:#232c3d; color:#fff; padding:14px 32px; border-radius:8px; font-weight:bold; font-size:17px; text-decoration:none; display:inline-block; margin-bottom:18px;">Acessar minha área exclusiva</a>
      </div>
      <div style="padding:0 32px; margin-top:18px;">
        <div style="background:#f8f9fa; border-radius:8px; padding:14px 18px; color:#232c3d; font-size:14px; display:flex; gap:18px; justify-content:center;">
          <div style="display:flex;align-items:center;gap:8px;"><img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" width="22" alt="">Atendimento personalizado</div>
          <div style="display:flex;align-items:center;gap:8px;"><img src="https://cdn-icons-png.flaticon.com/512/190/190406.png" width="22" alt="">Conteúdo exclusivo</div>
          <div style="display:flex;align-items:center;gap:8px;"><img src="https://cdn-icons-png.flaticon.com/512/190/190422.png" width="22" alt="">Ofertas e novidades</div>
        </div>
      </div>
      <div style="padding:0 32px; margin-top:24px; text-align:center; color:#aaa; font-size:13px;">Dúvidas? Responda este e-mail ou acesse nossa central de ajuda.</div>
      <div style="background:#232c3d; color:white; padding:18px; text-align:center; font-size:14px; border-radius:0 0 18px 18px; margin-top:28px;">
        <p style="margin:0 0 8px 0;">© 2024 {{empresa}}. Todos os direitos reservados.</p>
        <p style="margin:0;">
          <a href="#" style="color:#3498db; text-decoration:none;">Cancelar inscrição</a> |
          <a href="#" style="color:#3498db; text-decoration:none;">Política de Privacidade</a>
        </p>
      </div>
    </div>
  `,
  category: 'Modelos',
  attributes: { class: 'fas fa-star' }
});

// Modelo 3: Minimalista Sofisticado
editor.BlockManager.add('welcome-minimal', {
  label: 'Modelo: Minimalista Sofisticado',
  content: `
    <div style="background:#fff; border-radius:18px; box-shadow:0 4px 24px #0002; max-width:600px; margin:0 auto; overflow:hidden; font-family:'Segoe UI', Arial, sans-serif;">
      <div style="display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3498db 60%,#2c3e50 100%);height:120px;">
        <img src="https://cdn-icons-png.flaticon.com/512/190/190406.png" width="64" alt="Welcome" style="background:#fff; border-radius:50%; box-shadow:0 2px 8px #3498db22; padding:8px;">
      </div>
      <div style="padding:32px 32px 0 32px; text-align:center;">
        <h2 style="color:#2c3e50; font-size:26px; margin-bottom:10px; font-weight:700;">Bem-vindo(a), {{nome}}!</h2>
        <p style="color:#555; font-size:15px; margin-bottom:20px;">Estamos felizes em ter você conosco.<br>Confira seu acesso exclusivo abaixo:</p>
        <a href="{{linkAcesso}}" style="background:#3498db; color:#fff; padding:14px 32px; border-radius:8px; font-weight:bold; font-size:17px; text-decoration:none; display:inline-block; margin-bottom:18px;">Acessar minha área exclusiva</a>
      </div>
      <div style="padding:0 32px; margin-top:18px;">
        <ul style="color:#2c3e50; font-size:15px; background:#f8f9fa; border-radius:8px; padding:14px 18px; margin:0; list-style:none; display:flex; gap:18px; justify-content:center;">
          <li style="display:flex;align-items:center;gap:8px;"><img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" width="22" alt="">Suporte</li>
          <li style="display:flex;align-items:center;gap:8px;"><img src="https://cdn-icons-png.flaticon.com/512/190/190406.png" width="22" alt="">Conteúdo VIP</li>
        </ul>
      </div>
      <div style="padding:0 32px; margin-top:24px; text-align:center; color:#aaa; font-size:13px;">Dúvidas? Responda este e-mail ou acesse nossa central de ajuda.</div>
      <div style="background:#2c3e50; color:white; padding:18px; text-align:center; font-size:14px; border-radius:0 0 18px 18px; margin-top:28px;">
        <p style="margin:0 0 8px 0;">© 2024 {{empresa}}. Todos os direitos reservados.</p>
        <p style="margin:0;">
          <a href="#" style="color:#3498db; text-decoration:none;">Cancelar inscrição</a> |
          <a href="#" style="color:#3498db; text-decoration:none;">Política de Privacidade</a>
        </p>
      </div>
    </div>
  `,
  category: 'Modelos',
  attributes: { class: 'fas fa-star' }
}); 