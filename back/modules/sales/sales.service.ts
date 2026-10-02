import type { SaleInput } from "./sales.validators";
const model = require("./sales.model") as typeof import("./sales.model");
async function confirmSale(tenantId: number, userId: number, sale: SaleInput) { return model.confirmSale(tenantId, userId, sale); }
async function listSales(tenantId: number) { return model.listSales(tenantId); }
async function getSaleDetail(tenantId: number, saleId: number) { return model.getSaleDetail(tenantId, saleId); }
export { confirmSale, getSaleDetail, listSales };
