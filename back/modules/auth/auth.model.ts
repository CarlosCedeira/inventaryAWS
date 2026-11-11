import type { RowDataPacket } from "mysql2/promise";
import type { AuthenticatedUser, Role } from "../../types/http";

const { getConnection } = require("../../db") as {
  getConnection: () => Promise<import("mysql2/promise").PoolConnection>;
};

export interface SessionUser extends AuthenticatedUser {
  nombre: string;
  email: string;
  rol: Role;
  tenant_nombre: string;
  session_version: number;
}

interface LoginUser extends SessionUser, RowDataPacket {
  password_hash: string;
}

type SessionUserRow = SessionUser & RowDataPacket;

async function findActiveUserByEmail(email: string): Promise<LoginUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<LoginUser[]>(
      `SELECT u.id, u.tenant_id, u.nombre, u.email, u.password_hash, u.rol, u.session_version,
              t.nombre AS tenant_nombre
         FROM usuarios u
         INNER JOIN tenants t ON t.id = u.tenant_id
        WHERE LOWER(u.email) = ? AND u.activo = TRUE AND t.activo = TRUE`,
      [normalizedEmail],
    );
    return rows.length === 1 ? rows[0] : null;
  } finally {
    connection.release();
  }
}

// El JWT identifica la sesión, pero este dato se consulta en cada petición
// protegida para que una baja o un cambio de rol se aplique inmediatamente.
async function findActiveSessionUser(userId: number, tenantId: number): Promise<SessionUser | null> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<SessionUserRow[]>(
      `SELECT u.id, u.tenant_id, u.nombre, u.email, u.rol, u.session_version, t.nombre AS tenant_nombre
         FROM usuarios u
         INNER JOIN tenants t ON t.id = u.tenant_id
        WHERE u.id = ? AND u.tenant_id = ? AND u.activo = TRUE AND t.activo = TRUE`,
      [userId, tenantId],
    );
    return rows.length === 1 ? rows[0] : null;
  } finally {
    connection.release();
  }
}

export { findActiveSessionUser, findActiveUserByEmail };
