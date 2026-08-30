const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Professor = require('../models/Professor');

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    let usuario = await Admin.findOne({ email });
    
    if (!usuario) {
      usuario = await Professor.findOne({ email });
    }

    if (!usuario) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: usuario._id, role: usuario.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );

    res.json({
      mensagem: 'Login efetuado com sucesso!',
      token,
      usuario: { id: usuario._id, nome: usuario.nome, email: usuario.email, role: usuario.role }
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro no servidor durante o login.' });
  }
};