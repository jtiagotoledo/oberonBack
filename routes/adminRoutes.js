const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');

router.post('/', adminController.criarAdmin);
router.get('/', adminController.listarAdmins);
router.get('/:id', adminController.buscarAdminPorId);
router.put('/:id', adminController.atualizarAdmin);
router.delete('/:id', adminController.deletarAdmin);

module.exports = router;