import type { SaleInput, SaleListFilters } from "./sales.validators";
const model = require("./sales.model") as typeof import("./sales.model");
async function confirmSale(tenantId: number, userId: number, sale: SaleInput) { return model.confirmSale(tenantId, userId, sale); }
async function listSales(tenantId: number, filters: SaleListFilters) { return model.listSales(tenantId, filters); }
async function getFilterOptions(tenantId: number) { return model.getSaleFilterOptions(tenantId); }
async function getSummary(tenantId: number) { return model.getSaleSummary(tenantId); }
async function getSaleDetail(tenantId: number, saleId: number) { return model.getSaleDetail(tenantId, saleId); }
export { confirmSale, getFilterOptions, getSaleDetail, getSummary, listSales };
