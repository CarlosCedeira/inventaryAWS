import bcrypt from "bcrypt";
import { findActiveUserByEmail, type SessionUser } from "./auth.model";
import { createToken } from "./auth.tokens";

export interface AuthSession {
  token: string;
  user: SessionUser;
}

async function login(email: string, password: string): Promise<AuthSession | null> {
  const user = await findActiveUserByEmail(email);
  if (!user || !await bcrypt.compare(password, user.password_hash)) return null;

  const safeUser: SessionUser = {
    id: user.id,
    tenant_id: user.tenant_id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    tenant_nombre: user.tenant_nombre,
    session_version: user.session_version,
  };
  return { token: createToken(safeUser), user: safeUser };
}

export { login };
