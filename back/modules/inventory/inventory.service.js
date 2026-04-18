const { groupProductWithInventory } = require("./inventory.mappers");
const inventoryModel = require("./inventory.model");

async function listProducts() {
  return await inventoryModel.getAllProducts();
}

async function listCategories() {
  return await inventoryModel.getAllCategories();
}

async function searchProducts(name) {
  return await inventoryModel.searchProductsByName(name);
}

async function getProduct(id) {
  const rows = await inventoryModel.getProductById(id);

  return groupProductWithInventory(rows);
}

async function toggleProductFlag(id, flag) {
  const allowedFlags = ["publicado", "destacado", "recomendado"];
  if (!allowedFlags.includes(flag)) throw new Error("Flag no permitido");
  return await inventoryModel.toggleFlag(id, flag);
}

async function updateProductData(productId, productoData) {
const { inventario } = productoData;
  return await inventoryModel.updateProduct(productId, productoData, inventario);
}

async function createNewProduct(productoData, inventarioData) {
  return await inventoryModel.createProduct(productoData, inventarioData);
}

module.exports = {
  listProducts,
  listCategories,
  searchProducts,
  getProduct,
  toggleProductFlag,
  updateProductData,
  createNewProduct,
};