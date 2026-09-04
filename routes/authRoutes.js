const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const autenticarToken = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/trocar-senha-primeiro-acesso', autenticarToken, authController.trocarSenhaPrimeiroAcesso);

module.exports = router;