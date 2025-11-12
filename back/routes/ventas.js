// routes/ventas.js
const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

// Listar ventas
router.get("/", async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(`
      SELECT 
        v.id,
        v.id_producto,
        p.nombre AS nombre_producto,
        v.id_cliente,
        c.nombre AS nombre_cliente,
        v.cantidad,
        v.precio_venta,
        v.total,
        v.metodo_pago,
        DATE_FORMAT(v.fecha, '%d/%m/%Y %H:%i') AS fecha
      FROM ventas v
      LEFT JOIN productos p ON v.id_producto = p.id
      LEFT JOIN clientes c ON v.id_cliente = c.id
      ORDER BY v.fecha DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

// Crear venta
router.post("/", async (req, res) => {
  let connection;
  try {
    const { id_producto, cantidad, precio_venta } = req.body;
    if (!id_producto || !cantidad || !precio_venta) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    connection = await getConnection();
    const [result] = await connection.execute(
      `INSERT INTO ventas (id_producto, id_cliente, cantidad, precio_venta, metodo_pago)
       VALUES (?, ?, ?, ?, ?)`,
      [id_producto, 1, cantidad, precio_venta, "efectivo"]
    );

    res.status(201).json({ id: result.insertId, message: "Venta registrada" });
  } catch (error) {
    console.error("Error al registrar venta:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;
