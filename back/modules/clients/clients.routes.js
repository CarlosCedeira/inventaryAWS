const express = require("express");
const router = express.Router();
const clientsController = require("./clients.controller");
const { ROLES, requireAuth, requireRoles } = require("../auth/auth.middleware");

router.use(requireAuth, requireRoles(ROLES.OWNER, ROLES.ADMIN));
router.get("/", clientsController.getClients);
router.post("/", clientsController.createClient);
router.patch("/:id", clientsController.updateClient);

module.exports = router;
