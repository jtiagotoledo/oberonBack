const bcrypt = require('bcryptjs');
const Aluno = require('../models/Aluno');

exports.criarAluno = async (req, res) => {
  try {
    const { 
      nome, email, telefone, endereco, cidade, senha, professorId, horariosFixos 
    } = req.body;

    const alunoExistente = await Aluno.findOne({ email });
    if (alunoExistente) {
      return res.status(400).json({ erro: 'Este email já está cadastrado.' });
    }

    const LIMITE = parseInt(process.env.LIMITE_ALUNOS_POR_HORARIO) || 4;

    if (horariosFixos && horariosFixos.length > 0) {
      for (const slot of horariosFixos) {
        const alunosNoHorario = await Aluno.countDocuments({ 
          professorId: professorId,
          'horariosFixos.diaSemana': slot.diaSemana,
          'horariosFixos.horario': slot.horario
        });

        if (alunosNoHorario >= LIMMITE) {
          return res.status(400).json({ 
            erro: `O horário de ${slot.diaSemana} às ${slot.horario} já atingiu o limite máximo de 4 alunos.` 
          });
        }
      }
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const novoAluno = new Aluno({
      nome, email, telefone, endereco, cidade, senha: senhaHash, professorId, horariosFixos
    });

    await novoAluno.save();

    res.status(201).json({
      mensagem: 'Aluno matriculado com sucesso!',
      aluno: { 
        id: novoAluno._id, 
        nome: novoAluno.nome, 
        horariosFixos: novoAluno.horariosFixos 
      }
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao cadastrar aluno.', detalhe: erro.message });
  }
};

exports.listarAlunos = async (req, res) => {
  try {
    const alunos = await Aluno.find()
      .select('-senha')
      .populate('professorId', 'nome email'); // Traz o nome e email do professor
    res.json(alunos);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar alunos.' });
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
            erro: `O novo horário de ${slot.diaSemana} às ${slot.horario} já está lotado (máx 4).` 
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