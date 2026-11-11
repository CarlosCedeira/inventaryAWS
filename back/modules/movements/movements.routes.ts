import { createMovement, finalizePicking, getMovements } from "./movements.controller";

const express = require("express") as { Router: () => { use: (...args: unknown[]) => void; get: (...args: unknown[]) => void; post: (...args: unknown[]) => void; patch: (...args: unknown[]) => void } };
const router = express.Router();
const { ROLES, requireAuth, requireRoles } = require("../auth/auth.middleware") as {
  ROLES: { OWNER: "owner"; ADMIN: "admin"; WAREHOUSE: "almacen" };
  requireAuth: unknown;
  requireRoles: (...roles: string[]) => unknown;
};

router.use(requireAuth, requireRoles(ROLES.OWNER, ROLES.ADMIN, ROLES.WAREHOUSE));

router.get("/", getMovements);
router.post("/", createMovement);
router.patch("/:movimientoId/finalizar-picking", finalizePicking);

export = router;
