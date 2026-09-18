const request = require("supertest");
const app = require("../app");
const { getConnection } = require("../db");
const { seedTenantAndUser } = require("./helpers/database");

async function loginAs(user) {
  const response = await request(app).post("/auth/login").send({
    email: user.email,
    password: user.password,
  });

  expect(response.status).toBe(200);
  return response.body.token;
}

async function seedProductWithLot(tenantId, name, quantity) {
  const connection = await getConnection();
  try {
    const [category] = await connection.execute(
      "INSERT INTO categorias (tenant_id, nombre) VALUES (?, ?)",
      [tenantId, "General"],
    );
    const [product] = await connection.execute(
      `INSERT INTO productos
        (tenant_id, nombre, categoria_id, precio_compra, precio_venta, stock_minimo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, name, category.insertId, 2, 4, 1],
    );
    const [inventory] = await connection.execute(
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
    (lot) => lot.numero_lote === "ENTRADA-01",
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
  expect(historyResponse.body.map((movement) => movement.tipo).sort()).toEqual([
    "ajuste",
    "entrada",
    "salida",
  ]);
  expect(historyResponse.body).toEqual(expect.arrayContaining([
    expect.objectContaining({ producto_id: productId, producto_nombre: "Detergente" }),
  ]));

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
