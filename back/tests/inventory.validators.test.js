const test = require("node:test");
const assert = require("node:assert/strict");
const { buildCreateProductPayload, buildUpdateProductPayload } = require("../modules/inventory/inventory.validators");

const product = {
  nombre: "Producto demo", descripcion: "", categoria_id: "2",
  precio_compra: "0", precio_venta: "5", stock_minimo: "0",
};
const createBody = {
  ...product, producto_nombre: product.nombre, producto_descripcion: "",
  cantidad: "4", numero_lote: " L-01 ", fecha_caducidad: "",
};

test("creacion normaliza cantidades y utiliza el tenant autenticado", () => {
  const result = buildCreateProductPayload({ ...createBody, tenant_id: 999 }, 7);
  assert.equal(result.error, undefined);
  assert.equal(result.product.tenant_id, 7);
  assert.equal(result.inventory.tenant_id, 7);
  assert.equal(result.inventory.cantidad, 4);
  assert.equal(result.inventory.numero_lote, "L-01");
  assert.equal(result.inventory.fecha_caducidad, null);
});

test("crear producto exige stock inicial positivo", () => {
  assert.ok(buildCreateProductPayload({ ...createBody, cantidad: 0 }, 7).error);
});

test("editar permite agotar un lote y conservar valores cero", () => {
  const result = buildUpdateProductPayload({ ...product,
    inventario: [{ inventario_id: 3, version: "a".repeat(64), cantidad: "0" }],
  });
  assert.equal(result.error, undefined);
  assert.equal(result.product.inventario[0].cantidad, 0);
  assert.equal(result.product.precio_compra, 0);
  assert.equal(result.product.stock_minimo, 0);
});

test("editar rechaza cantidades invalidas de cualquier lote", () => {
  for (const cantidad of [-1, 1.5, "texto", "", null, undefined]) {
    const result = buildUpdateProductPayload({ ...product, inventario: [
      { inventario_id: 3, version: "a".repeat(64), cantidad: 2 }, { inventario_id: 4, version: "a".repeat(64), cantidad },
    ] });
    assert.ok(result.error, `Debe rechazar ${String(cantidad)}`);
    assert.equal(result.product, undefined);
  }
});

test("editar permite un producto sin lotes pero exige el array de inventario", () => {
  assert.deepEqual(buildUpdateProductPayload({ ...product, inventario: [] }).product.inventario, []);
  assert.ok(buildUpdateProductPayload(product).error);
});
