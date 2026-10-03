const { getConnection } = require("../../db") as { getConnection: () => Promise<import("mysql2/promise").PoolConnection> };
import type { ResultSetHeader } from "mysql2/promise";
import { readFileSync } from "node:fs";
import path from "node:path";

async function createTestSchema() {
  if (process.env.DATABASE !== "inventario_test") {
    throw new Error("El esquema de pruebas solo puede crearse en inventario_test");
  }
  const schema = readFileSync(path.join(__dirname, "../fixtures/schema.sql"), "utf8");
  const connection = await getConnection();
  try {
    for (const statement of schema.split(";").map((sql) => sql.trim()).filter(Boolean)) {
      try {
        await connection.query(statement);
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (!["ER_DUP_FIELDNAME", "ER_FK_DUP_NAME"].includes(code || "")) throw error;
      }
    }
  } finally {
    connection.release();
  }
}

async function cleanDatabase() {
  const connection = await getConnection();
  try {
    await connection.execute<ResultSetHeader>("DELETE FROM movimientos_inventario");
    await connection.execute<ResultSetHeader>("DELETE FROM lineas_venta");
    await connection.execute<ResultSetHeader>("DELETE FROM ventas");
    await connection.execute<ResultSetHeader>("DELETE FROM clientes");
    await connection.execute<ResultSetHeader>("DELETE FROM inventario");
    await connection.execute<ResultSetHeader>("DELETE FROM productos");
    await connection.execute<ResultSetHeader>("DELETE FROM impuestos");
    await connection.execute<ResultSetHeader>("DELETE FROM categorias");
    await connection.execute<ResultSetHeader>("DELETE FROM usuarios");
    await connection.execute<ResultSetHeader>("DELETE FROM tenants");
  } finally {
    connection.release();
  }
}

async function seedTenantAndUser(options: {
  tenantActive?: boolean;
  userActive?: boolean;
  email?: string;
  password?: string;
  role?: "owner" | "admin";
} = {}) {
  const {
    tenantActive = true,
    userActive = true,
    email = "admin@demo.com",
    password = "password-correcta",
    role = "admin",
  } = options;
  const bcrypt = require("bcrypt");
  const connection = await getConnection();
  try {
    const [tenant] = await connection.execute<ResultSetHeader>(
      "INSERT INTO tenants (nombre, tarifa, activo) VALUES (?, ?, ?)",
      ["Tenant de pruebas", 1, tenantActive],
    );
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await connection.execute<ResultSetHeader>(
      "INSERT INTO usuarios (tenant_id, nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?, ?)",
      [tenant.insertId, "Admin de pruebas", email, passwordHash, role, userActive],
    );
    return { tenantId: tenant.insertId, userId: user.insertId, email, password };
  } finally {
    connection.release();
  }
}

export type SeededUser = Awaited<ReturnType<typeof seedTenantAndUser>>;
export { createTestSchema, cleanDatabase, seedTenantAndUser };
