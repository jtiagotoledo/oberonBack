const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.post('/', authMiddleware, roleMiddleware(['admin']), adminController.criarAdmin);
router.get('/', authMiddleware, roleMiddleware(['admin']), adminController.listarAdmins);
router.get('/:id', authMiddleware, roleMiddleware(['admin']), adminController.buscarAdminPorId);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), adminController.atualizarAdmin);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), adminController.deletarAdmin);

module.exports = router;