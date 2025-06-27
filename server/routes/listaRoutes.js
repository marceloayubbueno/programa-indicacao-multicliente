const express = require('express');
const router = express.Router();
const {
    getListas,
    getListaById,
    createLista,
    updateLista,
    deleteLista,
    addParticipantes,
    removeParticipantes
} = require('../controllers/listaController');

// Middleware de autenticação
const { protect } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas principais
router.route('/')
    .get(getListas)
    .post(createLista);

router.route('/:id')
    .get(getListaById)
    .put(updateLista)
    .delete(deleteLista);

// Rotas de participantes
router.route('/:id/participantes')
    .post(addParticipantes)
    .delete(removeParticipantes);

module.exports = router; 