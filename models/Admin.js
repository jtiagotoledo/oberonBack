const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  nome: { type: String, required: true }, //
  email: { type: String, required: true, unique: true }, //
  telefone: { type: String }, //
  senha: { type: String, required: true },
  role: { type: String, default: 'admin' },
  primeiroAcesso: { type: Boolean, default: true },
  resetSenhaToken: { type: String },
  resetSenhaExpira: { type: Date },
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admin', adminSchema);