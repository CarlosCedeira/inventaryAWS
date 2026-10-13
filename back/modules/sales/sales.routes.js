const express = require("express");
const router = express.Router();
const controller = require("./sales.controller");
const { ROLES, requireAuth, requireRoles } = require("../auth/auth.middleware");

router.use(requireAuth);
const requireCommercialAccess = requireRoles(ROLES.OWNER, ROLES.ADMIN, ROLES.SELLER);
const requireCommercialManagement = requireRoles(ROLES.OWNER, ROLES.ADMIN);

router.get("/", requireCommercialAccess, controller.getSales);
router.get("/filtros", requireCommercialAccess, controller.getSaleFilterOptions);
router.get("/exportar", requireCommercialManagement, controller.exportSales);
router.get("/resumen", requireCommercialManagement, controller.getSaleSummary);
router.post("/", requireCommercialAccess, controller.createSale);
router.post("/:id/completar", requireCommercialAccess, controller.completeSale);
router.post("/:id/anular", requireCommercialAccess, controller.cancelSale);
router.post("/:id/devolver", requireCommercialAccess, controller.returnSale);
router.get("/:id", requireCommercialAccess, controller.getSaleDetail);
module.exports = router;
