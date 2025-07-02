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

async function main() {
  log('\n🔄 REDEPLOY RÁPIDO - RAILWAY', colors.bold + colors.blue);
  log('============================', colors.blue);

  try {
    // Verificar se há alterações pendentes
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        log('\n⚠️ Há alterações não commitadas!', colors.yellow);
        console.log(status);
        
        const continuar = await askQuestion('\n❓ Deseja fazer commit antes do redeploy? (Y/n): ');
        if (continuar.toLowerCase() !== 'n') {
          const commit = await askQuestion('💬 Mensagem do commit: ');
          if (commit) {
            if (!runCommand('git add .', 'Adicionando arquivos')) process.exit(1);
            if (!runCommand(`git commit -m "${commit}"`, 'Fazendo commit')) process.exit(1);
            if (!runCommand('git push origin main', 'Push das alterações')) process.exit(1);
          }
        }
      }
    } catch (error) {
      log('❌ Erro ao verificar status do git', colors.red);
    }

    // Trigger redeploy
    log('\n🚂 Triggerando redeploy no Railway...', colors.yellow);
    const timestamp = new Date().toLocaleString('pt-BR');
    const reason = await askQuestion('🤔 Motivo do redeploy (opcional): ') || 'Manual redeploy';
    
    if (!runCommand(`echo "# Redeploy: ${timestamp} - ${reason}" >> server/trigger-redeploy.txt`, 'Modificando trigger file')) process.exit(1);
    if (!runCommand('git add server/trigger-redeploy.txt', 'Adicionando trigger file')) process.exit(1);
    if (!runCommand(`git commit -m "chore(railway): ${reason} - ${timestamp}"`, 'Commit do trigger')) process.exit(1);
    if (!runCommand('git push origin main', 'Push do trigger')) process.exit(1);

    // Informações finais
    log('\n🎉 REDEPLOY TRIGGERADO COM SUCESSO!', colors.bold + colors.green);
    log('=====================================', colors.green);
    log('\n📋 Próximos passos:', colors.yellow);
    log('1. Aguarde 2-3 minutos para o Railway detectar a mudança', colors.reset);
    log('2. Acesse: https://railway.app/dashboard para monitorar', colors.reset);
    log('3. Verifique os logs durante o redeploy', colors.reset);
    
    log('\n🔗 Links úteis:', colors.blue);
    log('• Railway Dashboard: https://railway.app/dashboard', colors.reset);
    log('• Status do sistema: npm run status', colors.reset);

  } catch (error) {
    log(`\n❌ Erro durante o redeploy: ${error.message}`, colors.red);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main(); 