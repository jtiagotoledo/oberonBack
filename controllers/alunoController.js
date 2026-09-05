const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Aluno = require('../models/Aluno');
const Admin = require('../models/Admin');
const Professor = require('../models/Professor');
const { enviarSenhaTemporaria } = require('../services/emailService');

exports.criarAluno = async (req, res) => {
  try {
    const { nome, email, cpf, telefone, endereco, cidade, professor, aulasSemanais, horariosAula } = req.body;

    if (!nome || !email || !cpf || !professor) {
      return res.status(400).json({ erro: 'Nome, e-mail, CPF e professor são obrigatórios.' });
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({ erro: 'CPF inválido. Deve conter 11 dígitos.' });
    }

    const cpfExiste = await Aluno.findOne({ cpf: cpfLimpo });
    if (cpfExiste) {
      return res.status(400).json({ erro: 'Este CPF já está cadastrado para outro aluno.' });
    }

    const emailExiste =
      (await Admin.findOne({ email })) ||
      (await Professor.findOne({ email })) ||
      (await Aluno.findOne({ email }));

    if (emailExiste) {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado no sistema.' });
    }

    if (!horariosAula || horariosAula.length !== Number(aulasSemanais)) {
      return res.status(400).json({ erro: 'Defina o dia e horário para todas as aulas contratadas.' });
    }

    const senhaTemporaria = crypto.randomBytes(3).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senhaTemporaria, salt);

    const novoAluno = new Aluno({
      nome,
      email: email.toLowerCase().trim(),
      cpf: cpfLimpo,
      telefone,
      endereco,
      cidade,
      professor,
      aulasSemanais: Number(aulasSemanais),
      horariosAula,
      senha: senhaHash,
      role: 'aluno',
      primeiroAcesso: true,
    });

    await novoAluno.save();
    await enviarSenhaTemporaria(email, nome, senhaTemporaria);

    res.status(201).json({
      mensagem: 'Aluno cadastrado e e-mail enviado com sucesso!',
      aluno: {
        id: novoAluno._id,
        nome: novoAluno.nome,
        email: novoAluno.email,
        cpf: novoAluno.cpf,
        primeiroAcesso: novoAluno.primeiroAcesso,
      },
    });
  } catch (error) {
    console.error('Erro ao cadastrar aluno:', error);
    res.status(500).json({ erro: 'Erro interno ao processar cadastro de aluno.' });
  }
};

exports.listarAlunos = async (req, res) => {
  try {
    const alunos = await Aluno.find().populate('professor', 'nome email').select('-senha');
    res.json(alunos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar alunos.' });
  }
};

exports.buscarAlunoPorId = async (req, res) => {
  try {
    const aluno = await Aluno.findById(req.params.id).populate('professor', 'nome email').select('-senha');
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });
    res.json(aluno);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar aluno.' });
  }
};

exports.atualizarAluno = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, cpf, telefone, endereco, cidade, professor, aulasSemanais, horariosAula } = req.body;

    let dadosAtualizados = { nome, telefone, endereco, cidade, professor, aulasSemanais, horariosAula };

    if (email) {
      const emailEmUso =
        (await Admin.findOne({ email, _id: { $ne: id } })) ||
        (await Professor.findOne({ email, _id: { $ne: id } })) ||
        (await Aluno.findOne({ email, _id: { $ne: id } }));

      if (emailEmUso) {
        return res.status(400).json({ erro: 'Este e-mail já está em uso por outro usuário.' });
      }
      dadosAtualizados.email = email.toLowerCase().trim();
    }

    if (cpf) {
      const cpfLimpo = cpf.replace(/\D/g, '');
      const cpfEmUso = await Aluno.findOne({ cpf: cpfLimpo, _id: { $ne: id } });
      if (cpfEmUso) {
        return res.status(400).json({ erro: 'Este CPF já está em uso por outro aluno.' });
      }
      dadosAtualizados.cpf = cpfLimpo;
    }

    const aluno = await Aluno.findByIdAndUpdate(id, dadosAtualizados, { new: true }).select('-senha');
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

    res.json({ mensagem: 'Dados atualizados com sucesso!', aluno });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar aluno.' });
  }
};

exports.deletarAluno = async (req, res) => {
  try {
    const aluno = await Aluno.findByIdAndDelete(req.params.id);
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });
    res.json({ mensagem: 'Aluno removido com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao deletar aluno.' });
  }
};