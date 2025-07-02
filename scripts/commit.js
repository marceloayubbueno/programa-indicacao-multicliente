#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`\n🔄 ${description}...`, colors.blue);
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} - Concluído!`, colors.green);
    return true;
  } catch (error) {
    log(`❌ Erro em: ${description}`, colors.red);
    log(`Comando: ${command}`, colors.yellow);
    log(`Erro: ${error.message}`, colors.red);
    return false;
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

const commitTypes = {
  '1': { type: 'feat', desc: 'Nova funcionalidade', emoji: '✨' },
  '2': { type: 'fix', desc: 'Correção de bug', emoji: '🐛' },
  '3': { type: 'docs', desc: 'Documentação', emoji: '📝' },
  '4': { type: 'style', desc: 'Formatação/estilo', emoji: '💄' },
  '5': { type: 'refactor', desc: 'Refatoração', emoji: '♻️' },
  '6': { type: 'test', desc: 'Testes', emoji: '🧪' },
  '7': { type: 'chore', desc: 'Tarefas/configuração', emoji: '🔧' },
  '8': { type: 'perf', desc: 'Melhoria de performance', emoji: '⚡' },
  '9': { type: 'ci', desc: 'CI/CD', emoji: '👷' },
  '10': { type: 'build', desc: 'Build/dependências', emoji: '📦' }
};

const scopes = {
  '1': 'client',
  '2': 'server', 
  '3': 'admin',
  '4': 'auth',
  '5': 'api',
  '6': 'db',
  '7': 'ui',
  '8': 'lp',
  '9': 'config',
  '10': 'deploy'
};

async function main() {
  log('\n📝 COMMIT INTELIGENTE - PROGRAMA DE INDICAÇÃO', colors.bold + colors.blue);
  log('==============================================', colors.blue);

  try {
    // Verificar se há alterações para commitar
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (!status.trim()) {
      log('\n✅ Nenhuma alteração para commitar!', colors.green);
      log('📋 Use "git status" para verificar o status do repositório', colors.cyan);
      process.exit(0);
    }

    log('\n📂 Alterações detectadas:', colors.yellow);
    console.log(status);

    // Escolher tipo do commit
    log('\n🏷️ Escolha o TIPO do commit:', colors.cyan);
    Object.entries(commitTypes).forEach(([key, { type, desc, emoji }]) => {
      log(`${key.padStart(2)}: ${emoji} ${type.padEnd(8)} - ${desc}`, colors.reset);
    });

    const typeChoice = await askQuestion('\n💡 Digite o número do tipo: ');
    const selectedType = commitTypes[typeChoice];
    
    if (!selectedType) {
      log('❌ Tipo inválido!', colors.red);
      process.exit(1);
    }

    // Escolher escopo (opcional)
    log('\n🎯 Escolha o ESCOPO (opcional):', colors.cyan);
    Object.entries(scopes).forEach(([key, scope]) => {
      log(`${key.padStart(2)}: ${scope}`, colors.reset);
    });
    log(' 0: Nenhum escopo', colors.yellow);

    const scopeChoice = await askQuestion('\n🎯 Digite o número do escopo (0 para nenhum): ');
    const selectedScope = scopeChoice === '0' ? '' : scopes[scopeChoice];

    // Mensagem principal
    const message = await askQuestion('\n💬 Descreva a alteração (presente, imperativo): ');
    if (!message) {
      log('❌ Mensagem é obrigatória!', colors.red);
      process.exit(1);
    }

    // Descrição adicional (opcional)
    const description = await askQuestion('\n📄 Descrição adicional (opcional): ');

    // Montar mensagem final
    const scope = selectedScope ? `(${selectedScope})` : '';
    const commitMessage = `${selectedType.type}${scope}: ${message}`;
    const fullMessage = description ? `${commitMessage}\n\n${description}` : commitMessage;

    // Mostrar preview
    log('\n📋 Preview do commit:', colors.cyan);
    log('─'.repeat(50), colors.blue);
    log(fullMessage, colors.yellow);
    log('─'.repeat(50), colors.blue);

    const confirm = await askQuestion('\n✅ Confirma o commit? (Y/n): ');
    if (confirm.toLowerCase() === 'n') {
      log('🛑 Commit cancelado!', colors.yellow);
      process.exit(0);
    }

    // Fazer o commit
    if (!runCommand('git add .', 'Adicionando arquivos ao staging')) process.exit(1);
    if (!runCommand(`git commit -m "${fullMessage.replace(/"/g, '\\"')}"`, 'Fazendo commit')) process.exit(1);

    // Perguntar sobre push
    const pushNow = await askQuestion('\n🚀 Fazer push agora? (Y/n): ');
    if (pushNow.toLowerCase() !== 'n') {
      if (!runCommand('git push origin main', 'Push para repositório')) process.exit(1);
      
      log('\n🎉 COMMIT E PUSH CONCLUÍDOS!', colors.bold + colors.green);
      log('==============================', colors.green);
      log('\n🚂 Vercel e Railway farão deploy automático em alguns minutos', colors.cyan);
    } else {
      log('\n✅ COMMIT CONCLUÍDO!', colors.bold + colors.green);
      log('===================', colors.green);
      log('\n📤 Use "git push origin main" quando quiser enviar as alterações', colors.cyan);
    }

  } catch (error) {
    log(`\n❌ Erro durante o commit: ${error.message}`, colors.red);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main(); 