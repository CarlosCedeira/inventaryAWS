import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type { CategoryFields, InventoryFields, InventoryMovement, InventoryRow, InventoryUpdate, ProductFields, ProductId, ProductSummaryRow, ProductDetailRow, TaxFields } from "./inventory.types";
import type { HttpError } from "../../types/http";
const { inventoryVersion } = require("./inventory.version") as { inventoryVersion: (row: InventoryRow) => string };
const { getConnection } = require("../../db") as { getConnection: () => Promise<PoolConnection> };

const STOCK_PROJECTION = `COALESCE(SUM(i.cantidad), 0) AS stock_total,
        COALESCE(SUM(i.cantidad), 0) AS stock_fisico,
        COALESCE(SUM(CASE WHEN i.fecha_caducidad IS NULL OR i.fecha_caducidad >= CURDATE()
          THEN i.cantidad ELSE 0 END), 0) AS stock_disponible,
        COALESCE(SUM(CASE WHEN i.fecha_caducidad < CURDATE()
          THEN i.cantidad ELSE 0 END), 0) AS stock_caducado,
  MIN(
    CASE
      WHEN i.cantidad > 0 AND i.fecha_caducidad >= CURDATE()
      THEN i.fecha_caducidad
      ELSE NULL
    END
  ) AS fecha_caducidad`;

async function getCurrentStock(connection: PoolConnection, tenantId: number, productId: ProductId) {
  const [rows] = await connection.execute<(RowDataPacket & { stock_total: string })[]>(
    `
    SELECT COALESCE(SUM(cantidad), 0) AS stock_total
    FROM inventario
    WHERE tenant_id = ? AND producto_id = ?
    `,
    [tenantId, productId]
  );

  return Number(rows[0]?.stock_total || 0);
}

async function insertInventoryMovement(connection: PoolConnection, data: InventoryMovement) {
  const [result] = await connection.execute<ResultSetHeader>(
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
async function getAllProducts(tenantId: number) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<ProductSummaryRow[]>(`
    SELECT 
  p.id AS producto_id,
  p.nombre AS producto_nombre,
  p.descripcion AS producto_descripcion,

  c.id AS categoria_id,
  c.nombre AS producto_categoria,
  t.id AS impuesto_id,
  t.nombre AS impuesto_nombre,
  t.porcentaje AS impuesto_porcentaje,

  p.precio_compra,
  p.precio_venta,
  p.stock_minimo,

  ${STOCK_PROJECTION}

FROM productos p
LEFT JOIN inventario i 
  ON i.producto_id = p.id AND i.tenant_id = p.tenant_id
LEFT JOIN categorias c 
  ON p.categoria_id = c.id AND c.tenant_id = p.tenant_id
LEFT JOIN impuestos t
  ON t.id = p.impuesto_id AND t.activo = TRUE

WHERE p.tenant_id = ?
AND p.eliminado = 0

GROUP BY 
  p.id,
  p.nombre,
  p.descripcion,
  c.id,
  c.nombre,
  t.id,
  t.nombre,
  t.porcentaje,
  p.precio_compra,
  p.precio_venta,
  p.stock_minimo
  ;`, [tenantId]);
    return rows;
  } finally {
    connection.release();
  }
}

// Listar categorías
async function getAllCategories(tenantId: number) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<(RowDataPacket & CategoryFields & { id: number; tenant_id: number })[]>(
      "SELECT * FROM categorias WHERE tenant_id = ?",
      [tenantId]
    );
    return rows;
  } finally {
    connection.release();
  }
}

async function getAllTaxes() {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<(RowDataPacket & TaxFields)[]>(
      "SELECT id, nombre, porcentaje FROM impuestos WHERE activo = 1 ORDER BY porcentaje DESC, nombre",
    );
    return rows;
  } finally { connection.release(); }
}

