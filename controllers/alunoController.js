const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Aluno = require('../models/Aluno');
const Admin = require('../models/Admin');
const Professor = require('../models/Professor');
const { enviarSenhaTemporaria } = require('../services/emailService');

exports.criarAluno = async (req, res) => {
  try {
    const { nome, email, telefone, endereco, cidade, professor, aulasSemanais, horariosAula } = req.body;

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
      email,
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

exports.atualizarAluno = async (req, res) => {
  try {
    const { nome, telefone, endereco, cidade, professorId, horariosFixos } = req.body;

    const LIMITE = parseInt(process.env.LIMITE_ALUNOS_POR_HORARIO) || 4;

    if (horariosFixos && horariosFixos.length > 0) {
      for (const slot of horariosFixos) {
        const alunosNoHorario = await Aluno.countDocuments({ 
          professorId: professorId,
          'horariosFixos.diaSemana': slot.diaSemana,
          'horariosFixos.horario': slot.horario,
          _id: { $ne: req.params.id } 
        });

        if (alunosNoHorario >= LIMITE) {
          return res.status(400).json({ 
            erro: `O novo horário de ${slot.diaSemana} às ${slot.horario} já está lotado (máx ${LIMITE}).` 
          });
        }
      }
    }

    const aluno = await Aluno.findByIdAndUpdate(
      req.params.id, 
      { nome, telefone, endereco, cidade, professorId, horariosFixos }, 
      { new: true }
    ).select('-senha');
    
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });
    
    res.json({ mensagem: 'Dados do aluno atualizados!', aluno });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar aluno.' });
  }
};

exports.deletarAluno = async (req, res) => {
  try {
    const aluno = await Aluno.findByIdAndDelete(req.params.id);
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });
    res.json({ mensagem: 'Aluno removido com sucesso!' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao deletar aluno.' });
  }
};