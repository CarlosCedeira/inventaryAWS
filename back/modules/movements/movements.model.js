const { getConnection } = require("../../db");

async function getAllMovements(tenantId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `
      SELECT
  m.id AS movimiento_id,
  m.tenant_id,
  m.producto_id,
  p.nombre AS producto_nombre,
  c.id AS categoria_id,
  c.nombre AS producto_categoria,

  m.inventario_id,
  m.tipo,
  m.cantidad,
  m.stock_anterior,
  m.stock_nuevo,
  m.numero_lote,
  m.fecha_caducidad,
  m.motivo,
  m.descripcion,
  m.usuario_id,
  m.fecha_movimiento

FROM movimientos_inventario m

INNER JOIN productos p
  ON p.id = m.producto_id
 AND p.tenant_id = m.tenant_id

LEFT JOIN categorias c
  ON c.id = p.categoria_id
 AND c.tenant_id = p.tenant_id

WHERE m.tenant_id = ?

ORDER BY m.fecha_movimiento DESC, m.id DESC;
      `,
      [tenantId]
    );

    return rows;
  } finally {
    await connection.end();
  }
}

module.exports = {
  getAllMovements,
};
