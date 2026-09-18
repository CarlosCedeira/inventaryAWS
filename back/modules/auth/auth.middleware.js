const { verifyToken } = require("./auth.tokens");
const { log } = require("../../utils/logger");

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
    log("warn", "authentication_failed", { requestId: req.requestId, path: req.originalUrl });
    res.status(401).json({ error: "Token invalido" });
  }
}

module.exports = {
  requireAuth,
};
