const express = require('express');
const router = express.Router();
const protectAdmin = require('../middleware/protectAdmin');
const {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    getClientByIndicationLink
} = require('../controllers/clientController');

// Rotas públicas
router.get('/indication/:linkIndicador', getClientByIndicationLink);

// Rotas protegidas por admin
router.use(protectAdmin);

router.route('/')
    .get(getClients)
    .post(createClient);

router.route('/:id')
    .get(getClientById)
    .put(updateClient)
    .delete(deleteClient);

module.exports = router; 