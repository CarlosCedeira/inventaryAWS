import type { SaleInput, SaleListFilters } from "./sales.validators";
const model = require("./sales.model") as typeof import("./sales.model");
async function confirmSale(tenantId: number, userId: number, sale: SaleInput, scopeUserId: number | null = null) { return model.confirmSale(tenantId, userId, sale, scopeUserId); }
async function listSales(tenantId: number, filters: SaleListFilters, scopeUserId: number | null = null) { return model.listSales(tenantId, filters, scopeUserId); }
async function getFilterOptions(tenantId: number, scopeUserId: number | null = null) { return model.getSaleFilterOptions(tenantId, scopeUserId); }
async function exportSales(tenantId: number, dateFrom: string, dateTo: string) { return model.exportSales(tenantId, dateFrom, dateTo); }
async function getSummary(tenantId: number) { return model.getSaleSummary(tenantId); }
async function getSaleDetail(tenantId: number, saleId: number, scopeUserId: number | null = null) { return model.getSaleDetail(tenantId, saleId, scopeUserId); }
async function cancelSale(tenantId: number, userId: number, saleId: number, reason: string, scopeUserId: number | null = null) { return model.cancelSale(tenantId, userId, saleId, reason, scopeUserId); }
async function returnSale(tenantId: number, userId: number, saleId: number, saleReturn: import("./sales.validators").SaleReturnInput, scopeUserId: number | null = null) { return model.returnSale(tenantId, userId, saleId, saleReturn, scopeUserId); }
async function completeSale(tenantId: number, saleId: number, scopeUserId: number | null = null) { return model.completeSale(tenantId, saleId, scopeUserId); }
export { cancelSale, completeSale, confirmSale, exportSales, getFilterOptions, getSaleDetail, getSummary, listSales, returnSale };
