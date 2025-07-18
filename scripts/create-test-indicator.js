#!/usr/bin/env node

/**
 * 🧪 SCRIPT PARA CRIAR INDICADOR DE TESTE
 * Cria um indicador válido para testar as rotas de indicação
 */

const { MongoClient } = require('mongodb');

// Configuração do MongoDB
const MONGODB_URI = 'mongodb+srv://marceloayubbueno:6o6TsTwpr8AQPleQ@cluster0.glmogtu.mongodb.net/programa-indicacao?retryWrites=true&w=majority&appName=Cluster0';

async function createTestIndicator() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    
    const db = client.db('programa-indicacao');
    const participantsCollection = db.collection('participants');
    const clientsCollection = db.collection('clients');
    
    // 1. Buscar ou criar um cliente
    let clientDoc = await clientsCollection.findOne({});
    if (!clientDoc) {
      console.log('❌ Nenhum cliente encontrado. Criando cliente de teste...');
      const newClient = {
        name: 'Cliente Teste',
        email: 'teste@exemplo.com',
        phone: '11999999999',
        status: 'ativo',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await clientsCollection.insertOne(newClient);
      clientDoc = { _id: result.insertedId, ...newClient };
      console.log('✅ Cliente de teste criado:', clientDoc._id);
    } else {
      console.log('✅ Cliente encontrado:', clientDoc.name);
    }
    
    // 2. Criar indicador de teste
    const testCode = 'TESTE123456';
    const testIndicator = {
      name: 'Indicador Teste',
      email: 'indicador@teste.com',
      phone: '11988888888',
      tipo: 'indicador',
      status: 'ativo',
      canIndicate: true,
      uniqueReferralCode: testCode,
      clientId: clientDoc._id,
      totalIndicacoes: 0,
      indicacoesAprovadas: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 3. Verificar se já existe
    const existing = await participantsCollection.findOne({ uniqueReferralCode: testCode });
    if (existing) {
      console.log('⚠️ Indicador de teste já existe. Atualizando...');
      await participantsCollection.updateOne(
        { uniqueReferralCode: testCode },
        { $set: { ...testIndicator, updatedAt: new Date() } }
      );
    } else {
      console.log('✅ Criando indicador de teste...');
      await participantsCollection.insertOne(testIndicator);
    }
    
    console.log('\n🎉 INDICADOR DE TESTE CRIADO/ATUALIZADO!');
    console.log(`📋 Nome: ${testIndicator.name}`);
    console.log(`📧 Email: ${testIndicator.email}`);
    console.log(`🔗 Código: ${testCode}`);
    console.log(`🔗 Link de teste: https://app.virallead.com.br/indicacao/${testCode}`);
    console.log(`🔗 Preview: https://app.virallead.com.br/indicacao/${testCode}/preview`);
    console.log(`🔗 Railway direto: https://programa-indicacao-multicliente-production.up.railway.app/indicacao/${testCode}`);
    
    // 4. Verificar se foi criado
    const created = await participantsCollection.findOne({ uniqueReferralCode: testCode });
    if (created) {
      console.log('\n✅ VERIFICAÇÃO: Indicador encontrado no banco!');
      console.log(`   ID: ${created._id}`);
      console.log(`   Status: ${created.status}`);
      console.log(`   Pode indicar: ${created.canIndicate}`);
    } else {
      console.log('\n❌ ERRO: Indicador não foi criado!');
    }
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar criação
createTestIndicator().catch(console.error); 