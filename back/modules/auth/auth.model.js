const { getConnection } = require("../../db");

async function findActiveUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `
      SELECT
        u.id,
        u.tenant_id,
        u.nombre,
        u.email,
        u.password_hash,
        u.rol,
        t.nombre AS tenant_nombre
      FROM usuarios u
      INNER JOIN tenants t ON t.id = u.tenant_id
      WHERE LOWER(u.email) = ? AND u.activo = TRUE AND t.activo = TRUE
      `,
      [normalizedEmail]
    );

    if (rows.length !== 1) return null;
    return rows[0];
  } finally {
    connection.release();
  }
}

// El JWT identifica la sesión, pero este dato se consulta en cada petición
// protegida para que una baja o un cambio de rol se aplique inmediatamente.
async function findActiveSessionUser(userId, tenantId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `
      SELECT
        u.id,
        u.tenant_id,
        u.nombre,
        u.email,
        u.rol,
        t.nombre AS tenant_nombre
      FROM usuarios u
      INNER JOIN tenants t ON t.id = u.tenant_id
      WHERE u.id = ? AND u.tenant_id = ? AND u.activo = TRUE AND t.activo = TRUE
      `,
      [userId, tenantId]
    );

    return rows.length === 1 ? rows[0] : null;
  } finally {
    connection.release();
  }
}

module.exports = {
  findActiveUserByEmail,
  findActiveSessionUser,
};
