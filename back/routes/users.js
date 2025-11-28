const express = require("express");
const router = express.Router();
const { getUsers, createUser } = require("../controllers/userController");
const { checkRole } = require("../middleware/auth");

// 🔹 Listar usuarios (solo admin)
router.get("/", checkRole(["admin"]), getUsers);

// 🔹 Crear usuario (solo admin)
router.post("/", checkRole(["admin"]), createUser);

module.exports = router;
