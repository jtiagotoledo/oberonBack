const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, admin.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' } 
    );

    res.json({
      mensagem: 'Login efetuado com sucesso!',
      token,
      admin: { id: admin._id, nome: admin.nome, email: admin.email, role: admin.role }
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro no servidor durante o login.' });
  }
};