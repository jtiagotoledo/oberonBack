const mongoose = require('mongoose');

const professorSchema = new mongoose.Schema({
  nome: { type: String, required: true }, //
  email: { type: String, required: true, unique: true }, //
  telefone: { type: String }, //
  senha: { type: String, required: true },
  role: { type: String, default: 'professor' },
  primeiroAcesso: { type: Boolean, default: true },
  horarios: [{
    diaSemana: { type: String, enum: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'] },
    slots: [{ type: String }]
  }],
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Professor', professorSchema);