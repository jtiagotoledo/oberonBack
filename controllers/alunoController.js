const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Aluno = require('../models/Aluno');
const Admin = require('../models/Admin');
const Professor = require('../models/Professor');
const Configuracao = require('../models/Configuracao');
const { enviarSenhaTemporaria } = require('../services/emailService');

async function verificarCapacidadeHorarios(professorId, horariosAula, alunoIdIgnorado = null) {
  const config = await Configuracao.findOne({ chave: 'limiteAlunosPorHorario' });
  const limiteMaximo = config ? Number(config.valor) : 4;

  const chavesUnicas = new Set();
  for (const aula of horariosAula) {
    const chave = `${aula.diaSemana}_${aula.horario}`;
    if (chavesUnicas.has(chave)) {
      return {
        lotado: true,
        mensagem: `O horário de ${aula.diaSemana} às ${aula.horario} foi selecionado mais de uma vez.`,
      };
    }
    chavesUnicas.add(chave);
  }

  for (const aula of horariosAula) {
    const filtro = {
      professor: professorId,
      horariosAula: {
        $elemMatch: {
          diaSemana: aula.diaSemana,
          horario: aula.horario,
        },
      },
    };

    if (alunoIdIgnorado) {
      filtro._id = { $ne: alunoIdIgnorado };
    }

    const totalAlunos = await Aluno.countDocuments(filtro);

    if (totalAlunos >= limiteMaximo) {
      return {
        lotado: true,
        mensagem: `O horário de ${aula.diaSemana} às ${aula.horario} atingiu o limite de ${limiteMaximo} alunos para este professor.`,
      };
    }
  }

  return { lotado: false };
}

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

    // Validação da capacidade por horário (limite dinâmico configurável)
    const checagemCapacidade = await verificarCapacidadeHorarios(professor, horariosAula);
    if (checagemCapacidade.lotado) {
      return res.status(400).json({ erro: checagemCapacidade.mensagem });
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
    const aluno = await Aluno.findById(req.params.id)
      .populate('professor', 'nome email')
      .populate('reagendamentos.professor', 'nome email') // <-- Garante que o professor do reagendamento também venha populado
      .select('-senha');
      
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

    if (professor && horariosAula && horariosAula.length > 0) {
      const checagemCapacidade = await verificarCapacidadeHorarios(professor, horariosAula, id);
      if (checagemCapacidade.lotado) {
        return res.status(400).json({ erro: checagemCapacidade.mensagem });
      }
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

exports.registrarReagendamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { dataOrigem, horarioOrigem, dataNova, horarioNovo, professor } = req.body;

    const aluno = await Aluno.findById(id);
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

    aluno.reagendamentos.push({
      dataOrigem,
      horarioOrigem,
      dataNova,
      horarioNovo,
      professor
    });

    await aluno.save();

    res.json({ mensagem: 'Aula reagendada com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar reagendamento:', error);
    res.status(500).json({ erro: 'Erro interno ao reagendar a aula.' });
  }
};