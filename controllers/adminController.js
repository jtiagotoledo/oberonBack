const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Professor = require('../models/Professor');
const Aluno = require('../models/Aluno');
const { enviarSenhaTemporaria } = require('../services/emailService');

exports.criarAdmin = async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;

    const emailExiste =
      (await Admin.findOne({ email })) ||
      (await Professor.findOne({ email })) ||
      (await Aluno.findOne({ email }));

    if (emailExiste) {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado no sistema.' });
    }

    const senhaTemporaria = crypto.randomBytes(3).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaTemporaria, salt);

    const novoAdmin = new Admin({
      nome,
      email,
      telefone,
      senha: senhaHash,
      role: 'admin',
      primeiroAcesso: true,
    });

    await novoAdmin.save();
    await enviarSenhaTemporaria(email, nome, senhaTemporaria);

    res.status(201).json({
      mensagem: 'Administrador cadastrado e e-mail enviado com sucesso!',
      admin: {
        id: novoAdmin._id,
        nome: novoAdmin.nome,
        email: novoAdmin.email,
        primeiroAcesso: novoAdmin.primeiroAcesso,
      },
    });
  } catch (error) {
    console.error('Erro ao cadastrar admin:', error);
    res.status(500).json({ erro: 'Erro interno ao processar cadastro de administrador.' });
  }
};

exports.listarAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-senha');
    res.json(admins);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar administradores.' });
  }
};

exports.buscarAdminPorId = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-senha');
    if (!admin) return res.status(404).json({ erro: 'Administrador não encontrado.' });
    res.json(admin);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar administrador.' });
  }
};

exports.atualizarAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, senha } = req.body;

    if (email) {
      const emailEmUso =
        (await Admin.findOne({ email, _id: { $ne: id } })) ||
        (await Professor.findOne({ email, _id: { $ne: id } })) ||
        (await Aluno.findOne({ email, _id: { $ne: id } }));

      if (emailEmUso) {
        return res.status(400).json({ erro: 'Este e-mail já está em uso por outro usuário.' });
      }
    }

    let dadosAtualizados = { nome, email, telefone };

    if (senha) {
      const salt = await bcrypt.genSalt(10);
      dadosAtualizados.senha = await bcrypt.hash(senha, salt);
      dadosAtualizados.primeiroAcesso = false;
    }

    const admin = await Admin.findByIdAndUpdate(id, dadosAtualizados, { new: true }).select('-senha');
    if (!admin) return res.status(404).json({ erro: 'Administrador não encontrado.' });

    res.json({ mensagem: 'Dados atualizados!', admin });
  } catch (erro) {
    console.error('Erro ao atualizar admin:', error);
    res.status(500).json({ erro: 'Erro ao atualizar administrador.' });
  }
};

exports.deletarAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ erro: 'Administrador não encontrado.' });
    res.json({ mensagem: 'Administrador removido com sucesso!' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao deletar administrador.' });
  }
};