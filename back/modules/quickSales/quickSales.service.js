const quickSalesModel = require("./quickSales.model");

async function registerQuickSale({ tenantId, userId, productId, quantity }) {
  return quickSalesModel.registerQuickSale({
    tenantId,
    userId,
    productId,
    quantity,
  });
}

module.exports = {
  registerQuickSale,
};
