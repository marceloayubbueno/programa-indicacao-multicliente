#!/usr/bin/env node

const https = require('https');
const http = require('http');

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

function makeRequest(url, timeout = 10000) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = protocol.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          responseTime,
          data: data.substring(0, 200), // Primeiros 200 chars
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        success: false,
        error: error.message,
        responseTime
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      resolve({
        success: false,
        error: 'Timeout',
        responseTime
      });
    });
  });
}

function formatResponseTime(ms) {
  if (ms < 500) return `${ms}ms (rápido)`;
  if (ms < 1000) return `${ms}ms (normal)`;
  if (ms < 2000) return `${ms}ms (lento)`;
  return `${ms}ms (muito lento)`;
}

async function testEndpoint(name, url, expectedStatus = 200) {
  log(`\n🔍 Testando ${name}...`, colors.blue);
  log(`   URL: ${url}`, colors.cyan);
  
  const result = await makeRequest(url);
  
  if (!result.success) {
    log(`   ❌ FALHOU: ${result.error}`, colors.red);
    log(`   ⏱️ Tempo: ${formatResponseTime(result.responseTime)}`, colors.yellow);
    return false;
  }
  
  const statusOk = result.status === expectedStatus;
  const statusColor = statusOk ? colors.green : colors.red;
  const statusIcon = statusOk ? '✅' : '❌';
  
  log(`   ${statusIcon} Status: ${result.status} ${statusOk ? '(OK)' : '(ERRO)'}`, statusColor);
  log(`   ⏱️ Tempo: ${formatResponseTime(result.responseTime)}`, 
      result.responseTime < 1000 ? colors.green : colors.yellow);
  
  if (result.data) {
    const preview = result.data.replace(/\n/g, ' ').substring(0, 100);
    log(`   📄 Preview: ${preview}${result.data.length > 100 ? '...' : ''}`, colors.reset);
  }
  
  return statusOk;
}

async function main() {
  log('\n🧪 TESTE DE PRODUÇÃO - PROGRAMA DE INDICAÇÃO', colors.bold + colors.blue);
  log('=============================================', colors.blue);

  const tests = [
    {
      name: 'Backend API (Health)',
      url: 'https://programa-indicacao-multicliente-production.up.railway.app/api/',
      expectedStatus: 200
    },
    {
      name: 'Frontend (Home)',
      url: 'https://programa-indicacao-multicliente.vercel.app/',
      expectedStatus: 200
    },
    {
      name: 'Frontend (Login)',
      url: 'https://programa-indicacao-multicliente.vercel.app/pages/login.html',
      expectedStatus: 200
    },
    {
      name: 'Admin (Login)',
      url: 'https://programa-indicacao-multicliente.vercel.app/admin/pages/login.html',
      expectedStatus: 200
    },
    {
      name: 'LP Indicadores',
      url: 'https://programa-indicacao-multicliente.vercel.app/pages/lp-indicadores.html',
      expectedStatus: 200
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  log('\n📋 Executando testes...', colors.yellow);

  for (const test of tests) {
    const passed = await testEndpoint(test.name, test.url, test.expectedStatus);
    if (passed) passedTests++;
  }

  // Resumo
  log('\n📊 RESUMO DOS TESTES:', colors.cyan);
  log('─'.repeat(25), colors.blue);
  
  const allPassed = passedTests === totalTests;
  const summaryColor = allPassed ? colors.green : colors.red;
  const summaryIcon = allPassed ? '✅' : '❌';
  
  log(`${summaryIcon} Testes passaram: ${passedTests}/${totalTests}`, summaryColor);
  
  if (allPassed) {
    log('\n🎉 TODOS OS TESTES PASSARAM!', colors.bold + colors.green);
    log('Sistema funcionando corretamente ✅', colors.green);
  } else {
    log('\n⚠️ ALGUNS TESTES FALHARAM!', colors.bold + colors.red);
    log('Verifique os logs e dashboards para mais detalhes', colors.yellow);
  }

  // Links úteis
  log('\n🔗 MONITORAMENTO:', colors.cyan);
  log('─'.repeat(20), colors.blue);
  log('• Railway Dashboard: https://railway.app/dashboard', colors.reset);
  log('• Vercel Dashboard: https://vercel.com/dashboard', colors.reset);
  log('• GitHub Repository: https://github.com/marceloayubbueno/programa-indicacao-multicliente', colors.reset);

  log('\n💡 DICAS:', colors.cyan);
  log('─'.repeat(10), colors.blue);
  if (!allPassed) {
    log('• Se backend falhou: Verifique Railway Dashboard', colors.yellow);
    log('• Se frontend falhou: Verifique Vercel Dashboard', colors.yellow);
    log('• Para redeploy: npm run redeploy', colors.yellow);
  }
  log('• Execute este teste novamente: npm run test-prod', colors.yellow);
  log('• Para status completo: npm run status', colors.yellow);

  process.exit(allPassed ? 0 : 1);
}

main(); 