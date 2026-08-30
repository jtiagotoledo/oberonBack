require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`Conectado ao MongoDB! Banco de dados: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error('Erro crítico ao conectar no MongoDB:', err);
  });

app.get('/api/health', (req, res) => {
  res.json({ status: 'alive', db_state: mongoose.connection.readyState });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});