import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { SaleInput } from "./sales.validators";
const { getConnection } = require("../../db") as { getConnection: () => Promise<PoolConnection> };
type ClientRow = RowDataPacket & { id: number; nombre: string; contacto_email: string | null; identificacion_fiscal: string | null };
type ProductRow = RowDataPacket & { id: number; nombre: string; precio_venta: string };
type LotRow = RowDataPacket & { id: number; cantidad: number | string; numero_lote: string | null; fecha_caducidad: string | null };
function httpError(statusCode: number, message: string) { const error = new Error(message) as Error & { statusCode: number }; error.statusCode = statusCode; return error; }
function cents(value: string | number) { return Math.round(Number(value) * 100); }

async function listSales(tenantId: number) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT v.id, v.referencia, v.estado, v.moneda, v.subtotal, v.total, v.fecha_confirmacion, v.created_at,
              COALESCE(v.cliente_nombre, c.nombre, 'Venta sin cliente') AS cliente_nombre,
              COUNT(l.id) AS lineas
       FROM ventas v
       LEFT JOIN clientes c ON c.id = v.cliente_id AND c.tenant_id = v.tenant_id
       LEFT JOIN lineas_venta l ON l.venta_id = v.id AND l.tenant_id = v.tenant_id
       WHERE v.tenant_id = ?
       GROUP BY v.id, v.referencia, v.estado, v.moneda, v.subtotal, v.total, v.fecha_confirmacion, v.created_at, v.cliente_nombre, c.nombre
       ORDER BY v.created_at DESC, v.id DESC`, [tenantId]);
    return rows;
  } finally { connection.release(); }
}

async function getSaleDetail(tenantId: number, saleId: number) {
  const connection = await getConnection();
  try {
    const [sales] = await connection.execute<RowDataPacket[]>(
      `SELECT id, referencia, estado, moneda, cliente_nombre, cliente_email, cliente_identificacion_fiscal,
              subtotal, descuento_total, impuesto_total, total, observaciones, fecha_confirmacion, created_at
       FROM ventas WHERE id = ? AND tenant_id = ?`,
      [saleId, tenantId],
    );
    if (!sales.length) throw httpError(404, "Venta no encontrada");
    const [lines] = await connection.execute<RowDataPacket[]>(
      `SELECT id, producto_id, descripcion, cantidad, precio_unitario, descuento_total, impuesto_total, importe_total
       FROM lineas_venta WHERE venta_id = ? AND tenant_id = ? ORDER BY id`,
      [saleId, tenantId],
    );
    const [movements] = await connection.execute<RowDataPacket[]>(
      `SELECT m.id, m.linea_venta_id, m.cantidad, m.numero_lote, m.fecha_caducidad, m.created_at,
              p.nombre AS producto_nombre, u.nombre AS usuario_nombre
       FROM movimientos_inventario m
       INNER JOIN lineas_venta l ON l.id = m.linea_venta_id AND l.tenant_id = m.tenant_id
       INNER JOIN productos p ON p.id = m.producto_id AND p.tenant_id = m.tenant_id
       LEFT JOIN usuarios u ON u.id = m.usuario_id AND u.tenant_id = m.tenant_id
       WHERE l.venta_id = ? AND m.tenant_id = ? AND m.tipo = 'salida'
       ORDER BY m.id`,
      [saleId, tenantId],
    );
    return { ...sales[0], lineas: lines, movimientos: movements };
  } finally { connection.release(); }
}

async function confirmSale(tenantId: number, userId: number, sale: SaleInput) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    let client: ClientRow | null = null;
    if (sale.clientId !== null) {
      const [rows] = await connection.execute<ClientRow[]>("SELECT id,nombre,contacto_email,identificacion_fiscal FROM clientes WHERE id = ? AND tenant_id = ? AND activo = TRUE FOR UPDATE", [sale.clientId, tenantId]);
      if (!rows.length) throw httpError(404, "Cliente no encontrado");
      client = rows[0];
    }
    const [saleResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO ventas (tenant_id,cliente_id,usuario_id,estado,referencia,moneda,cliente_nombre,cliente_email,cliente_identificacion_fiscal,observaciones)
       VALUES (?,?,?,'borrador',?,?,?,?,?,?)`,
      [tenantId, sale.clientId, userId, sale.reference, sale.currency, client?.nombre || null, client?.contacto_email || null, client?.identificacion_fiscal || null, sale.notes],
    );
    let subtotalCents = 0;
    const createdLines: Array<{ id: number; productId: number; quantity: number; movements: number[] }> = [];
    for (const line of sale.lines) {
      const [products] = await connection.execute<ProductRow[]>("SELECT id,nombre,precio_venta FROM productos WHERE id = ? AND tenant_id = ? AND eliminado = FALSE FOR UPDATE", [line.productId, tenantId]);
      if (!products.length) throw httpError(404, "Producto no encontrado");
      const product = products[0];
      const [lots] = await connection.execute<LotRow[]>(
        `SELECT id,cantidad,numero_lote,fecha_caducidad FROM inventario WHERE tenant_id = ? AND producto_id = ? AND cantidad > 0
         AND (fecha_caducidad IS NULL OR fecha_caducidad >= CURDATE()) ORDER BY CASE WHEN fecha_caducidad IS NULL THEN 1 ELSE 0 END, fecha_caducidad, id FOR UPDATE`,
        [tenantId, line.productId],
      );
      const available = lots.reduce((sum, lot) => sum + Number(lot.cantidad), 0);
      if (available < line.quantity) throw httpError(409, "Stock disponible insuficiente");
      const [stockRows] = await connection.execute<(RowDataPacket & { total: string })[]>("SELECT COALESCE(SUM(cantidad),0) AS total FROM inventario WHERE tenant_id = ? AND producto_id = ?", [tenantId, line.productId]);
      let runningStock = Number(stockRows[0].total);
      const unitCents = cents(product.precio_venta);
      const amountCents = unitCents * line.quantity;
      const [lineResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO lineas_venta (tenant_id,venta_id,producto_id,descripcion,cantidad,precio_unitario,importe_total) VALUES (?,?,?,?,?,?,?)",
        [tenantId, saleResult.insertId, line.productId, product.nombre, line.quantity, unitCents / 100, amountCents / 100],
      );
      subtotalCents += amountCents;
      let remaining = line.quantity;
      const movementIds: number[] = [];
      for (const lot of lots) {
        if (!remaining) break;
        const used = Math.min(Number(lot.cantidad), remaining);
        const nextStock = runningStock - used;
        await connection.execute("UPDATE inventario SET cantidad = ? WHERE id = ? AND tenant_id = ? AND producto_id = ?", [Number(lot.cantidad) - used, lot.id, tenantId, line.productId]);
        const [movement] = await connection.execute<ResultSetHeader>(
          `INSERT INTO movimientos_inventario (tenant_id,producto_id,inventario_id,linea_venta_id,tipo,cantidad,stock_anterior,stock_nuevo,numero_lote,fecha_caducidad,motivo,descripcion,usuario_id)
           VALUES (?,?,?,?, 'salida',?,?,?,?,?,?,?,?)`,
          [tenantId, line.productId, lot.id, lineResult.insertId, used, runningStock, nextStock, lot.numero_lote, lot.fecha_caducidad, "Venta", `Venta ${sale.reference || `#${saleResult.insertId}`}`, userId],
        );
        movementIds.push(movement.insertId); remaining -= used; runningStock = nextStock;
      }
      createdLines.push({ id: lineResult.insertId, productId: line.productId, quantity: line.quantity, movements: movementIds });
    }
    await connection.execute("UPDATE ventas SET estado = 'confirmada', subtotal = ?, total = ?, fecha_confirmacion = NOW() WHERE id = ? AND tenant_id = ?", [subtotalCents / 100, subtotalCents / 100, saleResult.insertId, tenantId]);
    await connection.commit();
    return { id: saleResult.insertId, estado: "confirmada", subtotal: subtotalCents / 100, total: subtotalCents / 100, lineas: createdLines };
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}
export { confirmSale, getSaleDetail, listSales };
