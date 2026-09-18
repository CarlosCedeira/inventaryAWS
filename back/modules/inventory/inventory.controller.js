const inventoryService = require("./inventory.service");
const {
  buildCreateCategoryPayload,
  buildCreateProductPayload,
  buildUpdateProductPayload,
} = require("./inventory.validators");
const { log, logUnexpectedError } = require("../../utils/logger");

async function getProducts(req, res) {
  try {
    const products = await inventoryService.listProducts(req.tenantId);
    res.json(products);
  } catch (error) {
    logUnexpectedError(req, "inventory_list_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await inventoryService.listCategories(req.tenantId);
    res.json(categories);
  } catch (error) {
    logUnexpectedError(req, "category_list_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function createCategory(req, res) {
  try {
    const validation = buildCreateCategoryPayload(req.body);

    if (validation.error) {
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
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    logUnexpectedError(req, "category_create_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function searchProducts(req, res) {
  try {
    const products = await inventoryService.searchProducts(req.tenantId, req.params.name);
    res.json(products);
  } catch (error) {
    logUnexpectedError(req, "inventory_search_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getProductsByCategory(req, res) {
  try {
    const categoryId = Number(req.params.categoryId);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ error: "Categoria invalida" });
    }

    const products = await inventoryService.listProductsByCategory(req.tenantId, categoryId);
    res.json(products);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    logUnexpectedError(req, "inventory_category_filter_failed", error, { categoryId });
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getProductById(req, res) {
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



async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const validation = buildUpdateProductPayload(req.body);

    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const categoryExists = await inventoryService.categoryBelongsToTenant(
      req.tenantId,
      validation.product.categoria_id
    );

    if (!categoryExists) {
      return res.status(400).json({ error: "La categoria seleccionada no es valida" });
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
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    logUnexpectedError(req, "product_update_failed", error, { productId: id });
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function createProduct(req, res) {
  try {
    const validation = buildCreateProductPayload(req.body, req.tenantId);

    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const categoryExists = await inventoryService.categoryBelongsToTenant(
      req.tenantId,
      validation.product.categoria_id
    );

    if (!categoryExists) {
      return res.status(400).json({ error: "La categoria seleccionada no es valida" });
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

async function deleteProduct(req, res) {
  try {
    const productId = Number(req.params.id);
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
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    logUnexpectedError(req, "product_delete_failed", error, { productId });
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = {
  getProducts,
  getCategories,
  createCategory,
  searchProducts,
  getProductsByCategory,
  getProductById,
  updateProduct,
  createProduct,
  deleteProduct,
};
