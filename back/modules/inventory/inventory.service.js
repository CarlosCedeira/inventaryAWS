const { groupProductWithInventory } = require("./inventory.mappers");
const inventoryModel = require("./inventory.model");

async function listProducts(tenantId) {
  return await inventoryModel.getAllProducts(tenantId);
}

async function listCategories(tenantId) {
  return await inventoryModel.getAllCategories(tenantId);
}

async function searchProducts(tenantId, name) {
  return await inventoryModel.searchProductsByName(tenantId, name);
}

async function getProduct(tenantId, id) {
  const rows = await inventoryModel.getProductById(tenantId, id);

  return groupProductWithInventory(rows);
}



async function updateProductData(tenantId, productId, productoData) {
const { inventario } = productoData;
  return await inventoryModel.updateProduct(tenantId, productId, productoData, inventario);
}

async function createNewProduct(productoData, inventarioData) {
  return await inventoryModel.createProduct(productoData, inventarioData);
}

module.exports = {
  listProducts,
  listCategories,
  searchProducts,
  getProduct,
  updateProductData,
  createNewProduct,
};
