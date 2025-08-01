const mongoose = require('mongoose');
require('dotenv').config();

// Schema do template global
const whatsappGlobalTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  language: { type: String, default: 'pt_BR' },
  content: {
    body: { type: String, required: true }
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  variables: [{ type: String }],
  isGlobal: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const WhatsAppGlobalTemplate = mongoose.model('WhatsAppGlobalTemplate', whatsappGlobalTemplateSchema);

// Templates de exemplo
const templates = [
  {
    name: 'Boas-vindas Indicador',
    category: 'indicadores',
    language: 'pt_BR',
    content: {
      body: 'Olá {{nome}}, bem-vindo ao nosso programa de indicação! Você pode ganhar recompensas indicando amigos. Quer saber como?'
    },
    status: 'active',
    variables: ['nome']
  },
  {
    name: 'Dicas de Indicação',
    category: 'indicadores',
    language: 'pt_BR',
    content: {
      body: 'Dica do dia: Compartilhe seu link pessoal nas redes sociais! Seu link: {{link_pessoal}} Indicações hoje: {{indicacoes_hoje}}'
    },
    status: 'active',
    variables: ['link_pessoal', 'indicacoes_hoje']
  },
  {
    name: 'Parabéns Lead',
    category: 'leads',
    language: 'pt_BR',
    content: {
      body: 'Parabéns {{nome_lead}}! Você foi indicado por {{nome_indicador}} e pode ganhar um bônus especial! Acesse: {{link_bonus}}'
    },
    status: 'active',
    variables: ['nome_lead', 'nome_indicador', 'link_bonus']
  },
  {
    name: 'Lembrete de Indicação',
    category: 'indicadores',
    language: 'pt_BR',
    content: {
      body: 'Oi {{nome}}! Não esqueça de compartilhar seu link hoje. Cada indicação pode render {{valor_recompensa}}! Seu link: {{link_pessoal}}'
    },
    status: 'active',
    variables: ['nome', 'valor_recompensa', 'link_pessoal']
  },
  {
    name: 'Lead Convertido',
    category: 'leads',
    language: 'pt_BR',
    content: {
      body: 'Parabéns {{nome_lead}}! Sua compra foi confirmada e você ganhou {{bonus_lead}}! Obrigado por escolher nossos produtos.'
    },
    status: 'active',
    variables: ['nome_lead', 'bonus_lead']
  },
  {
    name: 'Recompensa Ganha',
    category: 'indicadores',
    language: 'pt_BR',
    content: {
      body: '🎉 {{nome}}, você ganhou {{valor_recompensa}} por indicar {{nome_lead}}! Continue indicando para ganhar mais recompensas!'
    },
    status: 'active',
    variables: ['nome', 'valor_recompensa', 'nome_lead']
  },
  {
    name: 'Promoção Especial',
    category: 'geral',
    language: 'pt_BR',
    content: {
      body: '🔥 Promoção especial por tempo limitado! {{descricao_promocao}} Aproveite: {{link_promocao}}'
    },
    status: 'active',
    variables: ['descricao_promocao', 'link_promocao']
  },
  {
    name: 'Suporte ao Cliente',
    category: 'geral',
    language: 'pt_BR',
    content: {
      body: 'Olá {{nome}}! Como podemos ajudar você hoje? Entre em contato conosco: {{contato_suporte}}'
    },
    status: 'active',
    variables: ['nome', 'contato_suporte']
  }
];

async function seedTemplates() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/virallead');
    console.log('✅ Conectado ao MongoDB');

    // Limpar templates existentes (opcional)
    await WhatsAppGlobalTemplate.deleteMany({});
    console.log('🗑️ Templates existentes removidos');

    // Inserir novos templates
    const createdTemplates = await WhatsAppGlobalTemplate.insertMany(templates);
    console.log(`✅ ${createdTemplates.length} templates criados com sucesso!`);

    // Listar templates criados
    console.log('\n📋 Templates criados:');
    createdTemplates.forEach(template => {
      console.log(`- ${template.name} (${template.category}) - ${template.variables.length} variáveis`);
    });

    console.log('\n🎉 Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar o seed
seedTemplates(); 