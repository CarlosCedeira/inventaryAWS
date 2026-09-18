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

async function seedProduct({ tenantId, name, categoryName, lots }) {
  const connection = await getConnection();
  try {
    const [category] = await connection.execute(
      "INSERT INTO categorias (tenant_id, nombre) VALUES (?, ?)",
      [tenantId, categoryName],
    );
    const [product] = await connection.execute(
      `INSERT INTO productos
        (tenant_id, nombre, descripcion, categoria_id, precio_compra, precio_venta, stock_minimo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, name, `${name} descripcion`, category.insertId, 2.5, 5, 3],
    );
    for (const lot of lots) {
      await connection.execute(
        `INSERT INTO inventario
          (tenant_id, producto_id, cantidad, fecha_caducidad, numero_lote)
         VALUES (?, ?, ?, ?, ?)`,
        [tenantId, product.insertId, lot.quantity, lot.expirationDate, lot.lotNumber || null],
      );
    }
    return product.insertId;
  } finally {
    connection.release();
  }
}

test("la vista de productos exige una sesión válida", async () => {
  const response = await request(app).get("/productos");

  expect(response.status).toBe(401);
  expect(response.body).toEqual({ error: "Token requerido" });
});

test("la vista de productos muestra stock y categoría solo del tenant autenticado", async () => {
  const currentUser = await seedTenantAndUser({ email: "productos@demo.com" });
  const otherUser = await seedTenantAndUser({ email: "otro@demo.com" });
  const today = new Date().toISOString().slice(0, 10);

  await seedProduct({
    tenantId: currentUser.tenantId,
    name: "Café",
    categoryName: "Bebidas",
    lots: [
      { quantity: 8, expirationDate: null, lotNumber: "SIN-FECHA" },
      { quantity: 2, expirationDate: today, lotNumber: "HOY" },
      { quantity: 5, expirationDate: "2020-01-01", lotNumber: "CADUCADO" },
    ],
  });
  await seedProduct({
    tenantId: otherUser.tenantId,
    name: "Producto ajeno",
    categoryName: "Otra categoría",
    lots: [{ quantity: 99, expirationDate: null }],
  });

  const token = await loginAs(currentUser);
  const response = await request(app)
    .get("/productos")
    .set("Authorization", `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.body).toHaveLength(1);
  expect(response.body[0]).toMatchObject({
    producto_nombre: "Café",
    producto_categoria: "Bebidas",
    stock_fisico: "15",
    stock_disponible: "10",
    stock_caducado: "5",
  });
});

test("la API de productos permite crear, consultar, buscar, filtrar, editar y borrar dentro del tenant", async () => {
  const currentUser = await seedTenantAndUser({ email: "gestion@demo.com" });
  const otherUser = await seedTenantAndUser({ email: "gestion-otro@demo.com" });
  const token = await loginAs(currentUser);
  const otherToken = await loginAs(otherUser);

  const categoryResponse = await request(app)
    .post("/productos/categorias")
    .set("Authorization", `Bearer ${token}`)
    .send({ nombre: "Limpieza", descripcion: "Productos de limpieza" });
  expect(categoryResponse.status).toBe(201);
  const categoryId = categoryResponse.body.id;

  const createResponse = await request(app)
    .post("/productos/newProduct")
    .set("Authorization", `Bearer ${token}`)
    .send({
      producto_nombre: "Jabón líquido",
      producto_descripcion: "Formato de un litro",
      categoria_id: categoryId,
      precio_compra: 2.5,
      precio_venta: 4.5,
      stock_minimo: 3,
      cantidad: 6,
      numero_lote: "L-001",
      fecha_caducidad: "2030-12-31",
    });
  expect(createResponse.status).toBe(201);
  const { productoId } = createResponse.body;

  const listResponse = await request(app)
    .get("/productos")
    .set("Authorization", `Bearer ${token}`);
  expect(listResponse.status).toBe(200);
  expect(listResponse.body).toEqual(expect.arrayContaining([
    expect.objectContaining({ producto_id: productoId, producto_nombre: "Jabón líquido" }),
  ]));

  const searchResponse = await request(app)
    .get("/productos/buscar/Jabón")
    .set("Authorization", `Bearer ${token}`);
  expect(searchResponse.status).toBe(200);
  expect(searchResponse.body).toHaveLength(1);
  expect(searchResponse.body[0]).toMatchObject({ producto_id: productoId });

  const categoryProductsResponse = await request(app)
    .get(`/productos/categoria/${categoryId}`)
    .set("Authorization", `Bearer ${token}`);
  expect(categoryProductsResponse.status).toBe(200);
  expect(categoryProductsResponse.body).toHaveLength(1);

  const detailResponse = await request(app)
    .get(`/productos/${productoId}`)
    .set("Authorization", `Bearer ${token}`);
  expect(detailResponse.status).toBe(200);
  expect(detailResponse.body).toMatchObject({
    producto_id: productoId,
    nombre: "Jabón líquido",
    categoria_id: categoryId,
    inventario: [expect.objectContaining({ cantidad: 6, numero_lote: "L-001" })],
  });

  const updatedProduct = {
    ...detailResponse.body,
    nombre: "Jabón líquido concentrado",
    precio_venta: 5,
    inventario: detailResponse.body.inventario.map((lot) => ({ ...lot, cantidad: 8 })),
  };
  const updateResponse = await request(app)
    .put(`/productos/actualizar/${productoId}`)
    .set("Authorization", `Bearer ${token}`)
    .send(updatedProduct);
  expect(updateResponse.status).toBe(200);

  const updatedDetailResponse = await request(app)
    .get(`/productos/${productoId}`)
    .set("Authorization", `Bearer ${token}`);
  expect(updatedDetailResponse.body).toMatchObject({
    nombre: "Jabón líquido concentrado",
    precio_venta: "5.00",
    inventario: [expect.objectContaining({ cantidad: 8 })],
  });

  const foreignDetailResponse = await request(app)
    .get(`/productos/${productoId}`)
    .set("Authorization", `Bearer ${otherToken}`);
  expect(foreignDetailResponse.status).toBe(404);

  const foreignDeleteResponse = await request(app)
    .patch(`/productos/eliminar/${productoId}`)
    .set("Authorization", `Bearer ${otherToken}`);
  expect(foreignDeleteResponse.status).toBe(404);

  const deleteResponse = await request(app)
    .patch(`/productos/eliminar/${productoId}`)
    .set("Authorization", `Bearer ${token}`);
  expect(deleteResponse.status).toBe(200);

  const deletedDetailResponse = await request(app)
    .get(`/productos/${productoId}`)
    .set("Authorization", `Bearer ${token}`);
  expect(deletedDetailResponse.status).toBe(404);
});
