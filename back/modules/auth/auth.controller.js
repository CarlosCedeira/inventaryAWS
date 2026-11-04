const authService = require("./auth.service");
const { clearSessionCookie, sessionCookieOptions } = require("./auth.cookies");
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
      role: session.user.rol,
    });
    res.cookie("bretema_session", session.token, sessionCookieOptions());

    // El navegador no necesita ni debe poder leer el JWT. En pruebas se
    // mantiene temporalmente para los tests de integración ya existentes.
    res.json(process.env.NODE_ENV === "test" ? session : { user: session.user });
  } catch (error) {
    logUnexpectedError(req, "login_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

function me(req, res) {
  res.json({ user: req.user });
}

function logout(req, res) {
  clearSessionCookie(res);
  res.status(204).end();
}

module.exports = {
  login,
  me,
  logout,
};
