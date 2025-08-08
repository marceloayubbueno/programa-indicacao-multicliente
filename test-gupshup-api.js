/**
 * TESTE DE CONCEITO - API GUPSHUP (CORRIGIDO)
 * 
 * Objetivo: Validar envio de mensagem simples
 * Data: 2025-01-04
 * Status: Teste inicial
 */

const axios = require('axios');

// Configurações da API Gupshup (CORRIGIDO)
const GUPSHUP_CONFIG = {
  apiKey: 'ojlftrm5pv02cemljepf29g86wyrpuk8',
  appName: 'ViralLeadWhatsApp',
  baseUrl: 'https://api.gupshup.io/wa/api/v1',
  sourceNumber: '15557777720' // Número técnico da plataforma
};

/**
 * Teste 1: Envio de mensagem simples (CORRIGIDO)
 */
async function testSendSimpleMessage() {
  console.log('=== TESTE 1: ENVIO DE MENSAGEM SIMPLES ===');
  
  try {
    // Formato correto da API Gupshup
    const messageData = {
      channel: 'whatsapp',
      source: GUPSHUP_CONFIG.sourceNumber,
      destination: '5528999468999', // Sem o + no início
      message: {
        type: 'text',
        text: 'Olá! Este é um teste do sistema Viral Lead. Se você recebeu esta mensagem, a configuração está funcionando perfeitamente! 🎉'
      }
    };

    console.log('Enviando mensagem...');
    console.log('De:', GUPSHUP_CONFIG.sourceNumber);
    console.log('Para:', '5528999468999');
    console.log('Mensagem:', messageData.message.text);

    const response = await axios.post(
      `${GUPSHUP_CONFIG.baseUrl}/msg`,
      messageData,
      {
        headers: {
          'apikey': GUPSHUP_CONFIG.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ SUCESSO!');
    console.log('Response:', response.data);
    
    return {
      success: true,
      messageId: response.data?.messageId,
      status: response.data?.status
    };

  } catch (error) {
    console.error('❌ ERRO NO ENVIO:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Teste 2: Verificar status da conta (CORRIGIDO)
 */
async function testAccountStatus() {
  console.log('\n=== TESTE 2: STATUS DA CONTA ===');
  
  try {
    // Endpoint correto para verificar conta
    const response = await axios.get(
      `${GUPSHUP_CONFIG.baseUrl}/account/status`,
      {
        headers: {
          'apikey': GUPSHUP_CONFIG.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ STATUS DA CONTA:');
    console.log('Response:', response.data);
    
    return {
      success: true,
      accountStatus: response.data
    };

  } catch (error) {
    console.error('❌ ERRO AO VERIFICAR STATUS:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Teste 3: Verificar número de telefone (CORRIGIDO)
 */
async function testPhoneNumberStatus() {
  console.log('\n=== TESTE 3: STATUS DO NÚMERO ===');
  
  try {
    // Endpoint correto para verificar número
    const response = await axios.get(
      `${GUPSHUP_CONFIG.baseUrl}/phone/${GUPSHUP_CONFIG.sourceNumber}/status`,
      {
        headers: {
          'apikey': GUPSHUP_CONFIG.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ STATUS DO NÚMERO:');
    console.log('Response:', response.data);
    
    return {
      success: true,
      phoneStatus: response.data
    };

  } catch (error) {
    console.error('❌ ERRO AO VERIFICAR NÚMERO:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Teste 4: Verificar documentação da API
 */
async function testApiDocumentation() {
  console.log('\n=== TESTE 4: VERIFICAR DOCUMENTAÇÃO ===');
  
  try {
    // Tentar acessar documentação da API
    const response = await axios.get(
      'https://www.gupshup.io/developer/docs/bot-platform/guide/whatsapp-message-send',
      {
        headers: {
          'Accept': 'text/html'
        }
      }
    );

    console.log('✅ DOCUMENTAÇÃO ACESSÍVEL');
    console.log('Status:', response.status);
    
    return {
      success: true,
      documentation: 'Acessível'
    };

  } catch (error) {
    console.error('❌ ERRO AO ACESSAR DOCUMENTAÇÃO:');
    console.error('Status:', error.response?.status);
    
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('🚀 INICIANDO TESTES DE CONCEITO - API GUPSHUP (CORRIGIDO)');
  console.log('Data:', new Date().toISOString());
  console.log('API Key:', GUPSHUP_CONFIG.apiKey);
  console.log('App:', GUPSHUP_CONFIG.appName);
  console.log('Número:', GUPSHUP_CONFIG.sourceNumber);
  console.log('=====================================\n');

  // Teste 1: Envio de mensagem
  const test1Result = await testSendSimpleMessage();
  
  // Teste 2: Status da conta
  const test2Result = await testAccountStatus();
  
  // Teste 3: Status do número
  const test3Result = await testPhoneNumberStatus();

  // Teste 4: Documentação
  const test4Result = await testApiDocumentation();

  // Resumo dos resultados
  console.log('\n=====================================');
  console.log('📊 RESUMO DOS TESTES:');
  console.log('=====================================');
  console.log('Teste 1 - Envio de Mensagem:', test1Result.success ? '✅ SUCESSO' : '❌ FALHOU');
  console.log('Teste 2 - Status da Conta:', test2Result.success ? '✅ SUCESSO' : '❌ FALHOU');
  console.log('Teste 3 - Status do Número:', test3Result.success ? '✅ SUCESSO' : '❌ FALHOU');
  console.log('Teste 4 - Documentação:', test4Result.success ? '✅ SUCESSO' : '❌ FALHOU');
  
  if (test1Result.success) {
    console.log('✅ API GUPSHUP FUNCIONANDO!');
    console.log('✅ Modelo validado com sucesso!');
    console.log('✅ Próximo passo: Implementar no sistema');
  } else {
    console.log('❌ Problemas identificados');
    console.log('❌ Verificar configurações');
    console.log('❌ Consultar documentação oficial');
  }
  
  console.log('=====================================');
}

// Executar testes se o arquivo for chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testSendSimpleMessage,
  testAccountStatus,
  testPhoneNumberStatus,
  testApiDocumentation,
  runAllTests
};
