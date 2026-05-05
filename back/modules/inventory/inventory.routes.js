const express = require("express");
const router = express.Router();
const inventoryController = require("./inventory.controller");
const { requireAuth } = require("../auth/auth.middleware");

router.use(requireAuth);

// Listado y búsqueda
router.get("/", inventoryController.getProducts);
router.get("/categorias", inventoryController.getCategories);
router.get("/buscar/:name", inventoryController.searchProducts);
router.get("/:id", inventoryController.getProductById);



// Actualización y creación
router.put("/actualizar/:id", inventoryController.updateProduct);
router.post("/newProduct", inventoryController.createProduct);

module.exports = router;
