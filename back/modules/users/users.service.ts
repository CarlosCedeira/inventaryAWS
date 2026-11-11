import bcrypt from "bcrypt";
import type { Role } from "../../types/http";
import { createUser as persistUser, getUser, listUsers as listPersistedUsers, resetPassword as persistPasswordReset, updateUser as persistUserUpdate, type UserWritePayload } from "./users.model";

type UserInput = Record<string, unknown>;
type AssignableRole = Exclude<Role, "owner">;
const ASSIGNABLE_ROLES = new Set<AssignableRole>(["admin", "almacen", "vendedor"]);

interface UserServiceError extends Error { statusCode: number }
function httpError(statusCode: number, message: string): UserServiceError {
  return Object.assign(new Error(message), { statusCode });
}

function cleanText(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== "string") throw httpError(400, `${label} es obligatorio`);
  const text = value.trim();
  if (text.length < min || text.length > max) throw httpError(400, `${label} debe tener entre ${min} y ${max} caracteres`);
  return text;
}

function buildUserPayload(payload: UserInput): UserWritePayload {
  const nombre = cleanText(payload.nombre, "El nombre", 2, 150);
  const email = cleanText(payload.email, "El email", 5, 150).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw httpError(400, "El email no es válido");
  const rol = payload.rol;
  if (typeof rol !== "string" || !ASSIGNABLE_ROLES.has(rol as AssignableRole)) throw httpError(400, "El rol no es asignable");
  return { nombre, email, rol: rol as AssignableRole, activo: Boolean(payload.activo) };
}

function validatePassword(password: unknown): string {
  if (typeof password !== "string" || password.length < 6 || password.length > 128) {
    throw httpError(400, "La contraseña debe tener entre 6 y 128 caracteres");
  }
  return password;
}

async function listUsers(tenantId: number) { return listPersistedUsers(tenantId); }

async function createUser(tenantId: number, payload: UserInput) {
  const user = buildUserPayload({ ...payload, activo: true });
  const passwordHash = await bcrypt.hash(validatePassword(payload.password), 12);
  const id = await persistUser(tenantId, { ...user, passwordHash });
  return { id, ...user };
}

async function updateUser(tenantId: number, actorId: number, userId: number, payload: UserInput) {
  const existing = await getUser(tenantId, userId);
  if (!existing) throw httpError(404, "Usuario no encontrado");
  if (existing.rol === "owner") throw httpError(403, "No se puede modificar una cuenta owner desde esta sección");
  const user = buildUserPayload(payload);
  // Los owners no son editables desde esta sección y los demás roles no pueden
  // asignarse owner; por tanto, un actor no puede modificarse a sí mismo aquí.
  if (userId === actorId) {
    throw httpError(403, "No puedes cambiar tu propio rol ni desactivar tu cuenta");
  }
  if (!await persistUserUpdate(tenantId, userId, user)) throw httpError(404, "Usuario no encontrado");
  return { id: userId, ...user };
}

async function resetPassword(tenantId: number, userId: number, password: unknown): Promise<void> {
  const existing = await getUser(tenantId, userId);
  if (!existing) throw httpError(404, "Usuario no encontrado");
  if (existing.rol === "owner") throw httpError(403, "No se puede restablecer una cuenta owner desde esta sección");
  await persistPasswordReset(tenantId, userId, await bcrypt.hash(validatePassword(password), 12));
}

export { createUser, listUsers, resetPassword, updateUser };
