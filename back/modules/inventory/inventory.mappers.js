
function groupProductWithInventory(rows) {
  const map = new Map();

  rows.forEach(row => {
    if (!map.has(row.producto_id)) {
      map.set(row.producto_id, {
        producto_id: row.producto_id,
        nombre: row.producto_nombre,
        descripcion: row.producto_descripcion,
        categoria_nombre: row.producto_categoria,
        categoria_id: row.categoria_id,
        precio_compra: row.precio_compra,
        precio_venta: row.precio_venta,
        stock_minimo: row.stock_minimo,
        inventario: []
      });
    }

    map.get(row.producto_id).inventario.push({
      inventario_id: row.inventario_id,
      cantidad: row.cantidad,
      fecha_caducidad: row.fecha_caducidad,
      numero_lote: row.numero_lote
    });
  });

  return Array.from(map.values())[0]; // si es un producto único
}

module.exports = {
  groupProductWithInventory
};