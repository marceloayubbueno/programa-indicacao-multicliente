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
  log('\n🚀 DEPLOY AUTOMÁTICO - PROGRAMA DE INDICAÇÃO', colors.bold + colors.blue);
  log('================================================', colors.blue);

  try {
    // 1. Verificar status do git
    log('\n📋 ETAPA 1: Verificando status do repositório...', colors.yellow);
    
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        log('📝 Alterações detectadas:', colors.yellow);
        console.log(status);
        
        const commit = await askQuestion('\n💬 Digite a mensagem do commit: ');
        if (!commit) {
          log('❌ Mensagem de commit é obrigatória!', colors.red);
          process.exit(1);
        }

        // Adicionar e commitar
        if (!runCommand('git add .', 'Adicionando arquivos ao staging')) process.exit(1);
        if (!runCommand(`git commit -m "${commit}"`, 'Fazendo commit')) process.exit(1);
      } else {
        log('✅ Repositório limpo - nenhuma alteração pendente', colors.green);
      }
    } catch (error) {
      log('❌ Erro ao verificar status do git', colors.red);
      process.exit(1);
    }

    // 2. Testar build local
    log('\n🏗️ ETAPA 2: Testando build local...', colors.yellow);
    if (!runCommand('cd server && npm run build', 'Build do backend')) {
      const continuar = await askQuestion('\n⚠️ Build falhou. Continuar mesmo assim? (y/N): ');
      if (continuar.toLowerCase() !== 'y') {
        log('🛑 Deploy cancelado pelo usuário', colors.yellow);
        process.exit(1);
      }
    }

    // 3. Push para repositório
    log('\n📤 ETAPA 3: Enviando para repositório...', colors.yellow);
    if (!runCommand('git push origin main', 'Push para GitHub')) process.exit(1);

    // 4. Trigger redeploy no Railway
    log('\n🚂 ETAPA 4: Triggerando redeploy no Railway...', colors.yellow);
    const timestamp = new Date().toLocaleString('pt-BR');
    if (!runCommand(`echo "# Deploy: ${timestamp}" >> server/trigger-redeploy.txt`, 'Modificando trigger file')) process.exit(1);
    if (!runCommand('git add server/trigger-redeploy.txt', 'Adicionando trigger file')) process.exit(1);
    if (!runCommand(`git commit -m "chore(railway): trigger redeploy - ${timestamp}"`, 'Commit do trigger')) process.exit(1);
    if (!runCommand('git push origin main', 'Push do trigger')) process.exit(1);

    // 5. Informações finais
    log('\n🎉 DEPLOY CONCLUÍDO COM SUCESSO!', colors.bold + colors.green);
    log('=====================================', colors.green);
    log('\n📋 Próximos passos:', colors.yellow);
    log('1. Aguarde 2-3 minutos para o Railway fazer o redeploy', colors.reset);
    log('2. Acesse: https://railway.app/dashboard para monitorar', colors.reset);
    log('3. Teste a aplicação quando o deploy estiver completo', colors.reset);
    
    log('\n🔗 Links úteis:', colors.blue);
    log('• Railway Dashboard: https://railway.app/dashboard', colors.reset);
    log('• Vercel Dashboard: https://vercel.com/dashboard', colors.reset);
    log('• Para ver logs: npm run logs', colors.reset);

  } catch (error) {
    log(`\n❌ Erro durante o deploy: ${error.message}`, colors.red);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main(); 