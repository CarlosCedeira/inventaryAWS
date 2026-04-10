const inventoryService = require("./inventory.service");

async function getProducts(req, res) {
  try {
    const products = await inventoryService.listProducts();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await inventoryService.listCategories();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function searchProducts(req, res) {
  try {
    const products = await inventoryService.searchProducts(req.params.name);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getProductById(req, res) {
  try {
    const product = await inventoryService.getProduct(req.params.id);
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function toggleFlag(req, res) {
  try {
    const { flag } = req.params;
    const updated = await inventoryService.toggleProductFlag(req.params.id, flag);
    res.json({ message: `Flag ${flag} actualizado correctamente` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { producto_id, ...productoData } = req.body;
    const inventarioData = { ...req.body };
    await inventoryService.updateProductData(id, { id: producto_id, ...productoData }, inventarioData);
    res.json({ message: "Producto e inventario actualizados correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function createProduct(req, res) {
  try {
    const productoData = req.body;
    const inventarioData = req.body;
    const result = await inventoryService.createNewProduct(productoData, inventarioData);
    res.status(201).json({ message: "Producto creado correctamente", ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = {
  getProducts,
  getCategories,
  searchProducts,
  getProductById,
  toggleFlag,
  updateProduct,
  createProduct,
};