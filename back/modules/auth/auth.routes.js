const express = require("express");
const authController = require("./auth.controller");
const { requireAuth } = require("./auth.middleware");

const router = express.Router();

router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/logout", authController.logout);

module.exports = router;
