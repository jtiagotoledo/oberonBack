const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  nome: { type: String, required: true }, //
  email: { type: String, required: true, unique: true }, //
  telefone: { type: String }, //
  senha: { type: String, required: true },
  role: { type: String, default: 'admin' },
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admin', adminSchema);