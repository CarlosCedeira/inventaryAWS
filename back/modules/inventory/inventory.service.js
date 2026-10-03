const { groupProductWithInventory } = require("./inventory.mappers");
const inventoryModel = require("./inventory.model");

async function listProducts(tenantId) {
  return await inventoryModel.getAllProducts(tenantId);
}

async function listCategories(tenantId) {
  return await inventoryModel.getAllCategories(tenantId);
}

async function listTaxes() {
  return await inventoryModel.getAllTaxes();
}

async function listProductsWithoutRecentSales(tenantId) {
  return await inventoryModel.getProductsWithoutRecentSales(tenantId);
}

async function taxIsActive(taxId) {
  return await inventoryModel.taxExists(taxId);
}

async function createCategoryForTenant(tenantId, categoryData) {
  return await inventoryModel.createCategory(tenantId, categoryData);
}

async function categoryBelongsToTenant(tenantId, categoryId) {
  return await inventoryModel.categoryExistsForTenant(tenantId, categoryId);
}

async function searchProducts(tenantId, name) {
  return await inventoryModel.searchProductsByName(tenantId, name);
}

async function listProductsByCategory(tenantId, categoryId) {
  return await inventoryModel.getProductsByCategory(tenantId, categoryId);
}

async function getProduct(tenantId, id) {
  const rows = await inventoryModel.getProductById(tenantId, id);

  return groupProductWithInventory(rows);
}



async function updateProductData(tenantId, productId, productoData, userId) {
  const { inventario } = productoData;
  return await inventoryModel.updateProduct(
    tenantId,
    productId,
    productoData,
    inventario,
    userId
  );
}

async function createNewProduct(productoData, inventarioData, userId) {
  return await inventoryModel.createProduct(productoData, inventarioData, userId);
}

async function removeProduct(tenantId, productId) {
  return await inventoryModel.softDeleteProduct(tenantId, productId);
}

module.exports = {
  listProducts,
  listCategories,
  listTaxes,
  listProductsWithoutRecentSales,
  taxIsActive,
  createCategoryForTenant,
  categoryBelongsToTenant,
  searchProducts,
  listProductsByCategory,
  getProduct,
  updateProductData,
  createNewProduct,
  removeProduct,
};
