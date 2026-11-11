import { createClient, getClients, updateClient } from "./clients.controller";

const express = require("express") as { Router: () => { use: (...args: unknown[]) => void; get: (...args: unknown[]) => void; post: (...args: unknown[]) => void; patch: (...args: unknown[]) => void } };
const router = express.Router();
const { ROLES, requireAuth, requireRoles } = require("../auth/auth.middleware") as {
  ROLES: { OWNER: "owner"; ADMIN: "admin"; SELLER: "vendedor" };
  requireAuth: unknown;
  requireRoles: (...roles: string[]) => unknown;
};

router.use(requireAuth, requireRoles(ROLES.OWNER, ROLES.ADMIN, ROLES.SELLER));
router.get("/", getClients);
router.post("/", createClient);
router.patch("/:id", updateClient);

export = router;
