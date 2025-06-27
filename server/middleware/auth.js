const jwt = require('jsonwebtoken');
const Client = require('../models/Client');

const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secret_aqui';

exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Acesso não autorizado' });
        }

        try {
            // Verificar token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Buscar cliente
            const client = await Client.findById(decoded.id).select('-senha');
            if (!client) {
                return res.status(401).json({ message: 'Token inválido' });
            }

            // Adicionar cliente ao request
            req.client = client;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Token inválido' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Erro no servidor' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.client) {
            return res.status(401).json({ message: 'Acesso não autorizado' });
        }

        if (!roles.includes(req.client.role)) {
            return res.status(403).json({ 
                message: 'Você não tem permissão para realizar esta ação' 
            });
        }

        next();
    };
}; 