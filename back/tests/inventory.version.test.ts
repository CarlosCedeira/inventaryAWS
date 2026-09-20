import test from "node:test";
import assert from "node:assert/strict";
const { inventoryVersion } = require("../modules/inventory/inventory.version");
const { parseStockQuantity } = require("../utils/stockQuantity");

test("version cambia al modificar cantidad, fecha o lote", () => {
  const lot = { cantidad: 10, fecha_caducidad: "2027-01-01", numero_lote: "A" };
  for (const change of [{ cantidad: 8 }, { fecha_caducidad: null }, { numero_lote: "B" }]) {
    assert.notEqual(inventoryVersion(lot), inventoryVersion({ ...lot, ...change }));
  }
});
test("version normaliza cantidades y fechas recibidas de MySQL", () => {
  assert.equal(inventoryVersion({ cantidad: "10", fecha_caducidad: new Date(2027, 0, 1) }),
    inventoryVersion({ cantidad: 10, fecha_caducidad: "2027-01-01" }));
});
test("ajustes aceptan cero, entradas y salidas siguen rechazandolo", () => {
  assert.equal(parseStockQuantity("0", { allowZero: true }), 0);
  assert.throws(() => parseStockQuantity(0), { statusCode: 400 });
  for (const value of [-1, "", null, 1.5]) {
    assert.throws(() => parseStockQuantity(value, { allowZero: true }), { statusCode: 400 });
  }
});
