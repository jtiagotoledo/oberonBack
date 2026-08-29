const express = require('express');
const app = express();
const PORT = 4000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'Servidor vivo na porta 4000' });
});

app.listen(PORT, () => {
  console.log(`Servidor da Muvup rodando na porta ${PORT}`);
});