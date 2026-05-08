const express = require("express");
const router = express.Router();
const inventoryController = require("./inventory.controller");
const { requireAuth } = require("../auth/auth.middleware");

router.use(requireAuth);

// Listado y búsqueda
router.get("/", inventoryController.getProducts);
router.get("/categorias", inventoryController.getCategories);
router.post("/categorias", inventoryController.createCategory);
router.get("/categoria/:categoryId", inventoryController.getProductsByCategory);
router.get("/buscar/:name", inventoryController.searchProducts);
router.get("/:id", inventoryController.getProductById);



// Actualización y creación
router.put("/actualizar/:id", inventoryController.updateProduct);
router.post("/newProduct", inventoryController.createProduct);
router.patch("/eliminar/:id", inventoryController.deleteProduct);

module.exports = router;
