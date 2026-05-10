const productNameRegex = /^[a-zA-ZÀ-ÿ0-9\s\-_.,()]+$/;
const categoryNameRegex = /^[a-zA-ZÀ-ÿ0-9\s\-_]+$/;

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function toTrimmedString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function validateRequiredNumber(value, label) {
  if (isBlank(value)) return `${label} es obligatorio`;

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return `${label} debe ser un numero valido`;
  if (numberValue < 0) return `${label} no puede ser negativo`;

  return null;
}

function validateRequiredInteger(value, label) {
  const numberError = validateRequiredNumber(value, label);
  if (numberError) return numberError;

  if (!Number.isInteger(Number(value))) {
    return `${label} debe ser un numero entero`;
  }

  return null;
}

function validateOptionalDate(value, label) {
  if (isBlank(value)) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `${label} no es valida`;
  }

  return null;
}

function validateProductFields(product) {
  const nombre = toTrimmedString(product.nombre);
  const descripcion = toTrimmedString(product.descripcion);

  if (!nombre) return "El nombre del producto es obligatorio";
  if (nombre.length < 3) return "El nombre debe tener al menos 3 caracteres";
  if (nombre.length > 80) return "El nombre no puede superar los 80 caracteres";

  if (!productNameRegex.test(nombre)) {
    return "El nombre contiene caracteres no validos";
  }

  if (descripcion.length > 300) {
    return "La descripcion no puede superar los 300 caracteres";
  }

  if (isBlank(product.categoria_id)) return "Debes seleccionar una categoria";

  const categoryId = Number(product.categoria_id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return "La categoria seleccionada no es valida";
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

function validateInventoryItem(item) {
  const quantityError = validateRequiredInteger(
    item.cantidad,
    "La cantidad inicial"
  );
  if (quantityError) return quantityError;

  const lot = toTrimmedString(item.numero_lote);
  if (lot.length > 50) {
    return "El numero de lote no puede superar los 50 caracteres";
  }

  return validateOptionalDate(item.fecha_caducidad, "La fecha de caducidad");
}

function normalizeProductFields(product) {
  return {
    nombre: toTrimmedString(product.nombre),
    descripcion: toTrimmedString(product.descripcion),
    categoria_id: Number(product.categoria_id),
    precio_compra: Number(product.precio_compra),
    precio_venta: Number(product.precio_venta),
    stock_minimo: Number(product.stock_minimo),
  };
}

function normalizeInventoryItem(item) {
  return {
    ...item,
    cantidad: Number(item.cantidad),
    fecha_caducidad: isBlank(item.fecha_caducidad) ? null : item.fecha_caducidad,
    numero_lote: toTrimmedString(item.numero_lote) || null,
  };
}

function buildCreateProductPayload(body, tenantId) {
  const product = {
    tenant_id: tenantId,
    nombre: body.producto_nombre,
    descripcion: body.producto_descripcion,
    categoria_id: body.categoria_id || body.producto_categoria,
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

  const productError = validateProductFields(product);
  if (productError) return { error: productError };

  const inventoryError = validateInventoryItem(inventory);
  if (inventoryError) return { error: inventoryError };

  return {
    product: {
      tenant_id: tenantId,
      ...normalizeProductFields(product),
    },
    inventory: {
      tenant_id: tenantId,
      ...normalizeInventoryItem(inventory),
    },
  };
}

function buildCreateCategoryPayload(body) {
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

function buildUpdateProductPayload(body) {
  const productError = validateProductFields(body);
  if (productError) return { error: productError };

  if (!Array.isArray(body.inventario)) {
    return { error: "El inventario del producto es obligatorio" };
  }

  const normalizedInventory = [];

  for (const item of body.inventario) {
    if (!Number.isInteger(Number(item.inventario_id)) || Number(item.inventario_id) <= 0) {
      return { error: "El lote de inventario no es valido" };
    }

    const inventoryError = validateInventoryItem(item);
    if (inventoryError) return { error: inventoryError };

    normalizedInventory.push(normalizeInventoryItem(item));
  }

  return {
    product: {
      ...normalizeProductFields(body),
      inventario: normalizedInventory,
    },
  };
}

module.exports = {
  buildCreateCategoryPayload,
  buildCreateProductPayload,
  buildUpdateProductPayload,
};
