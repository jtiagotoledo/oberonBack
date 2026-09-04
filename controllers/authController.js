const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Professor = require('../models/Professor');
const Aluno = require('../models/Aluno');
const { enviarEmailRecuperacao } = require('../services/emailService');

const modelosPorRole = {
  admin: Admin,
  professor: Professor,
  aluno: Aluno,
};

const modelos = [Admin, Professor, Aluno];

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    let usuario = await Admin.findOne({ email });

    if (!usuario) {
      usuario = await Professor.findOne({ email });
    }

    if (!usuario) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: usuario._id, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensagem: 'Login efetuado com sucesso!',
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        primeiroAcesso: usuario.primeiroAcesso ?? false,
      },
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro no servidor durante o login.' });
  }
};

exports.trocarSenhaPrimeiroAcesso = async (req, res) => {
  try {
    const { novaSenha } = req.body;
    const { id, role } = req.usuario;

    if (!novaSenha || novaSenha.length < 6) {
      return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    const Model = modelosPorRole[role];
    if (!Model) {
      return res.status(400).json({ erro: 'Perfil de usuário inválido.' });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(novaSenha, salt);

    const usuarioAtualizado = await Model.findByIdAndUpdate(
      id,
      {
        senha: senhaHash,
        primeiroAcesso: false,
      },
      { new: true }
    ).select('-senha');

    if (!usuarioAtualizado) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.json({
      mensagem: 'Senha redefinida com sucesso!',
      usuario: {
        id: usuarioAtualizado._id,
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
        role: usuarioAtualizado.role || role,
        primeiroAcesso: usuarioAtualizado.primeiroAcesso,
      },
    });
  } catch (error) {
    console.error('Erro ao trocar senha genérica:', error);
    res.status(500).json({ erro: 'Erro interno ao redefinir a senha.' });
  }
};

exports.solicitarRecuperacaoSenha = async (req, res) => {
  try {
    const { email } = req.body;

    let usuario = null;
    let ModelEncontrado = null;

    for (const Model of modelos) {
      usuario = await Model.findOne({ email });
      if (usuario) {
        ModelEncontrado = Model;
        break;
      }
    }

    if (!usuario) {
      return res.json({ mensagem: 'Se o e-mail existir, um link de recuperação foi enviado.' });
    }

    const tokenReset = crypto.randomBytes(32).toString('hex');

    usuario.resetSenhaToken = tokenReset;
    usuario.resetSenhaExpira = Date.now() + 15 * 60 * 1000;
    await usuario.save();

    const baseUrl = process.env.APP_URL;
    const linkReset = `${baseUrl}/redefinir-senha.html?token=${tokenReset}`;

    await enviarEmailRecuperacao(usuario.email, usuario.nome, linkReset);

    res.json({ mensagem: 'E-mail de recuperação enviado com sucesso!' });
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    res.status(500).json({ erro: 'Erro interno ao solicitar recuperação de senha.' });
  }
};

exports.redefinirSenha = async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    if (!novaSenha || novaSenha.length < 6) {
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    let usuario = null;
    for (const Model of modelos) {
      usuario = await Model.findOne({
        resetSenhaToken: token,
        resetSenhaExpira: { $gt: Date.now() },
      });
      if (usuario) break;
    }

    if (!usuario) {
      return res.status(400).json({ erro: 'Link inválido ou expirado. Solicite novamente.' });
    }

    const salt = await bcrypt.genSalt(10);
    usuario.senha = await bcrypt.hash(novaSenha, salt);
    usuario.primeiroAcesso = false;
    usuario.resetSenhaToken = undefined;
    usuario.resetSenhaExpira = undefined;
    await usuario.save();

    res.json({ mensagem: 'Senha redefinida com sucesso! Você já pode entrar pelo aplicativo.' });
  } catch (error) {
    console.error('Erro ao salvar nova senha redefinida:', error);
    res.status(500).json({ erro: 'Erro interno ao redefinir a senha.' });
  }
};