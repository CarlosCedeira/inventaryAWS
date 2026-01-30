// routes/productos.js
const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

router.get("/", async (req, res) => {
  console.log(`Solicitud recibida en /productos`);
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      `
     SELECT 
        i.id AS inventario_id,
        i.tenant_id,
        i.producto_id,
        p.nombre AS producto_nombre,
        c.nombre AS producto_categoria,
        c.id AS categoria_id,
        i.cantidad,
        i.precio_compra,
        i.precio_venta,
        i.stock_minimo,
        i.fecha_caducidad,
        p.publicado,
        p.variantes   -- <-- AÑADIDO AQUÍ
      FROM inventario i
      INNER JOIN productos p ON i.producto_id = p.id
      LEFT JOIN categorias c ON p.categoria_id = c.id

    `
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al consultar productos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

router.get("/categorias", async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute("SELECT * FROM categorias");
    res.json(rows);
    console.log("categorias totaltes", rows);
  } catch (error) {
    console.error("Error al publicar/despublicar:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

router.get("/buscar/:name", async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      `
      SELECT 
        i.id AS inventario_id,
        p.nombre AS producto_nombre,
        p.descripcion,
        c.nombre AS producto_categoria,
        i.precio_venta,
        i.cantidad
      FROM inventario i
      INNER JOIN productos p ON i.producto_id = p.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.nombre LIKE CONCAT('%', ?, '%')
      `,
      [req.params.name]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error en búsqueda:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

router.get("/:id", async (req, res) => {
  console.log("Solicitud recibida en /producto/:id", req.params.id);
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      `
      SELECT 
    i.id AS inventario_id,
    i.tenant_id,
    i.producto_id,

    -- PRODUCTO
    p.nombre AS producto_nombre,
    p.descripcion AS producto_descripcion,
    p.publicado,
    p.destacado,
    p.recomendado,
    p.ranking,
    p.fecha_creacion,
    p.variantes,

    -- CATEGORÍA
    c.id AS categoria_id,
    c.nombre AS producto_categoria,

    -- INVENTARIO
    i.cantidad,
    i.stock_minimo,
    i.precio_compra,
    i.precio_venta,
    i.fecha_caducidad,
    i.codigo_barras,
    i.numero_lote,
    i.sku,
    i.ultima_actualizacion

FROM inventario i
INNER JOIN productos p 
    ON i.producto_id = p.id
LEFT JOIN categorias c 
    ON p.categoria_id = c.id

WHERE i.id = ?;

      `,
      [req.params.id]
    );
    res.json(rows);
    console.log("Producto consultado:", rows);
  } catch (error) {
    console.error("Error al consultar productos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

router.put("/publicar/:id", async (req, res) => {
  console.log("Solicitud recibida en /publicar/:id", req.params.id);
  let connection;
  try {
    connection = await getConnection();
    await connection.execute(
      "UPDATE productos SET publicado = NOT publicado WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: "Estado de publicación actualizado" });
  } catch (error) {
    console.error("Error al publicar/despublicar:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

router.put("/destacar/:id", async (req, res) => {
  console.log("Solicitud recibida en destacar/:id", req.params.id);
  let connection;
  try {
    connection = await getConnection();
    await connection.execute(
      "UPDATE productos SET destacado = NOT destacado WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: "Estado de publicación destacar actualizado" });
  } catch (error) {
    console.error("Error al publicar/despublicar:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

router.put("/recomendar/:id", async (req, res) => {
  console.log("Solicitud recibida en recomendar/:id", req.params.id);
  let connection;
  try {
    connection = await getConnection();
    await connection.execute(
      "UPDATE productos SET recomendado = NOT recomendado WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: "Estado de publicación recomendar actualizado" });
  } catch (error) {
    console.error("Error al publicar/despublicar:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});

router.put("/actualizar/:id", async (req, res) => {
  console.log("Solicitud recibida en /actualizar/:id", req.params.id);
  console.log("parametros en ctualizar", req.params);
  let connection;

  try {
    connection = await getConnection();

    const inventarioId = req.params.id;

    // Datos que vienen del body
    const {
      producto_id,
      producto_nombre,
      producto_descripcion,
      publicado,
      destacado,
      recomendado,
      ranking,
      cantidad,
      stock_minimo,
      precio_compra,
      precio_venta,
      fecha_caducidad,
      codigo_barras,
      numero_lote,
      sku,
    } = req.body;

    // Actualizar tabla productos
    await connection.execute(
      `UPDATE productos
       SET nombre = ?, descripcion = ?, publicado = ?, destacado = ?, recomendado = ?, ranking = ?
       WHERE id = ?`,
      [
        producto_nombre,
        producto_descripcion,
        publicado,
        destacado,
        recomendado,
        ranking,
        producto_id,
      ]
    );

    // Actualizar tabla inventario
    await connection.execute(
      `UPDATE inventario
       SET cantidad = ?, stock_minimo = ?, precio_compra = ?, precio_venta = ?, fecha_caducidad = ?, codigo_barras = ?, numero_lote = ?, sku = ?, ultima_actualizacion = NOW()
       WHERE id = ?`,
      [
        cantidad,
        stock_minimo,
        precio_compra,
        precio_venta,
        fecha_caducidad ? new Date(fecha_caducidad) : null,
        codigo_barras,
        numero_lote,
        sku,
        inventarioId,
      ]
    );

    res.json({
      message: "Datos actualizados correctamente",
      inventario_id: inventarioId,
    });
  } catch (error) {
    console.error("Error al actualizar inventario/producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) await connection.end();
  }
});



module.exports = router;
