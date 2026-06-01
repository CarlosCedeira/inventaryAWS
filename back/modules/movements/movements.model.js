const { getConnection } = require("../../db");

const ADD_TYPES = new Set(["entrada"]);
const SUBTRACT_TYPES = new Set(["salida"]);
const MOVEMENT_TYPES = new Set(["entrada", "salida", "ajuste"]);

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

function validateOptionalInventoryId(inventoryId) {
  if (inventoryId === undefined || inventoryId === null || inventoryId === "") {
    return null;
  }

  if (!Number.isInteger(Number(inventoryId)) || Number(inventoryId) <= 0) {
    throw createHttpError(400, "El lote de inventario no es valido");
  }

  return Number(inventoryId);
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

async function getInventoryLotForUpdate(connection, tenantId, productId, inventoryId) {
  const [rows] = await connection.execute(
    `
    SELECT id, cantidad, numero_lote, fecha_caducidad
    FROM inventario
    WHERE tenant_id = ?
      AND producto_id = ?
      AND id = ?
    LIMIT 1
    FOR UPDATE
    `,
    [tenantId, productId, inventoryId]
  );

  if (!rows.length) {
    throw createHttpError(404, "Lote de inventario no encontrado");
  }

  return rows[0];
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
        usuario_id
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

  if (data.inventoryId) {
    const inventoryLot = await getInventoryLotForUpdate(
      connection,
      data.tenantId,
      data.productId,
      data.inventoryId
    );
    const lotQuantity = Number(inventoryLot.cantidad);

    if (lotQuantity < data.quantity) {
      throw createHttpError(409, "Stock insuficiente en el lote seleccionado");
    }

    await connection.execute(
      `
      UPDATE inventario
      SET cantidad = ?
      WHERE tenant_id = ? AND producto_id = ? AND id = ?
      `,
      [
        lotQuantity - data.quantity,
        data.tenantId,
        data.productId,
        data.inventoryId,
      ]
    );

    const newStock = stockBefore - data.quantity;
    const movementId = await insertMovement(connection, {
      ...data,
      inventoryId: inventoryLot.id,
      previousStock: stockBefore,
      newStock,
      lotNumber: inventoryLot.numero_lote || null,
      expirationDate: inventoryLot.fecha_caducidad || null,
    });

    return {
      movementId,
      movementIds: [movementId],
      stock_anterior: stockBefore,
      stock_nuevo: newStock,
    };
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

async function adjustSelectedLotMovement(connection, data) {
  const stockBefore = await getCurrentStock(
    connection,
    data.tenantId,
    data.productId
  );
  const inventoryLot = await getInventoryLotForUpdate(
    connection,
    data.tenantId,
    data.productId,
    data.inventoryId
  );
  const currentLotStock = Number(inventoryLot.cantidad);
  const difference = data.quantity - currentLotStock;

  if (difference === 0) {
    throw createHttpError(400, "El ajuste no cambia el stock actual del lote");
  }

  await connection.execute(
    `
    UPDATE inventario
    SET cantidad = ?
    WHERE tenant_id = ? AND producto_id = ? AND id = ?
    `,
    [data.quantity, data.tenantId, data.productId, data.inventoryId]
  );

  const newStock = stockBefore + difference;
  const movementId = await insertMovement(connection, {
    ...data,
    inventoryId: inventoryLot.id,
    quantity: Math.abs(difference),
    previousStock: stockBefore,
    newStock,
    lotNumber: inventoryLot.numero_lote || null,
    expirationDate: inventoryLot.fecha_caducidad || null,
  });

  return {
    movementId,
    stock_anterior: stockBefore,
    stock_nuevo: newStock,
  };
}

async function createMovement({
  tenantId,
  userId,
  productId,
  inventoryId,
  type,
  quantity,
  lotNumber,
  expirationDate,
  reason,
}) {
  if (!MOVEMENT_TYPES.has(type)) {
    throw createHttpError(400, "Tipo de movimiento no valido");
  }

  const normalizedData = {
    tenantId,
    userId,
    productId,
    inventoryId: validateOptionalInventoryId(inventoryId),
    type,
    quantity: validateQuantity(quantity),
    lotNumber: normalizeOptionalString(lotNumber),
    expirationDate: normalizeOptionalDate(expirationDate),
    reason: normalizeOptionalString(reason),
  };

  if ((type === "salida" || type === "ajuste") && !normalizedData.inventoryId) {
    throw createHttpError(400, "Selecciona el lote de inventario");
  }

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
      result = await adjustSelectedLotMovement(connection, normalizedData);
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
