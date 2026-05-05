const { getConnection } = require("../../db");

async function findActiveUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  console.log("Finding user by email:", normalizedEmail);
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
    await connection.end();
  }
}

module.exports = {
  findActiveUserByEmail,
};
