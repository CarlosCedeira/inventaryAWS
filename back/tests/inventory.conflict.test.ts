import test from "node:test";
import assert from "node:assert/strict";
const db = require("../db");
const { inventoryVersion } = require("../modules/inventory/inventory.version");
let connection: {
  beginTransaction: () => Promise<number>;
  rollback: () => Promise<number>;
  commit: () => Promise<number>;
  release: () => number;
  execute: (sql: string) => Promise<unknown[]>;
};
const getConnection = db.getConnection;
db.getConnection = async () => connection;
const { updateProduct } = require("../modules/inventory/inventory.model");
db.getConnection = getConnection;

test("edicion desactualizada revierte la transaccion antes de cambiar el lote", async () => {
  const events: string[] = [];
  connection = {
    beginTransaction: async () => events.push("begin"),
    rollback: async () => events.push("rollback"),
    commit: async () => events.push("commit"),
    release: () => events.push("release"),
    execute: async (sql) => {
      if (sql.includes("UPDATE productos")) return [{ affectedRows: 1 }];
      if (sql.includes("SUM(cantidad)")) return [[{ stock_total: 8 }]];
      if (sql.includes("SELECT id, cantidad")) {
        assert.match(sql, /FOR UPDATE/);
        return [[{ id: 1, cantidad: 8, numero_lote: null, fecha_caducidad: null }]];
      }
      assert.fail("No debe escribir inventario ni movimientos ante un conflicto");
    },
  };
  await assert.rejects(updateProduct(1, 1, {}, [{
    inventario_id: 1, cantidad: 10, version: inventoryVersion({ cantidad: 10 }),
  }], 1), { statusCode: 409 });
  assert.deepEqual(events, ["begin", "rollback", "release"]);
});
