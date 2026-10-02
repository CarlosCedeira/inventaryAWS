import test from "node:test";
import assert from "node:assert/strict";
import type { AuthenticatedRequest, ApiResponse } from "../types/http";

const service = require("../modules/inventory/inventory.service") as Record<string, (...args: unknown[]) => Promise<unknown>>;
const controller = require("../modules/inventory/inventory.controller") as typeof import("../modules/inventory/inventory.controller");

for (const [handler, method] of [
  [controller.getProductsByCategory, "listProductsByCategory"],
  [controller.updateProduct, "updateProductData"],
  [controller.deleteProduct, "removeProduct"],
] as const) {
  test(`${method}: un error inesperado devuelve 500 sin fallar al registrar el contexto`, async () => {
    const original = service[method];
    const originalCategoryCheck = service.categoryBelongsToTenant;
    service[method] = async () => { throw new Error("Forced controller failure"); };
    service.categoryBelongsToTenant = async () => true;
    try {
      const req: AuthenticatedRequest = {
        headers: {}, originalUrl: "/productos", tenantId: 1, user: { id: 1, tenant_id: 1, rol: "admin" },
        params: { id: "1", categoryId: "2" },
        body: { nombre: "Producto", descripcion: "", categoria_id: 2, precio_compra: 1, precio_venta: 2, stock_minimo: 0, inventario: [] },
      };
      let status = 200;
      let body: unknown;
      const res: ApiResponse = {
        status(code) { status = code; return this; },
        json(value) { body = value; return this; },
      };
      await handler(req, res);
      assert.equal(status, 500);
      assert.deepEqual(body, { error: "Error interno del servidor" });
    } finally {
      service[method] = original;
      service.categoryBelongsToTenant = originalCategoryCheck;
    }
  });
}
