#!/usr/bin/env node

const { execSync } = require('child_process');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommandQuiet(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    return null;
  }
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleString('pt-BR');
  } catch {
    return dateString;
  }
}

function main() {
  log('\n📊 STATUS DO SISTEMA - PROGRAMA DE INDICAÇÃO', colors.bold + colors.blue);
  log('==============================================', colors.blue);

  try {
    // Status Git
    log('\n📂 STATUS DO REPOSITÓRIO:', colors.cyan);
    log('─'.repeat(30), colors.blue);
    
    const currentBranch = runCommandQuiet('git branch --show-current');
    const lastCommit = runCommandQuiet('git log -1 --pretty=format:"%h - %s (%an, %ar)"');
    const status = runCommandQuiet('git status --porcelain');
    const remoteStatus = runCommandQuiet('git status -sb');

    log(`🌿 Branch atual: ${currentBranch || 'N/A'}`, colors.green);
    log(`📝 Último commit: ${lastCommit || 'N/A'}`, colors.reset);
    
    if (status) {
      log('⚠️ Alterações pendentes:', colors.yellow);
      console.log(status);
    } else {
      log('✅ Repositório limpo', colors.green);
    }

    if (remoteStatus && remoteStatus.includes('ahead')) {
      log('📤 Há commits locais não enviados', colors.yellow);
    } else if (remoteStatus && remoteStatus.includes('behind')) {
      log('📥 Há commits remotos não baixados', colors.yellow);
    } else {
      log('🔄 Sincronizado com origin', colors.green);
    }

    // Informações dos ambientes
    log('\n🌐 AMBIENTES DE DEPLOY:', colors.cyan);
    log('─'.repeat(30), colors.blue);

    log('🚂 Railway (Backend):', colors.yellow);
    log('  • Dashboard: https://railway.app/dashboard', colors.reset);
    log('  • Status: Verificar no dashboard', colors.reset);
    log('  • Deploy automático: Ativo', colors.green);

    log('\n▲ Vercel (Frontend):', colors.yellow);
    log('  • Dashboard: https://vercel.com/dashboard', colors.reset);
    log('  • Status: Verificar no dashboard', colors.reset);
    log('  • Deploy automático: Ativo', colors.green);

    // Comandos disponíveis
    log('\n🛠️ COMANDOS DISPONÍVEIS:', colors.cyan);
    log('─'.repeat(30), colors.blue);

    const commands = [
      { cmd: 'npm run dev', desc: 'Iniciar desenvolvimento local' },
      { cmd: 'npm run commit', desc: 'Commit interativo com padrões' },
      { cmd: 'npm run quick-commit "msg"', desc: 'Commit rápido' },
      { cmd: 'npm run deploy', desc: 'Deploy completo (build + push)' },
      { cmd: 'npm run redeploy', desc: 'Redeploy rápido (só trigger)' },
      { cmd: 'npm run status', desc: 'Este comando (status)' },
      { cmd: 'npm run test-prod', desc: 'Testar produção' },
      { cmd: 'npm run logs', desc: 'Links para logs' }
    ];

    commands.forEach(({ cmd, desc }) => {
      log(`  ${cmd.padEnd(25)} - ${desc}`, colors.reset);
    });

    // URLs importantes
    log('\n🔗 LINKS IMPORTANTES:', colors.cyan);
    log('─'.repeat(30), colors.blue);
    
    log('📋 Dashboards:', colors.yellow);
    log('  • Railway: https://railway.app/dashboard', colors.reset);
    log('  • Vercel: https://vercel.com/dashboard', colors.reset);
    log('  • GitHub: https://github.com/marceloayubbueno/programa-indicacao-multicliente', colors.reset);

    log('\n🌐 Aplicações:', colors.yellow);
    log('  • Frontend: https://programa-indicacao-multicliente.vercel.app/', colors.reset);
    log('  • Backend: https://programa-indicacao-multicliente-production.up.railway.app/api', colors.reset);
    log('  • Admin: https://programa-indicacao-multicliente.vercel.app/admin/pages/login.html', colors.reset);

    // Últimas alterações
    log('\n📈 ÚLTIMOS COMMITS:', colors.cyan);
    log('─'.repeat(30), colors.blue);
    
    const recentCommits = runCommandQuiet('git log -5 --pretty=format:"%h %s (%ar)"');
    if (recentCommits) {
      recentCommits.split('\n').forEach(commit => {
        log(`  ${commit}`, colors.reset);
      });
    }

    // Dicas
    log('\n💡 DICAS RÁPIDAS:', colors.cyan);
    log('─'.repeat(30), colors.blue);
    log('• Para mudanças pequenas: npm run quick-commit "mensagem"', colors.yellow);
    log('• Para mudanças grandes: npm run commit (interativo)', colors.yellow);
    log('• Para redeploy: npm run redeploy', colors.yellow);
    log('• Para desenvolvimento: npm run dev', colors.yellow);

  } catch (error) {
    log(`\n❌ Erro ao obter status: ${error.message}`, colors.red);
  }
}

main(); 