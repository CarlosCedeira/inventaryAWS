import {
  cancelSale,
  completeSale,
  createSale,
  exportSales,
  getSaleDetail,
  getSaleFilterOptions,
  getSaleSummary,
  getSales,
  returnSale,
} from "./sales.controller";

const express = require("express") as { Router: () => { use: (...args: unknown[]) => void; get: (...args: unknown[]) => void; post: (...args: unknown[]) => void } };
const router = express.Router();
const { ROLES, requireAuth, requireRoles } = require("../auth/auth.middleware") as {
  ROLES: { OWNER: "owner"; ADMIN: "admin"; SELLER: "vendedor" };
  requireAuth: unknown;
  requireRoles: (...roles: string[]) => unknown;
};

router.use(requireAuth);
const requireCommercialAccess = requireRoles(ROLES.OWNER, ROLES.ADMIN, ROLES.SELLER);
const requireCommercialManagement = requireRoles(ROLES.OWNER, ROLES.ADMIN);

router.get("/", requireCommercialAccess, getSales);
router.get("/filtros", requireCommercialAccess, getSaleFilterOptions);
router.get("/exportar", requireCommercialManagement, exportSales);
router.get("/resumen", requireCommercialManagement, getSaleSummary);
router.post("/", requireCommercialAccess, createSale);
router.post("/:id/completar", requireCommercialAccess, completeSale);
router.post("/:id/anular", requireCommercialAccess, cancelSale);
router.post("/:id/devolver", requireCommercialAccess, returnSale);
router.get("/:id", requireCommercialAccess, getSaleDetail);
export = router;
