const express = require('express');
const router = express.Router();
const configuracaoController = require('../controllers/configuracaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/limite-alunos', configuracaoController.obterLimiteAlunos);

router.put(
  '/limite-alunos',
  roleMiddleware(['admin']),
  configuracaoController.atualizarLimiteAlunos
);

module.exports = router;