const mongoose = require('mongoose');

const configuracaoSchema = new mongoose.Schema({
  chave: { type: String, required: true, unique: true },
  valor: { type: mongoose.Schema.Types.Mixed, required: true },
  atualizadoEm: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Configuracao', configuracaoSchema);