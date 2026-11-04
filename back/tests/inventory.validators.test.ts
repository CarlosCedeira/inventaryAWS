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
};

test("creacion utiliza el tenant autenticado y no crea inventario", () => {
  const result = buildCreateProductPayload({ ...createBody, tenant_id: 999 }, 7);
  assert.equal(result.error, undefined);
  assert.equal(result.product.tenant_id, 7);
});

test("crear producto rechaza lote y cantidad inicial", () => {
  for (const body of [
    { ...createBody, cantidad: 4 },
    { ...createBody, numero_lote: "L-01" },
    { ...createBody, fecha_caducidad: "2030-01-01" },
  ]) {
    assert.equal(
      buildCreateProductPayload(body, 7).error,
      "El stock inicial se registra mediante un movimiento"
    );
  }
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
