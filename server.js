require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());

// Conexão com o MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`Conectado ao MongoDB! Banco de dados: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error('Erro crítico ao conectar no MongoDB:', err);
  });

// Rota de health check (agora retorna também o status do banco)
// 0 = desconectado, 1 = conectado, 2 = conectando, 3 = desconectando
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'alive', 
    db_state: mongoose.connection.readyState 
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});