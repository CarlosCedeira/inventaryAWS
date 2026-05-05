const authService = require("./auth.service");

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son obligatorios" });
    }

    const session = await authService.login(email, password);
    if (!session) {
      return res.status(401).json({ error: "Credenciales no validas" });
    }

    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = {
  login,
};
