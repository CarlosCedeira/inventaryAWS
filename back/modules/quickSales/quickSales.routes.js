const express = require("express");
const router = express.Router();
const quickSalesController = require("./quickSales.controller");
const { ROLES, requireAuth, requireRoles } = require("../auth/auth.middleware");

router.use(requireAuth, requireRoles(ROLES.OWNER, ROLES.ADMIN));

router.put("/:productId", quickSalesController.registerQuickSale);

module.exports = router;
