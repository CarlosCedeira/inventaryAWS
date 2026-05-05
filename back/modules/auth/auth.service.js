const bcrypt = require("bcrypt");
const authModel = require("./auth.model");
const { createToken } = require("./auth.tokens");

async function login(email, password) {
  const user = await authModel.findActiveUserByEmail(email);
  if (!user) return null;

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) return null;

  const safeUser = {
    id: user.id,
    tenant_id: user.tenant_id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    tenant_nombre: user.tenant_nombre,
  };

  return {
    token: createToken(safeUser),
    user: safeUser,
  };
}

module.exports = {
  login,
};
