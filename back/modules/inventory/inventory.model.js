const { getConnection } = require("../../db");

async function getCurrentStock(connection, tenantId, productId) {
  const [rows] = await connection.execute(
    `
    SELECT COALESCE(SUM(cantidad), 0) AS stock_total
    FROM inventario
    WHERE tenant_id = ? AND producto_id = ?
    `,
    [tenantId, productId]
  );

  return Number(rows[0]?.stock_total || 0);
}

async function insertInventoryMovement(connection, data) {
  const [result] = await connection.execute(
    `
    INSERT INTO movimientos_inventario
      (
        tenant_id,
        producto_id,
        inventario_id,
        tipo,
        cantidad,
        stock_anterior,
        stock_nuevo,
        numero_lote,
        fecha_caducidad,
        motivo,
        descripcion,
        usuario_id
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.tenantId,
      data.productId,
      data.inventoryId,
      data.type,
      data.quantity,
      data.previousStock,
      data.newStock,
      data.lotNumber,
      data.expirationDate,
      data.reason,
      data.description,
      data.userId,
    ]
  );

  return result.insertId;
}

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

// Comprobar que una categoria pertenece al tenant actual
async function categoryExistsForTenant(tenantId, categoryId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `
      SELECT id
      FROM categorias
      WHERE tenant_id = ? AND id = ?
      LIMIT 1
      `,
      [tenantId, categoryId]
    );

    return rows.length > 0;
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
        ON i.producto_id = p.id AND i.tenant_id = p.tenant_id
      LEFT JOIN categorias c
        ON p.categoria_id = c.id AND c.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.eliminado = 0 AND p.nombre LIKE CONCAT('%', ?, '%')
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
  i.updated_at,
  i.numero_lote

FROM inventario i
INNER JOIN productos p 
  ON i.producto_id = p.id AND p.tenant_id = i.tenant_id
LEFT JOIN categorias c 
  ON p.categoria_id = c.id AND c.tenant_id = p.tenant_id

WHERE i.tenant_id = ? AND i.producto_id = ? AND p.eliminado = 0 AND i.cantidad > 0;
      `,
      [tenantId, id]
    );
    return rows;
  } finally {
    await connection.end();
  }
}


// Actualizar producto e inventario
async function updateProduct(tenantId, productId, productoData, invnetarioData, userId) {
  console.log("NOdal Actualizando producto id:", productId, );
  console.log("informacion productoData:", productoData);
  console.log("informacion inventarioData:", invnetarioData);
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const [productResult] = await connection.execute(
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

    if (!productResult.affectedRows) {
      const error = new Error("Producto no encontrado");
      error.statusCode = 404;
      throw error;
    }

    let runningStock = await getCurrentStock(connection, tenantId, productId);

    for (const item of invnetarioData) {
      const [inventoryRows] = await connection.execute(
        `
        SELECT id, cantidad
        FROM inventario
        WHERE tenant_id = ? AND producto_id = ? AND id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [tenantId, productId, item.inventario_id]
      );

      if (!inventoryRows.length) {
        const error = new Error("Lote de inventario no encontrado");
        error.statusCode = 404;
        throw error;
      }

      const previousQuantity = Number(inventoryRows[0].cantidad);
      const newQuantity = Number(item.cantidad);
      const quantityDifference = newQuantity - previousQuantity;
      const previousStock = runningStock;
      const newStock = runningStock + quantityDifference;
      const expirationDate = item.fecha_caducidad
        ? new Date(item.fecha_caducidad)
        : null;
      const lotNumber = item.numero_lote || null;

      await connection.execute(
        `
        UPDATE inventario
        SET cantidad = ?, fecha_caducidad = ?, numero_lote = ?
        WHERE tenant_id = ? AND producto_id = ? AND id = ?
        `,
        [
          newQuantity,
          expirationDate,
          lotNumber,
          tenantId,
          productId,
          item.inventario_id,
        ]
      );

      if (quantityDifference !== 0) {
        await insertInventoryMovement(connection, {
          tenantId,
          productId,
          inventoryId: item.inventario_id,
          type: "ajuste",
          quantity: Math.abs(quantityDifference),
          previousStock,
          newStock,
          lotNumber,
          expirationDate,
          reason: "Edicion de producto",
          description: "Ajuste generado al editar el inventario del producto",
          userId,
        });

        runningStock = newStock;
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
    
  } finally {
    await connection.end();
  }
}

// Crear nuevo producto e inventario
async function createProduct(productoData, inventarioData, userId) {
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
       (tenant_id, producto_id, cantidad, fecha_caducidad, numero_lote)
       VALUES (?, ?, ?, ?, ?)`,
      [
        inventarioData.tenant_id,
        productoId,
        inventarioData.cantidad,
        inventarioData.fecha_caducidad ? new Date(inventarioData.fecha_caducidad) : null,
        inventarioData.numero_lote,
      ]
    );

    await insertInventoryMovement(connection, {
      tenantId: productoData.tenant_id,
      productId: productoId,
      inventoryId: inventarioResult.insertId,
      type: "entrada",
      quantity: inventarioData.cantidad,
      previousStock: 0,
      newStock: inventarioData.cantidad,
      lotNumber: inventarioData.numero_lote || null,
      expirationDate: inventarioData.fecha_caducidad
        ? new Date(inventarioData.fecha_caducidad)
        : null,
      reason: "Creacion de producto",
      description: "Entrada inicial generada al crear el producto",
      userId,
    });

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
  categoryExistsForTenant,
  searchProductsByName,
  getProductsByCategory,
  getProductById,
  updateProduct,
  createProduct,
  softDeleteProduct,
};
