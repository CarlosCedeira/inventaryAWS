const bcrypt = require("bcrypt");
const usersModel = require("./users.model");

const ASSIGNABLE_ROLES = new Set(["admin", "almacen", "vendedor"]);

function cleanText(value, label, min, max) {
  if (typeof value !== "string") throw Object.assign(new Error(`${label} es obligatorio`), { statusCode: 400 });
  const text = value.trim();
  if (text.length < min || text.length > max) throw Object.assign(new Error(`${label} debe tener entre ${min} y ${max} caracteres`), { statusCode: 400 });
  return text;
}

function buildUserPayload(payload) {
  const nombre = cleanText(payload?.nombre, "El nombre", 2, 150);
  const email = cleanText(payload?.email, "El email", 5, 150).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw Object.assign(new Error("El email no es válido"), { statusCode: 400 });
  const rol = payload?.rol;
  if (!ASSIGNABLE_ROLES.has(rol)) throw Object.assign(new Error("El rol no es asignable"), { statusCode: 400 });
  return { nombre, email, rol, activo: Boolean(payload?.activo) };
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 6 || password.length > 128) {
    throw Object.assign(new Error("La contraseña debe tener entre 6 y 128 caracteres"), { statusCode: 400 });
  }
  return password;
}

async function listUsers(tenantId) {
  return usersModel.listUsers(tenantId);
}

async function createUser(tenantId, payload) {
  const user = buildUserPayload({ ...payload, activo: true });
  const password = validatePassword(payload?.password);
  const passwordHash = await bcrypt.hash(password, 12);
  const id = await usersModel.createUser(tenantId, { ...user, passwordHash });
  return { id, ...user };
}

async function updateUser(tenantId, actorId, userId, payload) {
  const existing = await usersModel.getUser(tenantId, userId);
  if (!existing) throw Object.assign(new Error("Usuario no encontrado"), { statusCode: 404 });
  if (existing.rol === "owner") throw Object.assign(new Error("No se puede modificar una cuenta owner desde esta sección"), { statusCode: 403 });
  const user = buildUserPayload(payload);
  if (userId === actorId && (user.rol !== "owner" || !user.activo)) {
    throw Object.assign(new Error("No puedes cambiar tu propio rol ni desactivar tu cuenta"), { statusCode: 403 });
  }
  const affectedRows = await usersModel.updateUser(tenantId, userId, user);
  if (!affectedRows) throw Object.assign(new Error("Usuario no encontrado"), { statusCode: 404 });
  return { id: userId, ...user };
}

async function resetPassword(tenantId, userId, password) {
  const existing = await usersModel.getUser(tenantId, userId);
  if (!existing) throw Object.assign(new Error("Usuario no encontrado"), { statusCode: 404 });
  if (existing.rol === "owner") throw Object.assign(new Error("No se puede restablecer una cuenta owner desde esta sección"), { statusCode: 403 });
  const passwordHash = await bcrypt.hash(validatePassword(password), 12);
  await usersModel.resetPassword(tenantId, userId, passwordHash);
}

module.exports = { createUser, listUsers, resetPassword, updateUser };
