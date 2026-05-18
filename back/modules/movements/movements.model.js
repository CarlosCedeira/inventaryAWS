const { getConnection } = require("../../db");

const ADD_TYPES = new Set(["entrada", "devolucion"]);
const SUBTRACT_TYPES = new Set(["salida", "merma"]);
const MOVEMENT_TYPES = new Set([
  "entrada",
  "salida",
  "ajuste",
  "devolucion",
  "merma",
]);

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeOptionalString(value) {
  const text = value === undefined || value === null ? "" : String(value).trim();
  return text || null;
}

function normalizeOptionalDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createHttpError(400, "La fecha de caducidad no es valida");
  }

  return value;
}

function validateQuantity(quantity) {
  if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
    throw createHttpError(400, "La cantidad debe ser un numero entero positivo");
  }

  return Number(quantity);
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

async function getCurrentLotStock(
  connection,
  tenantId,
  productId,
  lotNumber,
  expirationDate
) {
  const [rows] = await connection.execute(
    `
    SELECT cantidad
    FROM inventario
    WHERE tenant_id = ?
      AND producto_id = ?
      AND numero_lote <=> ?
      AND fecha_caducidad <=> ?
    LIMIT 1
    FOR UPDATE
    `,
    [tenantId, productId, lotNumber, expirationDate]
  );

  return Number(rows[0]?.cantidad || 0);
}

async function insertMovement(connection, data) {
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

async function getAllMovements(tenantId) {
  const connection = await getConnection();

  try {
    const [rows] = await connection.execute(
      `
      SELECT
        m.id AS movimiento_id,
        m.tenant_id,

        m.producto_id,
        p.nombre AS producto_nombre,

        c.id AS categoria_id,
        c.nombre AS producto_categoria,

        m.inventario_id,
        m.tipo,
        m.cantidad,
        m.stock_anterior,
        m.stock_nuevo,
        m.numero_lote,
        m.fecha_caducidad,
        m.motivo,
        m.descripcion,

        m.usuario_id,
        u.nombre AS usuario_nombre,

        m.created_at

      FROM movimientos_inventario m

      INNER JOIN productos p
        ON p.id = m.producto_id
       AND p.tenant_id = m.tenant_id

      LEFT JOIN categorias c
        ON c.id = p.categoria_id
       AND c.tenant_id = p.tenant_id

      LEFT JOIN usuarios u
        ON u.id = m.usuario_id
       AND u.tenant_id = m.tenant_id

      WHERE m.tenant_id = ?

      ORDER BY m.created_at DESC, m.id DESC
      `,
      [tenantId]
    );

    return rows;
  } finally {
    await connection.end();
  }
}

async function addStockMovement(connection, data) {
  const stockBefore = await getCurrentStock(
    connection,
    data.tenantId,
    data.productId
  );

  const [existingRows] = await connection.execute(
    `
    SELECT id, cantidad
    FROM inventario
    WHERE tenant_id = ?
      AND producto_id = ?
      AND numero_lote <=> ?
      AND fecha_caducidad <=> ?
    LIMIT 1
    FOR UPDATE
    `,
    [data.tenantId, data.productId, data.lotNumber, data.expirationDate]
  );

  let inventoryId;

  if (existingRows.length) {
    inventoryId = existingRows[0].id;

    await connection.execute(
      `
      UPDATE inventario
      SET cantidad = cantidad + ?
      WHERE tenant_id = ? AND id = ?
      `,
      [data.quantity, data.tenantId, inventoryId]
    );
  } else {
    const [inventoryResult] = await connection.execute(
      `
      INSERT INTO inventario
        (tenant_id, producto_id, cantidad, numero_lote, fecha_caducidad)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        data.tenantId,
        data.productId,
        data.quantity,
        data.lotNumber,
        data.expirationDate,
      ]
    );

    inventoryId = inventoryResult.insertId;
  }

  const previousStock = stockBefore;
  const newStock = stockBefore + data.quantity;

  const movementId = await insertMovement(connection, {
    ...data,
    inventoryId,
    previousStock,
    newStock,
  });

  return {
    movementId,
    stock_anterior: previousStock,
    stock_nuevo: newStock,
  };
}

async function subtractStockMovement(connection, data) {
  const stockBefore = await getCurrentStock(
    connection,
    data.tenantId,
    data.productId
  );

  if (stockBefore < data.quantity) {
    throw createHttpError(409, "Stock insuficiente para registrar el movimiento");
  }

  const [inventoryRows] = await connection.execute(
    `
    SELECT id, cantidad, numero_lote, fecha_caducidad
    FROM inventario
    WHERE tenant_id = ?
      AND producto_id = ?
      AND cantidad > 0
    ORDER BY
      CASE WHEN fecha_caducidad IS NULL THEN 1 ELSE 0 END,
      fecha_caducidad ASC,
      id ASC
    FOR UPDATE
    `,
    [data.tenantId, data.productId]
  );

  let remaining = data.quantity;
  let runningStock = stockBefore;
  const movementIds = [];

  for (const item of inventoryRows) {
    if (remaining <= 0) break;

    const itemQuantity = Number(item.cantidad);
    const amountToDiscount = Math.min(itemQuantity, remaining);

    const previousStock = runningStock;
    const newStock = runningStock - amountToDiscount;

    await connection.execute(
      `
      UPDATE inventario
      SET cantidad = ?
      WHERE tenant_id = ? AND id = ?
      `,
      [itemQuantity - amountToDiscount, data.tenantId, item.id]
    );

    const movementId = await insertMovement(connection, {
      ...data,
      inventoryId: item.id,
      quantity: amountToDiscount,
      previousStock,
      newStock,
      lotNumber: item.numero_lote || null,
      expirationDate: item.fecha_caducidad || null,
    });

    movementIds.push(movementId);
    remaining -= amountToDiscount;
    runningStock = newStock;
  }

  return {
    movementId: movementIds[0],
    movementIds,
    stock_anterior: stockBefore,
    stock_nuevo: runningStock,
  };
}

async function createMovement({
  tenantId,
  userId,
  productId,
  type,
  quantity,
  lotNumber,
  expirationDate,
  reason,
  description,
}) {
  if (!MOVEMENT_TYPES.has(type)) {
    throw createHttpError(400, "Tipo de movimiento no valido");
  }

  const normalizedData = {
    tenantId,
    userId,
    productId,
    type,
    quantity: validateQuantity(quantity),
    lotNumber: normalizeOptionalString(lotNumber),
    expirationDate: normalizeOptionalDate(expirationDate),
    reason: normalizeOptionalString(reason),
    description: normalizeOptionalString(description),
  };

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

    let result;

    if (ADD_TYPES.has(type)) {
      result = await addStockMovement(connection, normalizedData);
    } else if (SUBTRACT_TYPES.has(type)) {
      result = await subtractStockMovement(connection, normalizedData);
    } else {
      const currentLotStock = await getCurrentLotStock(
        connection,
        tenantId,
        productId,
        normalizedData.lotNumber,
        normalizedData.expirationDate
      );

      const difference = normalizedData.quantity - currentLotStock;

      if (difference === 0) {
        throw createHttpError(400, "El ajuste no cambia el stock actual del lote");
      }

      result =
        difference > 0
          ? await addStockMovement(connection, {
              ...normalizedData,
              quantity: difference,
            })
          : await subtractStockMovement(connection, {
              ...normalizedData,
              quantity: Math.abs(difference),
            });
    }

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = {
  getAllMovements,
  createMovement,
};
