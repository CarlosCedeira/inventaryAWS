import { test, expect } from "@jest/globals";
import request from "supertest";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { seedTenantAndUser } from "./helpers/database";

const app = require("../app");
const { getConnection } = require("../db") as { getConnection: () => Promise<PoolConnection> };

async function snapshot(tenantId: number) {
  const connection = await getConnection();
  try {
    const tables = ["inventario", "movimientos_inventario", "ventas", "lineas_venta", "devoluciones", "lineas_devolucion"];
    const entries = await Promise.all(tables.map(async (table) => {
      const [rows] = await connection.query<RowDataPacket[]>(`SELECT * FROM ${table} WHERE tenant_id = ? ORDER BY id`, [tenantId]);
      return [table, rows] as const;
    }));
    return Object.fromEntries(entries);
  } finally {
    connection.release();
  }
}

async function fixture(email = "safety@demo.com", quantity = 5, productName = "Safety") {
  const user = await seedTenantAndUser({ email });
  const login = await request(app).post("/auth/login").send({ email, password: user.password });
  expect(login.status).toBe(200);
  const connection = await getConnection();
  try {
    const [client] = await connection.execute<ResultSetHeader>(
      "INSERT INTO clientes (tenant_id, nombre, tarifa) VALUES (?, ?, 0)", [user.tenantId, `Cliente ${productName}`],
    );
    const [category] = await connection.execute<ResultSetHeader>(
      "INSERT INTO categorias (tenant_id, nombre) VALUES (?, ?)", [user.tenantId, `Categoría ${productName}`],
    );
    const [tax] = await connection.execute<ResultSetHeader>(
      "INSERT INTO impuestos (nombre, porcentaje, pais_codigo) VALUES (?, 21, 'ES')", [`IVA ${productName}`],
    );
    const [product] = await connection.execute<ResultSetHeader>(
      "INSERT INTO productos (tenant_id, nombre, categoria_id, impuesto_id, precio_compra, precio_venta, stock_minimo) VALUES (?, ?, ?, ?, 1, 10, 0)",
      [user.tenantId, productName, category.insertId, tax.insertId],
    );
    const [lot] = await connection.execute<ResultSetHeader>(
      "INSERT INTO inventario (tenant_id, producto_id, cantidad, numero_lote) VALUES (?, ?, ?, 'BASE')",
      [user.tenantId, product.insertId, quantity],
    );
    return { ...user, token: login.body.token as string, clientId: client.insertId, productId: product.insertId, inventoryId: lot.insertId };
  } finally {
    connection.release();
  }
}

function createSale(user: Awaited<ReturnType<typeof fixture>>, quantity: number, reference: string, productId = user.productId, clientId = user.clientId) {
  return request(app).post("/ventas").set("Authorization", `Bearer ${user.token}`).send({
    cliente_id: clientId, referencia: reference, lineas: [{ producto_id: productId, cantidad: quantity }],
  });
}

async function withFailingMovementInsert(action: () => Promise<request.Response>) {
  const connection = await getConnection();
  try {
    await connection.query("CREATE TRIGGER safety_fail_movement BEFORE INSERT ON movimientos_inventario FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Forced safety test failure'");
    return await action();
  } finally {
    await connection.query("DROP TRIGGER IF EXISTS safety_fail_movement");
    connection.release();
  }
}

test("dos ventas HTTP simultáneas de la última unidad dejan una sola salida", async () => {
  const user = await fixture("concurrent@demo.com", 1);
  const responses = await Promise.all([createSale(user, 1, "CONC-A"), createSale(user, 1, "CONC-B")]);
  expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
  const state = await snapshot(user.tenantId);
  expect(state.inventario).toHaveLength(1);
  expect(state.inventario[0].cantidad).toBe(0);
  expect(state.ventas).toHaveLength(1);
  expect(state.lineas_venta).toHaveLength(1);
  expect(state.movimientos_inventario).toHaveLength(1);
  expect(state.movimientos_inventario[0]).toMatchObject({ producto_id: user.productId, usuario_id: user.userId, tipo: "salida", cantidad: 1, stock_anterior: 1, stock_nuevo: 0 });
});

