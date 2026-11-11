import { createUser, listUsers, resetPassword, updateUser } from "./users.controller";

const express = require("express") as { Router: () => { use: (...args: unknown[]) => void; get: (...args: unknown[]) => void; post: (...args: unknown[]) => void; patch: (...args: unknown[]) => void } };
const { ROLES, requireAuth, requireRoles } = require("../auth/auth.middleware") as {
  ROLES: { OWNER: "owner" };
  requireAuth: unknown;
  requireRoles: (...roles: string[]) => unknown;
};

const router = express.Router();
router.use(requireAuth, requireRoles(ROLES.OWNER));
router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.post("/:id/restablecer-password", resetPassword);

export = router;
