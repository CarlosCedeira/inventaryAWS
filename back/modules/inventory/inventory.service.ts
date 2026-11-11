import { groupProductWithInventory } from "./inventory.mappers";
import * as inventoryModel from "./inventory.model";
import type { CategoryFields, ProductFields, ProductId } from "./inventory.types";

async function listProducts(tenantId: number) {
  return await inventoryModel.getAllProducts(tenantId);
}

async function listCategories(tenantId: number) {
  return await inventoryModel.getAllCategories(tenantId);
}

async function listTaxes() {
  return await inventoryModel.getAllTaxes();
}

async function listProductsWithoutRecentSales(tenantId: number) {
  return await inventoryModel.getProductsWithoutRecentSales(tenantId);
}

async function taxIsActive(taxId: number) {
  return await inventoryModel.taxExists(taxId);
}

async function createCategoryForTenant(tenantId: number, categoryData: CategoryFields) {
  return await inventoryModel.createCategory(tenantId, categoryData);
}

async function categoryBelongsToTenant(tenantId: number, categoryId: number) {
  return await inventoryModel.categoryExistsForTenant(tenantId, categoryId);
}

async function searchProducts(tenantId: number, name: string) {
  return await inventoryModel.searchProductsByName(tenantId, name);
}

async function listProductsByCategory(tenantId: number, categoryId: number) {
  return await inventoryModel.getProductsByCategory(tenantId, categoryId);
}

async function getProduct(tenantId: number, id: ProductId) {
  const rows = await inventoryModel.getProductById(tenantId, id);

  return groupProductWithInventory(rows);
}



async function updateProductData(tenantId: number, productId: ProductId, productoData: ProductFields) {
  return await inventoryModel.updateProduct(tenantId, productId, productoData);
}

async function createNewProduct(productoData: ProductFields & { tenant_id: number }) {
  return await inventoryModel.createProduct(productoData);
}

async function removeProduct(tenantId: number, productId: ProductId) {
  return await inventoryModel.softDeleteProduct(tenantId, productId);
}

export {
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
