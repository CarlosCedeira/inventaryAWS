import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mysql, { type RowDataPacket } from "mysql2/promise";

test("MySQL real: inventario, concurrencia y aislamiento", {
  skip: !process.env.TEST_DB_HOST && "Configura TEST_DB_HOST, TEST_DB_USER y TEST_DB_PASSWORD",
  timeout: 60_000,
}, async (t) => {
  assert.ok(process.env.TEST_DB_USER, "TEST_DB_USER es obligatorio");
  assert.notEqual(process.env.TEST_DB_PASSWORD, undefined, "TEST_DB_PASSWORD es obligatorio");
  // Never use DATABASE or load the application's .env. Own this random schema only.
  const database = `inventory_test_${randomUUID().replaceAll("-", "")}`;
  const admin = await mysql.createConnection({
    host: process.env.TEST_DB_HOST, user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD, connectTimeout: 5000,
  });
  let closePool: (() => Promise<void>) | undefined;
  let created = false;
  try {
    await admin.query(`CREATE DATABASE \`${database}\``);
    created = true;
    await admin.changeUser({ database });
    const definitions = [
      "tenants (id INT PRIMARY KEY, nombre VARCHAR(150), activo BOOLEAN DEFAULT TRUE)",
      "usuarios (id INT PRIMARY KEY, tenant_id INT, nombre VARCHAR(150), FOREIGN KEY (tenant_id) REFERENCES tenants(id))",
      "categorias (id INT PRIMARY KEY, tenant_id INT, nombre VARCHAR(150), descripcion TEXT, FOREIGN KEY (tenant_id) REFERENCES tenants(id))",
      "productos (id INT PRIMARY KEY AUTO_INCREMENT, tenant_id INT, nombre VARCHAR(200), descripcion TEXT, categoria_id INT, precio_compra DECIMAL(10,2), precio_venta DECIMAL(10,2), stock_minimo INT, eliminado BOOLEAN DEFAULT FALSE, FOREIGN KEY (tenant_id) REFERENCES tenants(id), FOREIGN KEY (categoria_id) REFERENCES categorias(id))",
      "inventario (id INT PRIMARY KEY AUTO_INCREMENT, tenant_id INT, producto_id INT, cantidad INT, fecha_caducidad DATE, numero_lote VARCHAR(100), updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (tenant_id) REFERENCES tenants(id), FOREIGN KEY (producto_id) REFERENCES productos(id))",
      "movimientos_inventario (id INT PRIMARY KEY AUTO_INCREMENT, tenant_id INT, producto_id INT, inventario_id INT, tipo VARCHAR(20), cantidad INT, stock_anterior INT, stock_nuevo INT, numero_lote VARCHAR(100), fecha_caducidad DATE, motivo VARCHAR(255), descripcion TEXT, usuario_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (tenant_id) REFERENCES tenants(id), FOREIGN KEY (producto_id) REFERENCES productos(id), FOREIGN KEY (inventario_id) REFERENCES inventario(id), FOREIGN KEY (usuario_id) REFERENCES usuarios(id))",
    ];
    for (const definition of definitions) await admin.query(`CREATE TABLE ${definition} ENGINE=InnoDB`);
    await admin.query("INSERT INTO tenants VALUES (1, 'Demo', TRUE), (2, 'Other', TRUE)");
    await admin.query("INSERT INTO usuarios VALUES (1, 1, 'Demo'), (2, 2, 'Other')");
    await admin.query("INSERT INTO categorias VALUES (1, 1, 'General', ''), (2, 2, 'Other', '')");
    await admin.query("INSERT INTO productos VALUES (1,1,'Demo','',1,2,4,1,FALSE),(2,2,'Other','',2,2,4,1,FALSE)");
    Object.assign(process.env, { DB_HOST: process.env.TEST_DB_HOST,
      DB_USER: process.env.TEST_DB_USER, DB_PASSWORD: process.env.TEST_DB_PASSWORD, DATABASE: database });
    const db = require("../../db");
    closePool = db.closePool;
    const model = require("../../modules/inventory/inventory.model");
    const { groupProductWithInventory } = require("../../modules/inventory/inventory.mappers");
    const { registerQuickSale } = require("../../modules/quickSales/quickSales.model");
    const { createMovement } = require("../../modules/movements/movements.model");
    const sale = (quantity: number, tenantId = 1) => registerQuickSale({ tenantId, userId: tenantId, productId: 1, quantity });
    async function reset() {
      await admin.query("DELETE FROM movimientos_inventario");
      await admin.query("DELETE FROM inventario");
    }

    await t.test("clasifica caducados, hoy y sin fecha en los tres listados", async () => {
      await admin.query("INSERT INTO inventario (id,tenant_id,producto_id,cantidad,fecha_caducidad) VALUES (1,1,1,15,CURDATE()-INTERVAL 1 DAY),(2,1,1,3,CURDATE()),(3,1,1,2,NULL),(4,1,1,0,CURDATE()-INTERVAL 2 DAY)");
      for (const rows of [await model.getAllProducts(1), await model.searchProductsByName(1, 'Demo'), await model.getProductsByCategory(1, 1)]) {
        assert.equal(Number(rows[0].stock_fisico), 20);
        assert.equal(Number(rows[0].stock_disponible), 5);
        assert.equal(Number(rows[0].stock_caducado), 15);
      }
      await assert.rejects(sale(10), { statusCode: 409 });
      const result = await sale(5);
      assert.equal(result.stock_fisico, 15);
      assert.equal(result.stock_disponible, 0);
      const [rows] = await admin.query<RowDataPacket[]>("SELECT cantidad FROM inventario WHERE id=1");
      assert.equal(rows[0].cantidad, 15);
    });

    await t.test("dos ventas simultaneas: solo una consume las ultimas unidades", async () => {
      await reset();
      await admin.query("INSERT INTO inventario (id,tenant_id,producto_id,cantidad) VALUES (1,1,1,5)");
      const results = await Promise.allSettled([sale(5), sale(5)]);
      assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
      const rejectedSale = results.find((r) => r.status === 'rejected');
      assert.ok(rejectedSale, "Una de las ventas debe rechazarse por falta de stock");
      assert.equal(rejectedSale.reason.statusCode, 409);
      const [rows] = await admin.query<RowDataPacket[]>("SELECT cantidad FROM inventario WHERE id=1");
      assert.equal(rows[0].cantidad, 0);
    });

    await t.test("rollback real revierte descuento si falla el movimiento", async () => {
      await reset();
      await admin.query("INSERT INTO inventario (id,tenant_id,producto_id,cantidad) VALUES (1,1,1,5)");
      await admin.query("CREATE TRIGGER fail_movement BEFORE INSERT ON movimientos_inventario FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Test failure'");
      try { await assert.rejects(sale(2), /Test failure/); }
      finally { await admin.query("DROP TRIGGER fail_movement"); }
      const [rows] = await admin.query<RowDataPacket[]>("SELECT cantidad FROM inventario WHERE id=1");
      const [movements] = await admin.query<RowDataPacket[]>("SELECT * FROM movimientos_inventario");
      assert.equal(rows[0].cantidad, 5);
      assert.equal(movements.length, 0);
    });

    await t.test("tenant ajeno no consulta ni vende ni ajusta el producto", async () => {
      assert.deepEqual(await model.getProductById(2, 1), []);
      await assert.rejects(sale(1, 2), { statusCode: 404 });
      await assert.rejects(createMovement({ tenantId: 2, userId: 2, productId: 1, inventoryId: 1, type: 'ajuste', quantity: 0 }), { statusCode: 404 });
    });

    await t.test("edicion antigua tras venta devuelve 409 sin restaurar stock", async () => {
      const detail = groupProductWithInventory(await model.getProductById(1, 1));
      await sale(1);
      await assert.rejects(model.updateProduct(1, 1, detail, detail.inventario, 1), { statusCode: 409 });
      const [rows] = await admin.query<RowDataPacket[]>("SELECT cantidad FROM inventario WHERE id=1");
      assert.equal(rows[0].cantidad, 4);
    });

    await t.test("ajuste a cero y ficha de producto agotado", async () => {
      await createMovement({ tenantId: 1, userId: 1, productId: 1, inventoryId: 1, type: 'ajuste', quantity: 0 });
      const detail = groupProductWithInventory(await model.getProductById(1, 1));
      assert.equal(detail.inventario[0].cantidad, 0);
    });

    await t.test("errores repetidos devuelven conexiones al pool", { timeout: 10_000 }, async () => {
      for (let index = 0; index < 15; index++) await assert.rejects(sale(1), { statusCode: 409 });
      assert.equal((await model.getAllProducts(1)).length, 1);
    });
  } finally {
    if (closePool) await closePool();
    if (created) await admin.query(`DROP DATABASE \`${database}\``);
    await admin.end();
  }
});
