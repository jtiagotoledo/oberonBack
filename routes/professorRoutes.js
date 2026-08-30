const express = require('express');
const router = express.Router();
const professorController = require('../controllers/professorController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.post('/', authMiddleware, roleMiddleware(['admin']), professorController.criarProfessor);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), professorController.atualizarProfessor);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), professorController.deletarProfessor);

router.get('/', authMiddleware, roleMiddleware(['admin', 'aluno']), professorController.listarProfessores);
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'aluno']), professorController.buscarProfessorPorId);

module.exports = router;