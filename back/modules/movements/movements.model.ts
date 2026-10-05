import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

const { parseStockQuantity } = require("../../utils/stockQuantity") as {
  parseStockQuantity: (value: unknown, options?: { allowZero?: boolean }) => number;
};
const { getConnection } = require("../../db") as {
  getConnection: () => Promise<PoolConnection>;
};

export type MovementType = "entrada" | "salida" | "ajuste";

export interface MovementFilters {
  productId?: number;
  type?: MovementType;
  startDate?: string;
  endDate?: string;
  search?: string;
}
type OptionalDate = string | Date | null;

interface MovementInput {
  tenantId: number;
  userId: number;
  productId: number;
  inventoryId?: unknown;
  type: string;
  quantity: unknown;
  lotNumber?: unknown;
  expirationDate?: unknown;
  reason?: unknown;
  description?: unknown;
}

interface NormalizedMovement {
  tenantId: number;
  userId: number;
  productId: number;
  inventoryId: number | null;
  type: MovementType;
  quantity: number;
  lotNumber: string | null;
  expirationDate: OptionalDate;
  reason: string | null;
  description: string | null;
}

interface InventoryLot extends RowDataPacket {
  id: number;
  cantidad: number | string;
  numero_lote: string | null;
  fecha_caducidad: OptionalDate;
}

interface StockRow extends RowDataPacket {
  stock_total: number | string;
}

interface MovementResult {
  movementId: number;
  movementIds?: number[];
  stock_anterior: number;
  stock_nuevo: number;
}

export interface StockConsumptionInput {
  tenantId: number;
  userId: number;
  productId: number;
  quantity: number;
  reason: string;
  description: string;
  saleLineId?: number | null;
}

export interface SaleStockRestorationInput {
  tenantId: number;
  userId: number;
  productId: number;
  inventoryId: number;
  quantity: number;
  lotNumber: string | null;
  expirationDate: OptionalDate;
  saleLineId: number;
  returnLineId?: number | null;
  reason?: string;
  description: string;
}

interface HttpError extends Error {
  statusCode: number;
}

const ADD_TYPES = new Set<MovementType>(["entrada"]);
const SUBTRACT_TYPES = new Set<MovementType>(["salida"]);
const MOVEMENT_TYPES = new Set<MovementType>(["entrada", "salida", "ajuste"]);

function createHttpError(statusCode: number, message: string): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function normalizeOptionalString(value: unknown): string | null {
  const text = value === undefined || value === null ? "" : String(value).trim();
  return text || null;
}

function normalizeOptionalDate(value: unknown): OptionalDate {
  if (!value) return null;

  if (typeof value !== "string" && !(value instanceof Date)) {
    throw createHttpError(400, "La fecha de caducidad no es valida");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createHttpError(400, "La fecha de caducidad no es valida");
  }

  return value;
}

function validateOptionalInventoryId(inventoryId: unknown): number | null {
  if (inventoryId === undefined || inventoryId === null || inventoryId === "") {
    return null;
  }

  if (!Number.isInteger(Number(inventoryId)) || Number(inventoryId) <= 0) {
    throw createHttpError(400, "El lote de inventario no es valido");
  }

  return Number(inventoryId);
}

