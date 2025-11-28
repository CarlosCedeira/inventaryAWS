// Middleware para verificar rol
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const user = req.user; // asumimos que viene del JWT o sesión
    if (!user) return res.status(401).json({ error: "No autenticado" });

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Permiso denegado" });
    }
    next();
  };
};

module.exports = { checkRole };
