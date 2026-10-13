type NumericFormValue = string | number;

export interface ProductForm {
  producto_nombre: string;
  producto_descripcion: string;
  categoria_id: NumericFormValue;
  impuesto_id: NumericFormValue;
  precio_compra: NumericFormValue;
  precio_venta: NumericFormValue;
  stock_minimo: NumericFormValue;
}

export interface ProductPayload {
  producto_nombre: string;
  producto_descripcion: string;
  categoria_id: number;
  impuesto_id: number | null;
  precio_compra: number;
  precio_venta: number;
  stock_minimo: number;
}

export const validateProductForm = (
  form: ProductForm,
): string | null => {
  const nombre = form.producto_nombre.trim();
  const descripcion = form.producto_descripcion.trim();

  if (!nombre) return "El nombre del producto es obligatorio";
  if (nombre.length < 3) {
    return "El nombre debe tener al menos 3 caracteres";
  }
  if (nombre.length > 80) {
    return "El nombre no puede superar los 80 caracteres";
  }

  const nombreRegex = /^[a-zA-ZÀ-ÿ0-9\s-_.,()]+$/;

  if (!nombreRegex.test(nombre)) {
    return "El nombre contiene caracteres no válidos";
  }

  if (!descripcion) return "La descripción del producto es obligatoria";
  if (descripcion.length > 300) {
    return "La descripción no puede superar los 300 caracteres";
  }

  if (!form.categoria_id) {
    return "Debes seleccionar una categoría";
  }

  if (!form.impuesto_id) {
    return "Debes seleccionar un IVA";
  }

  if (form.precio_compra === "") {
    return "El precio de compra es obligatorio";
  }
  if (Number(form.precio_compra) < 0) {
    return "El precio de compra no puede ser negativo";
  }

  if (form.precio_venta === "") {
    return "El precio de venta es obligatorio";
  }
  if (Number(form.precio_venta) < 0) {
    return "El precio de venta no puede ser negativo";
  }

  if (Number(form.precio_venta) < Number(form.precio_compra)) {
    return "El precio de venta no puede ser menor que el precio de compra";
  }

  if (form.stock_minimo === "") {
    return "El stock mínimo es obligatorio";
  }
  if (Number(form.stock_minimo) < 0) {
    return "El stock mínimo no puede ser negativo";
  }
  if (!Number.isInteger(Number(form.stock_minimo))) {
    return "El stock mínimo debe ser un número entero";
  }

  return null;
};

export const buildProductPayload = (
  form: ProductForm,
): ProductPayload => ({
  producto_nombre: form.producto_nombre.trim(),
  producto_descripcion: form.producto_descripcion.trim(),
  categoria_id: Number(form.categoria_id),
  impuesto_id: form.impuesto_id ? Number(form.impuesto_id) : null,
  precio_compra: Number(form.precio_compra),
  precio_venta: Number(form.precio_venta),
  stock_minimo: Number(form.stock_minimo),
});