async function getProductsWithoutRecentSales(tenantId: number) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<(RowDataPacket & { producto_id: number })[]>(
      `SELECT p.id AS producto_id
       FROM productos p
       INNER JOIN inventario i ON i.producto_id = p.id AND i.tenant_id = p.tenant_id
       WHERE p.tenant_id = ? AND p.eliminado = FALSE
         AND NOT EXISTS (
           SELECT 1 FROM lineas_venta l
           INNER JOIN ventas v ON v.id = l.venta_id AND v.tenant_id = l.tenant_id
           WHERE l.tenant_id = p.tenant_id AND l.producto_id = p.id AND l.cantidad > l.cantidad_devuelta AND v.estado IN ('pendiente_pago','completa','parcialmente_devuelta')
             AND COALESCE(v.fecha_confirmacion, v.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         )
       GROUP BY p.id
       HAVING SUM(i.cantidad) > 0`,
      [tenantId],
    );
    return rows;
  } finally { connection.release(); }
}

async function taxExists(taxId: number) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<RowDataPacket[]>("SELECT id FROM impuestos WHERE id = ? AND activo = 1 LIMIT 1", [taxId]);
    return rows.length > 0;
  } finally { connection.release(); }
}

// Crear categoria
async function createCategory(tenantId: number, categoryData: CategoryFields) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute<ResultSetHeader>(
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
    connection.release();
  }
}

// Comprobar que una categoria pertenece al tenant actual
async function categoryExistsForTenant(tenantId: number, categoryId: number) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<(RowDataPacket & { id: number })[]>(
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
    connection.release();
  }
}

// Buscar producto por nombre
async function searchProductsByName(tenantId: number, name: string) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<ProductSummaryRow[]>(
      `
      SELECT
        p.id AS producto_id,
        p.nombre AS producto_nombre,
        p.descripcion AS producto_descripcion,
        c.id AS categoria_id,
        c.nombre AS producto_categoria,
        t.id AS impuesto_id,
        t.nombre AS impuesto_nombre,
        t.porcentaje AS impuesto_porcentaje,
        p.precio_compra,
        p.precio_venta,
        p.stock_minimo,
        ${STOCK_PROJECTION}
      FROM productos p
      LEFT JOIN inventario i
        ON i.producto_id = p.id AND i.tenant_id = p.tenant_id
      LEFT JOIN categorias c
        ON p.categoria_id = c.id AND c.tenant_id = p.tenant_id
      LEFT JOIN impuestos t ON t.id = p.impuesto_id
      WHERE p.tenant_id = ? AND p.eliminado = 0 AND p.nombre LIKE CONCAT('%', ?, '%')
      GROUP BY
        p.id,
        p.nombre,
        p.descripcion,
        c.id,
        c.nombre,
        t.id,
        t.nombre,
        t.porcentaje,
        p.precio_compra,
        p.precio_venta,
        p.stock_minimo
      `,
      [tenantId, name]
    );
    return rows;
  } finally {
    connection.release();
  }
}

// Filtrar productos por categoria
async function getProductsByCategory(tenantId: number, categoryId: number) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<ProductSummaryRow[]>(
      `
      SELECT
        p.id AS producto_id,
        p.nombre AS producto_nombre,
        p.descripcion AS producto_descripcion,
        c.id AS categoria_id,
        c.nombre AS producto_categoria,
        t.id AS impuesto_id,
        t.nombre AS impuesto_nombre,
        t.porcentaje AS impuesto_porcentaje,
        p.precio_compra,
        p.precio_venta,
        p.stock_minimo,
        ${STOCK_PROJECTION}
      FROM productos p
      LEFT JOIN inventario i
        ON i.producto_id = p.id AND i.tenant_id = p.tenant_id
      LEFT JOIN categorias c
        ON p.categoria_id = c.id AND c.tenant_id = p.tenant_id
      LEFT JOIN impuestos t
        ON t.id = p.impuesto_id AND t.activo = TRUE
      WHERE p.tenant_id = ? AND p.categoria_id = ? AND p.eliminado = 0
      GROUP BY
        p.id,
        p.nombre,
        p.descripcion,
        c.id,
        c.nombre,
        t.id,
        t.nombre,
        t.porcentaje,
        p.precio_compra,
        p.precio_venta,
        p.stock_minimo
      `,
      [tenantId, categoryId]
    );
    return rows;
  } finally {
    connection.release();
  }
}

