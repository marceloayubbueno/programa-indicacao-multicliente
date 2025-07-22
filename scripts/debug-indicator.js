#!/usr/bin/env node

const mongoose = require('mongoose');

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/programa-indicacao';

async function debugIndicator() {
  try {
    console.log('🔍 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Modelos
    const Participant = mongoose.model('Participant', new mongoose.Schema({}));
    const Campaign = mongoose.model('Campaign', new mongoose.Schema({}));
    const ParticipantList = mongoose.model('ParticipantList', new mongoose.Schema({}));

    // Buscar indicadores
    console.log('\n🔍 Buscando indicadores...');
    const indicators = await Participant.find({ tipo: 'indicador' })
      .select('_id name email campaignId lists uniqueReferralCode')
      .populate('lists', 'name campaignId')
      .limit(5);

    console.log(`✅ Encontrados ${indicators.length} indicadores`);

    for (const indicator of indicators) {
      console.log(`\n📋 INDICADOR: ${indicator.name} (${indicator.email})`);
      console.log(`   ID: ${indicator._id}`);
      console.log(`   CampaignId: ${indicator.campaignId || 'NENHUM'}`);
      console.log(`   ReferralCode: ${indicator.uniqueReferralCode || 'NENHUM'}`);
      console.log(`   Lists: ${indicator.lists?.length || 0}`);

      if (indicator.lists && indicator.lists.length > 0) {
        console.log('   📋 Listas do indicador:');
        for (const list of indicator.lists) {
          console.log(`      - ${list.name} (ID: ${list._id}) - CampaignId: ${list.campaignId || 'NENHUM'}`);
        }
      }

      // Buscar campanha direta
      if (indicator.campaignId) {
        console.log(`\n🔍 Buscando campanha direta: ${indicator.campaignId}`);
        const campaign = await Campaign.findById(indicator.campaignId)
          .populate('rewardOnReferral', 'type value description')
          .populate('rewardOnConversion', 'type value description');

        if (campaign) {
          console.log(`✅ Campanha encontrada: ${campaign.name}`);
          console.log(`   Status: ${campaign.status}`);
          console.log(`   RewardOnReferral: ${campaign.rewardOnReferral ? 'SIM' : 'NÃO'}`);
          console.log(`   RewardOnConversion: ${campaign.rewardOnConversion ? 'SIM' : 'NÃO'}`);
        } else {
          console.log(`❌ Campanha não encontrada: ${indicator.campaignId}`);
        }
      }

      // Buscar campanhas via listas
      if (indicator.lists && indicator.lists.length > 0) {
        console.log(`\n🔍 Buscando campanhas via listas...`);
        const listIds = indicator.lists.map(l => l._id);
        const campaignLists = await ParticipantList.find({
          _id: { $in: listIds },
          campaignId: { $exists: true, $ne: null }
        }).populate('campaignId');

        console.log(`✅ Listas com campanha: ${campaignLists.length}`);

        for (const list of campaignLists) {
          console.log(`   📋 Lista: ${list.name} - Campanha: ${list.campaignId?.name || 'N/A'}`);
          
                      if (list.campaignId) {
              const campaign = await Campaign.findById(list.campaignId._id)
                .populate('rewardOnReferral', 'type value description')
                .populate('rewardOnConversion', 'type value description');

              if (campaign) {
                console.log(`      ✅ Campanha: ${campaign.name} (${campaign.status})`);
                console.log(`         Referral Reward: ${campaign.rewardOnReferral ? `R$ ${campaign.rewardOnReferral.value}` : 'NÃO'}`);
                console.log(`         Conversion Reward: ${campaign.rewardOnConversion ? `R$ ${campaign.rewardOnConversion.value}` : 'NÃO'}`);
              }
            }
        }
      }

      console.log('\n' + '='.repeat(60));
    }

    // Buscar todas as campanhas
    console.log('\n🔍 Buscando todas as campanhas...');
    const allCampaigns = await Campaign.find({})
      .populate('rewardOnReferral', 'type value description')
      .populate('rewardOnConversion', 'type value description')
      .select('name status rewardOnReferral rewardOnConversion');

    console.log(`✅ Total de campanhas: ${allCampaigns.length}`);
    
    for (const campaign of allCampaigns) {
      console.log(`   📋 ${campaign.name} (${campaign.status})`);
      console.log(`      Referral: ${campaign.rewardOnReferral ? `R$ ${campaign.rewardOnReferral.value}` : 'NÃO'}`);
      console.log(`      Conversion: ${campaign.rewardOnConversion ? `R$ ${campaign.rewardOnConversion.value}` : 'NÃO'}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado do MongoDB');
  }
}

debugIndicator(); 