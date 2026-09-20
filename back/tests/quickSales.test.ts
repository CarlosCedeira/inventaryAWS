import test from "node:test";
import assert from "node:assert/strict";
const db = require("../db");

// Substitute only the connection boundary; execute the real transaction logic.
type SqlParams = unknown[];
type Event = string | { update: SqlParams } | { movement: SqlParams };
type Lot = { id: number; cantidad: number; fecha_caducidad?: string | null };
let connection: {
  beginTransaction: () => Promise<number>;
  commit: () => Promise<number>;
  rollback: () => Promise<number>;
  release: () => number;
  execute: (sql: string, params: SqlParams) => Promise<unknown[]>;
};
const originalGetConnection = db.getConnection;
db.getConnection = async () => connection;
const { registerQuickSale } = require("../modules/quickSales/quickSales.model");
db.getConnection = originalGetConnection;

function setup({ physical = 20, lots = [], failInsert = false }: {
  physical?: number; lots?: Lot[]; failInsert?: boolean;
} = {}) {
  const events: Event[] = [];
  connection = {
    beginTransaction: async () => events.push("begin"),
    commit: async () => events.push("commit"),
    rollback: async () => events.push("rollback"),
    release: () => events.push("release"),
    execute: async (sql, params) => {
      assert.equal(params.includes(7), true, "tenant included in every query");
      if (sql.includes("FROM productos")) return [[{ id: 1 }]];
      if (sql.includes("SUM(cantidad)")) return [[{ stock_total: physical }]];
      if (sql.includes("FROM inventario")) {
        assert.match(sql, /fecha_caducidad IS NULL OR fecha_caducidad >= CURDATE\(\)/);
        assert.match(sql, /FOR UPDATE/);
        return [lots.map((lot) => ({ ...lot }))];
      }
      if (sql.includes("UPDATE inventario")) {
        events.push({ update: params });
        return [{ affectedRows: 1 }];
      }
      if (sql.includes("INSERT INTO movimientos")) {
        if (failInsert) throw new Error("Simulated insert failure");
        events.push({ movement: params });
        return [{ insertId: 10 }];
      }
      throw new Error("Unexpected query");
    },
  };
  return events;
}

const sell = (quantity: number) => registerQuickSale({ tenantId: 7, userId: 2, productId: 1, quantity });

test("20 fisicas, 15 caducadas y 5 disponibles: rechaza venta de 10 sin escribir", async () => {
  const events = setup({ lots: [{ id: 3, cantidad: 5, fecha_caducidad: null }] });
  await assert.rejects(sell(10), { statusCode: 409 });
  assert.deepEqual(events, ["begin", "rollback", "release"]);
});

test("venta con stock mixto conserva caducados y registra saldos fisicos", async () => {
  const events = setup({ lots: [{ id: 3, cantidad: 5, fecha_caducidad: null }] });
  const result = await sell(4);
  assert.equal(result.stock_fisico, 16);
  assert.equal(result.stock_disponible, 1);
  assert.equal(result.stock_caducado, 15);
  assert.equal(result.movimientos[0].stock_anterior, 20);
  assert.equal(result.movimientos[0].stock_nuevo, 16);
  assert.deepEqual(events.find((e): e is { update: SqlParams } => typeof e !== "string" && "update" in e)?.update, [1, 7, 3]);
  assert.deepEqual(events.slice(-2), ["commit", "release"]);
});

test("solo stock caducado: rechaza cualquier venta", async () => {
  const events = setup();
  await assert.rejects(sell(1), { statusCode: 409 });
  assert.deepEqual(events, ["begin", "rollback", "release"]);
});

test("consume lotes por orden y actualiza la proxima caducidad", async () => {
  setup({ physical: 8, lots: [
    { id: 3, cantidad: 3, fecha_caducidad: "2027-01-01" },
    { id: 4, cantidad: 3, fecha_caducidad: "2027-02-01" },
    { id: 5, cantidad: 2, fecha_caducidad: null },
  ] });
  const result = await sell(4);
  assert.deepEqual(result.movimientos.map((m: { inventario_id: number }) => m.inventario_id), [3, 4]);
  assert.equal(result.fecha_caducidad, "2027-02-01");
  assert.equal(result.stock_disponible, 4);
  assert.equal(result.stock_caducado, 0);
});

test("fallo al registrar movimiento solicita rollback y libera conexion", async () => {
  const events = setup({ lots: [{ id: 3, cantidad: 5 }], failInsert: true });
  await assert.rejects(sell(1), /Simulated insert failure/);
  assert.equal(events.includes("commit"), false);
  assert.deepEqual(events.slice(-2), ["rollback", "release"]);
});
