type Input = Record<string, unknown>;
export interface SaleLineInput { productId: number; quantity: number; }
export interface SaleInput { clientId: number; reference: string | null; currency: string; notes: string | null; lines: SaleLineInput[]; }
export interface SaleReturnInput { reason: string; lines: Array<{ movementId: number; quantity: number }>; }
export interface SaleListFilters {
  search: string;
  period: "" | "today" | "week" | "month" | "quarter" | "custom";
  dateFrom: string | null;
  dateTo: string | null;
  clientId: number | null;
  productId: number | null;
  categoryId: number | null;
  taxRate: number | null;
  userId: number | null;
  minimumTotal: number | null;
}

function optionalText(value: unknown, limit: number) {
  const text = value === undefined || value === null ? "" : String(value).trim();
  return text ? text.slice(0, limit) : null;
}

function buildSalePayload(body: Input): { sale: SaleInput; error?: never } | { error: string } {
  if (body.cliente_id === undefined || body.cliente_id === null || body.cliente_id === "") return { error: "Debes seleccionar un cliente" };
  const clientId = Number(body.cliente_id);
  if (!Number.isSafeInteger(clientId) || clientId <= 0) return { error: "El cliente no es valido" };
  if (!Array.isArray(body.lineas) || body.lineas.length === 0) return { error: "La venta debe tener al menos una linea" };
  const lines: SaleLineInput[] = [];
  for (const line of body.lineas as Input[]) {
    const productId = Number(line.producto_id);
    const quantity = Number(line.cantidad);
    if (!Number.isSafeInteger(productId) || productId <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0) return { error: "Cada linea debe tener producto y cantidad positiva" };
    lines.push({ productId, quantity });
  }
  const currency = (optionalText(body.moneda, 3) || "EUR").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "La moneda debe tener tres letras" };
  return { sale: { clientId, reference: optionalText(body.referencia, 64), currency, notes: optionalText(body.observaciones, 4000), lines } };
}

function buildSaleCancellationPayload(body: Input): { reason: string; error?: never } | { error: string } {
  const reason = optionalText(body.motivo, 256);
  if (!reason) return { error: "Indica el motivo de la anulación" };
  if (reason.length > 255) return { error: "El motivo de la anulación no puede superar los 255 caracteres" };
  return { reason };
}

function buildSaleReturnPayload(body: Input): { saleReturn: SaleReturnInput; error?: never } | { error: string } {
  const reason = optionalText(body.motivo, 256);
  if (!reason) return { error: "Indica el motivo de la devolución" };
  if (reason.length > 255) return { error: "El motivo de la devolución no puede superar los 255 caracteres" };
  if (!Array.isArray(body.lineas) || body.lineas.length === 0) return { error: "Selecciona al menos un lote para devolver" };
  const lines: SaleReturnInput["lines"] = [];
  const movementIds = new Set<number>();
  for (const line of body.lineas as Input[]) {
    const movementId = Number(line.movimiento_id);
    const quantity = Number(line.cantidad);
    if (!Number.isSafeInteger(movementId) || movementId <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0) {
      return { error: "Cada devolución debe indicar un movimiento y una cantidad positiva" };
    }
    if (movementIds.has(movementId)) return { error: "No se puede repetir el mismo lote en la devolución" };
    movementIds.add(movementId);
    lines.push({ movementId, quantity });
  }
  return { saleReturn: { reason, lines } };
}

function queryText(value: unknown, maxLength = 100) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function optionalId(value: unknown, label: string): { value: number | null; error?: string } {
  if (value === undefined || value === null || value === "") return { value: null };
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) return { value: null, error: `${label} no es válido` };
  return { value: id };
}

function optionalDate(value: unknown, label: string): { value: string | null; error?: string } {
  if (value === undefined || value === null || value === "") return { value: null as string | null };
  const date = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
    return { value: null, error: `${label} no es válida` };
  }
  return { value: date };
}

function buildSaleListFilters(query: Input): { filters: SaleListFilters; error?: never } | { error: string } {
  const period = queryText(query.periodo, 20);
  if (!["", "today", "week", "month", "quarter", "custom"].includes(period)) {
    return { error: "El periodo no es válido" };
  }

  const client = optionalId(query.cliente_id, "El cliente");
  const product = optionalId(query.producto_id, "El producto");
  const category = optionalId(query.categoria_id, "La categoría");
  const user = optionalId(query.usuario_id, "El usuario");
  if (client.error || product.error || category.error || user.error) {
    return { error: client.error || product.error || category.error || user.error || "Filtro no válido" };
  }

  const dateFrom = optionalDate(query.fecha_desde, "La fecha inicial");
  const dateTo = optionalDate(query.fecha_hasta, "La fecha final");
  if (dateFrom.error || dateTo.error) return { error: dateFrom.error || dateTo.error || "Fecha no válida" };
  if (period === "custom" && (!dateFrom.value || !dateTo.value)) {
    return { error: "Indica una fecha inicial y final para el periodo personalizado" };
  }
  if (dateFrom.value && dateTo.value && dateFrom.value > dateTo.value) {
    return { error: "La fecha inicial no puede ser posterior a la final" };
  }

  const taxRate = query.iva === undefined || query.iva === null || query.iva === "" ? null : Number(query.iva);
  if (taxRate !== null && (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100)) return { error: "El IVA no es válido" };
  const minimumTotal = query.importe_minimo === undefined || query.importe_minimo === null || query.importe_minimo === "" ? null : Number(query.importe_minimo);
  if (minimumTotal !== null && (!Number.isFinite(minimumTotal) || minimumTotal < 0)) return { error: "El importe mínimo no es válido" };

  return {
    filters: {
      search: queryText(query.buscar), period: period as SaleListFilters["period"], dateFrom: dateFrom.value, dateTo: dateTo.value,
      clientId: client.value, productId: product.value, categoryId: category.value, taxRate, userId: user.value, minimumTotal,
    },
  };
}

function buildSaleExportFilters(query: Input): { dateFrom: string; dateTo: string; error?: never } | { error: string } {
  const dateFrom = optionalDate(query.fecha_desde, "La fecha inicial");
  const dateTo = optionalDate(query.fecha_hasta, "La fecha final");
  if (dateFrom.error || dateTo.error) return { error: dateFrom.error || dateTo.error || "Fecha no válida" };
  if (!dateFrom.value || !dateTo.value) return { error: "Indica una fecha inicial y final para exportar" };
  if (dateFrom.value > dateTo.value) return { error: "La fecha inicial no puede ser posterior a la final" };
  return { dateFrom: dateFrom.value, dateTo: dateTo.value };
}

export { buildSalePayload, buildSaleCancellationPayload, buildSaleExportFilters, buildSaleListFilters, buildSaleReturnPayload };
