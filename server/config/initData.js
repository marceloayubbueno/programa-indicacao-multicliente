const Plano = require('../models/Plano');

async function initializePlanos() {
    try {
        // Verificar se o plano Trial já existe
        const trialExists = await Plano.findOne({ nome: 'Trial' });
        
        if (!trialExists) {
            // Criar plano Trial
            await Plano.create({
                nome: 'Trial',
                descricao: 'Plano de avaliação gratuito',
                limiteIndicadores: 3,
                limiteIndicacoes: 10,
                funcionalidades: {
                    exportacao: false,
                    relatorios: false,
                    campanhasExtras: false
                }
            });
            console.log('Plano Trial criado com sucesso');
        }
    } catch (error) {
        console.error('Erro ao inicializar planos:', error);
    }
}

module.exports = {
    initializePlanos
}; 