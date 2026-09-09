const express = require('express');
const router = express.Router();
const professorController = require('../controllers/professorController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/minha-agenda', authMiddleware, roleMiddleware(['admin', 'professor']), professorController.obterMinhaAgenda);
router.get('/minha-grade', authMiddleware, roleMiddleware(['admin', 'professor']), professorController.obterMinhaGradeCompleta);
router.get('/:id/ocupacao', authMiddleware, roleMiddleware(['admin', 'professor', 'aluno']), professorController.obterOcupacaoHorarios);

router.post('/', authMiddleware, roleMiddleware(['admin']), professorController.criarProfessor);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), professorController.atualizarProfessor);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), professorController.deletarProfessor);
router.get('/', authMiddleware, roleMiddleware(['admin', 'aluno']), professorController.listarProfessores);
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'aluno']), professorController.buscarProfessorPorId);

module.exports = router;