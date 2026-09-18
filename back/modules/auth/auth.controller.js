const authService = require("./auth.service");
const { log, logUnexpectedError } = require("../../utils/logger");

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son obligatorios" });
    }

    const session = await authService.login(email, password);
    if (!session) {
      log("warn", "login_rejected", { requestId: req.requestId });
      return res.status(401).json({ error: "Credenciales no validas" });
    }

    log("info", "login_succeeded", {
      requestId: req.requestId,
      tenantId: session.user.tenant_id,
      userId: session.user.id,
    });
    res.json(session);
  } catch (error) {
    logUnexpectedError(req, "login_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = {
  login,
};
