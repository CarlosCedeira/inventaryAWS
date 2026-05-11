const express = require("express");
const router = express.Router();
const quickSalesController = require("./quickSales.controller");
const { requireAuth } = require("../auth/auth.middleware");

router.use(requireAuth);

router.put("/:productId", quickSalesController.registerQuickSale);

module.exports = router;
