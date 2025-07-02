#!/usr/bin/env node

const { execSync } = require('child_process');

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

function main() {
  log('\n⚡ COMMIT RÁPIDO', colors.bold + colors.blue);
  log('===============', colors.blue);

  // Pegar mensagem dos argumentos
  const args = process.argv.slice(2);
  const message = args.join(' ');

  if (!message) {
    log('\n❌ Erro: Mensagem do commit é obrigatória!', colors.red);
    log('\n📋 Uso:', colors.cyan);
    log('  npm run quick-commit "sua mensagem aqui"', colors.reset);
    log('  npm run quick-commit fix: corrige bug na autenticação', colors.reset);
    log('  npm run quick-commit feat: adiciona nova funcionalidade', colors.reset);
    log('\n💡 Para commits mais elaborados, use: npm run commit', colors.yellow);
    process.exit(1);
  }

  try {
    // Verificar se há alterações
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (!status.trim()) {
      log('\n✅ Nenhuma alteração para commitar!', colors.green);
      process.exit(0);
    }

    log('\n📂 Alterações detectadas:', colors.yellow);
    console.log(status);

    // Fazer commit
    if (!runCommand('git add .', 'Adicionando arquivos ao staging')) process.exit(1);
    if (!runCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`, 'Fazendo commit')) process.exit(1);
    if (!runCommand('git push origin main', 'Push para repositório')) process.exit(1);

    log('\n🎉 COMMIT RÁPIDO CONCLUÍDO!', colors.bold + colors.green);
    log('============================', colors.green);
    log(`\n📝 Mensagem: ${message}`, colors.cyan);
    log('🚂 Deploy automático iniciará em alguns segundos...', colors.cyan);

    log('\n🔗 Links para monitoramento:', colors.blue);
    log('• Railway: https://railway.app/dashboard', colors.reset);
    log('• Vercel: https://vercel.com/dashboard', colors.reset);

  } catch (error) {
    log(`\n❌ Erro durante o commit: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main(); 