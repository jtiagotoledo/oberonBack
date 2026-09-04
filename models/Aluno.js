const mongoose = require('mongoose');

const alunoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telefone: { type: String },
  endereco: { type: String },
  cidade: { type: String },
  senha: { type: String, required: true },
  role: { type: String, default: 'aluno' },
  primeiroAcesso: { type: Boolean, default: true },
  professorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Professor',
    required: true 
  },

  horariosFixos: [{
    diaSemana: { type: String, enum: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'] },
    horario: { type: String } 
  }],

  limiteMensalReagendamentos: { type: Number, default: 2 },
  
  reagendamentos: [{
    dataFalta: { type: Date, required: true },      
    dataReposicao: { type: Date },                  
    mesReferencia: { type: String, required: true } 
  }],

  resetSenhaToken: { type: String },
  resetSenhaExpira: { type: Date },
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Aluno', alunoSchema);