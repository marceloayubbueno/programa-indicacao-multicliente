const https = require('https');

// Função para testar URL
function testUrl(url, description) {
  return new Promise((resolve) => {
    console.log(`🔍 ${description}...`);
    console.log(`   URL: ${url}`);
    
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   ✅ Status: ${res.statusCode} (${res.statusCode === 200 ? 'OK' : res.statusCode === 404 ? 'NOT_FOUND' : 'ERRO'})`);
        if (res.statusCode === 404) {
          console.log(`   ❌ PROBLEMA: Link retorna 404!`);
        }
        console.log(`   📄 Preview: ${data.slice(0, 100)}...`);
        console.log('');
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ ERRO: ${err.message}`);
      console.log('');
      resolve();
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`   ⏰ TIMEOUT: Requisição demorou mais de 10s`);
      console.log('');
      resolve();
    });
  });
}

// Testes de links de indicação
async function testIndicacaoLinks() {
  console.log('🧪 TESTE DE LINKS DE INDICAÇÃO');
  console.log('================================\n');
  
  await testUrl('https://app.virallead.com.br/indicacao/ABC123', 'Testando link de indicação (código fictício 1)');
  await testUrl('https://app.virallead.com.br/indicacao/TEST456', 'Testando link de indicação (código fictício 2)');
  await testUrl('https://app.virallead.com.br/indicacao/XYZ789', 'Testando link de indicação (código fictício 3)');
  
  console.log('🎯 ANÁLISE DOS RESULTADOS:');
  console.log('═══════════════════════════');
  console.log('• Status 404: Normal para códigos fictícios - sistema funcionando');
  console.log('• Status 200: Pode indicar problema no proxy ou código válido');
  console.log('• Erro de conexão: Problema de configuração');
  console.log('');
}

testIndicacaoLinks().catch(console.error); 