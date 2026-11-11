import {
  createCategory,
  createProduct,
  deleteProduct,
  getCategories,
  getProductById,
  getProducts,
  getProductsByCategory,
  getProductsWithoutRecentSales,
  getTaxes,
  searchProducts,
  updateProduct,
} from "./inventory.controller";

const express = require("express") as { Router: () => { use: (...args: unknown[]) => void; get: (...args: unknown[]) => void; post: (...args: unknown[]) => void; put: (...args: unknown[]) => void; patch: (...args: unknown[]) => void } };
const router = express.Router();
const { ROLES, requireAuth, requireRoles } = require("../auth/auth.middleware") as {
  ROLES: { OWNER: "owner"; ADMIN: "admin"; WAREHOUSE: "almacen"; SELLER: "vendedor" };
  requireAuth: unknown;
  requireRoles: (...roles: string[]) => unknown;
};

router.use(requireAuth);

const requireInventoryAccess = requireRoles(ROLES.OWNER, ROLES.ADMIN, ROLES.WAREHOUSE);
const requireProductCatalogAccess = requireRoles(ROLES.OWNER, ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.SELLER);
const requireInventoryManagement = requireRoles(ROLES.OWNER, ROLES.ADMIN);

// Listado y búsqueda
router.get("/", requireProductCatalogAccess, getProducts);
router.get("/categorias", requireProductCatalogAccess, getCategories);
router.get("/impuestos", requireProductCatalogAccess, getTaxes);
router.get("/sin-ventas", requireInventoryAccess, getProductsWithoutRecentSales);
router.get("/categoria/:categoryId", requireProductCatalogAccess, getProductsByCategory);
router.get("/buscar/:name", requireProductCatalogAccess, searchProducts);
router.get("/:id", requireProductCatalogAccess, getProductById);



// Actualización y creación
router.post("/categorias", requireInventoryManagement, createCategory);
router.put("/actualizar/:id", requireInventoryManagement, updateProduct);
router.post("/newProduct", requireInventoryManagement, createProduct);
router.patch("/eliminar/:id", requireInventoryManagement, deleteProduct);

export = router;
