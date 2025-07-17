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
        console.log(`   ✅ Status: ${res.statusCode} (${res.statusCode === 200 ? 'OK' : res.statusCode === 404 ? 'NOT_FOUND' : 'OUTRO'})`);
        console.log(`   📄 Preview: ${data.slice(0, 150)}...`);
        console.log('');
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ ERRO: ${err.message}`);
      console.log('');
      resolve();
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      console.log(`   ⏰ TIMEOUT`);
      console.log('');
      resolve();
    });
  });
}

async function testRailwayDireto() {
  console.log('🚂 TESTE DIRETO NO RAILWAY');
  console.log('===========================\n');
  
  await testUrl('https://programa-indicacao-multicliente-production.up.railway.app/api/health', 'Health check do Railway');
  await testUrl('https://programa-indicacao-multicliente-production.up.railway.app/indicacao/ABC123', 'Link indicação direto no Railway');
  await testUrl('https://programa-indicacao-multicliente-production.up.railway.app/indicacao/ABC123/preview', 'Preview de indicação no Railway');
  
  console.log('🎯 CONCLUSÃO:');
  console.log('• Se o Railway retorna 404 para códigos fictícios = ✅ Normal');
  console.log('• Se o Railway retorna 200 ou HTML = ✅ Funcionando');
  console.log('• Se retorna erro = ❌ Problema no Railway');
}

testRailwayDireto().catch(console.error); 