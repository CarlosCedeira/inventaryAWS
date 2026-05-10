const express = require("express");
const router = express.Router();
const movementsController = require("./movements.controller");
const { requireAuth } = require("../auth/auth.middleware");

router.use(requireAuth);

router.get("/", movementsController.getMovements);

module.exports = router;
