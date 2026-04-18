const { getConnection } = require("../../db");

// Listar todos los productos
async function getAllProducts() {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(`
    SELECT 
  p.id AS producto_id,
  p.nombre AS producto_nombre,
  p.descripcion AS producto_descripcion,

  c.id AS categoria_id,
  c.nombre AS producto_categoria,

  p.precio_compra,
  p.precio_venta,
  p.stock_minimo,

  COALESCE(SUM(i.cantidad), 0) AS stock_total

FROM productos p
LEFT JOIN inventario i 
  ON i.producto_id = p.id
LEFT JOIN categorias c 
  ON p.categoria_id = c.id

GROUP BY 
  p.id,
  p.nombre,
  p.descripcion,
  c.id,
  c.nombre,
  p.precio_compra,
  p.precio_venta,
  p.stock_minimo
  ;`);
    return rows;
  } finally {
    await connection.end();
  }
}

// Listar categorías
async function getAllCategories() {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute("SELECT * FROM categorias");
    return rows;
  } finally {
    await connection.end();
  }
}

// Buscar producto por nombre
async function searchProductsByName(name) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `
      SELECT i.id AS inventario_id, p.nombre AS producto_nombre, p.descripcion,
             c.nombre AS producto_categoria, p.precio_venta, i.cantidad
      FROM inventario i
      INNER JOIN productos p ON i.producto_id = p.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.nombre LIKE CONCAT('%', ?, '%')
      `,
      [name]
    );
    return rows;
  } finally {
    await connection.end();
  }
}

// Obtener producto por id
async function getProductById(id) {
  const connection = await getConnection();
  try {
    console.log("Consultando en base de datos producto por ID:", id);
    const [rows] = await connection.execute(
      `
     SELECT 
  i.id AS inventario_id,
  i.tenant_id,
  i.producto_id,

  p.nombre AS producto_nombre,
  p.descripcion AS producto_descripcion,

  c.id AS categoria_id,
  c.nombre AS producto_categoria,

  i.cantidad,
  p.stock_minimo,
  p.precio_compra,
  p.precio_venta,

  i.fecha_caducidad,
  i.ultima_actualizacion,
  i.numero_lote

FROM inventario i
INNER JOIN productos p 
  ON i.producto_id = p.id
LEFT JOIN categorias c 
  ON p.categoria_id = c.id

WHERE i.producto_id = ?;
      `,
      [id]
    );
    return rows;
  } finally {
    await connection.end();
  }
}

// Actualizar flags (publicado, destacado, recomendado)
async function toggleFlag(id, flag) {
  const connection = await getConnection();
  try {
    await connection.execute(
      `UPDATE productos SET ${flag} = NOT ${flag} WHERE id = ?`,
      [id]
    );
  } finally {
    await connection.end();
  }
}

// Actualizar producto e inventario
async function updateProduct(productId, productoData, invnetarioData) {
  console.log("NOdal Actualizando producto id:", productId, );
  console.log("informacion productoData:", productoData);
  console.log("informacion inventarioData:", invnetarioData);
  const connection = await getConnection();
  try {
    await connection.execute(
      `UPDATE productos
       SET nombre = ?, descripcion = ?, categoria_id = ?, precio_compra = ?, precio_venta = ?, stock_minimo = ?
       WHERE id = ?`,
      [
        productoData.nombre,
        productoData.descripcion,
        productoData.categoria_id,
        productoData.precio_compra,
        productoData.precio_venta,
        productoData.stock_minimo,
        productId
      ]
    );


    
    
 for (const item of invnetarioData) {
  await connection.execute(
    `UPDATE inventario
     SET cantidad = ?, fecha_caducidad = ?, numero_lote = ?, ultima_actualizacion = NOW()
     WHERE id = ?`,
    [
      item.cantidad,
      item.fecha_caducidad ? new Date(item.fecha_caducidad) : null,
      item.numero_lote || null,
      item.inventario_id, 
    ]
  );
}
    
  } finally {
    await connection.end();
  }
}

// Crear nuevo producto e inventario
async function createProduct(productoData, inventarioData) {
  const connection = await getConnection();
  try {
    const [productoResult] = await connection.execute(
      `INSERT INTO productos 
       (tenant_id, nombre, descripcion, publicado, destacado, recomendado, ranking)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        productoData.tenant_id,
        productoData.nombre,
        productoData.descripcion,
        productoData.publicado,
        productoData.destacado,
        productoData.recomendado,
        productoData.ranking,
      ]
    );

    const productoId = productoResult.insertId;

    const [inventarioResult] = await connection.execute(
      `INSERT INTO inventario
       (tenant_id, producto_id, cantidad, stock_minimo, precio_compra, precio_venta, fecha_caducidad, 
        codigo_barras, numero_lote, sku, ultima_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        inventarioData.tenant_id,
        productoId,
        inventarioData.cantidad,
        inventarioData.stock_minimo,
        inventarioData.precio_compra,
        inventarioData.precio_venta,
        inventarioData.fecha_caducidad ? new Date(inventarioData.fecha_caducidad) : null,
        inventarioData.codigo_barras,
        inventarioData.numero_lote,
        inventarioData.sku,
      ]
    );

    return { productoId, inventarioId: inventarioResult.insertId };
  } finally {
    await connection.end();
  }
}

module.exports = {
  getAllProducts,
  getAllCategories,
  searchProductsByName,
  getProductById,
  toggleFlag,
  updateProduct,
  createProduct,
};