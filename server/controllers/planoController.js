const Plano = require('../models/Plano');

// Listar todos os planos
exports.getPlanos = async (req, res) => {
    try {
        const planos = await Plano.find();
        res.json(planos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar planos', error: error.message });
    }
};

// Criar novo plano
exports.createPlano = async (req, res) => {
    try {
        const plano = await Plano.create(req.body);
        res.status(201).json(plano);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao criar plano', error: error.message });
    }
};

// Editar plano
exports.updatePlano = async (req, res) => {
    try {
        const plano = await Plano.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!plano) {
            return res.status(404).json({ message: 'Plano não encontrado' });
        }
        res.json(plano);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao atualizar plano', error: error.message });
    }
};

// Deletar plano
exports.deletePlano = async (req, res) => {
    try {
        const plano = await Plano.findByIdAndDelete(req.params.id);
        if (!plano) {
            return res.status(404).json({ message: 'Plano não encontrado' });
        }
        res.json({ message: 'Plano deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar plano', error: error.message });
    }
}; 