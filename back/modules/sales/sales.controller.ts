import type { ApiResponse, AuthenticatedRequest } from "../../types/http";
import { buildSaleListFilters, buildSalePayload } from "./sales.validators";
const service = require("./sales.service") as typeof import("./sales.service");
const { log, logUnexpectedError } = require("../../utils/logger");
async function getSales(req: AuthenticatedRequest, res: ApiResponse) {
  const validation = buildSaleListFilters((req as AuthenticatedRequest & { query: Record<string, unknown> }).query || {});
  if (validation.error !== undefined) return res.status(400).json({ error: validation.error });
  try { res.json(await service.listSales(req.tenantId, validation.filters)); }
  catch (error) { logUnexpectedError(req, "sales_list_failed", error); res.status(500).json({ error: "Error interno del servidor" }); }
}
async function getSaleFilterOptions(req: AuthenticatedRequest, res: ApiResponse) {
  try { res.json(await service.getFilterOptions(req.tenantId)); }
  catch (error) { logUnexpectedError(req, "sale_filter_options_failed", error); res.status(500).json({ error: "Error interno del servidor" }); }
}
async function getSaleSummary(req: AuthenticatedRequest, res: ApiResponse) {
  try { res.json(await service.getSummary(req.tenantId)); }
  catch (error) { logUnexpectedError(req, "sale_summary_failed", error); res.status(500).json({ error: "Error interno del servidor" }); }
}
async function getSaleDetail(req: AuthenticatedRequest, res: ApiResponse) {
  const saleId = Number(req.params.id);
  if (!Number.isSafeInteger(saleId) || saleId <= 0) return res.status(400).json({ error: "El identificador de venta no es valido" });
  try { res.json(await service.getSaleDetail(req.tenantId, saleId)); }
  catch (error) {
    if (error instanceof Error && "statusCode" in error) return res.status((error as Error & { statusCode: number }).statusCode).json({ error: error.message });
    logUnexpectedError(req, "sale_detail_failed", error); res.status(500).json({ error: "Error interno del servidor" });
  }
}
async function createSale(req: AuthenticatedRequest, res: ApiResponse) {
  const validation = buildSalePayload(req.body);
  if (validation.error !== undefined) return res.status(400).json({ error: validation.error });
  try {
    const sale = await service.confirmSale(req.tenantId, req.user.id, validation.sale);
    log("info", "sale_confirmed", { requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, saleId: sale.id });
    res.status(201).json(sale);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) return res.status((error as Error & { statusCode: number }).statusCode).json({ error: error.message });
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") return res.status(409).json({ error: "La referencia ya existe para esta empresa" });
    logUnexpectedError(req, "sale_create_failed", error); res.status(500).json({ error: "Error interno del servidor" });
  }
}
export { createSale, getSaleDetail, getSaleFilterOptions, getSaleSummary, getSales };
