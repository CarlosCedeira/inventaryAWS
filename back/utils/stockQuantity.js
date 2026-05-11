const DEFAULT_MAX_STOCK_QUANTITY = 999999;

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function validateStockQuantity(
  value,
  { label = "La cantidad", max = DEFAULT_MAX_STOCK_QUANTITY } = {}
) {
  if (isBlank(value)) return `${label} es obligatoria`;

  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    return `${label} debe ser un numero valido`;
  }

  if (!Number.isInteger(quantity)) {
    return `${label} debe ser un numero entero`;
  }

  if (quantity <= 0) {
    return `${label} debe ser mayor que cero`;
  }

  if (quantity > max) {
    return `${label} no puede superar ${max}`;
  }

  return null;
}

function normalizeStockQuantity(value) {
  return Number(value);
}

function parseStockQuantity(value, options) {
  const errorMessage = validateStockQuantity(value, options);

  if (errorMessage) {
    const error = new Error(errorMessage);
    error.statusCode = 400;
    throw error;
  }

  return normalizeStockQuantity(value);
}

module.exports = {
  validateStockQuantity,
  normalizeStockQuantity,
  parseStockQuantity,
};
