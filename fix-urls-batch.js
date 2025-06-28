const fs = require('fs');
const path = require('path');

// Lista de arquivos que precisam ser corrigidos
const filesToFix = [
  'client/js/teste-gratis.js',
  'client/js/rewards.js', 
  'client/js/reward-type-editor.js',
  'client/js/referrals.js',
  'client/js/payments.js',
  'client/js/my-data.js',
  'client/js/lp-indicadores.js',
  'client/js/lp-indicadores-success.js',
  'client/js/lp-indicador-form-public.js',
  'client/js/indicators.js',
  'client/js/indication.js',
  'client/js/editar-participante.js',
  'client/admin/js/users.js',
  'client/admin/js/plans.js',
  'client/admin/js/clients.js',
  'client/admin/js/auth.js',
  'client/admin/js/admin-login.js'
];

// Função para obter API_URL dinâmica
const getApiUrlFunction = `// 🔧 CORREÇÃO: Função para obter API_URL de forma segura
function getApiUrl() {
    return window.API_URL || 
           (window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
           (window.location.hostname === 'localhost' ? 
            'http://localhost:3000/api' : 
            'https://programa-indicacao-multicliente-production.up.railway.app/api'));
}`;

// Padrões de substituição
const replacements = [
  // API_URL hardcoded
  {
    pattern: /const API_URL = window\.API_URL \|\| \(window\.location\.hostname === 'localhost' \?\s*'http:\/\/localhost:3000\/api' :\s*'https:\/\/programa-indicacao-multicliente-production\.up\.railway\.app\/api'\);/g,
    replacement: `${getApiUrlFunction}\n\nconst API_URL = getApiUrl();`
  },
  {
    pattern: /const API_URL = window\.APP_CONFIG \? window\.APP_CONFIG\.API_URL :\s*\(window\.location\.hostname === 'localhost' \?\s*'http:\/\/localhost:3000\/api' :\s*'https:\/\/programa-indicacao-multicliente-production\.up\.railway\.app\/api'\);/g,
    replacement: `const API_URL = getApiUrl();`
  },
  // URLs hardcoded inline
  {
    pattern: /'http:\/\/localhost:3000\/api'/g,
    replacement: 'getApiUrl()'
  },
  {
    pattern: /'http:\/\/localhost:3000'/g,
    replacement: "(window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://programa-indicacao-multicliente-production.up.railway.app')"
  },
  // Template literals
  {
    pattern: /`http:\/\/localhost:3000\/api`/g,
    replacement: '`${getApiUrl()}`'
  },
  {
    pattern: /`http:\/\/localhost:3000`/g,
    replacement: "`${window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://programa-indicacao-multicliente-production.up.railway.app'}`"
  }
];

console.log('🔧 Iniciando correção em lote dos URLs localhost...');

filesToFix.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Verificar se já tem a função getApiUrl
    if (!content.includes('function getApiUrl()')) {
      // Adicionar função no início do arquivo (após comentários)
      const lines = content.split('\n');
      let insertIndex = 0;
      
      // Pular comentários do início
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.includes('*/')) {
          insertIndex = i + 1;
        } else {
          break;
        }
      }
      
      lines.splice(insertIndex, 0, '', getApiUrlFunction, '');
      content = lines.join('\n');
      modified = true;
    }

    // Aplicar substituições
    replacements.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
    } else {
      console.log(`ℹ️  Já atualizado: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
  }
});

console.log('🎉 Correção em lote concluída!'); 