test("una venta multilínea insuficiente revierte cabecera, líneas, movimientos y stock", async () => {
  const user = await fixture("multilinea@demo.com", 3, "Primero");
  const connection = await getConnection();
  let productId: number;
  try {
    const [tax] = await connection.execute<ResultSetHeader>("INSERT INTO impuestos (nombre, porcentaje, pais_codigo) VALUES ('IVA Segundo local', 21, 'ES')");
    const [category] = await connection.execute<ResultSetHeader>("INSERT INTO categorias (tenant_id, nombre) VALUES (?, 'Segunda línea')", [user.tenantId]);
    const [product] = await connection.execute<ResultSetHeader>(
      "INSERT INTO productos (tenant_id, nombre, categoria_id, impuesto_id, precio_compra, precio_venta, stock_minimo) VALUES (?, 'Segundo local', ?, ?, 1, 10, 0)",
      [user.tenantId, category.insertId, tax.insertId],
    );
    productId = product.insertId;
    await connection.execute("INSERT INTO inventario (tenant_id, producto_id, cantidad, numero_lote) VALUES (?, ?, 1, 'SEGUNDO')", [user.tenantId, productId]);
  } finally {
    connection.release();
  }
  const before = await snapshot(user.tenantId);
  const response = await request(app).post("/ventas").set("Authorization", `Bearer ${user.token}`).send({
    cliente_id: user.clientId, referencia: "MULTI-ROLLBACK",
    lineas: [{ producto_id: user.productId, cantidad: 1 }, { producto_id: productId!, cantidad: 2 }],
  });
  expect(response.status).toBe(409);
  expect(await snapshot(user.tenantId)).toEqual(before);
});

test("un fallo durante la anulación no deja stock ni estado restaurados parcialmente", async () => {
  const user = await fixture("anulacion-fallo@demo.com", 2);
  const sale = await createSale(user, 1, "ANULAR-FALLO");
  expect(sale.status).toBe(201);
  const before = await snapshot(user.tenantId);
  const response = await withFailingMovementInsert(() => request(app).post(`/ventas/${sale.body.id}/anular`).set("Authorization", `Bearer ${user.token}`).send({ motivo: "Forzar rollback" }));
  expect(response.status).toBe(500);
  expect(await snapshot(user.tenantId)).toEqual(before);
});

test("un fallo durante una devolución no deja devolución ni stock restaurados parcialmente", async () => {
  const user = await fixture("devolucion-fallo@demo.com", 2);
  const sale = await createSale(user, 1, "DEVOLVER-FALLO");
  expect(sale.status).toBe(201);
  const before = await snapshot(user.tenantId);
  const response = await withFailingMovementInsert(() => request(app).post(`/ventas/${sale.body.id}/devolver`).set("Authorization", `Bearer ${user.token}`).send({
    motivo: "Forzar rollback", lineas: [{ movimiento_id: sale.body.lineas[0].movements[0], cantidad: 1 }],
  }));
  expect(response.status).toBe(500);
  expect(await snapshot(user.tenantId)).toEqual(before);
});

test("una venta no acepta cliente ni producto de otro tenant y no modifica ningún tenant", async () => {
  const current = await fixture("actual-safety@demo.com", 2, "Actual");
  const other = await fixture("ajeno-safety@demo.com", 2, "Ajeno");
  const currentBefore = await snapshot(current.tenantId);
  const otherBefore = await snapshot(other.tenantId);
  expect((await createSale(current, 1, "CLIENTE-AJENO", current.productId, other.clientId)).status).toBe(404);
  expect((await createSale(current, 1, "PRODUCTO-AJENO", other.productId, current.clientId)).status).toBe(404);
  expect(await snapshot(current.tenantId)).toEqual(currentBefore);
  expect(await snapshot(other.tenantId)).toEqual(otherBefore);
});
