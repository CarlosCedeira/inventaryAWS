const express = require("express"); const router = express.Router();
const controller = require("./sales.controller"); const { ROLES, requireAuth, requireRoles } = require("../auth/auth.middleware");
router.use(requireAuth, requireRoles(ROLES.OWNER, ROLES.ADMIN)); router.get("/", controller.getSales); router.get("/exportar", controller.exportSales); router.get("/filtros", controller.getSaleFilterOptions); router.get("/resumen", controller.getSaleSummary); router.get("/:id", controller.getSaleDetail); router.post("/", controller.createSale); router.post("/:id/completar", controller.completeSale); router.post("/:id/anular", controller.cancelSale); router.post("/:id/devolver", controller.returnSale);
module.exports = router;
