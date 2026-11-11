import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { Role } from "../../types/http";

const { getConnection } = require("../../db") as {
  getConnection: () => Promise<import("mysql2/promise").PoolConnection>;
};

export interface UserRecord extends RowDataPacket {
  id: number;
  tenant_id: number;
  nombre: string;
  email: string;
  rol: Role;
  activo: boolean;
  fecha_creacion?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserWritePayload {
  nombre: string;
  email: string;
  rol: Exclude<Role, "owner">;
  activo: boolean;
}

interface NewUser extends UserWritePayload {
  passwordHash: string;
}

async function listUsers(tenantId: number): Promise<UserRecord[]> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<UserRecord[]>(
      `SELECT id, tenant_id, nombre, email, rol, activo, fecha_creacion, created_at, updated_at
         FROM usuarios
        WHERE tenant_id = ?
        ORDER BY activo DESC, nombre ASC, id ASC`,
      [tenantId],
    );
    return rows;
  } finally {
    connection.release();
  }
}

async function getUser(tenantId: number, userId: number): Promise<UserRecord | null> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<UserRecord[]>(
      "SELECT id, tenant_id, nombre, email, rol, activo FROM usuarios WHERE tenant_id = ? AND id = ?",
      [tenantId, userId],
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
}

async function createUser(tenantId: number, user: NewUser): Promise<number> {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO usuarios (tenant_id, nombre, email, password_hash, rol, activo)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [tenantId, user.nombre, user.email, user.passwordHash, user.rol],
    );
    return result.insertId;
  } finally {
    connection.release();
  }
}

async function updateUser(tenantId: number, userId: number, user: UserWritePayload): Promise<number> {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE usuarios
          SET nombre = ?, email = ?, rol = ?, activo = ?
        WHERE tenant_id = ? AND id = ?`,
      [user.nombre, user.email, user.rol, user.activo, tenantId, userId],
    );
    return result.affectedRows;
  } finally {
    connection.release();
  }
}

async function resetPassword(tenantId: number, userId: number, passwordHash: string): Promise<number> {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute<ResultSetHeader>(
      "UPDATE usuarios SET password_hash = ?, session_version = session_version + 1 WHERE tenant_id = ? AND id = ?",
      [passwordHash, tenantId, userId],
    );
    return result.affectedRows;
  } finally {
    connection.release();
  }
}

export { createUser, getUser, listUsers, resetPassword, updateUser };
