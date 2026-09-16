const DEFAULT_MAX_STOCK_QUANTITY = 999999;

type StockQuantityValue = string | number | null | undefined;

interface StockQuantityOptions {
  label?: string;
  max?: number;
  allowZero?: boolean;
}

function isBlank(value: StockQuantityValue): boolean {
  return value === undefined || value === null || String(value).trim() === "";
}

export function validateStockQuantity(
  value: StockQuantityValue,
  {
    label = "La cantidad",
    max = DEFAULT_MAX_STOCK_QUANTITY,
    allowZero = false,
  }: StockQuantityOptions = {},
): string | null {
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

export function normalizeStockQuantity(
  value: StockQuantityValue,
): number {
  return Number(value);
}
