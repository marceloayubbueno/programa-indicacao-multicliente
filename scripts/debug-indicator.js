#!/usr/bin/env node

const mongoose = require('mongoose');

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/programa-indicacao';

async function debugIndicator() {
  try {
    console.log('🔍 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Modelos - usando schemas básicos
    const Participant = mongoose.model('Participant', new mongoose.Schema({
      name: String,
      email: String,
      campaignId: mongoose.Schema.Types.ObjectId,
      uniqueReferralCode: String,
      tipo: String,
      clientId: mongoose.Schema.Types.ObjectId,
      status: String
    }));
    
    const Campaign = mongoose.model('Campaign', new mongoose.Schema({
      name: String,
      status: String,
      clientId: mongoose.Schema.Types.ObjectId,
      rewardOnReferral: mongoose.Schema.Types.ObjectId,
      rewardOnConversion: mongoose.Schema.Types.ObjectId
    }));

    // Buscar indicadores
    console.log('\n🔍 Buscando indicadores...');
    const indicators = await Participant.find({ tipo: 'indicador' })
      .select('_id name email campaignId uniqueReferralCode clientId status')
      .limit(5);

    console.log(`✅ Encontrados ${indicators.length} indicadores`);

    for (const indicator of indicators) {
      console.log(`\n📋 INDICADOR: ${indicator.name} (${indicator.email})`);
      console.log(`   ID: ${indicator._id}`);
      console.log(`   CampaignId: ${indicator.campaignId || 'NENHUM'}`);
      console.log(`   ReferralCode: ${indicator.uniqueReferralCode || 'NENHUM'}`);
      console.log(`   ClientId: ${indicator.clientId}`);
      console.log(`   Status: ${indicator.status}`);

      // Buscar campanha direta
      if (indicator.campaignId) {
        console.log(`\n🔍 Buscando campanha direta: ${indicator.campaignId}`);
        const campaign = await Campaign.findById(indicator.campaignId);

        if (campaign) {
          console.log(`✅ Campanha encontrada: ${campaign.name}`);
          console.log(`   Status: ${campaign.status}`);
          console.log(`   ClientId: ${campaign.clientId}`);
        } else {
          console.log(`❌ Campanha não encontrada: ${indicator.campaignId}`);
        }
      } else {
        console.log(`\n❌ Indicador não tem campaignId associado`);
      }

      console.log('\n' + '='.repeat(60));
    }

    // Buscar todas as campanhas
    console.log('\n🔍 Buscando todas as campanhas...');
    const allCampaigns = await Campaign.find({})
      .select('name status clientId');

    console.log(`✅ Total de campanhas: ${allCampaigns.length}`);
    
    for (const campaign of allCampaigns) {
      console.log(`   📋 ${campaign.name} (${campaign.status}) - ClientId: ${campaign.clientId}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado do MongoDB');
  }
}

debugIndicator(); 