// Script para atualizar todos os indicadores sem plainPassword, gerando senha e hash
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/programa_indicacao';

const participantSchema = new mongoose.Schema({
  email: String,
  tipo: String,
  password: { type: String, select: false },
  plainPassword: String,
}, { strict: false });

const Participant = mongoose.model('Participant', participantSchema, 'participants');

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado ao MongoDB');

  const indicadores = await Participant.find({ tipo: 'indicador', $or: [ { plainPassword: { $exists: false } }, { plainPassword: null }, { plainPassword: '' } ] }).select('+password email');
  console.log(`Encontrados ${indicadores.length} indicadores sem plainPassword.`);

  for (const ind of indicadores) {
    const tempPassword = uuidv4().slice(0, 8) + Math.floor(Math.random()*1000);
    const hash = await bcrypt.hash(tempPassword, 10);
    ind.password = hash;
    ind.plainPassword = tempPassword;
    await ind.save();
    console.log(`Indicador atualizado: ${ind.email} | Senha gerada: ${tempPassword}`);
  }

  console.log('Atualização concluída.');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Erro ao atualizar indicadores:', err);
  process.exit(1);
}); 