const mongoose = require('mongoose');

const alunoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  cpf: { type: String, required: true, unique: true, sparse: true },
  telefone: { type: String },
  endereco: { type: String },
  cidade: { type: String },
  senha: { type: String, required: true },
  role: { type: String, default: 'aluno' },
  primeiroAcesso: { type: Boolean, default: true },
  professor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professor',
    required: true,
  },
  aulasSemanais: { type: Number, required: true, min: 1, max: 5 },
  horariosAula: [
    {
      diaSemana: {
        type: String,
        enum: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'],
        required: true,
      },
      horario: { type: String, required: true },
    },
  ],
  resetSenhaToken: { type: String },
  resetSenhaExpira: { type: Date },
  criadoEm: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Aluno', alunoSchema);