const Configuracao = require('../models/Configuracao');

const CHAVE_LIMITE = 'limiteAlunosPorHorario';
const LIMITE_PADRAO = 4;

exports.obterLimiteAlunos = async (req, res) => {
  try {
    let config = await Configuracao.findOne({ chave: CHAVE_LIMITE });
    if (!config) {
      config = await Configuracao.create({ chave: CHAVE_LIMITE, valor: LIMITE_PADRAO });
    }
    return res.json({ limite: Number(config.valor) });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar configuração de limite.' });
  }
};

exports.atualizarLimiteAlunos = async (req, res) => {
  try {
    const { limite } = req.body;
    const num = Number(limite);

    if (isNaN(num) || num < 1 || num > 50) {
      return res.status(400).json({ erro: 'O limite deve ser um número válido entre 1 e 50.' });
    }

    const config = await Configuracao.findOneAndUpdate(
      { chave: CHAVE_LIMITE },
      { valor: num, atualizadoEm: new Date() },
      { new: true, upsert: true }
    );

    return res.json({ mensagem: 'Limite atualizado com sucesso!', limite: Number(config.valor) });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao salvar configuração de limite.' });
  }
};