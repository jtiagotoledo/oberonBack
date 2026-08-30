module.exports = (rolesPermitidas) => {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidas.includes(req.usuario.role)) {
      return res.status(403).json({ 
        erro: 'Acesso negado. Seu perfil não tem permissão para realizar esta ação.' 
      });
    }
    
    next();
  };
};