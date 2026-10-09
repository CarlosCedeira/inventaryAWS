import type { CategoryFields, InventoryDate, InventoryFields, ProductFields } from "./inventory.types";

type Input = Record<string, unknown>;
type Validation<T> = (T & { error?: never }) | { error: string };
type CreatePayload = {
  product: ProductFields & { tenant_id: number };
  inventory: InventoryFields & { tenant_id: number };
};

const {
  normalizeStockQuantity,
  validateStockQuantity,
} = require("../../utils/stockQuantity") as {
  normalizeStockQuantity: (value: unknown) => number;
  validateStockQuantity: (value: unknown, options: { label: string }) => string | null;
};

const productNameRegex = /^[\p{L}0-9\s_.(),-]+$/u;
const categoryNameRegex = /^[\p{L}0-9\s_-]+$/u;

function isBlank(value: unknown) {
  return value === undefined || value === null || String(value).trim() === "";
}

function toTrimmedString(value: unknown) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function validateRequiredNumber(value: unknown, label: string) {
  if (isBlank(value)) return `${label} es obligatorio`;

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return `${label} debe ser un numero valido`;
  if (numberValue < 0) return `${label} no puede ser negativo`;

  return null;
}

function validateRequiredInteger(value: unknown, label: string) {
  const numberError = validateRequiredNumber(value, label);
  if (numberError) return numberError;

  if (!Number.isInteger(Number(value))) {
    return `${label} debe ser un numero entero`;
  }

  return null;
}

function validateOptionalDate(value: unknown, label: string) {
  if (isBlank(value)) return null;

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${label} no es valida`;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return `${label} no es valida`;

  return null;
}

function validateProductFields(product: Input, { requireTax = false }: { requireTax?: boolean } = {}) {
  const nombre = toTrimmedString(product.nombre);
  const descripcion = toTrimmedString(product.descripcion);

  if (!nombre) return "El nombre del producto es obligatorio";
  if (nombre.length < 3) return "El nombre debe tener al menos 3 caracteres";
  if (nombre.length > 80) return "El nombre no puede superar los 80 caracteres";

  if (!productNameRegex.test(nombre)) {
    return "El nombre contiene caracteres no validos";
  }

  if (!descripcion) return "La descripcion del producto es obligatoria";
  if (descripcion.length > 300) {
    return "La descripcion no puede superar los 300 caracteres";
  }

  if (isBlank(product.categoria_id)) return "Debes seleccionar una categoria";

  const categoryId = Number(product.categoria_id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return "La categoria seleccionada no es valida";
  }

  if (isBlank(product.impuesto_id) && requireTax) {
    return "Debes seleccionar un IVA";
  }

  if (!isBlank(product.impuesto_id)) {
    const taxId = Number(product.impuesto_id);
    if (!Number.isInteger(taxId) || taxId <= 0) return "El impuesto seleccionado no es valido";
  }

  const purchasePriceError = validateRequiredNumber(
    product.precio_compra,
    "El precio de compra"
  );
  if (purchasePriceError) return purchasePriceError;

  const salePriceError = validateRequiredNumber(
    product.precio_venta,
    "El precio de venta"
  );
  if (salePriceError) return salePriceError;

  if (Number(product.precio_venta) < Number(product.precio_compra)) {
    return "El precio de venta no puede ser menor que el precio de compra";
  }

  return validateRequiredInteger(product.stock_minimo, "El stock minimo");
}

function validateInventoryItem(item: Input) {
  const quantityError = validateStockQuantity(item.cantidad, {
    label: "La cantidad inicial",
  });
  if (quantityError) return quantityError;

  const lot = toTrimmedString(item.numero_lote);
  if (lot.length > 50) {
    return "El numero de lote no puede superar los 50 caracteres";
  }

  return validateOptionalDate(item.fecha_caducidad, "La fecha de caducidad");
}

function normalizeProductFields(product: Input): ProductFields {
  return {
    nombre: toTrimmedString(product.nombre),
    descripcion: toTrimmedString(product.descripcion),
    categoria_id: Number(product.categoria_id),
    impuesto_id: isBlank(product.impuesto_id) ? null : Number(product.impuesto_id),
    precio_compra: Number(product.precio_compra),
    precio_venta: Number(product.precio_venta),
    stock_minimo: Number(product.stock_minimo),
  };
}

function normalizeInventoryItem<T extends Input>(item: T): T & InventoryFields {
  return {
    ...item,
    cantidad: normalizeStockQuantity(item.cantidad),
    fecha_caducidad: isBlank(item.fecha_caducidad) ? null : item.fecha_caducidad as InventoryDate,
    numero_lote: toTrimmedString(item.numero_lote) || null,
  };
}

function buildCreateProductPayload(body: Input, tenantId: number): Validation<CreatePayload> {
  const product = {
    tenant_id: tenantId,
    nombre: body.producto_nombre,
    descripcion: body.producto_descripcion,
    categoria_id: body.categoria_id || body.producto_categoria,
    impuesto_id: body.impuesto_id,
    precio_compra: body.precio_compra,
    precio_venta: body.precio_venta,
    stock_minimo: body.stock_minimo,
  };

  const inventory = {
    tenant_id: tenantId,
    cantidad: body.cantidad,
    fecha_caducidad: body.fecha_caducidad,
    numero_lote: body.numero_lote,
  };

  const productError = validateProductFields(product, { requireTax: true });
  if (productError) return { error: productError };

  const inventoryError = validateInventoryItem(inventory);
  if (inventoryError) return { error: inventoryError };

  return {
    product: {
      tenant_id: tenantId,
      ...normalizeProductFields(product),
    },
    inventory: {
      ...normalizeInventoryItem(inventory),
    },
  };
}

function buildCreateCategoryPayload(body: Input): Validation<{ category: CategoryFields }> {
  const nombre = toTrimmedString(body.nombre);
  const descripcion = toTrimmedString(body.descripcion);

  if (!nombre) return { error: "El nombre es obligatorio" };
  if (nombre.length < 3) {
    return { error: "El nombre debe tener al menos 3 caracteres" };
  }

  if (nombre.length > 50) {
    return { error: "El nombre no puede superar los 50 caracteres" };
  }

  if (!categoryNameRegex.test(nombre)) {
    return { error: "El nombre contiene caracteres no validos" };
  }

  if (!descripcion) return { error: "La descripcion de la categoria es obligatoria" };
  if (descripcion.length > 200) {
    return { error: "La descripcion no puede superar los 200 caracteres" };
  }

  return {
    category: {
      nombre,
      descripcion: descripcion || null,
    },
  };
}

function buildUpdateProductPayload(body: Input): Validation<{ product: ProductFields }> {
  const productError = validateProductFields(body);
  if (productError) return { error: productError };

  if (Object.hasOwn(body, "inventario")) {
    return { error: "Los lotes se gestionan desde Movimientos" };
  }

  return {
    product: normalizeProductFields(body),
  };
}

export {
  buildCreateCategoryPayload,
  buildCreateProductPayload,
  buildUpdateProductPayload,
};
