import type { ApiResponse, AuthenticatedRequest } from "../../types/http";
import { buildSaleCancellationPayload, buildSaleExportFilters, buildSaleListFilters, buildSalePayload, buildSaleReturnPayload } from "./sales.validators";
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
function csvCell(value: unknown) { const text = value === null || value === undefined ? "" : String(value); return `"${text.replace(/"/g, '""')}"`; }
async function exportSales(req: AuthenticatedRequest, res: ApiResponse) {
  const validation = buildSaleExportFilters((req as AuthenticatedRequest & { query: Record<string, unknown> }).query || {});
  if (validation.error !== undefined) return res.status(400).json({ error: validation.error });
  try {
    const rows = await service.exportSales(req.tenantId, validation.dateFrom, validation.dateTo);
    const headers = ["Fecha", "Referencia", "Estado", "Cliente", "NIF/CIF", "Email", "Producto", "Cantidad", "Precio sin IVA", "IVA %", "Base imponible", "Cuota IVA", "Total línea", "Base neta", "IVA neto", "Total neto", "Moneda", "Observaciones"];
    const body = [headers, ...rows.map((row) => [row.fecha, row.referencia, row.estado, row.cliente_nombre, row.cliente_identificacion_fiscal, row.cliente_email, row.producto, row.cantidad, row.precio_unitario, row.impuesto_porcentaje, Number(row.importe_total) - Number(row.impuesto_total), row.impuesto_total, row.importe_total, row.base_neta, row.iva_neto, row.total_neto, row.moneda, row.observaciones])].map((line) => line.map(csvCell).join(";")).join("\r\n");
    const download = res as ApiResponse & { set: (field: string, value: string) => unknown; send: (body: string) => unknown };
    download.set("Content-Type", "text/csv; charset=utf-8"); download.set("Content-Disposition", `attachment; filename="ventas_${validation.dateFrom}_${validation.dateTo}.csv"`); download.send(`\uFEFF${body}`);
  } catch (error) { logUnexpectedError(req, "sales_export_failed", error); res.status(500).json({ error: "No se pudieron exportar las ventas" }); }
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
async function cancelSale(req: AuthenticatedRequest, res: ApiResponse) {
  const saleId = Number(req.params.id);
  if (!Number.isSafeInteger(saleId) || saleId <= 0) return res.status(400).json({ error: "El identificador de venta no es valido" });
  const validation = buildSaleCancellationPayload(req.body);
  if (validation.error !== undefined) return res.status(400).json({ error: validation.error });
  try {
    const sale = await service.cancelSale(req.tenantId, req.user.id, saleId, validation.reason);
    log("info", "sale_cancelled", { requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, saleId });
    res.json(sale);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) return res.status((error as Error & { statusCode: number }).statusCode).json({ error: error.message });
    logUnexpectedError(req, "sale_cancel_failed", error); res.status(500).json({ error: "Error interno del servidor" });
  }
}
async function returnSale(req: AuthenticatedRequest, res: ApiResponse) {
  const saleId = Number(req.params.id);
  if (!Number.isSafeInteger(saleId) || saleId <= 0) return res.status(400).json({ error: "El identificador de venta no es valido" });
  const validation = buildSaleReturnPayload(req.body);
  if (validation.error !== undefined) return res.status(400).json({ error: validation.error });
  try {
    const result = await service.returnSale(req.tenantId, req.user.id, saleId, validation.saleReturn);
    log("info", "sale_returned", { requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, saleId, returnId: result.id });
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) return res.status((error as Error & { statusCode: number }).statusCode).json({ error: error.message });
    logUnexpectedError(req, "sale_return_failed", error); res.status(500).json({ error: "Error interno del servidor" });
  }
}
async function completeSale(req: AuthenticatedRequest, res: ApiResponse) {
  const saleId = Number(req.params.id);
  if (!Number.isSafeInteger(saleId) || saleId <= 0) return res.status(400).json({ error: "El identificador de venta no es valido" });
  try {
    const sale = await service.completeSale(req.tenantId, saleId);
    log("info", "sale_completed", { requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, saleId });
    res.json(sale);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) return res.status((error as Error & { statusCode: number }).statusCode).json({ error: error.message });
    logUnexpectedError(req, "sale_complete_failed", error); res.status(500).json({ error: "Error interno del servidor" });
  }
}
export { cancelSale, completeSale, createSale, exportSales, getSaleDetail, getSaleFilterOptions, getSaleSummary, getSales, returnSale };
