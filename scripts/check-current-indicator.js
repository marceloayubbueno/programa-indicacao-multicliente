#!/usr/bin/env node

const mongoose = require('mongoose');

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/programa-indicacao';

async function checkCurrentIndicator() {
  try {
    console.log('🔍 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Modelos
    const Participant = mongoose.model('Participant', new mongoose.Schema({}));

    // Buscar o indicador específico que está logado
    const indicatorId = '6865280653d306560e890284';
    console.log(`\n🔍 Buscando indicador específico: ${indicatorId}`);
    
    const indicator = await Participant.findById(indicatorId);
    
    if (indicator) {
      console.log(`\n👤 INDICADOR ENCONTRADO:`);
      console.log(`   Nome: ${indicator.name}`);
      console.log(`   Email: ${indicator.email}`);
      console.log(`   Tipo: ${indicator.tipo}`);
      console.log(`   CampaignId: ${indicator.campaignId || 'NENHUM'}`);
      console.log(`   CampaignName: ${indicator.campaignName || 'NENHUM'}`);
      console.log(`   Lists: ${indicator.lists?.length || 0}`);
      console.log(`   UniqueReferralCode: ${indicator.uniqueReferralCode || 'NENHUM'}`);
      console.log(`   Status: ${indicator.status}`);
      console.log(`   ClientId: ${indicator.clientId}`);
    } else {
      console.log(`\n❌ INDICADOR NÃO ENCONTRADO: ${indicatorId}`);
    }

    // Buscar todos os indicadores para comparação
    console.log('\n🔍 Buscando todos os indicadores...');
    const allIndicators = await Participant.find({ tipo: 'indicador' })
      .limit(10);

    console.log(`✅ Encontrados ${allIndicators.length} indicadores`);

    for (const ind of allIndicators) {
      console.log(`\n👤 INDICADOR COMPLETO:`);
      console.log(JSON.stringify(ind, null, 2));
    }

    // Buscar especificamente pelo MARCELO
    console.log('\n🔍 Buscando MARCELO especificamente...');
    const marcelo = await Participant.findOne({ 
      $or: [
        { name: /marcelo/i },
        { email: /marcelo/i }
      ]
    });

    if (marcelo) {
      console.log(`\n👤 MARCELO ENCONTRADO:`);
      console.log(JSON.stringify(marcelo, null, 2));
    } else {
      console.log('\n❌ MARCELO NÃO ENCONTRADO');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado do MongoDB');
  }
}

checkCurrentIndicator(); 