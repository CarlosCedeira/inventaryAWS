import { test, expect } from "@jest/globals";
import request from "supertest";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { seedTenantAndUser } from "./helpers/database";
const app = require("../app");
const { getConnection } = require("../db") as { getConnection: () => Promise<PoolConnection> };

test("confirmar venta crea cabecera, linea y una salida por lote", async () => {
  const user = await seedTenantAndUser({ email: "ventas@demo.test" });
  const login = await request(app).post("/auth/login").send({ email: user.email, password: user.password });
  const token = login.body.token;
  const connection = await getConnection();
  let clientId: number; let productId: number;
  try {
    const [client] = await connection.execute<ResultSetHeader>("INSERT INTO clientes (tenant_id,nombre,tarifa) VALUES (?,?,0)", [user.tenantId, "Ana"]); clientId = client.insertId;
    const [category] = await connection.execute<ResultSetHeader>("INSERT INTO categorias (tenant_id,nombre) VALUES (?,?)", [user.tenantId, "General"]);
    const [product] = await connection.execute<ResultSetHeader>("INSERT INTO productos (tenant_id,nombre,categoria_id,precio_compra,precio_venta,stock_minimo) VALUES (?,?,?,?,?,?)", [user.tenantId, "Leche", category.insertId, 1, 5, 1]); productId = product.insertId;
    await connection.execute("INSERT INTO inventario (tenant_id,producto_id,cantidad,numero_lote,fecha_caducidad) VALUES (?,?,?,?,?),(?,?,?,?,?)", [user.tenantId, productId, 3, "A", "2030-01-01", user.tenantId, productId, 4, "B", "2030-02-01"]);
  } finally { connection.release(); }
  const response = await request(app).post("/ventas").set("Authorization", `Bearer ${token}`).send({ cliente_id: clientId!, referencia: "V-1", lineas: [{ producto_id: productId!, cantidad: 5 }] });
  expect(response.status).toBe(201); expect(response.body).toMatchObject({ estado: "confirmada", total: 25 }); expect(response.body.lineas[0].movements).toHaveLength(2);
  const verify = await getConnection();
  try {
    const [movements] = await verify.execute<RowDataPacket[]>("SELECT tipo,cantidad,linea_venta_id FROM movimientos_inventario WHERE tenant_id = ? ORDER BY id", [user.tenantId]);
    expect(movements).toEqual([{ tipo: "salida", cantidad: 3, linea_venta_id: response.body.lineas[0].id }, { tipo: "salida", cantidad: 2, linea_venta_id: response.body.lineas[0].id }]);
  } finally { verify.release(); }
  const listResponse = await request(app).get("/ventas").set("Authorization", `Bearer ${token}`);
  expect(listResponse.status).toBe(200);
  expect(listResponse.body[0]).toMatchObject({ referencia: "V-1", cliente_nombre: "Ana", estado: "confirmada", total: "25.00" });
  const detailResponse = await request(app).get(`/ventas/${response.body.id}`).set("Authorization", `Bearer ${token}`);
  expect(detailResponse.status).toBe(200);
  expect(detailResponse.body.lineas).toHaveLength(1);
  expect(detailResponse.body.movimientos).toEqual(expect.arrayContaining([
    expect.objectContaining({ numero_lote: "A", cantidad: 3 }),
    expect.objectContaining({ numero_lote: "B", cantidad: 2 }),
  ]));
});

test("una venta no puede usar cliente o producto de otro tenant", async () => {
  const owner = await seedTenantAndUser({ email: "ventas-propias@demo.test" });
  const outsider = await seedTenantAndUser({ email: "ventas-ajenas@demo.test" });
  const login = await request(app).post("/auth/login").send({ email: owner.email, password: owner.password });
  const connection = await getConnection();
  let foreignClient: number; let foreignProduct: number;
  try {
    const [client] = await connection.execute<ResultSetHeader>("INSERT INTO clientes (tenant_id,nombre,tarifa) VALUES (?,?,0)", [outsider.tenantId, "Cliente ajeno"]); foreignClient = client.insertId;
    const [category] = await connection.execute<ResultSetHeader>("INSERT INTO categorias (tenant_id,nombre) VALUES (?,?)", [outsider.tenantId, "Ajena"]);
    const [product] = await connection.execute<ResultSetHeader>("INSERT INTO productos (tenant_id,nombre,categoria_id,precio_compra,precio_venta,stock_minimo) VALUES (?,?,?,?,?,?)", [outsider.tenantId, "Producto ajeno", category.insertId, 1, 2, 1]); foreignProduct = product.insertId;
  } finally { connection.release(); }
  const response = await request(app).post("/ventas").set("Authorization", `Bearer ${login.body.token}`).send({ cliente_id: foreignClient!, lineas: [{ producto_id: foreignProduct!, cantidad: 1 }] });
  expect(response.status).toBe(404);
  const verify = await getConnection();
  try { const [rows] = await verify.execute<RowDataPacket[]>("SELECT id FROM ventas WHERE tenant_id = ?", [owner.tenantId]); expect(rows).toHaveLength(0); } finally { verify.release(); }
});
