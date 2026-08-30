const express = require('express');
const router = express.Router();
const alunoController = require('../controllers/alunoController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.post('/', authMiddleware, roleMiddleware(['admin', 'professor']), alunoController.criarAluno);
router.get('/', authMiddleware, roleMiddleware(['admin', 'professor']), alunoController.listarAlunos);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'professor']), alunoController.atualizarAluno);
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'professor']), alunoController.deletarAluno);

module.exports = router;