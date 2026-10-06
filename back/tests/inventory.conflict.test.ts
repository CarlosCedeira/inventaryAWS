import test from "node:test";
import assert from "node:assert/strict";
const db = require("../db");
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

test("editar datos maestros no consulta ni modifica lotes", async () => {
  const events: string[] = [];
  connection = {
    beginTransaction: async () => events.push("begin"),
    rollback: async () => events.push("rollback"),
    commit: async () => events.push("commit"),
    release: () => events.push("release"),
    execute: async (sql) => {
      if (sql.includes("UPDATE productos")) return [{ affectedRows: 1 }];
      assert.fail("No debe consultar ni escribir inventario al editar datos maestros");
    },
  };
  await updateProduct(1, 1, {});
  assert.deepEqual(events, ["begin", "commit", "release"]);
});
