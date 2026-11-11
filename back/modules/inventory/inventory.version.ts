import { createHash } from "node:crypto";

interface VersionedInventoryItem {
  cantidad: number | null;
  fecha_caducidad: Date | string | null;
  numero_lote: string | null;
}

// An opaque snapshot token, compared while the lot is locked for editing.
function inventoryVersion(item: VersionedInventoryItem) {
  const date = item.fecha_caducidad;
  const normalizedDate = date instanceof Date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : date ? String(date).slice(0, 10) : null;
  return createHash("sha256").update(JSON.stringify([
    Number(item.cantidad), normalizedDate, item.numero_lote || null,
  ])).digest("hex");
}

export { inventoryVersion };
