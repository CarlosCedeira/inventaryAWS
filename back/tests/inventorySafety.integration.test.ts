import { test, expect } from "@jest/globals";
import request from "supertest";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { seedTenantAndUser } from "./helpers/database";

const app = require("../app");
const { getConnection } = require("../db") as { getConnection: () => Promise<PoolConnection> };

async function snapshot() {
  const connection = await getConnection();
  try {
    const [lots] = await connection.query<RowDataPacket[]>("SELECT * FROM inventario ORDER BY id");
    const [movements] = await connection.query<RowDataPacket[]>("SELECT * FROM movimientos_inventario ORDER BY id");
    return { lots, movements };
  } finally {
    connection.release();
  }
}

async function fixture(email = "safety@demo.com", quantity = 5) {
  const user = await seedTenantAndUser({ email });
  const login = await request(app).post("/auth/login").send({ email, password: user.password });
  expect(login.status).toBe(200);
  const connection = await getConnection();
  try {
    const [product] = await connection.execute<ResultSetHeader>(
      "INSERT INTO productos (tenant_id, nombre, stock_minimo) VALUES (?, 'Safety', 0)", [user.tenantId],
    );
    const [lot] = await connection.execute<ResultSetHeader>(
      "INSERT INTO inventario (tenant_id, producto_id, cantidad, numero_lote) VALUES (?, ?, ?, 'BASE')",
      [user.tenantId, product.insertId, quantity],
    );
    return { ...user, token: login.body.token as string, productId: product.insertId, inventoryId: lot.insertId };
  } finally {
    connection.release();
  }
}

test.each(["entrada", "salida", "ajuste", "venta"])(
  "%s: un fallo al registrar el movimiento revierte todo el stock",
  async (operation) => {
    const user = await fixture();
    const before = await snapshot();
    const connection = await getConnection();
    try {
      await connection.query("CREATE TRIGGER safety_fail_movement BEFORE INSERT ON movimientos_inventario FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Forced safety test failure'");
      try {
        const response = operation === "venta"
          ? await request(app).put(`/ventas/${user.productId}`).set("Authorization", `Bearer ${user.token}`).send({ cantidad: 2 })
          : await request(app).post("/movimientos").set("Authorization", `Bearer ${user.token}`).send({
            tipo: operation, producto_id: user.productId, inventario_id: user.inventoryId,
            cantidad: 2, numero_lote: "NEW-LOT",
          });
        expect(response.status).toBe(500);
        expect(await snapshot()).toEqual(before);
      } finally {
        await connection.query("DROP TRIGGER safety_fail_movement");
      }
    } finally {
      connection.release();
    }
  },
);

test("dos ventas HTTP simultaneas de la ultima unidad dejan una sola salida", async () => {
  const user = await fixture("concurrent@demo.com", 1);
  const sell = () => request(app).put(`/ventas/${user.productId}`)
    .set("Authorization", `Bearer ${user.token}`).send({ cantidad: 1 });
  const responses = await Promise.all([sell(), sell()]);
  expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
  const state = await snapshot();
  expect(state.lots).toHaveLength(1);
  expect(state.lots[0].cantidad).toBe(0);
  expect(state.movements).toHaveLength(1);
  expect(state.movements[0]).toMatchObject({
    tenant_id: user.tenantId, producto_id: user.productId, usuario_id: user.userId,
    tipo: "salida", cantidad: 1, stock_anterior: 1, stock_nuevo: 0,
  });
});

test("IDs ajenos no permiten consultar, vender ni modificar lotes de otra empresa", async () => {
  const current = await fixture();
  const other = await fixture("other-safety@demo.com");
  const before = await snapshot();
  const authorization = `Bearer ${current.token}`;
  const detail = await request(app).get(`/productos/${other.productId}`).set("Authorization", authorization);
  expect(detail.status).toBe(404);
  const sale = await request(app).put(`/ventas/${other.productId}`).set("Authorization", authorization)
    .send({ cantidad: 1, tenant_id: other.tenantId, usuario_id: other.userId });
  expect(sale.status).toBe(404);
  for (const type of ["salida", "ajuste"]) {
    const response = await request(app).post("/movimientos").set("Authorization", authorization).send({
      tipo: type, producto_id: current.productId, inventario_id: other.inventoryId,
      cantidad: 1, tenant_id: other.tenantId,
    });
    expect(response.status).toBe(404);
  }
  expect(await snapshot()).toEqual(before);
});
