import type { AuthenticatedRequest, ApiResponse } from "../../types/http";
import { isHttpError } from "../../types/http";
import type * as InventoryModel from "./inventory.model";
import type { ProductFields, InventoryUpdate } from "./inventory.types";

const inventoryService = require("./inventory.service") as {
  listProducts: typeof InventoryModel.getAllProducts;
  listCategories: typeof InventoryModel.getAllCategories;
  listTaxes: typeof InventoryModel.getAllTaxes;
  listProductsWithoutRecentSales: typeof InventoryModel.getProductsWithoutRecentSales;
  createCategoryForTenant: typeof InventoryModel.createCategory;
  categoryBelongsToTenant: typeof InventoryModel.categoryExistsForTenant;
  taxIsActive: typeof InventoryModel.taxExists;
  searchProducts: typeof InventoryModel.searchProductsByName;
  listProductsByCategory: typeof InventoryModel.getProductsByCategory;
  getProduct: (tenantId: number, id: string) => Promise<unknown>;
  updateProductData: (tenantId: number, id: string, product: ProductFields & { inventario: InventoryUpdate[] }, userId: number) => Promise<void>;
  createNewProduct: typeof InventoryModel.createProduct;
  removeProduct: typeof InventoryModel.softDeleteProduct;
};
const {
  buildCreateCategoryPayload,
  buildCreateProductPayload,
  buildUpdateProductPayload,
} = require("./inventory.validators") as typeof import("./inventory.validators");
const { log, logUnexpectedError } = require("../../utils/logger");

async function getProducts(req: AuthenticatedRequest, res: ApiResponse) {
  try {
    const products = await inventoryService.listProducts(req.tenantId);
    res.json(products);
  } catch (error) {
    logUnexpectedError(req, "inventory_list_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getCategories(req: AuthenticatedRequest, res: ApiResponse) {
  try {
    const categories = await inventoryService.listCategories(req.tenantId);
    res.json(categories);
  } catch (error) {
    logUnexpectedError(req, "category_list_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getTaxes(_req: AuthenticatedRequest, res: ApiResponse) {
  try { res.json(await inventoryService.listTaxes()); }
  catch (error) { logUnexpectedError(_req, "tax_list_failed", error); res.status(500).json({ error: "Error interno del servidor" }); }
}

async function getProductsWithoutRecentSales(req: AuthenticatedRequest, res: ApiResponse) {
  try { res.json(await inventoryService.listProductsWithoutRecentSales(req.tenantId)); }
  catch (error) { logUnexpectedError(req, "inventory_without_sales_failed", error); res.status(500).json({ error: "Error interno del servidor" }); }
}

async function createCategory(req: AuthenticatedRequest, res: ApiResponse) {
  try {
    const validation = buildCreateCategoryPayload(req.body);

    if (validation.error !== undefined) {
      return res.status(400).json({ error: validation.error });
    }

    const category = await inventoryService.createCategoryForTenant(
      req.tenantId,
      validation.category
    );

    log("info", "category_created", {
      requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, categoryId: category.id,
    });
    res.status(201).json(category);
  } catch (error) {
    if (isHttpError(error) && error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    logUnexpectedError(req, "category_create_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function searchProducts(req: AuthenticatedRequest, res: ApiResponse) {
  try {
    const products = await inventoryService.searchProducts(req.tenantId, req.params.name);
    res.json(products);
  } catch (error) {
    logUnexpectedError(req, "inventory_search_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getProductsByCategory(req: AuthenticatedRequest, res: ApiResponse) {
  const categoryId = Number(req.params.categoryId);
  try {
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ error: "Categoria invalida" });
    }

    const products = await inventoryService.listProductsByCategory(req.tenantId, categoryId);
    res.json(products);
  } catch (error) {
    if (isHttpError(error) && error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    logUnexpectedError(req, "inventory_category_filter_failed", error, { categoryId });
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getProductById(req: AuthenticatedRequest, res: ApiResponse) {
  try {
    const product = await inventoryService.getProduct(req.tenantId, req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json(product);
  } catch (error) {
    logUnexpectedError(req, "inventory_detail_failed", error, { productId: req.params.id });
    res.status(500).json({ error: "Error interno del servidor" });
  }
}



async function updateProduct(req: AuthenticatedRequest, res: ApiResponse) {
  const { id } = req.params;
  try {
    const validation = buildUpdateProductPayload(req.body);

    if (validation.error !== undefined) {
      return res.status(400).json({ error: validation.error });
    }

    const categoryExists = await inventoryService.categoryBelongsToTenant(
      req.tenantId,
      validation.product.categoria_id
    );

    if (!categoryExists) {
      return res.status(400).json({ error: "La categoria seleccionada no es valida" });
    }

    if (validation.product.impuesto_id !== null && !await inventoryService.taxIsActive(validation.product.impuesto_id)) {
      return res.status(400).json({ error: "El impuesto seleccionado no es valido" });
    }

    await inventoryService.updateProductData(
      req.tenantId,
      id,
      validation.product,
      req.user.id
    );

    log("info", "product_updated", {
      requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id,
      productId: Number(id), inventoryLots: validation.product.inventario.length,
    });
    res.json({ message: "Producto e inventario actualizados correctamente" });
  } catch (error) {
    if (isHttpError(error) && error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    logUnexpectedError(req, "product_update_failed", error, { productId: id });
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function createProduct(req: AuthenticatedRequest, res: ApiResponse) {
  try {
    const validation = buildCreateProductPayload(req.body, req.tenantId);

    if (validation.error !== undefined) {
      return res.status(400).json({ error: validation.error });
    }

    const categoryExists = await inventoryService.categoryBelongsToTenant(
      req.tenantId,
      validation.product.categoria_id
    );

    if (!categoryExists) {
      return res.status(400).json({ error: "La categoria seleccionada no es valida" });
    }

    if (validation.product.impuesto_id === null || !await inventoryService.taxIsActive(validation.product.impuesto_id)) {
      return res.status(400).json({ error: "El impuesto seleccionado no es valido" });
    }

    const result = await inventoryService.createNewProduct(
      validation.product,
      validation.inventory,
      req.user.id
    );

    log("info", "product_created", {
      requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id,
      productId: result.productoId, inventoryId: result.inventarioId,
    });
    res.status(201).json({ message: "Producto creado correctamente", ...result });
  } catch (error) {
    logUnexpectedError(req, "product_create_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function deleteProduct(req: AuthenticatedRequest, res: ApiResponse) {
  const productId = Number(req.params.id);
  try {
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: "Producto invalido" });
    }

    const affectedRows = await inventoryService.removeProduct(req.tenantId, productId);
    if (!affectedRows) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    log("info", "product_deleted", {
      requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, productId,
    });
    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    if (isHttpError(error) && error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    logUnexpectedError(req, "product_delete_failed", error, { productId });
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export {
  getProducts,
  getCategories,
  getTaxes,
  getProductsWithoutRecentSales,
  createCategory,
  searchProducts,
  getProductsByCategory,
  getProductById,
  updateProduct,
  createProduct,
  deleteProduct,
};
