// Script de Migração para Fluxos WhatsApp
// Atualiza fluxos existentes para incluir o campo 'scope'

const mongoose = require('mongoose');
require('dotenv').config();

// Schema temporário para migração
const WhatsAppFlowSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  name: { type: String, required: true },
  targetAudience: { type: String, required: true, enum: ['indicators', 'leads', 'mixed'] },
  scope: { type: String, enum: ['global', 'campaign'], default: 'campaign' },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: false },
  filters: { type: Object },
  messages: [{ type: Object, required: true }],
  triggers: [{ type: String, default: [] }],
  status: { type: String, required: true, enum: ['draft', 'active', 'paused', 'archived'] },
  scheduling: { type: Object },
  statistics: { type: Object, default: {} }
}, { timestamps: true });

const WhatsAppFlow = mongoose.model('WhatsAppFlow', WhatsAppFlowSchema);

async function migrateWhatsAppFlows() {
  try {
    console.log('🚀 Iniciando migração de fluxos WhatsApp...');
    
    // Conectar ao MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/programa-indicacao';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB');
    
    // Buscar todos os fluxos existentes
    const existingFlows = await WhatsAppFlow.find({});
    console.log(`📊 Encontrados ${existingFlows.length} fluxos para migrar`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const flow of existingFlows) {
      try {
        // Verificar se já tem o campo scope
        if (flow.scope) {
          console.log(`⏭️ Fluxo "${flow.name}" já migrado (scope: ${flow.scope})`);
          skippedCount++;
          continue;
        }
        
        // Determinar scope baseado na presença de campaignId
        // Como os fluxos existentes não tinham campaignId, serão marcados como 'global'
        const updateData = {
          scope: 'global',
          campaignId: undefined
        };
        
        // Atualizar fluxo
        await WhatsAppFlow.updateOne(
          { _id: flow._id },
          { $set: updateData }
        );
        
        console.log(`✅ Fluxo "${flow.name}" migrado para scope: global`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Erro ao migrar fluxo "${flow.name}":`, error.message);
      }
    }
    
    console.log('\n📋 RESUMO DA MIGRAÇÃO:');
    console.log(`✅ Fluxos migrados: ${migratedCount}`);
    console.log(`⏭️ Fluxos já migrados: ${skippedCount}`);
    console.log(`📊 Total processado: ${existingFlows.length}`);
    
    if (migratedCount > 0) {
      console.log('\n🎉 Migração concluída com sucesso!');
      console.log('💡 Fluxos existentes foram marcados como "global" (todas as campanhas)');
      console.log('💡 Novos fluxos podem ser criados com escopo específico por campanha');
    } else {
      console.log('\nℹ️ Nenhum fluxo precisou ser migrado');
    }
    
  } catch (error) {
    console.error('❌ Erro durante migração:', error);
  } finally {
    // Fechar conexão
    await mongoose.disconnect();
    console.log('🔌 Conexão com MongoDB fechada');
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateWhatsAppFlows()
    .then(() => {
      console.log('🏁 Script de migração finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { migrateWhatsAppFlows };
