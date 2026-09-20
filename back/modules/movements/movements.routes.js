const express = require("express");
const router = express.Router();
const movementsController = require("./movements.controller.ts");
const { requireAuth } = require("../auth/auth.middleware");

router.use(requireAuth);

router.get("/", movementsController.getMovements);
router.post("/", movementsController.createMovement);

module.exports = router;
