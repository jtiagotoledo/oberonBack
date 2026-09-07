const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Professor = require('../models/Professor');
const Aluno = require('../models/Aluno');
const Configuracao = require('../models/Configuracao');
const { enviarSenhaTemporaria } = require('../services/emailService');

exports.criarProfessor = async (req, res) => {
  try {
    const { nome, email, telefone, horarios } = req.body;

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

    const novoProfessor = new Professor({
      nome,
      email,
      telefone,
      senha: senhaHash,
      role: 'professor',
      primeiroAcesso: true,
      horarios: horarios || [],
    });

    await novoProfessor.save();
    await enviarSenhaTemporaria(email, nome, senhaTemporaria);

    res.status(201).json({
      mensagem: 'Professor cadastrado e e-mail enviado com sucesso!',
      professor: {
        id: novoProfessor._id,
        nome: novoProfessor.nome,
        email: novoProfessor.email,
        primeiroAcesso: novoProfessor.primeiroAcesso,
      },
    });
  } catch (error) {
    console.error('Erro ao cadastrar professor:', error);
    res.status(500).json({ erro: 'Erro interno ao processar cadastro de professor.' });
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
    const { id } = req.params;
    const { nome, email, telefone, senha, horarios } = req.body;

    if (email) {
      const emailEmUso =
        (await Admin.findOne({ email, _id: { $ne: id } })) ||
        (await Professor.findOne({ email, _id: { $ne: id } })) ||
        (await Aluno.findOne({ email, _id: { $ne: id } }));

      if (emailEmUso) {
        return res.status(400).json({ erro: 'Este e-mail já está em uso por outro usuário.' });
      }
    }

    let dadosAtualizados = { nome, email, telefone, horarios };

    if (senha) {
      const salt = await bcrypt.genSalt(10);
      dadosAtualizados.senha = await bcrypt.hash(senha, salt);
      dadosAtualizados.primeiroAcesso = false; // Corrigido: desativa primeiro acesso se a senha for alterada aqui
    }

    const professor = await Professor.findByIdAndUpdate(id, dadosAtualizados, { new: true }).select('-senha');
    if (!professor) return res.status(404).json({ erro: 'Professor não encontrado.' });

    res.json({ mensagem: 'Dados atualizados!', professor });
  } catch (erro) {
    console.error('Erro ao atualizar professor:', erro);
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

exports.obterOcupacaoHorarios = async (req, res) => {
  try {
    const { id } = req.params;
    const professor = await Professor.findById(id);
    if (!professor) {
      return res.status(404).json({ erro: 'Professor não encontrado.' });
    }

    const config = await Configuracao.findOne({ chave: 'limiteAlunosPorHorario' });
    const limite = config ? Number(config.valor) : 4;

    const alunos = await Aluno.find({ professor: id }).select('horariosAula');

    const contagem = {};
    alunos.forEach((aluno) => {
      aluno.horariosAula?.forEach((h) => {
        const chave = `${h.diaSemana}_${h.horario}`;
        contagem[chave] = (contagem[chave] || 0) + 1;
      });
    });

    const ocupacao = [];
    professor.horarios?.forEach((item) => {
      const slotsInfo = item.slots.map((slot) => {
        const totalMatriculados = contagem[`${item.diaSemana}_${slot}`] || 0;
        return {
          horario: slot,
          matriculados: totalMatriculados,
          limite,
          lotado: totalMatriculados >= limite,
        };
      });

      ocupacao.push({
        diaSemana: item.diaSemana,
        slots: slotsInfo,
      });
    });

    return res.json({ limite, ocupacao });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao calcular ocupação dos horários.' });
  }
};

exports.obterMinhaGradeCompleta = async (req, res) => {
  try {
    let professorId = req.user.id;

    if (req.user.role === 'admin') {
      const primeiroProf = await Professor.findOne();
      if (!primeiroProf) {
        return res.status(404).json({ erro: 'Nenhum professor cadastrado para visualização.' });
      }
      professorId = primeiroProf._id;
    }

    const professor = await Professor.findById(professorId);
    if (!professor) {
      return res.status(404).json({ erro: 'Professor não encontrado.' });
    }

    const config = await Configuracao.findOne({ chave: 'limiteAlunosPorHorario' });
    const limiteMaximo = config ? Number(config.valor) : 4;

    const alunos = await Aluno.find({ professor: professorId })
      .select('nome email telefone cpf horariosAula')
      .lean();

    const mapaAlunosPorSlot = {};
    alunos.forEach((aluno) => {
      aluno.horariosAula?.forEach((h) => {
        const chave = `${h.diaSemana}_${h.horario}`;
        if (!mapaAlunosPorSlot[chave]) {
          mapaAlunosPorSlot[chave] = [];
        }
        mapaAlunosPorSlot[chave].push({
          _id: aluno._id,
          nome: aluno.nome,
          email: aluno.email,
          telefone: aluno.telefone,
          cpf: aluno.cpf,
        });
      });
    });

    const grade = (professor.horarios || []).map((h) => {
      const slotsComAlunos = (h.slots || []).map((slot) => {
        const chave = `${h.diaSemana}_${slot}`;
        const alunosDoSlot = mapaAlunosPorSlot[chave] || [];
        return {
          horario: slot,
          limite: limiteMaximo,
          totalAlunos: alunosDoSlot.length,
          lotado: alunosDoSlot.length >= limiteMaximo,
          alunos: alunosDoSlot,
        };
      });

      return {
        diaSemana: h.diaSemana,
        slots: slotsComAlunos,
      };
    });

    return res.json({
      professor: {
        id: professor._id,
        nome: professor.nome,
      },
      limiteMaximo,
      grade,
    });
  } catch (error) {
    console.error('Erro ao buscar grade completa do professor:', error);
    return res.status(500).json({ erro: 'Erro ao carregar grade de aulas.' });
  }
};