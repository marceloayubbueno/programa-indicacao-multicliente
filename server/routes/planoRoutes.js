const express = require('express');
const router = express.Router();
const planoController = require('../controllers/planoController');

// Rotas de planos
router.get('/', planoController.getPlanos);
router.post('/', planoController.createPlano);
router.put('/:id', planoController.updatePlano);
router.delete('/:id', planoController.deletePlano);

module.exports = router; 