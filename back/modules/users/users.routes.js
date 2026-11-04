const express = require("express");
const router = express.Router();
const controller = require("./users.controller");
const { ROLES, requireAuth, requireRoles } = require("../auth/auth.middleware");

router.use(requireAuth, requireRoles(ROLES.OWNER));
router.get("/", controller.listUsers);
router.post("/", controller.createUser);
router.patch("/:id", controller.updateUser);
router.post("/:id/restablecer-password", controller.resetPassword);

module.exports = router;
