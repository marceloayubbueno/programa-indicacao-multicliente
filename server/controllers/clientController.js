const Client = require('../models/Client');
const Plano = require('../models/Plano');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secret_aqui';

// Função para buscar o plano Trial
async function getTrialPlan() {
    try {
        return await Plano.findOne({ nome: 'Trial' });
    } catch (error) {
        console.error('Erro ao buscar plano Trial:', error);
        return null;
    }
}

// Gerar Token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Buscar todos os clientes
// @route   GET /api/clients
// @access  Private/Admin
exports.getClients = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Valor padrão de itens por página
        const search = req.query.search || '';

        // Filtro de busca por nome da empresa (pode ser expandido para outros campos)
        const query = search
            ? { 'empresa.nome': { $regex: search, $options: 'i' } }
            : {};

        const totalClients = await Client.countDocuments(query);
        const totalPages = Math.ceil(totalClients / limit) || 1;

        const clients = await Client.find(query)
            .select('-senha')
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            clients,
            page,
            totalPages
        });
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ 
            message: 'Erro ao buscar clientes',
            error: error.message 
        });
    }
};

// @desc    Buscar cliente por ID
// @route   GET /api/clients/:id
// @access  Private
exports.getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id)
            .select('+senha')
            .populate('plano', 'nome descricao');
        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }
        res.json(client);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar cliente', error: error.message });
    }
};

// @desc    Criar novo cliente
// @route   POST /api/clients
// @access  Private/Admin
exports.createClient = async (req, res) => {
    try {
        console.log('Recebendo requisição para criar cliente:', req.body);

        // Gerar senha temporária se não fornecida
        const senhaTemporaria = req.body.senha || crypto.randomBytes(4).toString('hex');
        
        // Se não foi especificado um plano, buscar o plano Trial
        if (!req.body.plano) {
            const trialPlan = await getTrialPlan();
            if (trialPlan) {
                req.body.plano = trialPlan._id;
            }
        }
        
        // Criar cliente com senha
        const client = await Client.create({
            ...req.body,
            senha: senhaTemporaria,
            primeiroAcesso: true,
            status: req.body.status || 'pendente'
        });

        console.log('Cliente criado:', client);

        // Se solicitado, enviar email com credenciais
        if (req.body.enviarCredenciais) {
            const mensagem = `
                Olá ${client.responsavel.nome},

                Sua empresa ${client.empresa.nome} foi cadastrada com sucesso no nosso sistema.

                Para acessar sua conta, utilize as seguintes credenciais:
                Email: ${client.responsavel.email}
                Senha: ${senhaTemporaria}

                Por favor, acesse o sistema e altere sua senha no primeiro acesso.

                Atenciosamente,
                Equipe de Suporte
            `;

            try {
                await sendEmail({
                    email: client.responsavel.email,
                    subject: 'Bem-vindo ao Sistema - Suas Credenciais',
                    message: mensagem
                });
                console.log('Email enviado com sucesso');
            } catch (emailError) {
                console.error('Erro ao enviar email:', emailError);
            }
        }

        // Retornar cliente com senha
        const clientResponse = client.toObject();
        clientResponse.senha = senhaTemporaria;

        res.status(201).json({
            success: true,
            message: 'Cliente criado com sucesso',
            client: clientResponse
        });
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'CNPJ, CPF ou email já cadastrado',
                error: error.message 
            });
        }
        res.status(500).json({ 
            message: 'Erro ao criar cliente',
            error: error.message 
        });
    }
};

// @desc    Atualizar cliente
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        // Se uma nova senha foi fornecida
        if (updateData.senha) {
            updateData.primeiroAcesso = true;
        }

        const client = await Client.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('+senha');

        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        // Se solicitado, enviar email com novas credenciais
        if (req.body.enviarCredenciais && req.body.senha) {
            const mensagem = `
                Olá ${client.responsavel.nome},

                Suas credenciais de acesso foram atualizadas.

                Email: ${client.responsavel.email}
                Nova senha: ${req.body.senha}

                Por favor, acesse o sistema e altere sua senha no primeiro acesso.

                Atenciosamente,
                Equipe de Suporte
            `;

            try {
                await sendEmail({
                    email: client.responsavel.email,
                    subject: 'Suas Credenciais Foram Atualizadas',
                    message: mensagem
                });
            } catch (emailError) {
                console.error('Erro ao enviar email:', emailError);
            }
        }

        // Retornar cliente com senha se foi atualizada
        const clientResponse = client.toObject();
        if (req.body.senha) {
            clientResponse.senha = req.body.senha;
        }

        res.json({
            success: true,
            message: 'Cliente atualizado com sucesso',
            client: clientResponse
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'CNPJ, CPF ou email já cadastrado',
                error: error.message 
            });
        }
        res.status(500).json({ 
            message: 'Erro ao atualizar cliente',
            error: error.message 
        });
    }
};

