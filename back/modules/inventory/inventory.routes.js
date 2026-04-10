const express = require("express");
const router = express.Router();
const inventoryController = require("./inventory.controller");

// Listado y búsqueda
router.get("/", inventoryController.getProducts);
router.get("/categorias", inventoryController.getCategories);
router.get("/buscar/:name", inventoryController.searchProducts);
router.get("/:id", inventoryController.getProductById);

// Flags
router.put("/flag/:flag/:id", inventoryController.toggleFlag);

// Actualización y creación
router.put("/actualizar/:id", inventoryController.updateProduct);
router.post("/newProduct", inventoryController.createProduct);

module.exports = router;