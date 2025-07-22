// Script para atualizar todos os indicadores, removendo password e garantindo plainPassword
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/programa_indicacao';

const participantSchema = new mongoose.Schema({
  email: String,
  tipo: String,
  plainPassword: String,
}, { strict: false });

const Participant = mongoose.model('Participant', participantSchema, 'participants');

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado ao MongoDB');

  const indicadores = await Participant.find({ tipo: 'indicador' });
  console.log(`Encontrados ${indicadores.length} indicadores.`);

  for (const ind of indicadores) {
    // Gera senha curta se não existir
    if (!ind.plainPassword || ind.plainPassword.length < 6) {
      ind.plainPassword = Math.random().toString(36).slice(-8);
    }
    // Remove campo password se existir
    if (ind.password) {
      ind.password = undefined;
    }
    await ind.save();
    console.log(`Indicador atualizado: ${ind.email} | Senha: ${ind.plainPassword}`);
  }

  console.log('Atualização concluída.');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Erro ao atualizar indicadores:', err);
  process.exit(1);
}); 