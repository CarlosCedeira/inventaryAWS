const { getConnection } = require("../../db");

// Listar todos los productos
async function getAllProducts(tenantId) {
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

  COALESCE(SUM(i.cantidad), 0) AS stock_total,
  MIN(
    CASE
      WHEN i.fecha_caducidad IS NOT NULL AND i.fecha_caducidad >= CURDATE()
      THEN i.fecha_caducidad
      ELSE NULL
    END
  ) AS fecha_caducidad

FROM productos p
LEFT JOIN inventario i 
  ON i.producto_id = p.id AND i.tenant_id = p.tenant_id
LEFT JOIN categorias c 
  ON p.categoria_id = c.id AND c.tenant_id = p.tenant_id

WHERE p.tenant_id = ?
AND p.eliminado = 0

GROUP BY 
  p.id,
  p.nombre,
  p.descripcion,
  c.id,
  c.nombre,
  p.precio_compra,
  p.precio_venta,
  p.stock_minimo
  ;`, [tenantId]);
    return rows;
  } finally {
    await connection.end();
  }
}

// Listar categorías
async function getAllCategories(tenantId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      "SELECT * FROM categorias WHERE tenant_id = ?",
      [tenantId]
    );
    return rows;
  } finally {
    await connection.end();
  }
}

// Crear categoria
async function createCategory(tenantId, categoryData) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(
      `
      INSERT INTO categorias (nombre, descripcion, tenant_id)
      VALUES (?, ?, ?)
      `,
      [categoryData.nombre, categoryData.descripcion || null, tenantId]
    );

    return {
      id: result.insertId,
      nombre: categoryData.nombre,
      descripcion: categoryData.descripcion || null,
      tenant_id: tenantId,
    };
  } finally {
    await connection.end();
  }
}

// Buscar producto por nombre
async function searchProductsByName(tenantId, name) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `
      SELECT
        p.id AS producto_id,
        p.nombre AS producto_nombre,
        p.descripcion AS producto_descripcion,
        c.id AS categoria_id,
        c.nombre AS producto_categoria,
        p.precio_compra,
        p.precio_venta,
        p.stock_minimo,
        COALESCE(SUM(i.cantidad), 0) AS stock_total,
        MIN(
          CASE
            WHEN i.fecha_caducidad IS NOT NULL AND i.fecha_caducidad >= CURDATE()
            THEN i.fecha_caducidad
            ELSE NULL
          END
        ) AS fecha_caducidad
      FROM productos p
      LEFT JOIN inventario i
        ON i.producto_id = p.id AND i.tenant_id = p.tenant_id AND p.eliminado = 0
      LEFT JOIN categorias c
        ON p.categoria_id = c.id AND c.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.nombre LIKE CONCAT('%', ?, '%')
      GROUP BY
        p.id,
        p.nombre,
        p.descripcion,
        c.id,
        c.nombre,
        p.precio_compra,
        p.precio_venta,
        p.stock_minimo
      `,
      [tenantId, name]
    );
    return rows;
  } finally {
    await connection.end();
  }
}

// Filtrar productos por categoria
async function getProductsByCategory(tenantId, categoryId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `
      SELECT
        p.id AS producto_id,
        p.nombre AS producto_nombre,
        p.descripcion AS producto_descripcion,
        c.id AS categoria_id,
        c.nombre AS producto_categoria,
        p.precio_compra,
        p.precio_venta,
        p.stock_minimo,
        COALESCE(SUM(i.cantidad), 0) AS stock_total,
        MIN(
          CASE
            WHEN i.fecha_caducidad IS NOT NULL AND i.fecha_caducidad >= CURDATE()
            THEN i.fecha_caducidad
            ELSE NULL
          END
        ) AS fecha_caducidad
      FROM productos p
      LEFT JOIN inventario i
        ON i.producto_id = p.id AND i.tenant_id = p.tenant_id
      LEFT JOIN categorias c
        ON p.categoria_id = c.id AND c.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.categoria_id = ? AND p.eliminado = 0
      GROUP BY
        p.id,
        p.nombre,
        p.descripcion,
        c.id,
        c.nombre,
        p.precio_compra,
        p.precio_venta,
        p.stock_minimo
      `,
      [tenantId, categoryId]
    );
    return rows;
  } finally {
    await connection.end();
  }
}

// Obtener producto por id
async function getProductById(tenantId, id) {
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
  ON i.producto_id = p.id AND p.tenant_id = i.tenant_id
LEFT JOIN categorias c 
  ON p.categoria_id = c.id AND c.tenant_id = p.tenant_id

WHERE i.tenant_id = ? AND i.producto_id = ? AND p.eliminado = 0;
      `,
      [tenantId, id]
    );
    return rows;
  } finally {
    await connection.end();
  }
}

// Actualizar flags (publicado, destacado, recomendado)


// Actualizar producto e inventario
async function updateProduct(tenantId, productId, productoData, invnetarioData) {
  console.log("NOdal Actualizando producto id:", productId, );
  console.log("informacion productoData:", productoData);
  console.log("informacion inventarioData:", invnetarioData);
  const connection = await getConnection();
  try {
    await connection.execute(
      `UPDATE productos
       SET nombre = ?, descripcion = ?, categoria_id = ?, precio_compra = ?, precio_venta = ?, stock_minimo = ?
       WHERE tenant_id = ? AND id = ?`,
      [
        productoData.nombre,
        productoData.descripcion,
        productoData.categoria_id,
        productoData.precio_compra,
        productoData.precio_venta,
        productoData.stock_minimo,
        tenantId,
        productId
      ]
    );


    
    
 for (const item of invnetarioData) {
  await connection.execute(
    `UPDATE inventario
     SET cantidad = ?, fecha_caducidad = ?, numero_lote = ?, ultima_actualizacion = NOW()
     WHERE tenant_id = ? AND id = ?`,
    [
      item.cantidad,
      item.fecha_caducidad ? new Date(item.fecha_caducidad) : null,
      item.numero_lote || null,
      tenantId,
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
  console.log("Creando nuevo producto con id:", productoData.categoria_id);
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const [productoResult] = await connection.execute(
      `INSERT INTO productos 
       (tenant_id, nombre, descripcion, categoria_id, precio_compra, precio_venta, stock_minimo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        productoData.tenant_id,
        productoData.nombre,
        productoData.descripcion,
        productoData.categoria_id,
        productoData.precio_compra,
        productoData.precio_venta,
        productoData.stock_minimo,
      ]
    );

    const productoId = productoResult.insertId;

    const [inventarioResult] = await connection.execute(
      `INSERT INTO inventario
       (tenant_id, producto_id, cantidad, fecha_caducidad, numero_lote, ultima_actualizacion)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        inventarioData.tenant_id,
        productoId,
        inventarioData.cantidad,
        inventarioData.fecha_caducidad ? new Date(inventarioData.fecha_caducidad) : null,
        inventarioData.numero_lote,
      ]
    );

    await connection.commit();

    return { productoId, inventarioId: inventarioResult.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

// Borrado logico de producto
async function softDeleteProduct(tenantId, productId) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(
      `
      UPDATE productos
      SET eliminado = 1
      WHERE tenant_id = ? AND id = ? AND eliminado = 0
      `,
      [tenantId, productId]
    );

    return result.affectedRows;
  } finally {
    await connection.end();
  }
}

module.exports = {
  getAllProducts,
  getAllCategories,
  createCategory,
  searchProductsByName,
  getProductsByCategory,
  getProductById,
  updateProduct,
  createProduct,
  softDeleteProduct,
};
