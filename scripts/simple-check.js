#!/usr/bin/env node

const mongoose = require('mongoose');

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/programa-indicacao';

async function simpleCheck() {
  try {
    console.log('🔍 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Modelos simples
    const Campaign = mongoose.model('Campaign', new mongoose.Schema({}));
    const Participant = mongoose.model('Participant', new mongoose.Schema({}));
    const Reward = mongoose.model('Reward', new mongoose.Schema({}));

    // Buscar especificamente pelo MARCELO
    console.log('\n🔍 Buscando MARCELO especificamente...');
    const marcelo = await Participant.findOne({ 
      $or: [
        { name: /marcelo/i },
        { email: /marcelo/i }
      ]
    });

    if (marcelo) {
      console.log(`\n👤 MARCELO ENCONTRADO: ${JSON.stringify(marcelo, null, 2)}`);
    } else {
      console.log('\n❌ MARCELO NÃO ENCONTRADO');
      
      // Buscar todos os participantes para ver se há algum com nome similar
      console.log('\n🔍 Buscando todos os participantes...');
      const allParticipants = await Participant.find({}).select('name email tipo campaignId campaignName');
      
      console.log(`✅ Total de participantes: ${allParticipants.length}`);
      
      for (const p of allParticipants) {
        console.log(`   - ${p.name} (${p.email}) - tipo: ${p.tipo} - campaignId: ${p.campaignId || 'NENHUM'}`);
      }
    }

    // Buscar campanhas
    console.log('\n🔍 Buscando campanhas...');
    const campaigns = await Campaign.find({}).select('name status rewardOnReferral rewardOnConversion participantListId');

    console.log(`✅ Encontradas ${campaigns.length} campanhas`);

    for (const campaign of campaigns) {
      console.log(`\n📋 CAMPANHA: ${campaign.name} (${campaign.status})`);
      console.log(`   ID: ${campaign._id}`);
      console.log(`   ParticipantListId: ${campaign.participantListId || 'NENHUM'}`);
      console.log(`   RewardOnReferral: ${campaign.rewardOnReferral || 'NÃO'}`);
      console.log(`   RewardOnConversion: ${campaign.rewardOnConversion || 'NÃO'}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado do MongoDB');
  }
}

simpleCheck(); 