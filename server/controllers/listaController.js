const Lista = require('../models/Lista');

// @desc    Buscar todas as listas do cliente
// @route   GET /api/lists
// @access  Private
exports.getListas = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status;

        const query = { clienteId: req.client.id };
        
        if (search) {
            query.$or = [
                { nome: { $regex: search, $options: 'i' } },
                { descricao: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) {
            query.status = status;
        }

        const total = await Lista.countDocuments(query);
        const listas = await Lista.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate('participantes', 'nome email');

        res.json({
            listas,
            page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar listas', error: error.message });
    }
};

// @desc    Buscar lista por ID
// @route   GET /api/lists/:id
// @access  Private
exports.getListaById = async (req, res) => {
    try {
        const lista = await Lista.findOne({
            _id: req.params.id,
            clienteId: req.client.id
        }).populate('participantes', 'nome email');

        if (!lista) {
            return res.status(404).json({ message: 'Lista não encontrada' });
        }

        res.json(lista);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar lista', error: error.message });
    }
};

// @desc    Criar nova lista
// @route   POST /api/lists
// @access  Private
exports.createLista = async (req, res) => {
    try {
        const { nome, descricao, status } = req.body;

        // Verificar se já existe uma lista com o mesmo nome para este cliente
        const listaExistente = await Lista.findOne({
            nome,
            clienteId: req.client.id
        });

        if (listaExistente) {
            return res.status(400).json({ message: 'Já existe uma lista com este nome' });
        }

        const lista = await Lista.create({
            nome,
            descricao,
            status,
            clienteId: req.client.id
        });

        res.status(201).json(lista);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao criar lista', error: error.message });
    }
};

// @desc    Atualizar lista
// @route   PUT /api/lists/:id
// @access  Private
exports.updateLista = async (req, res) => {
    try {
        const { nome, descricao, status } = req.body;

        // Verificar se já existe outra lista com o mesmo nome
        if (nome) {
            const listaExistente = await Lista.findOne({
                nome,
                clienteId: req.client.id,
                _id: { $ne: req.params.id }
            });

            if (listaExistente) {
                return res.status(400).json({ message: 'Já existe uma lista com este nome' });
            }
        }

        const lista = await Lista.findOneAndUpdate(
            { _id: req.params.id, clienteId: req.client.id },
            { nome, descricao, status },
            { new: true, runValidators: true }
        );

        if (!lista) {
            return res.status(404).json({ message: 'Lista não encontrada' });
        }

        res.json(lista);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao atualizar lista', error: error.message });
    }
};

// @desc    Excluir lista
// @route   DELETE /api/lists/:id
// @access  Private
exports.deleteLista = async (req, res) => {
    try {
        const lista = await Lista.findOneAndDelete({
            _id: req.params.id,
            clienteId: req.client.id
        });

        if (!lista) {
            return res.status(404).json({ message: 'Lista não encontrada' });
        }

        res.json({ message: 'Lista excluída com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir lista', error: error.message });
    }
};

// @desc    Adicionar participantes à lista
// @route   POST /api/lists/:id/participantes
// @access  Private
exports.addParticipantes = async (req, res) => {
    try {
        const { participantes } = req.body;

        const lista = await Lista.findOneAndUpdate(
            { _id: req.params.id, clienteId: req.client.id },
            { $addToSet: { participantes: { $each: participantes } } },
            { new: true }
        ).populate('participantes', 'nome email');

        if (!lista) {
            return res.status(404).json({ message: 'Lista não encontrada' });
        }

        res.json(lista);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao adicionar participantes', error: error.message });
    }
};

// @desc    Remover participantes da lista
// @route   DELETE /api/lists/:id/participantes
// @access  Private
exports.removeParticipantes = async (req, res) => {
    try {
        const { participantes } = req.body;

        const lista = await Lista.findOneAndUpdate(
            { _id: req.params.id, clienteId: req.client.id },
            { $pullAll: { participantes } },
            { new: true }
        ).populate('participantes', 'nome email');

        if (!lista) {
            return res.status(404).json({ message: 'Lista não encontrada' });
        }

        res.json(lista);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao remover participantes', error: error.message });
    }
}; 