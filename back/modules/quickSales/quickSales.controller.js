const quickSalesService = require("./quickSales.service");
const { parseStockQuantity } = require("../../utils/stockQuantity");
const { log, logUnexpectedError } = require("../../utils/logger");

async function registerQuickSale(req, res) {
  try {
    const productId = parseStockQuantity(req.params.productId, {
      label: "Producto",
    });
    const quantity = parseStockQuantity(req.body.cantidad);

    const result = await quickSalesService.registerQuickSale({
      tenantId: req.tenantId,
      userId: req.user.id,
      productId,
      quantity,
    });

    log("info", "quick_sale_registered", {
      requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id,
      productId, quantity, stockBefore: result.stock_anterior, stockAfter: result.stock_nuevo,
    });
    res.json({
      message: "Venta registrada correctamente",
      ...result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    logUnexpectedError(req, "quick_sale_failed", error, { productId: req.params.productId });
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = {
  registerQuickSale,
};
