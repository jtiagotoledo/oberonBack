const express = require('express');
const router = express.Router();
const professorController = require('../controllers/professorController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, professorController.criarProfessor);
router.get('/', authMiddleware, professorController.listarProfessores);
router.get('/:id', authMiddleware, professorController.buscarProfessorPorId);
router.put('/:id', authMiddleware, professorController.atualizarProfessor);
router.delete('/:id', authMiddleware, professorController.deletarProfessor);

module.exports = router;