// @desc    Excluir um cliente
// @route   DELETE /api/clients/:id
// @access  Private
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        
        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        res.json({ message: 'Cliente excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Erro ao excluir cliente',
            error: error.message 
        });
    }
};

// @desc    Alterar senha
// @route   PUT /api/clients/:id/password
// @access  Private
exports.alterarSenha = async (req, res) => {
    try {
        const { senhaAtual, novaSenha } = req.body;
        
        // Buscar cliente com senha
        const client = await Client.findById(req.params.id).select('+senha');
        
        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        // Se não for primeiro acesso, verificar senha atual
        if (!client.primeiroAcesso) {
            const senhaCorreta = await client.verificarSenha(senhaAtual);
            if (!senhaCorreta) {
                return res.status(400).json({ message: 'Senha atual incorreta' });
            }
        }

        // Atualizar senha
        client.senha = novaSenha;
        client.primeiroAcesso = false;
        client.status = 'ativo';
        await client.save();

        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Erro ao alterar senha',
            error: error.message 
        });
    }
};

// @desc    Solicitar redefinição de senha
// @route   POST /api/clients/forgot-password
// @access  Public
exports.esqueceuSenha = async (req, res) => {
    try {
        const client = await Client.findOne({ 'responsavel.email': req.body.email });

        if (!client) {
            return res.status(404).json({ message: 'Não existe cliente com este email' });
        }

        // Gerar token de redefinição
        const resetToken = crypto.randomBytes(20).toString('hex');
        client.resetSenhaToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        
        // Token expira em 1 hora
        client.resetSenhaExpiracao = Date.now() + 3600000;
        await client.save();

        // Enviar email
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
        const mensagem = `
            Você solicitou a redefinição de sua senha.
            Para definir uma nova senha, acesse o link: ${resetUrl}
            Se você não solicitou a redefinição, ignore este email.
        `;

        try {
            await sendEmail({
                email: client.responsavel.email,
                subject: 'Redefinição de Senha',
                message: mensagem
            });

            res.json({ message: 'Email enviado com instruções' });
        } catch (error) {
            client.resetSenhaToken = undefined;
            client.resetSenhaExpiracao = undefined;
            await client.save();

            return res.status(500).json({ message: 'Erro ao enviar email' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao processar solicitação' });
    }
};

// @desc    Redefinir senha
// @route   PUT /api/clients/reset-password/:token
// @access  Public
exports.redefinirSenha = async (req, res) => {
    try {
        // Obter token hasheado
        const resetSenhaToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const client = await Client.findOne({
            resetSenhaToken,
            resetSenhaExpiracao: { $gt: Date.now() }
        });

        if (!client) {
            return res.status(400).json({ message: 'Token inválido ou expirado' });
        }

        // Definir nova senha
        client.senha = req.body.senha;
        client.resetSenhaToken = undefined;
        client.resetSenhaExpiracao = undefined;
        client.primeiroAcesso = false;
        await client.save();

        res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao redefinir senha' });
    }
};

// @desc    Login do cliente
// @route   POST /api/clients/login
// @access  Public
exports.loginClient = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar cliente pelo email do responsável (sempre em minúsculo)
        const client = await Client.findOne({ 'responsavel.email': email.toLowerCase() }).select('+senha');

        if (!client) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        // Verificar status do cliente
        if (client.status !== 'ativo') {
            return res.status(403).json({ message: 'Seu acesso está bloqueado. Entre em contato com o suporte.' });
        }

        // Verificar senha
        const isMatch = await client.verificarSenha(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        // Gerar token
        const token = generateToken(client._id);

        res.json({
            success: true,
            token,
            client: {
                id: client._id,
                empresa: client.empresa,
                responsavel: client.responsavel,
                endereco: client.endereco,
                primeiroAcesso: client.primeiroAcesso,
                status: client.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao fazer login', error: error.message });
    }
};

// @desc    Obter cliente atual
// @route   GET /api/clients/me
// @access  Private
exports.getCurrentClient = async (req, res) => {
    try {
        console.log('Buscando cliente atual:', req.client._id);
        const client = await Client.findById(req.client._id).select('-senha');
        
        if (!client) {
            console.log('Cliente não encontrado');
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        console.log('Cliente encontrado:', client);
        res.json(client);
    } catch (error) {
        console.error('Erro ao buscar cliente atual:', error);
        res.status(500).json({ 
            message: 'Erro ao buscar dados do cliente',
            error: error.message 
        });
    }
};

// @desc    Buscar cliente pelo link de indicação
// @route   GET /api/clients/indication/:linkIndicador
// @access  Public
exports.getClientByIndicationLink = async (req, res) => {
    try {
        const client = await Client.findOne({ linkIndicador: req.params.linkIndicador })
            .select('configuracaoDivulgação');

        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        res.json(client);
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        res.status(500).json({ 
            message: 'Erro ao buscar cliente',
            error: error.message 
        });
    }
}; 