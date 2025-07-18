#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TESTE - ROTAS DE INDICAÇÃO
 * Testa as rotas públicas de indicação para diagnosticar problemas
 */

const https = require('https');
const http = require('http');

// Configurações
const TEST_CONFIG = {
  vercel: {
    baseUrl: 'https://app.virallead.com.br',
    testCode: 'MCKK8K9V057650'
  },
  railway: {
    baseUrl: 'https://programa-indicacao-multicliente-production.up.railway.app',
    testCode: 'MCKK8K9V057650'
  }
};

// Função para fazer requisição HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: 'GET',
      headers: {
        'User-Agent': 'Test-Script/1.0',
        'Accept': 'text/html,application/json',
        ...options.headers
      },
      timeout: 10000,
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Função para testar uma URL
async function testUrl(baseUrl, testCode, description) {
  console.log(`\n🧪 TESTANDO: ${description}`);
  console.log(`📍 URL: ${baseUrl}/indicacao/${testCode}`);
  
  try {
    const response = await makeRequest(`${baseUrl}/indicacao/${testCode}`);
    
    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`📋 Content-Type: ${response.headers['content-type']}`);
    console.log(`📏 Content-Length: ${response.headers['content-length'] || 'N/A'}`);
    
    if (response.statusCode === 200) {
      console.log(`✅ SUCESSO: Página carregada corretamente`);
      
      // Verificar se é HTML
      if (response.data.includes('<html') || response.data.includes('<!DOCTYPE')) {
        console.log(`✅ CONFIRMADO: Retornando HTML válido`);
      } else {
        console.log(`⚠️ ATENÇÃO: Não parece ser HTML válido`);
        console.log(`📄 Primeiros 200 caracteres:`, response.data.substring(0, 200));
      }
    } else if (response.statusCode === 307 || response.statusCode === 302) {
      console.log(`🔄 REDIRECIONAMENTO: ${response.headers.location}`);
    } else {
      console.log(`❌ ERRO: Status ${response.statusCode}`);
      console.log(`📄 Resposta:`, response.data.substring(0, 500));
    }
    
  } catch (error) {
    console.log(`💥 ERRO: ${error.message}`);
  }
}

// Função para testar preview
async function testPreview(baseUrl, testCode, description) {
  console.log(`\n🧪 TESTANDO PREVIEW: ${description}`);
  console.log(`📍 URL: ${baseUrl}/indicacao/${testCode}/preview`);
  
  try {
    const response = await makeRequest(`${baseUrl}/indicacao/${testCode}/preview`);
    
    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`📋 Content-Type: ${response.headers['content-type']}`);
    
    if (response.statusCode === 200) {
      console.log(`✅ SUCESSO: Preview carregado`);
      try {
        const jsonData = JSON.parse(response.data);
        console.log(`📊 Dados do preview:`, {
          success: jsonData.success,
          indicador: jsonData.indicador?.name,
          targetLP: jsonData.targetLP?.name,
          redirectUrl: jsonData.redirectUrl
        });
      } catch (e) {
        console.log(`⚠️ Resposta não é JSON válido`);
      }
    } else {
      console.log(`❌ ERRO: Status ${response.statusCode}`);
      console.log(`📄 Resposta:`, response.data.substring(0, 300));
    }
    
  } catch (error) {
    console.log(`💥 ERRO: ${error.message}`);
  }
}

// Função principal
async function runTests() {
  console.log(`🚀 INICIANDO TESTES DE ROTAS DE INDICAÇÃO`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  // Teste 1: Vercel (domínio personalizado)
  await testUrl(TEST_CONFIG.vercel.baseUrl, TEST_CONFIG.vercel.testCode, 'VERCEL (Domínio Personalizado)');
  
  // Teste 2: Railway (diretamente)
  await testUrl(TEST_CONFIG.railway.baseUrl, TEST_CONFIG.railway.testCode, 'RAILWAY (Direto)');
  
  // Teste 3: Preview no Vercel
  await testPreview(TEST_CONFIG.vercel.baseUrl, TEST_CONFIG.vercel.testCode, 'PREVIEW VERCEL');
  
  // Teste 4: Preview no Railway
  await testPreview(TEST_CONFIG.railway.baseUrl, TEST_CONFIG.railway.testCode, 'PREVIEW RAILWAY');
  
  console.log(`\n🏁 TESTES CONCLUÍDOS`);
}

// Executar testes
runTests().catch(console.error); 