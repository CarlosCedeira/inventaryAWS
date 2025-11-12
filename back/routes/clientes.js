// routes/clientes.js
const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

router.get("/", async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute("SELECT * FROM clientes");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;
