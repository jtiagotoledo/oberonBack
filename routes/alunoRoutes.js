const express = require('express');
const router = express.Router();
const alunoController = require('../controllers/alunoController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.post('/', authMiddleware, roleMiddleware(['admin', 'professor']), alunoController.criarAluno);
router.get('/', authMiddleware, roleMiddleware(['admin', 'professor']), alunoController.listarAlunos);
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'professor', 'aluno']), alunoController.buscarAlunoPorId);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'professor', 'aluno']), alunoController.atualizarAluno);
router.post('/:id/reagendar', authMiddleware, roleMiddleware(['admin', 'professor', 'aluno']), alunoController.registrarReagendamento);
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'professor']), alunoController.deletarAluno);

module.exports = router;