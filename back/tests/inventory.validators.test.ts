import test from "node:test";
import assert from "node:assert/strict";
const { buildCreateProductPayload, buildUpdateProductPayload } = require("../modules/inventory/inventory.validators");

const product = {
  nombre: "Producto demo", descripcion: "Producto de demostración", categoria_id: "2",
  impuesto_id: "1",
  precio_compra: "0", precio_venta: "5", stock_minimo: "0",
};
const createBody = {
  ...product, producto_nombre: product.nombre, producto_descripcion: product.descripcion,
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

test("crear producto exige seleccionar un IVA", () => {
  const result = buildCreateProductPayload({ ...createBody, impuesto_id: "" }, 7);
  assert.equal(result.error, "Debes seleccionar un IVA");
});

test("editar permite valores cero en los datos maestros", () => {
  const result = buildUpdateProductPayload(product);
  assert.equal(result.error, undefined);
  assert.equal(result.product.precio_compra, 0);
  assert.equal(result.product.stock_minimo, 0);
});

test("editar rechaza lotes: se gestionan mediante movimientos", () => {
  const result = buildUpdateProductPayload({ ...product, inventario: [] });
  assert.equal(result.error, "Los lotes se gestionan desde Movimientos");
});
