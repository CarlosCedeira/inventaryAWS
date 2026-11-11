const DEFAULT_MAX_STOCK_QUANTITY = 999999;

interface StockQuantityOptions {
  label?: string;
  max?: number;
  allowZero?: boolean;
}

function isBlank(value: unknown) {
  return value === undefined || value === null || String(value).trim() === "";
}

function validateStockQuantity(
  value: unknown,
  { label = "La cantidad", max = DEFAULT_MAX_STOCK_QUANTITY, allowZero = false }: StockQuantityOptions = {}
) {
  if (isBlank(value)) return `${label} es obligatoria`;

  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    return `${label} debe ser un numero valido`;
  }

  if (!Number.isInteger(quantity)) {
    return `${label} debe ser un numero entero`;
  }

  if (quantity < 0 || (!allowZero && quantity === 0)) {
    return allowZero ? `${label} no puede ser negativa` : `${label} debe ser mayor que cero`;
  }

  if (quantity > max) {
    return `${label} no puede superar ${max}`;
  }

  return null;
}

function normalizeStockQuantity(value: unknown) {
  return Number(value);
}

function parseStockQuantity(value: unknown, options?: StockQuantityOptions) {
  const errorMessage = validateStockQuantity(value, options);

  if (errorMessage) {
    const error = new Error(errorMessage) as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  return normalizeStockQuantity(value);
}

export {
  validateStockQuantity,
  normalizeStockQuantity,
  parseStockQuantity,
};