async function getCurrentStock(connection: PoolConnection, tenantId: number, productId: number): Promise<number> {
  const [rows] = await connection.execute<StockRow[]>(
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
  connection: PoolConnection,
  tenantId: number,
  productId: number,
  lotNumber: string | null,
  expirationDate: OptionalDate,
): Promise<number> {
  const [rows] = await connection.execute<InventoryLot[]>(
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

async function getInventoryLotForUpdate(
  connection: PoolConnection,
  tenantId: number,
  productId: number,
  inventoryId: number,
): Promise<InventoryLot> {
  const [rows] = await connection.execute<InventoryLot[]>(
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

async function insertMovement(
  connection: PoolConnection,
  data: NormalizedMovement & { inventoryId: number; previousStock: number; newStock: number; description?: string | null; saleLineId?: number | null; returnLineId?: number | null },
): Promise<number> {
  const [result] = await connection.execute<ResultSetHeader>(
    `
    INSERT INTO movimientos_inventario
      (
        tenant_id,
        producto_id,
        inventario_id,
        linea_venta_id,
        linea_devolucion_id,
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.tenantId,
      data.productId,
      data.inventoryId,
      data.saleLineId || null,
      data.returnLineId || null,
      data.type,
      data.quantity,
      data.previousStock,
      data.newStock,
      data.lotNumber,
      data.expirationDate,
      data.reason,
      data.description || null,
      data.userId,
    ]
  );

  return result.insertId;
}

async function consumeStockByFEFO(connection: PoolConnection, data: StockConsumptionInput) {
  const [products] = await connection.execute<RowDataPacket[]>(
    "SELECT id FROM productos WHERE tenant_id = ? AND id = ? AND eliminado = 0 FOR UPDATE",
    [data.tenantId, data.productId],
  );
  if (!products.length) throw createHttpError(404, "Producto no encontrado");
  const [lots] = await connection.execute<InventoryLot[]>(
    `SELECT id, cantidad, numero_lote, fecha_caducidad FROM inventario
     WHERE tenant_id = ? AND producto_id = ? AND cantidad > 0
       AND (fecha_caducidad IS NULL OR fecha_caducidad >= CURDATE())
     ORDER BY CASE WHEN fecha_caducidad IS NULL THEN 1 ELSE 0 END, fecha_caducidad, id FOR UPDATE`,
    [data.tenantId, data.productId],
  );
  const sellableStock = lots.reduce((total, lot) => total + Number(lot.cantidad), 0);
  if (sellableStock < data.quantity) throw createHttpError(409, "Stock disponible insuficiente: los lotes caducados no se pueden vender");
  const stockBefore = await getCurrentStock(connection, data.tenantId, data.productId);
  let runningStock = stockBefore;
  let remaining = data.quantity;
  const movementIds: number[] = [];
  const movements: Array<{ id: number; inventario_id: number; cantidad: number; stock_anterior: number; stock_nuevo: number }> = [];
  for (const lot of lots) {
    if (!remaining) break;
    const used = Math.min(Number(lot.cantidad), remaining);
    const nextStock = runningStock - used;
    await connection.execute("UPDATE inventario SET cantidad = ? WHERE tenant_id = ? AND id = ?", [Number(lot.cantidad) - used, data.tenantId, lot.id]);
    const movementId = await insertMovement(connection, {
      tenantId: data.tenantId, userId: data.userId, productId: data.productId, inventoryId: lot.id,
      type: "salida", quantity: used, lotNumber: lot.numero_lote, expirationDate: lot.fecha_caducidad,
      reason: data.reason, description: data.description, saleLineId: data.saleLineId,
      previousStock: runningStock, newStock: nextStock,
    });
    movementIds.push(movementId);
    movements.push({ id: movementId, inventario_id: lot.id, cantidad: used, stock_anterior: runningStock, stock_nuevo: nextStock });
    lot.cantidad = Number(lot.cantidad) - used;
    remaining -= used;
    runningStock = nextStock;
  }
  return {
    movementIds,
    movements,
    stock_anterior: stockBefore,
    stock_nuevo: runningStock,
    stock_disponible: sellableStock - data.quantity,
    stock_caducado: stockBefore - sellableStock,
    fecha_caducidad: lots.find((lot) => Number(lot.cantidad) > 0 && lot.fecha_caducidad)?.fecha_caducidad ?? null,
  };
}

async function getAllMovements(
  tenantId: number,
  filters: MovementFilters = {},
): Promise<RowDataPacket[]> {
  const connection = await getConnection();

  try {
    const conditions = ["m.tenant_id = ?"];
    const parameters: Array<number | string> = [tenantId];
    if (filters.productId !== undefined) {
      conditions.push("m.producto_id = ?");
      parameters.push(filters.productId);
    }
    if (filters.type !== undefined) {
      conditions.push("m.tipo = ?");
      parameters.push(filters.type);
    }
    if (filters.startDate !== undefined) {
      conditions.push("m.created_at >= ?");
      parameters.push(filters.startDate);
    }
    if (filters.endDate !== undefined) {
      conditions.push("m.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
      parameters.push(filters.endDate);
    }
    if (filters.search !== undefined) {
      const pattern = `%${filters.search}%`;
      conditions.push("(p.nombre LIKE ? OR m.numero_lote LIKE ? OR u.nombre LIKE ?)");
      parameters.push(pattern, pattern, pattern);
    }

    const [rows] = await connection.execute<RowDataPacket[]>(
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

      WHERE ${conditions.join(" AND ")}

      ORDER BY m.created_at DESC, m.id DESC
      `,
      parameters,
    );

    return rows;
  } finally {
    connection.release();
  }
}

async function addStockMovement(connection: PoolConnection, data: NormalizedMovement & { saleLineId?: number | null; returnLineId?: number | null }): Promise<MovementResult> {
  const stockBefore = await getCurrentStock(
    connection,
    data.tenantId,
    data.productId
  );

  const [existingRows] = await connection.execute<InventoryLot[]>(
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
    const [inventoryResult] = await connection.execute<ResultSetHeader>(
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

async function restoreSaleStock(connection: PoolConnection, data: SaleStockRestorationInput): Promise<MovementResult> {
  const description = normalizeOptionalString(data.description);
  if (!description) throw createHttpError(400, "Escribe una descripción para el movimiento");
  if (!Number.isSafeInteger(data.inventoryId) || data.inventoryId <= 0) {
    throw createHttpError(409, "No se puede revertir la venta: el lote original ya no existe");
  }
  const stockBefore = await getCurrentStock(connection, data.tenantId, data.productId);
  const [lots] = await connection.execute<InventoryLot[]>(
    `SELECT id, cantidad, numero_lote, fecha_caducidad
     FROM inventario
     WHERE id = ? AND tenant_id = ? AND producto_id = ?
     FOR UPDATE`,
    [data.inventoryId, data.tenantId, data.productId],
  );
  if (!lots.length) throw createHttpError(409, "No se puede revertir la venta: el lote original ya no existe");
  const lot = lots[0];
  await connection.execute(
    "UPDATE inventario SET cantidad = cantidad + ? WHERE id = ? AND tenant_id = ? AND producto_id = ?",
    [data.quantity, lot.id, data.tenantId, data.productId],
  );
  const newStock = stockBefore + data.quantity;
  const movementId = await insertMovement(connection, {
    tenantId: data.tenantId,
    userId: data.userId,
    productId: data.productId,
    inventoryId: lot.id,
    type: "entrada",
    quantity: parseStockQuantity(data.quantity),
    lotNumber: lot.numero_lote || null,
    expirationDate: lot.fecha_caducidad || null,
    reason: normalizeOptionalString(data.reason) || "Venta cancelada",
    description,
    saleLineId: data.saleLineId,
    returnLineId: data.returnLineId || null,
    previousStock: stockBefore,
    newStock,
  });
  return { movementId, stock_anterior: stockBefore, stock_nuevo: newStock };
}

async function subtractStockMovement(connection: PoolConnection, data: NormalizedMovement): Promise<MovementResult> {
  const stockBefore = await getCurrentStock(
    connection,
    data.tenantId,
    data.productId
  );

  if (stockBefore < data.quantity) {
    throw createHttpError(409, "Stock insuficiente para registrar el movimiento");
  }

  if (data.inventoryId !== null) {
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

  const [inventoryRows] = await connection.execute<InventoryLot[]>(
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
  const movementIds: number[] = [];

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

async function adjustSelectedLotMovement(
  connection: PoolConnection,
  data: NormalizedMovement & { inventoryId: number },
): Promise<MovementResult> {
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
  description,
}: MovementInput): Promise<MovementResult> {
  if (!MOVEMENT_TYPES.has(type as MovementType)) {
    throw createHttpError(400, "Tipo de movimiento no valido");
  }

  const normalizedData: NormalizedMovement = {
    tenantId,
    userId,
    productId,
    inventoryId: validateOptionalInventoryId(inventoryId),
    type: type as MovementType,
    quantity: parseStockQuantity(quantity, { allowZero: type === "ajuste" }),
    lotNumber: normalizeOptionalString(lotNumber),
    expirationDate: normalizeOptionalDate(expirationDate),
    reason: normalizeOptionalString(reason),
    description: normalizeOptionalString(description),
  };

  if ((normalizedData.type === "salida" || normalizedData.type === "ajuste") && normalizedData.inventoryId === null) {
    throw createHttpError(400, "Selecciona el lote de inventario");
  }
  if (!normalizedData.reason) {
    throw createHttpError(400, "Selecciona un motivo para el movimiento");
  }
  if (normalizedData.reason.length > 255) {
    throw createHttpError(400, "El motivo no puede superar los 255 caracteres");
  }
  if (!normalizedData.description) {
    throw createHttpError(400, "Escribe una descripción para el movimiento");
  }
  if (normalizedData.description.length > 4000) {
    throw createHttpError(400, "La descripción no puede superar los 4000 caracteres");
  }

  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const [products] = await connection.execute<RowDataPacket[]>(
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

    let result: MovementResult;

    if (ADD_TYPES.has(normalizedData.type)) {
      result = await addStockMovement(connection, normalizedData);
    } else if (SUBTRACT_TYPES.has(normalizedData.type)) {
      result = await subtractStockMovement(connection, normalizedData);
    } else {
      result = await adjustSelectedLotMovement(connection, normalizedData as NormalizedMovement & { inventoryId: number });
    }

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export { getAllMovements, createMovement, consumeStockByFEFO, restoreSaleStock };
