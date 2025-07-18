#!/usr/bin/env node

/**
 * 🔍 SCRIPT PARA BUSCAR CÓDIGOS DE INDICAÇÃO VÁLIDOS
 * Conecta ao MongoDB e busca indicadores ativos com códigos válidos
 */

const { MongoClient } = require('mongodb');

// Configuração do MongoDB
const MONGODB_URI = 'mongodb+srv://marceloayubbueno:6o6TsTwpr8AQPleQ@cluster0.glmogtu.mongodb.net/programa-indicacao?retryWrites=true&w=majority&appName=Cluster0';

async function findValidCodes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    
    const db = client.db('programa-indicacao');
    const participantsCollection = db.collection('participants');
    
    // Buscar indicadores ativos com códigos válidos
    const validIndicators = await participantsCollection.find({
      tipo: { $in: ['indicador', 'influenciador'] },
      status: 'ativo',
      uniqueReferralCode: { $exists: true, $ne: null },
      canIndicate: true
    }).project({
      name: 1,
      email: 1,
      uniqueReferralCode: 1,
      tipo: 1,
      status: 1,
      canIndicate: 1,
      clientId: 1,
      campaignName: 1,
      createdAt: 1
    }).toArray();
    
    console.log(`\n📊 RESULTADOS:`);
    console.log(`Total de indicadores válidos encontrados: ${validIndicators.length}`);
    
    if (validIndicators.length === 0) {
      console.log('❌ Nenhum indicador válido encontrado!');
      console.log('\n🔍 Verificando todos os participantes...');
      
      const allParticipants = await participantsCollection.find({}).project({
        name: 1,
        email: 1,
        tipo: 1,
        status: 1,
        uniqueReferralCode: 1,
        canIndicate: 1
      }).limit(10).toArray();
      
      console.log('📋 Primeiros 10 participantes:');
      allParticipants.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} (${p.email}) - Tipo: ${p.tipo}, Status: ${p.status}, Código: ${p.uniqueReferralCode || 'N/A'}, Pode indicar: ${p.canIndicate}`);
      });
      
    } else {
      console.log('\n✅ INDICADORES VÁLIDOS ENCONTRADOS:');
      validIndicators.forEach((indicator, i) => {
        console.log(`\n${i + 1}. ${indicator.name} (${indicator.email})`);
        console.log(`   📋 Tipo: ${indicator.tipo}`);
        console.log(`   🔗 Código: ${indicator.uniqueReferralCode}`);
        console.log(`   🎯 Campanha: ${indicator.campaignName || 'N/A'}`);
        console.log(`   📅 Criado em: ${indicator.createdAt}`);
        console.log(`   🔗 Link de teste: https://app.virallead.com.br/indicacao/${indicator.uniqueReferralCode}`);
      });
      
      // Testar o primeiro código encontrado
      if (validIndicators.length > 0) {
        const testCode = validIndicators[0].uniqueReferralCode;
        console.log(`\n🧪 TESTANDO PRIMEIRO CÓDIGO: ${testCode}`);
        console.log(`🔗 URL de teste: https://app.virallead.com.br/indicacao/${testCode}`);
        console.log(`🔗 Preview: https://app.virallead.com.br/indicacao/${testCode}/preview`);
      }
    }
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar busca
findValidCodes().catch(console.error); 