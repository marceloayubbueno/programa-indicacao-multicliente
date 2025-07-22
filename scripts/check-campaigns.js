#!/usr/bin/env node

const mongoose = require('mongoose');

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/programa-indicacao';

async function checkCampaigns() {
  try {
    console.log('🔍 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Modelos
    const Campaign = mongoose.model('Campaign', new mongoose.Schema({}));
    const Participant = mongoose.model('Participant', new mongoose.Schema({}));
    const Reward = mongoose.model('Reward', new mongoose.Schema({}));

    // Buscar campanhas
    console.log('\n🔍 Buscando campanhas...');
    const campaigns = await Campaign.find({})
      .populate('rewardOnReferral', 'type value description')
      .populate('rewardOnConversion', 'type value description')
      .select('name status rewardOnReferral rewardOnConversion participantListId');

    console.log(`✅ Encontradas ${campaigns.length} campanhas`);

    for (const campaign of campaigns) {
      console.log(`\n📋 CAMPANHA: ${campaign.name} (${campaign.status})`);
      console.log(`   ID: ${campaign._id}`);
      console.log(`   ParticipantListId: ${campaign.participantListId || 'NENHUM'}`);
      console.log(`   RewardOnReferral: ${campaign.rewardOnReferral ? `R$ ${campaign.rewardOnReferral.value}` : 'NÃO'}`);
      console.log(`   RewardOnConversion: ${campaign.rewardOnConversion ? `R$ ${campaign.rewardOnConversion.value}` : 'NÃO'}`);
    }

    // Buscar indicadores
    console.log('\n🔍 Buscando indicadores...');
    const indicators = await Participant.find({ tipo: 'indicador' })
      .select('_id name email campaignId campaignName uniqueReferralCode')
      .limit(5);

    console.log(`✅ Encontrados ${indicators.length} indicadores`);

    for (const indicator of indicators) {
      console.log(`\n👤 INDICADOR: ${indicator.name} (${indicator.email})`);
      console.log(`   ID: ${indicator._id}`);
      console.log(`   CampaignId: ${indicator.campaignId || 'NENHUM'}`);
      console.log(`   CampaignName: ${indicator.campaignName || 'NENHUM'}`);
      console.log(`   ReferralCode: ${indicator.uniqueReferralCode || 'NENHUM'}`);
    }

    // Buscar recompensas
    console.log('\n🔍 Buscando recompensas...');
    const rewards = await Reward.find({})
      .select('type value description campaignId campaignName');

    console.log(`✅ Encontradas ${rewards.length} recompensas`);

    for (const reward of rewards) {
      console.log(`\n💰 RECOMPENSA: ${reward.type} - R$ ${reward.value}`);
      console.log(`   ID: ${reward._id}`);
      console.log(`   Description: ${reward.description || 'NENHUM'}`);
      console.log(`   CampaignId: ${reward.campaignId || 'NENHUM'}`);
      console.log(`   CampaignName: ${reward.campaignName || 'NENHUM'}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado do MongoDB');
  }
}

checkCampaigns(); 