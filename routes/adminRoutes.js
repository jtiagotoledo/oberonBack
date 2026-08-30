const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', adminController.criarAdmin);

router.get('/', authMiddleware, adminController.listarAdmins);
router.get('/:id', authMiddleware, adminController.buscarAdminPorId);
router.put('/:id', authMiddleware, adminController.atualizarAdmin);
router.delete('/:id', authMiddleware, adminController.deletarAdmin);

module.exports = router;