// Obtener producto por id
async function getProductById(tenantId: number, id: ProductId) {
  const connection = await getConnection();

  try {
    const [rows] = await connection.execute<ProductDetailRow[]>(
      `
      SELECT
        i.id AS inventario_id,
        p.tenant_id,
        p.id AS producto_id,
        p.nombre AS producto_nombre,
        p.descripcion AS producto_descripcion,
        c.id AS categoria_id,
        c.nombre AS producto_categoria,
        t.id AS impuesto_id,
        t.nombre AS impuesto_nombre,
        t.porcentaje AS impuesto_porcentaje,
        i.cantidad,
        p.stock_minimo,
        p.precio_compra,
        p.precio_venta,
        i.fecha_caducidad,
        i.updated_at,
        i.numero_lote
      FROM productos p
      LEFT JOIN inventario i
        ON i.producto_id = p.id
        AND i.tenant_id = p.tenant_id
        AND i.cantidad > 0
      LEFT JOIN categorias c
        ON p.categoria_id = c.id
        AND c.tenant_id = p.tenant_id
      LEFT JOIN impuestos t ON t.id = p.impuesto_id
      WHERE p.tenant_id = ?
        AND p.id = ?
        AND p.eliminado = 0;
      `,
      [tenantId, id]
    );

    return rows;
  } finally {
    connection.release();
  }
}


// Actualizar producto e inventario
async function updateProduct(tenantId: number, productId: ProductId, productoData: ProductFields, invnetarioData: InventoryUpdate[], userId: number) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const [productResult] = await connection.execute<ResultSetHeader>(
      `UPDATE productos
       SET nombre = ?, descripcion = ?, categoria_id = ?, impuesto_id = ?, precio_compra = ?, precio_venta = ?, stock_minimo = ?
       WHERE tenant_id = ? AND id = ? AND eliminado = 0`,
      [
        productoData.nombre,
        productoData.descripcion,
        productoData.categoria_id,
        productoData.impuesto_id,
        productoData.precio_compra,
        productoData.precio_venta,
        productoData.stock_minimo,
        tenantId,
        productId
      ]
    );

    if (!productResult.affectedRows) {
      const error: HttpError = new Error("Producto no encontrado");
      error.statusCode = 404;
      throw error;
    }

    let runningStock = await getCurrentStock(connection, tenantId, productId);

    for (const item of invnetarioData) {
      const [inventoryRows] = await connection.execute<InventoryRow[]>(
        `
        SELECT id, cantidad, fecha_caducidad, numero_lote
        FROM inventario
        WHERE tenant_id = ? AND producto_id = ? AND id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [tenantId, productId, item.inventario_id]
      );

      if (!inventoryRows.length) {
        const error: HttpError = new Error("Lote de inventario no encontrado");
        error.statusCode = 404;
        throw error;
      }

      if (item.version !== inventoryVersion(inventoryRows[0])) {
        const error: HttpError = new Error("El inventario ha cambiado. Recarga la ficha antes de guardar.");
        error.statusCode = 409;
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
    connection.release();
  }
}

// Crear nuevo producto e inventario
async function createProduct(productoData: ProductFields & { tenant_id: number }, inventarioData: InventoryFields & { tenant_id: number }, userId: number) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const [productoResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO productos 
       (tenant_id, nombre, descripcion, categoria_id, impuesto_id, precio_compra, precio_venta, stock_minimo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productoData.tenant_id,
        productoData.nombre,
        productoData.descripcion,
        productoData.categoria_id,
        productoData.impuesto_id,
        productoData.precio_compra,
        productoData.precio_venta,
        productoData.stock_minimo,
      ]
    );

    const productoId = productoResult.insertId;

    const [inventarioResult] = await connection.execute<ResultSetHeader>(
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
    connection.release();
  }
}

// Borrado logico de producto
async function softDeleteProduct(tenantId: number, productId: ProductId) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute<ResultSetHeader>(
      `
      UPDATE productos
      SET eliminado = 1
      WHERE tenant_id = ? AND id = ? AND eliminado = 0
      `,
      [tenantId, productId]
    );

    return result.affectedRows;
  } finally {
    connection.release();
  }
}

export {
  getAllProducts,
  getAllCategories,
  getAllTaxes,
  getProductsWithoutRecentSales,
  createCategory,
  categoryExistsForTenant,
  taxExists,
  searchProductsByName,
  getProductsByCategory,
  getProductById,
  updateProduct,
  createProduct,
  softDeleteProduct,
};
