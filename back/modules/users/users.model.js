const { getConnection } = require("../../db");

async function listUsers(tenantId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
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

async function getUser(tenantId, userId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      "SELECT id, tenant_id, nombre, email, rol, activo FROM usuarios WHERE tenant_id = ? AND id = ?",
      [tenantId, userId],
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
}

async function createUser(tenantId, user) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(
      `INSERT INTO usuarios (tenant_id, nombre, email, password_hash, rol, activo)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [tenantId, user.nombre, user.email, user.passwordHash, user.rol],
    );
    return result.insertId;
  } finally {
    connection.release();
  }
}

async function updateUser(tenantId, userId, user) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(
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

async function resetPassword(tenantId, userId, passwordHash) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(
      "UPDATE usuarios SET password_hash = ? WHERE tenant_id = ? AND id = ?",
      [passwordHash, tenantId, userId],
    );
    return result.affectedRows;
  } finally {
    connection.release();
  }
}

module.exports = { createUser, getUser, listUsers, resetPassword, updateUser };
