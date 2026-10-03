const { inventoryVersion } = require("./inventory.version");

function groupProductWithInventory(rows) {
  const map = new Map();

  rows.forEach(row => {
    if (!map.has(row.producto_id)) {
      const product = {
        producto_id: row.producto_id,
        nombre: row.producto_nombre,
        descripcion: row.producto_descripcion,
        categoria_nombre: row.producto_categoria,
        categoria_id: row.categoria_id,
        precio_compra: row.precio_compra,
        precio_venta: row.precio_venta,
        stock_minimo: row.stock_minimo,
        inventario: []
      };
      if (Object.hasOwn(row, "impuesto_id")) {
        product.impuesto_id = row.impuesto_id;
        product.impuesto_nombre = row.impuesto_nombre;
        product.impuesto_porcentaje = row.impuesto_porcentaje;
      }
      map.set(row.producto_id, product);
    }

    if (row.inventario_id != null) map.get(row.producto_id).inventario.push({
      inventario_id: row.inventario_id,
      version: inventoryVersion(row),
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
