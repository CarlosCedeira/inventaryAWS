import test from "node:test";
import assert from "node:assert/strict";
const { parseStockQuantity, validateStockQuantity } = require("../utils/stockQuantity");

for (const [name, value] of [
  ["ausente", undefined], ["null", null], ["vacia", ""], ["espacios", "  "],
  ["texto", "abc"], ["negativo", -1], ["cero", 0], ["decimal", 1.5],
  ["decimal en texto", "2.5"], ["infinito", Infinity], ["NaN", NaN],
  ["exceso del limite", 1000000],
]) {
  test(`rechaza cantidad ${name} con error HTTP 400`, () => {
    assert.equal(typeof validateStockQuantity(value), "string");
    assert.throws(() => parseStockQuantity(value), (error) => {
      assert.ok(error instanceof Error);
      assert.ok("statusCode" in error);
      assert.equal(error.statusCode, 400);
      assert.ok(error.message.length > 0);
      return true;
    });
  });
}

test("acepta enteros positivos y convierte cantidades de formularios", () => {
  for (const value of [1, "1", " 25 ", 999999]) {
    assert.equal(validateStockQuantity(value), null);
    assert.equal(parseStockQuantity(value), Number(value));
  }
});

test("respeta el limite configurable e incluye el nombre del campo", () => {
  assert.equal(parseStockQuantity("10", { max: 10 }), 10);
  assert.throws(() => parseStockQuantity(11, { max: 10, label: "Unidades" }),
    /Unidades no puede superar 10/);
});
