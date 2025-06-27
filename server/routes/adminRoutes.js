const express = require('express');
const router = express.Router();
const { loginAdmin, listAdmins, createAdmin, updateAdmin, deleteAdmin } = require('../controllers/adminAuthController');
const protectAdmin = require('../middleware/protectAdmin');
const { isSuperAdmin } = require('../middleware/protectAdmin');

// Rota de login de admin
router.post('/login', loginAdmin);

// Listar admins (apenas autenticado)
router.get('/', protectAdmin, listAdmins);
// Criar admin (apenas superadmin)
router.post('/', protectAdmin, isSuperAdmin, createAdmin);
// Editar admin (apenas superadmin)
router.put('/:id', protectAdmin, isSuperAdmin, updateAdmin);
// Remover admin (apenas superadmin)
router.delete('/:id', protectAdmin, isSuperAdmin, deleteAdmin);

module.exports = router; 