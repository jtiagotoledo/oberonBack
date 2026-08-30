const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ erro: 'Acesso negado. Formato de token inválido.' });
  }

  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    
    req.usuario = decodificado;
    
    next();
  } catch (erro) {
    res.status(400).json({ erro: 'Token inválido ou expirado.' });
  }
};