export const validateProductForm = (form) => {
  const nombre = form.producto_nombre.trim();
  const descripcion = form.producto_descripcion.trim();
  const lote = form.numero_lote.trim();

  if (!nombre) return "El nombre del producto es obligatorio";
  if (nombre.length < 3) return "El nombre debe tener al menos 3 caracteres";
  if (nombre.length > 80) return "El nombre no puede superar los 80 caracteres";

  const nombreRegex = /^[a-zA-ZÀ-ÿ0-9\s-_.,()]+$/;

  if (!nombreRegex.test(nombre)) {
    return "El nombre contiene caracteres no válidos";
  }

  if (descripcion.length > 300) {
    return "La descripción no puede superar los 300 caracteres";
  }

  if (!form.categoria_id) return "Debes seleccionar una categoría";

  if (form.precio_compra === "") return "El precio de compra es obligatorio";
  if (Number(form.precio_compra) < 0) return "El precio de compra no puede ser negativo";

  if (form.precio_venta === "") return "El precio de venta es obligatorio";
  if (Number(form.precio_venta) < 0) return "El precio de venta no puede ser negativo";

  if (Number(form.precio_venta) < Number(form.precio_compra)) {
    return "El precio de venta no puede ser menor que el precio de compra";
  }

  if (form.stock_minimo === "") return "El stock mínimo es obligatorio";
  if (Number(form.stock_minimo) < 0) return "El stock mínimo no puede ser negativo";
  if (!Number.isInteger(Number(form.stock_minimo))) {
    return "El stock mínimo debe ser un número entero";
  }

  if (form.cantidad === "") return "La cantidad inicial es obligatoria";
  if (Number(form.cantidad) < 0) return "La cantidad inicial no puede ser negativa";
  if (!Number.isInteger(Number(form.cantidad))) {
    return "La cantidad inicial debe ser un número entero";
  }

  if (lote.length > 50) {
    return "El número de lote no puede superar los 50 caracteres";
  }

  return null;
};

export const buildProductPayload = (form) => ({
  producto_nombre: form.producto_nombre.trim(),
  producto_descripcion: form.producto_descripcion.trim(),
  categoria_id: Number(form.categoria_id),
  precio_compra: Number(form.precio_compra),
  precio_venta: Number(form.precio_venta),
  stock_minimo: Number(form.stock_minimo),
  cantidad: Number(form.cantidad),
  fecha_caducidad: form.fecha_caducidad || null,
  numero_lote: form.numero_lote.trim() || null,
});