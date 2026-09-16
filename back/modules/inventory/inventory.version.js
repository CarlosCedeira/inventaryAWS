const { createHash } = require("node:crypto");

// An opaque snapshot token, compared while the lot is locked for editing.
function inventoryVersion(item) {
  const date = item.fecha_caducidad;
  const normalizedDate = date instanceof Date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : date ? String(date).slice(0, 10) : null;
  return createHash("sha256").update(JSON.stringify([
    Number(item.cantidad), normalizedDate, item.numero_lote || null,
  ])).digest("hex");
}

module.exports = { inventoryVersion };
