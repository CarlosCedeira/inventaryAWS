const { verifyToken } = require("./auth.tokens");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const user = verifyToken(token);
    if (!user) return res.status(401).json({ error: "Token invalido" });

    req.user = user;
    req.tenantId = user.tenant_id;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: "Token invalido" });
  }
}

module.exports = {
  requireAuth,
};
