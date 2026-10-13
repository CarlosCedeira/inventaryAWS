const express = require("express");
const router = express.Router();
const inventoryController = require("./inventory.controller");
const { ROLES, requireAuth, requireRoles } = require("../auth/auth.middleware");

router.use(requireAuth);

const requireInventoryAccess = requireRoles(ROLES.OWNER, ROLES.ADMIN, ROLES.WAREHOUSE);
const requireProductCatalogAccess = requireRoles(ROLES.OWNER, ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.SELLER);
const requireInventoryManagement = requireRoles(ROLES.OWNER, ROLES.ADMIN);

// Listado y búsqueda
router.get("/", requireProductCatalogAccess, inventoryController.getProducts);
router.get("/categorias", requireProductCatalogAccess, inventoryController.getCategories);
router.get("/impuestos", requireProductCatalogAccess, inventoryController.getTaxes);
router.get("/sin-ventas", requireInventoryAccess, inventoryController.getProductsWithoutRecentSales);
router.get("/categoria/:categoryId", requireProductCatalogAccess, inventoryController.getProductsByCategory);
router.get("/buscar/:name", requireProductCatalogAccess, inventoryController.searchProducts);
router.get("/:id", requireProductCatalogAccess, inventoryController.getProductById);



// Actualización y creación
router.post("/categorias", requireInventoryManagement, inventoryController.createCategory);
router.put("/actualizar/:id", requireInventoryManagement, inventoryController.updateProduct);
router.post("/newProduct", requireInventoryManagement, inventoryController.createProduct);
router.patch("/eliminar/:id", requireInventoryManagement, inventoryController.deleteProduct);

module.exports = router;
