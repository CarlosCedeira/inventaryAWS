import { test, expect } from "@jest/globals";
import request from "supertest";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { seedTenantAndUser } from "./helpers/database";
const app = require("../app");
const { getConnection } = require("../db") as { getConnection: () => Promise<PoolConnection> };

test("una venta exige seleccionar un cliente", async () => {
  const user = await seedTenantAndUser({ email: "ventas-cliente-obligatorio@demo.test" });
  const login = await request(app).post("/auth/login").send({ email: user.email, password: user.password });

  const response = await request(app)
    .post("/ventas")
    .set("Authorization", `Bearer ${login.body.token}`)
    .send({ cliente_id: null, lineas: [{ producto_id: 1, cantidad: 1 }] });

  expect(response.status).toBe(400);
  expect(response.body).toEqual({ error: "Debes seleccionar un cliente" });
});

test("confirmar venta crea cabecera, linea y una salida por lote", async () => {
  const user = await seedTenantAndUser({ email: "ventas@demo.test" });
  const login = await request(app).post("/auth/login").send({ email: user.email, password: user.password });
  const token = login.body.token;
  const connection = await getConnection();
  let clientId: number; let productId: number; let categoryId: number;
  try {
    const [client] = await connection.execute<ResultSetHeader>("INSERT INTO clientes (tenant_id,nombre,tarifa) VALUES (?,?,0)", [user.tenantId, "Ana"]); clientId = client.insertId;
    const [category] = await connection.execute<ResultSetHeader>("INSERT INTO categorias (tenant_id,nombre) VALUES (?,?)", [user.tenantId, "General"]); categoryId = category.insertId;
    const [tax] = await connection.execute<ResultSetHeader>("INSERT INTO impuestos (nombre,porcentaje,pais_codigo) VALUES (?,?,?)", ["IVA general", 21, "ES"]);
    const [product] = await connection.execute<ResultSetHeader>("INSERT INTO productos (tenant_id,nombre,categoria_id,impuesto_id,precio_compra,precio_venta,stock_minimo) VALUES (?,?,?,?,?,?,?)", [user.tenantId, "Leche", category.insertId, tax.insertId, 1, 5, 1]); productId = product.insertId;
    await connection.execute("INSERT INTO inventario (tenant_id,producto_id,cantidad,numero_lote,fecha_caducidad) VALUES (?,?,?,?,?),(?,?,?,?,?)", [user.tenantId, productId, 3, "A", "2030-01-01", user.tenantId, productId, 4, "B", "2030-02-01"]);
  } finally { connection.release(); }
  const response = await request(app).post("/ventas").set("Authorization", `Bearer ${token}`).send({ cliente_id: clientId!, referencia: "V-1", lineas: [{ producto_id: productId!, cantidad: 5 }] });
  expect(response.status).toBe(201); expect(response.body).toMatchObject({ estado: "pendiente_pago", subtotal: 25, impuesto_total: 5.25, total: 30.25 }); expect(response.body.lineas[0].movements).toHaveLength(2);
  const completeResponse = await request(app).post(`/ventas/${response.body.id}/completar`).set("Authorization", `Bearer ${token}`);
  expect(completeResponse.status).toBe(200);
  expect(completeResponse.body).toEqual({ id: response.body.id, estado: "completa" });
  const verify = await getConnection();
  try {
    const [movements] = await verify.execute<RowDataPacket[]>("SELECT tipo,cantidad,linea_venta_id FROM movimientos_inventario WHERE tenant_id = ? ORDER BY id", [user.tenantId]);
    expect(movements).toEqual([{ tipo: "salida", cantidad: 3, linea_venta_id: response.body.lineas[0].id }, { tipo: "salida", cantidad: 2, linea_venta_id: response.body.lineas[0].id }]);
  } finally { verify.release(); }
  const listResponse = await request(app).get("/ventas").set("Authorization", `Bearer ${token}`);
  expect(listResponse.status).toBe(200);
  expect(listResponse.body[0]).toMatchObject({ referencia: "V-1", cliente_nombre: "Ana", estado: "completa", total: "30.25", total_neto: "30.25" });
  const filteredResponse = await request(app).get(`/ventas?buscar=A&periodo=today&cliente_id=${clientId}&producto_id=${productId}&categoria_id=${categoryId!}&iva=21&usuario_id=${user.userId}&importe_minimo=30`).set("Authorization", `Bearer ${token}`);
  expect(filteredResponse.status).toBe(200);
  expect(filteredResponse.body).toHaveLength(1);
  expect(filteredResponse.body[0]).toMatchObject({ referencia: "V-1", usuario_nombre: "Admin de pruebas" });
  const optionsResponse = await request(app).get("/ventas/filtros").set("Authorization", `Bearer ${token}`);
  expect(optionsResponse.status).toBe(200);
  expect(optionsResponse.body.users).toEqual(expect.arrayContaining([expect.objectContaining({ id: user.userId, nombre: "Admin de pruebas" })]));
  const summaryResponse = await request(app).get("/ventas/resumen").set("Authorization", `Bearer ${token}`);
  expect(summaryResponse.status).toBe(200);
  expect(summaryResponse.body).toMatchObject({
    today: { cantidad: 1, total: "30.25" }, month: { cantidad: 1, total: "30.25" },
    averageTicket: { total: "30.250000" }, topProduct: { producto_id: productId, nombre: "Leche", unidades: "5", total: "30.25" },
    highSales: { cantidad: 0, total: "0.00" },
  });
  const detailResponse = await request(app).get(`/ventas/${response.body.id}`).set("Authorization", `Bearer ${token}`);
  expect(detailResponse.status).toBe(200);
  expect(detailResponse.body.lineas).toHaveLength(1);
  expect(detailResponse.body.lineas[0]).toMatchObject({ impuesto_nombre: "IVA general", impuesto_porcentaje: "21.00", impuesto_total: "5.25", importe_total: "30.25" });
  expect(detailResponse.body.movimientos).toEqual(expect.arrayContaining([
    expect.objectContaining({ numero_lote: "A", cantidad: 3 }),
    expect.objectContaining({ numero_lote: "B", cantidad: 2 }),
  ]));

  const missingReasonResponse = await request(app).post(`/ventas/${response.body.id}/anular`).set("Authorization", `Bearer ${token}`).send({});
  expect(missingReasonResponse.status).toBe(400);

  const cancelResponse = await request(app).post(`/ventas/${response.body.id}/anular`).set("Authorization", `Bearer ${token}`).send({ motivo: "Pedido duplicado" });
  expect(cancelResponse.status).toBe(200);
  expect(cancelResponse.body).toMatchObject({ id: response.body.id, estado: "anulada" });
  expect(cancelResponse.body.movimientos_entrada).toHaveLength(2);

  const cancellationVerify = await getConnection();
  try {
    const [stock] = await cancellationVerify.execute<RowDataPacket[]>("SELECT SUM(cantidad) AS total FROM inventario WHERE tenant_id = ? AND producto_id = ?", [user.tenantId, productId!]);
    expect(Number(stock[0].total)).toBe(7);
    const [restorations] = await cancellationVerify.execute<RowDataPacket[]>("SELECT tipo,cantidad,numero_lote,motivo,linea_venta_id,estado_logistico FROM movimientos_inventario WHERE tenant_id = ? AND tipo = 'entrada' ORDER BY id", [user.tenantId]);
    expect(restorations).toEqual([
      { tipo: "entrada", cantidad: 3, numero_lote: "A", motivo: "Venta cancelada", linea_venta_id: response.body.lineas[0].id, estado_logistico: "finalizado" },
      { tipo: "entrada", cantidad: 2, numero_lote: "B", motivo: "Venta cancelada", linea_venta_id: response.body.lineas[0].id, estado_logistico: "finalizado" },
    ]);
    const [cancelledExits] = await cancellationVerify.execute<RowDataPacket[]>(
      "SELECT estado_logistico FROM movimientos_inventario WHERE tenant_id = ? AND tipo = 'salida' ORDER BY id",
      [user.tenantId],
    );
    expect(cancelledExits).toEqual([{ estado_logistico: "cancelado" }, { estado_logistico: "cancelado" }]);
  } finally { cancellationVerify.release(); }

  const cancelledDetailResponse = await request(app).get(`/ventas/${response.body.id}`).set("Authorization", `Bearer ${token}`);
  expect(cancelledDetailResponse.body).toMatchObject({ estado: "anulada", motivo_anulacion: "Pedido duplicado", anulada_por: user.userId, anulada_por_nombre: "Admin de pruebas" });
  expect(cancelledDetailResponse.body.total_neto).toBe(0);
  expect(cancelledDetailResponse.body.lineas[0]).toMatchObject({ estado: "cancelada", cantidad_devuelta: 0 });
  expect(Number(cancelledDetailResponse.body.lineas[0].cantidad_facturable)).toBe(0);

  const repeatedCancellation = await request(app).post(`/ventas/${response.body.id}/anular`).set("Authorization", `Bearer ${token}`).send({ motivo: "Segundo intento" });
  expect(repeatedCancellation.status).toBe(409);
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

test("una venta admite devoluciones parciales y completas por lote", async () => {
  const user = await seedTenantAndUser({ email: "devoluciones@demo.test" });
  const login = await request(app).post("/auth/login").send({ email: user.email, password: user.password });
  const token = login.body.token;
  const connection = await getConnection();
  let clientId: number; let productId: number;
  try {
    const [client] = await connection.execute<ResultSetHeader>("INSERT INTO clientes (tenant_id,nombre,tarifa) VALUES (?,?,0)", [user.tenantId, "Cliente devolución"]); clientId = client.insertId;
    const [category] = await connection.execute<ResultSetHeader>("INSERT INTO categorias (tenant_id,nombre) VALUES (?,?)", [user.tenantId, "Devoluciones"]);
    const [tax] = await connection.execute<ResultSetHeader>("INSERT INTO impuestos (nombre,porcentaje,pais_codigo) VALUES (?,?,?)", ["IVA devolución", 21, "ES"]);
    const [product] = await connection.execute<ResultSetHeader>("INSERT INTO productos (tenant_id,nombre,categoria_id,impuesto_id,precio_compra,precio_venta,stock_minimo) VALUES (?,?,?,?,?,?,?)", [user.tenantId, "Producto devuelto", category.insertId, tax.insertId, 2, 10, 1]); productId = product.insertId;
    await connection.execute("INSERT INTO inventario (tenant_id,producto_id,cantidad,numero_lote,fecha_caducidad) VALUES (?,?,?,?,?)", [user.tenantId, productId, 5, "DEV-1", "2030-01-01"]);
  } finally { connection.release(); }

  const sale = await request(app).post("/ventas").set("Authorization", `Bearer ${token}`).send({ cliente_id: clientId!, referencia: "V-DEV", lineas: [{ producto_id: productId!, cantidad: 5 }] });
  expect(sale.body.estado).toBe("pendiente_pago");
  const completed = await request(app).post(`/ventas/${sale.body.id}/completar`).set("Authorization", `Bearer ${token}`);
  expect(completed.status).toBe(200);
  const movementId = sale.body.lineas[0].movements[0];
  const partialReturn = await request(app).post(`/ventas/${sale.body.id}/devolver`).set("Authorization", `Bearer ${token}`).send({ motivo: "Devolución parcial", lineas: [{ movimiento_id: movementId, cantidad: 2 }] });
  expect(partialReturn.status).toBe(201);
  expect(partialReturn.body).toMatchObject({ estado_venta: "parcialmente_devuelta", subtotal: 20, impuesto_total: 4.2, total: 24.2 });

  const partialDetail = await request(app).get(`/ventas/${sale.body.id}`).set("Authorization", `Bearer ${token}`);
  expect(partialDetail.body).toMatchObject({ estado: "parcialmente_devuelta" });
  expect(partialDetail.body.lineas[0]).toMatchObject({ estado: "parcialmente_devuelta", cantidad_devuelta: 2 });
  expect(partialDetail.body.total_devuelto).toBe(24.2);
  expect(partialDetail.body.total_neto).toBeCloseTo(36.3);
  expect(Number(partialDetail.body.lineas[0].importe_neto)).toBeCloseTo(36.3);
  expect(Number(partialDetail.body.lineas[0].cantidad_facturable)).toBe(3);
  expect(Number(partialDetail.body.lineas[0].subtotal_neto)).toBeCloseTo(30);
  expect(Number(partialDetail.body.lineas[0].impuesto_neto)).toBeCloseTo(6.3);
  expect(Number(partialDetail.body.movimientos[0].cantidad_devuelta)).toBe(2);

  const partialStatusVerification = await getConnection();
  try {
    const [rows] = await partialStatusVerification.execute<RowDataPacket[]>(
      "SELECT estado_logistico FROM movimientos_inventario WHERE id = ? AND tenant_id = ?",
      [movementId, user.tenantId],
    );
    expect(rows).toEqual([{ estado_logistico: "pendiente_picking" }]);
  } finally { partialStatusVerification.release(); }

  const completeReturn = await request(app).post(`/ventas/${sale.body.id}/devolver`).set("Authorization", `Bearer ${token}`).send({ motivo: "Resto de la devolución", lineas: [{ movimiento_id: movementId, cantidad: 3 }] });
  expect(completeReturn.status).toBe(201);
  expect(completeReturn.body).toMatchObject({ estado_venta: "devuelta" });

  const finalDetail = await request(app).get(`/ventas/${sale.body.id}`).set("Authorization", `Bearer ${token}`);
  expect(finalDetail.body).toMatchObject({ estado: "devuelta" });
  expect(finalDetail.body.lineas[0]).toMatchObject({ estado: "devuelta", cantidad_devuelta: 5 });
  expect(Number(finalDetail.body.lineas[0].cantidad_facturable)).toBe(0);
  expect(finalDetail.body.total_neto).toBe(0);
  expect(finalDetail.body.devoluciones).toHaveLength(2);

  const verify = await getConnection();
  try {
    const [stock] = await verify.execute<RowDataPacket[]>("SELECT SUM(cantidad) AS total FROM inventario WHERE tenant_id = ? AND producto_id = ?", [user.tenantId, productId!]);
    expect(Number(stock[0].total)).toBe(5);
    const [entries] = await verify.execute<RowDataPacket[]>("SELECT cantidad,motivo,linea_devolucion_id,estado_logistico FROM movimientos_inventario WHERE tenant_id = ? AND tipo = 'entrada' ORDER BY id", [user.tenantId]);
    expect(entries).toHaveLength(2);
    expect(entries.every((entry) => entry.motivo === "Devolución cliente" && entry.linea_devolucion_id !== null && entry.estado_logistico === "finalizado")).toBe(true);
    const [returnedExit] = await verify.execute<RowDataPacket[]>(
      "SELECT estado_logistico FROM movimientos_inventario WHERE id = ? AND tenant_id = ?",
      [movementId, user.tenantId],
    );
    expect(returnedExit).toEqual([{ estado_logistico: "cancelado" }]);
  } finally { verify.release(); }
});

test("anulaciones y devoluciones no reconstruyen un lote original inexistente", async () => {
  const user = await seedTenantAndUser({ email: "lote-inexistente@demo.test" });
  const login = await request(app).post("/auth/login").send({ email: user.email, password: user.password });
  const token = login.body.token;
  const connection = await getConnection();
  let clientId: number; let productId: number; let inventoryId: number;
  try {
    const [client] = await connection.execute<ResultSetHeader>("INSERT INTO clientes (tenant_id,nombre,tarifa) VALUES (?,?,0)", [user.tenantId, "Cliente lote eliminado"]); clientId = client.insertId;
    const [category] = await connection.execute<ResultSetHeader>("INSERT INTO categorias (tenant_id,nombre) VALUES (?,?)", [user.tenantId, "Integridad"]);
    const [tax] = await connection.execute<ResultSetHeader>("INSERT INTO impuestos (nombre,porcentaje,pais_codigo) VALUES (?,?,?)", ["IVA integridad", 21, "ES"]);
    const [product] = await connection.execute<ResultSetHeader>("INSERT INTO productos (tenant_id,nombre,categoria_id,impuesto_id,precio_compra,precio_venta,stock_minimo) VALUES (?,?,?,?,?,?,?)", [user.tenantId, "Producto lote eliminado", category.insertId, tax.insertId, 1, 3, 1]); productId = product.insertId;
    const [inventory] = await connection.execute<ResultSetHeader>("INSERT INTO inventario (tenant_id,producto_id,cantidad,numero_lote) VALUES (?,?,?,?)", [user.tenantId, productId, 1, "NO-RECREAR"]); inventoryId = inventory.insertId;
  } finally { connection.release(); }

  const sale = await request(app).post("/ventas").set("Authorization", `Bearer ${token}`).send({ cliente_id: clientId!, lineas: [{ producto_id: productId!, cantidad: 1 }] });
  const movementId = sale.body.lineas[0].movements[0];
  const corrupt = await getConnection();
  try {
    await corrupt.execute("UPDATE movimientos_inventario SET inventario_id = NULL WHERE id = ? AND tenant_id = ?", [movementId, user.tenantId]);
    await corrupt.execute("DELETE FROM inventario WHERE id = ? AND tenant_id = ?", [inventoryId!, user.tenantId]);
  } finally { corrupt.release(); }

  const cancellation = await request(app).post(`/ventas/${sale.body.id}/anular`).set("Authorization", `Bearer ${token}`).send({ motivo: "Debe fallar" });
  expect(cancellation.status).toBe(409);
  expect(cancellation.body).toEqual({ error: "No se puede revertir la venta: el lote original ya no existe" });
  const saleReturn = await request(app).post(`/ventas/${sale.body.id}/devolver`).set("Authorization", `Bearer ${token}`).send({ motivo: "También debe fallar", lineas: [{ movimiento_id: movementId, cantidad: 1 }] });
  expect(saleReturn.status).toBe(409);

  const verify = await getConnection();
  try {
    const [inventory] = await verify.execute<RowDataPacket[]>("SELECT id FROM inventario WHERE tenant_id = ? AND producto_id = ?", [user.tenantId, productId!]);
    const [returns] = await verify.execute<RowDataPacket[]>("SELECT id FROM devoluciones WHERE tenant_id = ? AND venta_id = ?", [user.tenantId, sale.body.id]);
    const [sales] = await verify.execute<RowDataPacket[]>("SELECT estado FROM ventas WHERE id = ? AND tenant_id = ?", [sale.body.id, user.tenantId]);
    expect(inventory).toHaveLength(0);
    expect(returns).toHaveLength(0);
    expect(sales[0].estado).toBe("pendiente_pago");
  } finally { verify.release(); }
});
