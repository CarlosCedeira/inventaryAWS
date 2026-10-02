type Input = Record<string, unknown>;
export interface SaleLineInput { productId: number; quantity: number; }
export interface SaleInput { clientId: number | null; reference: string | null; currency: string; notes: string | null; lines: SaleLineInput[]; }

function optionalText(value: unknown, limit: number) {
  const text = value === undefined || value === null ? "" : String(value).trim();
  return text ? text.slice(0, limit) : null;
}

function buildSalePayload(body: Input): { sale: SaleInput; error?: never } | { error: string } {
  const clientId = body.cliente_id === undefined || body.cliente_id === null || body.cliente_id === "" ? null : Number(body.cliente_id);
  if (clientId !== null && (!Number.isSafeInteger(clientId) || clientId <= 0)) return { error: "El cliente no es valido" };
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
export { buildSalePayload };
