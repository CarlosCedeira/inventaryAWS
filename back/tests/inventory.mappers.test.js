const test = require("node:test");
const assert = require("node:assert/strict");
const { groupProductWithInventory } = require("../modules/inventory/inventory.mappers");

const row = {
  producto_id: 8, producto_nombre: "Producto demo", producto_descripcion: "Descripcion",
  producto_categoria: "General", categoria_id: 2, precio_compra: "2.50",
  precio_venta: "4.00", stock_minimo: 3, inventario_id: null,
  cantidad: null, fecha_caducidad: null, numero_lote: null,
};

test("producto sin lotes conserva su ficha sin generar un lote ficticio", () => {
  assert.deepEqual(groupProductWithInventory([row]), {
    producto_id: 8, nombre: "Producto demo", descripcion: "Descripcion",
    categoria_nombre: "General", categoria_id: 2, precio_compra: "2.50",
    precio_venta: "4.00", stock_minimo: 3, inventario: [],
  });
});

test("conserva los lotes agotados para consultar y editar el producto", () => {
  const result = groupProductWithInventory([{ ...row, inventario_id: 10,
    cantidad: 0, numero_lote: "AGOTADO" }]);
  assert.match(result.inventario[0].version, /^[a-f0-9]{64}$/);
  assert.deepEqual(result.inventario, [{ inventario_id: 10, version: result.inventario[0].version, cantidad: 0,
    fecha_caducidad: null, numero_lote: "AGOTADO" }]);
});

test("agrupa varios lotes sin perder cantidades ni fechas", () => {
  const result = groupProductWithInventory([
    { ...row, inventario_id: 10, cantidad: 0 },
    { ...row, inventario_id: 11, cantidad: 5, fecha_caducidad: "2027-01-01" },
  ]);
  assert.equal(result.producto_id, 8);
  assert.equal(result.inventario.length, 2);
  assert.equal(result.inventario[1].cantidad, 5);
  assert.equal(result.inventario[1].fecha_caducidad, "2027-01-01");
});

test("producto inexistente no genera una ficha vacia", () => {
  assert.equal(groupProductWithInventory([]), undefined);
});
