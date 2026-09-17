const { getConnection } = require("../../db");
const { readFileSync } = require("node:fs");
const path = require("node:path");

async function createTestSchema() {
  if (process.env.DATABASE !== "inventario_test") {
    throw new Error("El esquema de pruebas solo puede crearse en inventario_test");
  }
  const schema = readFileSync(path.join(__dirname, "../fixtures/schema.sql"), "utf8");
  const connection = await getConnection();
  try {
    for (const statement of schema.split(";").map((sql) => sql.trim()).filter(Boolean)) {
      await connection.query(statement);
    }
  } finally {
    connection.release();
  }
}

async function cleanDatabase() {
  const connection = await getConnection();
  try {
    await connection.execute("DELETE FROM movimientos_inventario");
    await connection.execute("DELETE FROM inventario");
    await connection.execute("DELETE FROM productos");
    await connection.execute("DELETE FROM categorias");
    await connection.execute("DELETE FROM usuarios");
    await connection.execute("DELETE FROM tenants");
  } finally {
    connection.release();
  }
}

async function seedTenantAndUser(options = {}) {
  const {
    tenantActive = true,
    userActive = true,
    email = "admin@demo.com",
    password = "password-correcta",
  } = options;
  const bcrypt = require("bcrypt");
  const connection = await getConnection();
  try {
    const [tenant] = await connection.execute(
      "INSERT INTO tenants (nombre, tarifa, activo) VALUES (?, ?, ?)",
      ["Tenant de pruebas", 1, tenantActive],
    );
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await connection.execute(
      "INSERT INTO usuarios (tenant_id, nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?, ?)",
      [tenant.insertId, "Admin de pruebas", email, passwordHash, "admin", userActive],
    );
    return { tenantId: tenant.insertId, userId: user.insertId, email, password };
  } finally {
    connection.release();
  }
}

module.exports = { createTestSchema, cleanDatabase, seedTenantAndUser };
