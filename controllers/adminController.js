const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

exports.criarAdmin = async (req, res) => {
  try {
    const { nome, email, telefone, senha } = req.body;

    const adminExistente = await Admin.findOne({ email });
    if (adminExistente) {
      return res.status(400).json({ erro: 'Este email já está cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const novoAdmin = new Admin({ nome, email, telefone, senha: senhaHash });
    await novoAdmin.save();

    res.status(201).json({ 
      mensagem: 'Administrador criado com sucesso!', 
      admin: { id: novoAdmin._id, nome: novoAdmin.nome, email: novoAdmin.email } 
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar administrador.', detalhe: erro.message });
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
    const { nome, email, telefone, senha } = req.body;
    let dadosAtualizados = { nome, email, telefone };

    if (senha) {
      const salt = await bcrypt.genSalt(10);
      dadosAtualizados.senha = await bcrypt.hash(senha, salt);
    }

    const admin = await Admin.findByIdAndUpdate(req.params.id, dadosAtualizados, { new: true }).select('-senha');
    if (!admin) return res.status(404).json({ erro: 'Administrador não encontrado.' });
    
    res.json({ mensagem: 'Dados atualizados!', admin });
  } catch (erro) {
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