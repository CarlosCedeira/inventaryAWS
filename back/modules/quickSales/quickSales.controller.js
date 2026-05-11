const quickSalesService = require("./quickSales.service");
const { parseStockQuantity } = require("../../utils/stockQuantity");

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

    res.json({
      message: "Venta registrada correctamente",
      ...result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = {
  registerQuickSale,
};
