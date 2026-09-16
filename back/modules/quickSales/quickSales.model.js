const { getConnection } = require("../../db");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

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

async function registerQuickSale({ tenantId, userId, productId, quantity }) {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const [products] = await connection.execute(
      `
      SELECT id
      FROM productos
      WHERE tenant_id = ? AND id = ? AND eliminado = 0
      FOR UPDATE
      `,
      [tenantId, productId]
    );

    if (!products.length) {
      throw createHttpError(404, "Producto no encontrado");
    }

    const stockBeforeSale = await getCurrentStock(connection, tenantId, productId);



    const [inventoryRows] = await connection.execute(
      `
      SELECT id, cantidad, numero_lote, fecha_caducidad
      FROM inventario
      WHERE tenant_id = ? AND producto_id = ? AND cantidad > 0
        AND (fecha_caducidad IS NULL OR fecha_caducidad >= CURDATE())
      ORDER BY
        CASE WHEN fecha_caducidad IS NULL THEN 1 ELSE 0 END,
        fecha_caducidad ASC,
        id ASC
      FOR UPDATE
      `,
      [tenantId, productId]
    );

    // Count the locked, sellable lots. Movement balances remain physical stock.
    const sellableStock = inventoryRows.reduce((total, item) => total + Number(item.cantidad), 0);
    if (sellableStock < quantity) {
      throw createHttpError(409, "Stock disponible insuficiente: los lotes caducados no se pueden vender");
    }

    let remaining = quantity;
    let runningStock = stockBeforeSale;
    const movements = [];

    for (const item of inventoryRows) {
      if (remaining <= 0) break;

      const amountToDiscount = Math.min(Number(item.cantidad), remaining);
      const newInventoryQuantity = Number(item.cantidad) - amountToDiscount;
      const stockPrevious = runningStock;
      const stockNew = runningStock - amountToDiscount;

      await connection.execute(
        `
        UPDATE inventario
        SET cantidad = ?
        WHERE tenant_id = ? AND id = ?
        `,
        [newInventoryQuantity, tenantId, item.id]
      );

      const [movementResult] = await connection.execute(
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
        VALUES (?, ?, ?, 'salida', ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          tenantId,
          productId,
          item.id,
          amountToDiscount,
          stockPrevious,
          stockNew,
          item.numero_lote || null,
          item.fecha_caducidad || null,
          "Venta rapida",
          "Salida registrada desde la vista de productos",
          userId,
        ]
      );

      movements.push({
        id: movementResult.insertId,
        inventario_id: item.id,
        cantidad: amountToDiscount,
        stock_anterior: stockPrevious,
        stock_nuevo: stockNew,
      });

      item.cantidad = newInventoryQuantity;
      remaining -= amountToDiscount;
      runningStock = stockNew;
    }

    if (remaining > 0) {
      throw createHttpError(409, "No se ha podido completar la venta con stock disponible");
    }
    await connection.commit();

    return {
      producto_id: productId,
      cantidad_vendida: quantity,
      stock_anterior: stockBeforeSale,
      stock_nuevo: runningStock,
      stock_fisico: runningStock,
      stock_disponible: sellableStock - quantity,
      stock_caducado: stockBeforeSale - sellableStock,
      fecha_caducidad: inventoryRows.find((item) => item.cantidad > 0 && item.fecha_caducidad)?.fecha_caducidad ?? null,
      movimientos: movements,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  registerQuickSale,
};
