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

async function searchProducts(req, res) {
  try {
    const products = await inventoryService.searchProducts(req.tenantId, req.params.name);
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
    const productoData = { ...req.body, tenant_id: req.tenantId };
    const inventarioData = { ...req.body, tenant_id: req.tenantId };
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
  updateProduct,
  createProduct,
};
