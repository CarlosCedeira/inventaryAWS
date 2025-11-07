const express = require("express");
const mysql = require("mysql2/promise"); // Asegúrate de instalar mysql2
const cors = require("cors"); // Importa cors
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para habilitar CORS
app.use(cors());

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.json());

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: "localhost",
  user: "root", // Cambia esto según tu configuración
  password: "root", // Cambia esto según tu configuración
  database: "tienda_local", // Asegúrate de que la base de datos exista
};

app.get("/productos", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
  SELECT p.*, i.*
  FROM productos p
  INNER JOIN inventario i ON p.id = i.id_producto
`);
    res.json(rows);
  } catch (error) {
    console.error("Error al consultar la base de datos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

app.get("/clientes", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(` SELECT *  FROM clientes`);
    res.json(rows);
  } catch (error) {
    console.error("Error al consultar la base de datos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

app.get("/ventas", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

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
    console.error("Error al consultar las ventas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

app.post("/ventas", async (req, res) => {
  let connection;
  try {
    const { id_producto, cantidad, precio_venta } = req.body;

    if (!id_producto || !cantidad || !precio_venta) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // ✅ Crear conexión
    connection = await mysql.createConnection(dbConfig);

    // ✅ Insertar venta
    const [result] = await connection.execute(
      `INSERT INTO ventas (id_producto, id_cliente, cantidad, precio_venta, metodo_pago)
       VALUES (?, ?, ?, ?, ?)`,
      [id_producto, 1, cantidad, precio_venta, "efectivo"]
    );

    res.status(201).json({ id: result.insertId, message: "Venta registrada" });
  } catch (error) {
    console.error("Error al registrar la venta:", error);
    res.status(500).json({ error: "Error al registrar la venta" });
  } finally {
    if (connection) await connection.end();
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
