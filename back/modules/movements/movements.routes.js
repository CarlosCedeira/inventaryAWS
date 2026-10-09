const express = require("express");
const router = express.Router();
const movementsController = require("./movements.controller.ts");
const { ROLES, requireAuth, requireRoles } = require("../auth/auth.middleware");

router.use(requireAuth, requireRoles(ROLES.OWNER, ROLES.ADMIN));

router.get("/", movementsController.getMovements);
router.post("/", movementsController.createMovement);
router.patch("/:movimientoId/finalizar-picking", movementsController.finalizePicking);

module.exports = router;
