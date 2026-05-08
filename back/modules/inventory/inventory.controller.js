const inventoryService = require("./inventory.service");

async function getProducts(req, res) {
  console.log("Controlador Listando productos", req.body);
  try {
    const products = await inventoryService.listProducts(req.tenantId);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await inventoryService.listCategories(req.tenantId);
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function createCategory(req, res) {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre de la categoria es obligatorio" });
    }

    const category = await inventoryService.createCategoryForTenant(req.tenantId, {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
    });

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function searchProducts(req, res) {
  try {
    const products = await inventoryService.searchProducts(req.tenantId, req.params.name);
    res.json(products);
  } catch (error) {
    console.error(error);
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
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getProductById(req, res) {
  try {
    const product = await inventoryService.getProduct(req.tenantId, req.params.id);
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}



async function updateProduct(req, res) {
  console.log("Controlador Actualizando productoid:", req.params.id);
  console.log("Controlador Actualizando con data:", req.body);

  try {
    const { id } = req.params;

    const {
      nombre,
      descripcion,
      categoria_id,
      precio_compra,
      precio_venta,
      stock_minimo,
      inventario
    } = req.body;

    const productoData = {
      nombre,
      descripcion,
      categoria_id,
      precio_compra,
      precio_venta,
      stock_minimo,
      inventario
    };

    await inventoryService.updateProductData(
      req.tenantId,
      id,
      productoData,
    );

    res.json({ message: "Producto e inventario actualizados correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function createProduct(req, res) {
  try {
    const {
      producto_nombre,
      producto_descripcion,
      producto_categoria,
      precio_compra,
      precio_venta,
      stock_minimo,
      cantidad,
      fecha_caducidad,
      numero_lote,
    } = req.body;

    const productoData = {
      tenant_id: req.tenantId,
      nombre: producto_nombre,
      descripcion: producto_descripcion,
      categoria_id: producto_categoria || null,
      precio_compra,
      precio_venta,
      stock_minimo,
    };

    const inventarioData = {
      tenant_id: req.tenantId,
      cantidad,
      fecha_caducidad,
      numero_lote,
    };

    const result = await inventoryService.createNewProduct(productoData, inventarioData);
    res.status(201).json({ message: "Producto creado correctamente", ...result });
  } catch (error) {
    console.error(error);
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

    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error(error);
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
