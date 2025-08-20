const mongoose = require('mongoose');
require('dotenv').config();

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.error('❌ Erro ao conectar:', err));

// Schema do template
const whatsappTemplateSchema = new mongoose.Schema({
  name: String,
  content: {
    body: String
  },
  variables: [String]
});

const WhatsAppTemplate = mongoose.model('WhatsAppTemplate', whatsappTemplateSchema);

// Função para atualizar formato das variáveis
async function updateTemplateFormat() {
  try {
    console.log('🔍 Buscando templates para atualizar...');
    
    // Buscar todos os templates
    const templates = await WhatsAppTemplate.find({});
    console.log(`📋 Encontrados ${templates.length} templates`);
    
    let updatedCount = 0;
    
    for (const template of templates) {
      let needsUpdate = false;
      let oldBody = template.content?.body || '';
      let newBody = oldBody;
      
      // Mapeamento de variáveis antigas para novas
      const variableMapping = {
        '{nome}': '{{nome}}',
        '{email}': '{{email}}',
        '{telefone}': '{{telefone}}',
        '{dataEntrada}': '{{dataEntrada}}',
        '{telefoneLead}': '{{telefoneLead}}',
        '{nomeLead}': '{{nomeLead}}',
        '{nomeCampanha}': '{{nomeCampanha}}',
        '{valorRecompensa}': '{{valorRecompensa}}',
        '{tipoRecompensa}': '{{tipoRecompensa}}',
        '{totalGanhos}': '{{totalGanhos}}',
        '{link_pessoal}': '{{link_pessoal}}',
        '{indicacoes_hoje}': '{{indicacoes_hoje}}',
        '{nome_lead}': '{{nome_lead}}',
        '{nome_indicador}': '{{nome_indicador}}',
        '{link_bonus}': '{{link_bonus}}',
        '{bonus_lead}': '{{bonus_lead}}',
        '{descricao_promocao}': '{{descricao_promocao}}',
        '{link_promocao}': '{{link_promocao}}',
        '{contato_suporte}': '{{contato_suporte}}'
      };
      
      // Aplicar substituições
      for (const [oldFormat, newFormat] of Object.entries(variableMapping)) {
        if (newBody.includes(oldFormat)) {
          newBody = newBody.replace(new RegExp(oldFormat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newFormat);
          needsUpdate = true;
          console.log(`🔄 Template "${template.name}": ${oldFormat} → ${newFormat}`);
        }
      }
      
      // Atualizar se necessário
      if (needsUpdate) {
        await WhatsAppTemplate.updateOne(
          { _id: template._id },
          { 
            $set: { 
              'content.body': newBody,
              updatedAt: new Date()
            }
          }
        );
        updatedCount++;
        console.log(`✅ Template "${template.name}" atualizado`);
      }
    }
    
    console.log(`\n🎯 RESUMO DA ATUALIZAÇÃO:`);
    console.log(`📊 Total de templates: ${templates.length}`);
    console.log(`✅ Templates atualizados: ${updatedCount}`);
    console.log(`⏭️ Templates sem alteração: ${templates.length - updatedCount}`);
    
    if (updatedCount > 0) {
      console.log(`\n🔄 Formatos atualizados:`);
      console.log(`   {nome} → {{nome}}`);
      console.log(`   {email} → {{email}}`);
      console.log(`   {telefone} → {{telefone}}`);
      console.log(`   E outras variáveis...`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante atualização:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Conexão com MongoDB fechada');
  }
}

// Executar atualização
updateTemplateFormat();
