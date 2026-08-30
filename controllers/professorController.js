const bcrypt = require('bcryptjs');
const Professor = require('../models/Professor');

exports.criarProfessor = async (req, res) => {
  try {
    const { nome, email, telefone, senha, horarios } = req.body;

    const professorExistente = await Professor.findOne({ email });
    if (professorExistente) {
      return res.status(400).json({ erro: 'Este email já está cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const novoProfessor = new Professor({ 
      nome, 
      email, 
      telefone, 
      senha: senhaHash,
      horarios 
    });
    
    await novoProfessor.save();

    res.status(201).json({ 
      mensagem: 'Professor cadastrado com sucesso!', 
      professor: { id: novoProfessor._id, nome: novoProfessor.nome, email: novoProfessor.email, horarios: novoProfessor.horarios } 
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao cadastrar professor.', detalhe: erro.message });
  }
};

exports.listarProfessores = async (req, res) => {
  try {
    const professores = await Professor.find().select('-senha');
    res.json(professores);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar professores.' });
  }
};

exports.buscarProfessorPorId = async (req, res) => {
  try {
    const professor = await Professor.findById(req.params.id).select('-senha');
    if (!professor) return res.status(404).json({ erro: 'Professor não encontrado.' });
    res.json(professor);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar professor.' });
  }
};

exports.atualizarProfessor = async (req, res) => {
  try {
    const { nome, email, telefone, senha, horarios } = req.body;
    let dadosAtualizados = { nome, email, telefone, horarios };

    if (senha) {
      const salt = await bcrypt.genSalt(10);
      dadosAtualizados.senha = await bcrypt.hash(senha, salt);
    }

    const professor = await Professor.findByIdAndUpdate(req.params.id, dadosAtualizados, { new: true }).select('-senha');
    if (!professor) return res.status(404).json({ erro: 'Professor não encontrado.' });
    
    res.json({ mensagem: 'Dados atualizados!', professor });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar professor.' });
  }
};

exports.deletarProfessor = async (req, res) => {
  try {
    const professor = await Professor.findByIdAndDelete(req.params.id);
    if (!professor) return res.status(404).json({ erro: 'Professor não encontrado.' });
    res.json({ mensagem: 'Professor removido com sucesso!' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao deletar professor.' });
  }
};