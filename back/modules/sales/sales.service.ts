import type { SaleInput, SaleListFilters } from "./sales.validators";
const model = require("./sales.model") as typeof import("./sales.model");
async function confirmSale(tenantId: number, userId: number, sale: SaleInput) { return model.confirmSale(tenantId, userId, sale); }
async function listSales(tenantId: number, filters: SaleListFilters) { return model.listSales(tenantId, filters); }
async function getFilterOptions(tenantId: number) { return model.getSaleFilterOptions(tenantId); }
async function getSummary(tenantId: number) { return model.getSaleSummary(tenantId); }
async function getSaleDetail(tenantId: number, saleId: number) { return model.getSaleDetail(tenantId, saleId); }
async function cancelSale(tenantId: number, userId: number, saleId: number, reason: string) { return model.cancelSale(tenantId, userId, saleId, reason); }
async function returnSale(tenantId: number, userId: number, saleId: number, saleReturn: import("./sales.validators").SaleReturnInput) { return model.returnSale(tenantId, userId, saleId, saleReturn); }
async function completeSale(tenantId: number, saleId: number) { return model.completeSale(tenantId, saleId); }
export { cancelSale, completeSale, confirmSale, getFilterOptions, getSaleDetail, getSummary, listSales, returnSale };
