import { test, expect } from "@jest/globals";
import request from "supertest";
const app = require("../app");
import type { PoolConnection, ResultSetHeader } from "mysql2/promise";
const { getConnection } = require("../db") as { getConnection: () => Promise<PoolConnection> };
import { seedTenantAndUser, type SeededUser } from "./helpers/database";

async function loginAs(user: SeededUser): Promise<string> {
  const response = await request(app).post("/auth/login").send({
    email: user.email,
    password: user.password,
  });

  expect(response.status).toBe(200);
  return response.body.token;
}

async function seedProductWithLot(tenantId: number, name: string, quantity: number) {
  const connection = await getConnection();
  try {
    const [category] = await connection.execute<ResultSetHeader>(
      "INSERT INTO categorias (tenant_id, nombre) VALUES (?, ?)",
      [tenantId, "General"],
    );
    const [product] = await connection.execute<ResultSetHeader>(
      `INSERT INTO productos
        (tenant_id, nombre, categoria_id, precio_compra, precio_venta, stock_minimo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, name, category.insertId, 2, 4, 1],
    );
    const [inventory] = await connection.execute<ResultSetHeader>(
      `INSERT INTO inventario
        (tenant_id, producto_id, cantidad, numero_lote)
       VALUES (?, ?, ?, ?)`,
      [tenantId, product.insertId, quantity, "INICIAL"],
    );
    return { productId: product.insertId, inventoryId: inventory.insertId };
  } finally {
    connection.release();
  }
}

test("el historial de movimientos exige una sesión válida", async () => {
  const response = await request(app).get("/movimientos");

  expect(response.status).toBe(401);
  expect(response.body).toEqual({ error: "Token requerido" });
});

test("la API registra entradas, salidas y ajustes, y conserva el historial del tenant", async () => {
  const currentUser = await seedTenantAndUser({ email: "movimientos@demo.com" });
  const otherUser = await seedTenantAndUser({ email: "movimientos-otro@demo.com" });
  const token = await loginAs(currentUser);
  const otherToken = await loginAs(otherUser);
  const { productId, inventoryId } = await seedProductWithLot(
    currentUser.tenantId,
    "Detergente",
    5,
  );

  const entryResponse = await request(app)
    .post("/movimientos")
    .set("Authorization", `Bearer ${token}`)
    .send({
      tipo: "entrada",
      producto_id: productId,
      cantidad: 10,
      numero_lote: "ENTRADA-01",
      fecha_caducidad: "2030-12-31",
      motivo: "Compra proveedor",
    });
  expect(entryResponse.status).toBe(201);
  expect(entryResponse.body).toMatchObject({ stock_anterior: 5, stock_nuevo: 15 });

  const exitResponse = await request(app)
    .post("/movimientos")
    .set("Authorization", `Bearer ${token}`)
    .send({
      tipo: "salida",
      producto_id: productId,
      inventario_id: inventoryId,
      cantidad: 2,
      motivo: "Venta",
    });
  expect(exitResponse.status).toBe(201);
  expect(exitResponse.body).toMatchObject({ stock_anterior: 15, stock_nuevo: 13 });

  const detailResponse = await request(app)
    .get(`/productos/${productId}`)
    .set("Authorization", `Bearer ${token}`);
  const entryLot = detailResponse.body.inventario.find(
    (lot: { numero_lote: string | null; inventario_id: number }) => lot.numero_lote === "ENTRADA-01",
  );
  expect(entryLot).toBeDefined();

  const adjustmentResponse = await request(app)
    .post("/movimientos")
    .set("Authorization", `Bearer ${token}`)
    .send({
      tipo: "ajuste",
      producto_id: productId,
      inventario_id: entryLot.inventario_id,
      cantidad: 0,
      motivo: "Conteo inventario",
    });
  expect(adjustmentResponse.status).toBe(201);
  expect(adjustmentResponse.body).toMatchObject({ stock_anterior: 13, stock_nuevo: 3 });

  const historyResponse = await request(app)
    .get("/movimientos")
    .set("Authorization", `Bearer ${token}`);
  expect(historyResponse.status).toBe(200);
  expect(historyResponse.body).toHaveLength(3);
  expect(historyResponse.body.map((movement: { tipo: string }) => movement.tipo).sort()).toEqual([
    "ajuste",
    "entrada",
    "salida",
  ]);
  expect(historyResponse.body).toEqual(expect.arrayContaining([
    expect.objectContaining({ producto_id: productId, producto_nombre: "Detergente" }),
  ]));

  const typeFilterResponse = await request(app)
    .get(`/movimientos?producto_id=${productId}&tipo=salida`)
    .set("Authorization", `Bearer ${token}`);
  expect(typeFilterResponse.status).toBe(200);
  expect(typeFilterResponse.body).toHaveLength(1);
  expect(typeFilterResponse.body[0]).toMatchObject({ producto_id: productId, tipo: "salida" });

  const connection = await getConnection();
  try {
    await connection.execute(
      "UPDATE movimientos_inventario SET created_at = ? WHERE tenant_id = ? AND tipo = ?",
      ["2020-01-02 12:00:00", currentUser.tenantId, "entrada"],
    );
  } finally {
    connection.release();
  }

  const dateFilterResponse = await request(app)
    .get("/movimientos?fecha_desde=2020-01-02&fecha_hasta=2020-01-02")
    .set("Authorization", `Bearer ${token}`);
  expect(dateFilterResponse.status).toBe(200);
  expect(dateFilterResponse.body).toHaveLength(1);
  expect(dateFilterResponse.body[0]).toMatchObject({ tipo: "entrada" });

  const invalidFilterResponse = await request(app)
    .get("/movimientos?tipo=traspaso&fecha_desde=2020-02-30")
    .set("Authorization", `Bearer ${token}`);
  expect(invalidFilterResponse.status).toBe(400);

  const insufficientStockResponse = await request(app)
    .post("/movimientos")
    .set("Authorization", `Bearer ${token}`)
    .send({
      tipo: "salida",
      producto_id: productId,
      inventario_id: inventoryId,
      cantidad: 4,
    });
  expect(insufficientStockResponse.status).toBe(409);

  const foreignMovementResponse = await request(app)
    .post("/movimientos")
    .set("Authorization", `Bearer ${otherToken}`)
    .send({
      tipo: "entrada",
      producto_id: productId,
      cantidad: 1,
    });
  expect(foreignMovementResponse.status).toBe(404);
});
