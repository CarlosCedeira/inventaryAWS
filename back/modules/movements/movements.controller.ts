import type { MovementFilters, MovementType } from "./movements.model.ts";

const movementsService = require("./movements.service.ts") as typeof import("./movements.service.ts");
const { parseStockQuantity } = require("../../utils/stockQuantity") as {
  parseStockQuantity: (value: unknown, options?: { label?: string; allowZero?: boolean }) => number;
};
const { log, logUnexpectedError } = require("../../utils/logger");

interface AuthenticatedRequest {
  tenantId: number;
  user: { id: number };
  requestId?: string;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
}

interface ApiResponse {
  status: (statusCode: number) => ApiResponse;
  json: (body: unknown) => ApiResponse;
}

interface HttpError extends Error {
  statusCode: number;
}

function createHttpError(statusCode: number, message: string): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function readQueryValue(query: Record<string, unknown>, name: string): string | undefined {
  const value = query[name];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw createHttpError(400, `El filtro ${name} no es valido`);
  return value.trim() || undefined;
}

function parseDate(value: string, label: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createHttpError(400, `${label} debe tener formato AAAA-MM-DD`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw createHttpError(400, `${label} no es valida`);
  }
  return value;
}

function parseMovementFilters(query: Record<string, unknown>): MovementFilters {
  const productValue = readQueryValue(query, "producto_id");
  const typeValue = readQueryValue(query, "tipo");
  const startValue = readQueryValue(query, "fecha_desde");
  const endValue = readQueryValue(query, "fecha_hasta");
  const filters: MovementFilters = {};

  if (productValue !== undefined) {
    const productId = Number(productValue);
    if (!Number.isSafeInteger(productId) || productId <= 0) {
      throw createHttpError(400, "El filtro producto_id no es valido");
    }
    filters.productId = productId;
  }

  if (typeValue !== undefined) {
    if (!(["entrada", "salida", "ajuste"] as MovementType[]).includes(typeValue as MovementType)) {
      throw createHttpError(400, "El filtro tipo no es valido");
    }
    filters.type = typeValue as MovementType;
  }

  if (startValue !== undefined) filters.startDate = parseDate(startValue, "fecha_desde");
  if (endValue !== undefined) filters.endDate = parseDate(endValue, "fecha_hasta");
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    throw createHttpError(400, "fecha_desde no puede ser posterior a fecha_hasta");
  }
  return filters;
}

function hasStatusCode(error: unknown): error is HttpError {
  return error instanceof Error && "statusCode" in error && typeof error.statusCode === "number";
}

async function getMovements(req: AuthenticatedRequest, res: ApiResponse) {
  try {
    const filters = parseMovementFilters(req.query);
    const movements = await movementsService.listMovements(req.tenantId, filters);
    res.json(movements);
  } catch (error) {
    if (hasStatusCode(error)) return res.status(error.statusCode).json({ error: error.message });
    logUnexpectedError(req, "movement_list_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function createMovement(req: AuthenticatedRequest, res: ApiResponse) {
  try {
    const productId = parseStockQuantity(req.body.producto_id, {
      label: "Producto",
    });
    const quantity = parseStockQuantity(req.body.cantidad, { allowZero: req.body.tipo === "ajuste" });

    const movement = await movementsService.createMovement({
      tenantId: req.tenantId,
      userId: req.user.id,
      productId,
      inventoryId: req.body.inventario_id,
      type: typeof req.body.tipo === "string" ? req.body.tipo : "",
      quantity,
      lotNumber: req.body.numero_lote,
      expirationDate: req.body.fecha_caducidad,
      reason: req.body.motivo,
    });

    log("info", "movement_created", {
      requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id,
      productId, inventoryId: req.body.inventario_id || null, type: req.body.tipo,
      quantity, stockBefore: movement.stock_anterior, stockAfter: movement.stock_nuevo,
    });
    res.status(201).json({
      message: "Movimiento registrado correctamente",
      ...movement,
    });
  } catch (error) {
    if (hasStatusCode(error)) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    logUnexpectedError(req, "movement_create_failed", error, {
      productId: req.body.producto_id, type: req.body.tipo,
    });
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export { getMovements, createMovement };
