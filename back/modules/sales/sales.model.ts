import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { SaleInput, SaleListFilters } from "./sales.validators";
const { getConnection } = require("../../db") as { getConnection: () => Promise<PoolConnection> };
const movementsModel = require("../movements/movements.model") as typeof import("../movements/movements.model");
type ClientRow = RowDataPacket & { id: number; nombre: string; contacto_email: string | null; identificacion_fiscal: string | null };
type ProductRow = RowDataPacket & { id: number; nombre: string; precio_venta: string; impuesto_nombre: string | null; impuesto_porcentaje: string | null };
function httpError(statusCode: number, message: string) { const error = new Error(message) as Error & { statusCode: number }; error.statusCode = statusCode; return error; }
function cents(value: string | number) { return Math.round(Number(value) * 100); }

async function listSales(tenantId: number, filters: SaleListFilters) {
  const connection = await getConnection();
  try {
    const conditions = ["v.tenant_id = ?"];
    const parameters: Array<string | number> = [tenantId];
    const saleDate = "COALESCE(v.fecha_confirmacion, v.created_at)";

    if (filters.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(`(
        v.referencia LIKE ? OR COALESCE(v.cliente_nombre, c.nombre, '') LIKE ? OR
        COALESCE(v.cliente_email, c.contacto_email, '') LIKE ? OR
        COALESCE(v.cliente_identificacion_fiscal, c.identificacion_fiscal, '') LIKE ? OR
        u.nombre LIKE ? OR EXISTS (
          SELECT 1 FROM lineas_venta ls
          LEFT JOIN productos ps ON ps.id = ls.producto_id AND ps.tenant_id = ls.tenant_id
          LEFT JOIN movimientos_inventario ms ON ms.linea_venta_id = ls.id AND ms.tenant_id = ls.tenant_id
          WHERE ls.venta_id = v.id AND ls.tenant_id = v.tenant_id
            AND (ls.descripcion LIKE ? OR ps.nombre LIKE ? OR ms.numero_lote LIKE ?)
        )
      )`);
      parameters.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern);
    }
    if (filters.clientId !== null) { conditions.push("v.cliente_id = ?"); parameters.push(filters.clientId); }
    if (filters.productId !== null) {
      conditions.push("EXISTS (SELECT 1 FROM lineas_venta lf WHERE lf.venta_id = v.id AND lf.tenant_id = v.tenant_id AND lf.producto_id = ?)");
      parameters.push(filters.productId);
    }
    if (filters.categoryId !== null) {
      conditions.push("EXISTS (SELECT 1 FROM lineas_venta lf INNER JOIN productos pf ON pf.id = lf.producto_id AND pf.tenant_id = lf.tenant_id WHERE lf.venta_id = v.id AND lf.tenant_id = v.tenant_id AND pf.categoria_id = ?)");
      parameters.push(filters.categoryId);
    }
    if (filters.taxRate !== null) {
      conditions.push("EXISTS (SELECT 1 FROM lineas_venta lf WHERE lf.venta_id = v.id AND lf.tenant_id = v.tenant_id AND lf.impuesto_porcentaje = ?)");
      parameters.push(filters.taxRate);
    }
    if (filters.userId !== null) { conditions.push("v.usuario_id = ?"); parameters.push(filters.userId); }
    if (filters.minimumTotal !== null) { conditions.push("v.total >= ?"); parameters.push(filters.minimumTotal); }

    if (filters.period === "today") conditions.push(`DATE(${saleDate}) = CURDATE()`);
    if (filters.period === "week") conditions.push(`DATE(${saleDate}) >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)`);
    if (filters.period === "month") conditions.push(`DATE(${saleDate}) >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`);
    if (filters.period === "quarter") conditions.push(`DATE(${saleDate}) >= DATE_ADD(MAKEDATE(YEAR(CURDATE()), 1), INTERVAL (QUARTER(CURDATE()) - 1) QUARTER)`);
    if (filters.dateFrom) { conditions.push(`${saleDate} >= ?`); parameters.push(filters.dateFrom); }
    if (filters.dateTo) { conditions.push(`${saleDate} < DATE_ADD(?, INTERVAL 1 DAY)`); parameters.push(filters.dateTo); }

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT v.id, v.referencia, v.estado, v.moneda, v.subtotal, v.total, v.fecha_confirmacion, v.created_at,
              COALESCE(v.cliente_nombre, c.nombre, 'Venta sin cliente') AS cliente_nombre,
              u.nombre AS usuario_nombre,
              COUNT(l.id) AS lineas
       FROM ventas v
       LEFT JOIN clientes c ON c.id = v.cliente_id AND c.tenant_id = v.tenant_id
       INNER JOIN usuarios u ON u.id = v.usuario_id AND u.tenant_id = v.tenant_id
       LEFT JOIN lineas_venta l ON l.venta_id = v.id AND l.tenant_id = v.tenant_id
       WHERE ${conditions.join(" AND ")}
       GROUP BY v.id, v.referencia, v.estado, v.moneda, v.subtotal, v.total, v.fecha_confirmacion, v.created_at, v.cliente_nombre, c.nombre, u.nombre
       ORDER BY v.created_at DESC, v.id DESC
       LIMIT 200`, parameters);
    return rows;
  } finally { connection.release(); }
}

async function getSaleFilterOptions(tenantId: number) {
  const connection = await getConnection();
  try {
    const [users] = await connection.execute<RowDataPacket[]>(
      "SELECT id, nombre FROM usuarios WHERE tenant_id = ? AND activo = TRUE ORDER BY nombre, id",
      [tenantId],
    );
    return { users };
  } finally { connection.release(); }
}

async function getSaleSummary(tenantId: number) {
  const connection = await getConnection();
  const confirmedDate = "COALESCE(v.fecha_confirmacion, v.created_at)";
  try {
    const [today, month, ticket, inactiveClients, recurringClients, topProducts, unsoldProducts, highSales] = await Promise.all([
      connection.execute<RowDataPacket[]>(`SELECT COUNT(*) AS cantidad, COALESCE(SUM(v.total), 0) AS total FROM ventas v WHERE v.tenant_id = ? AND v.estado = 'confirmada' AND DATE(${confirmedDate}) = CURDATE()`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT COUNT(*) AS cantidad, COALESCE(SUM(v.total), 0) AS total FROM ventas v WHERE v.tenant_id = ? AND v.estado = 'confirmada' AND DATE(${confirmedDate}) >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT COALESCE(AVG(v.total), 0) AS total FROM ventas v WHERE v.tenant_id = ? AND v.estado = 'confirmada' AND DATE(${confirmedDate}) >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT COUNT(*) AS cantidad FROM clientes c WHERE c.tenant_id = ? AND c.activo = TRUE AND NOT EXISTS (SELECT 1 FROM ventas v WHERE v.tenant_id = c.tenant_id AND v.cliente_id = c.id AND v.estado = 'confirmada' AND ${confirmedDate} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT COUNT(*) AS cantidad FROM (SELECT v.cliente_id FROM ventas v WHERE v.tenant_id = ? AND v.estado = 'confirmada' AND v.cliente_id IS NOT NULL AND ${confirmedDate} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY v.cliente_id HAVING COUNT(*) > 1) recurrentes`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT l.producto_id, MAX(l.descripcion) AS nombre, COALESCE(SUM(l.cantidad), 0) AS unidades, COALESCE(SUM(l.importe_total), 0) AS total FROM lineas_venta l INNER JOIN ventas v ON v.id = l.venta_id AND v.tenant_id = l.tenant_id WHERE l.tenant_id = ? AND v.estado = 'confirmada' AND ${confirmedDate} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY l.producto_id ORDER BY unidades DESC, total DESC LIMIT 1`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT COUNT(*) AS cantidad FROM (SELECT p.id FROM productos p INNER JOIN inventario i ON i.producto_id = p.id AND i.tenant_id = p.tenant_id WHERE p.tenant_id = ? AND p.eliminado = FALSE AND NOT EXISTS (SELECT 1 FROM lineas_venta l INNER JOIN ventas v ON v.id = l.venta_id AND v.tenant_id = l.tenant_id WHERE l.tenant_id = p.tenant_id AND l.producto_id = p.id AND v.estado = 'confirmada' AND ${confirmedDate} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) GROUP BY p.id HAVING SUM(i.cantidad) > 0) sin_ventas`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT COUNT(*) AS cantidad, COALESCE(SUM(v.total), 0) AS total FROM ventas v WHERE v.tenant_id = ? AND v.estado = 'confirmada' AND v.total >= 500 AND DATE(${confirmedDate}) >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`, [tenantId]),
    ]);
    return {
      today: today[0][0], month: month[0][0], averageTicket: ticket[0][0], inactiveClients: inactiveClients[0][0], recurringClients: recurringClients[0][0], topProduct: topProducts[0][0] || null, unsoldProducts: unsoldProducts[0][0], highSales: highSales[0][0],
    };
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
      `SELECT id, producto_id, descripcion, cantidad, precio_unitario, impuesto_nombre, impuesto_porcentaje, descuento_total, impuesto_total, importe_total
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
    let taxCents = 0;
    const createdLines: Array<{ id: number; productId: number; quantity: number; movements: number[] }> = [];
    for (const line of sale.lines) {
      const [products] = await connection.execute<ProductRow[]>(
        `SELECT p.id, p.nombre, p.precio_venta, t.nombre AS impuesto_nombre, t.porcentaje AS impuesto_porcentaje
         FROM productos p LEFT JOIN impuestos t ON t.id = p.impuesto_id AND t.activo = TRUE
         WHERE p.id = ? AND p.tenant_id = ? AND p.eliminado = FALSE FOR UPDATE`,
        [line.productId, tenantId],
      );
      if (!products.length) throw httpError(404, "Producto no encontrado");
      const product = products[0];
      if (!product.impuesto_nombre || product.impuesto_porcentaje === null) {
        throw httpError(409, "El producto no tiene un IVA activo asignado");
      }
      const unitCents = cents(product.precio_venta);
      const lineSubtotalCents = unitCents * line.quantity;
      const lineTaxCents = Math.round(lineSubtotalCents * Number(product.impuesto_porcentaje) / 100);
      const amountCents = lineSubtotalCents + lineTaxCents;
      const [lineResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO lineas_venta (tenant_id,venta_id,producto_id,descripcion,cantidad,precio_unitario,impuesto_nombre,impuesto_porcentaje,impuesto_total,importe_total) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [tenantId, saleResult.insertId, line.productId, product.nombre, line.quantity, unitCents / 100, product.impuesto_nombre, product.impuesto_porcentaje, lineTaxCents / 100, amountCents / 100],
      );
      subtotalCents += lineSubtotalCents;
      taxCents += lineTaxCents;
      const stockConsumption = await movementsModel.consumeStockByFEFO(connection, {
        tenantId,
        userId,
        productId: line.productId,
        quantity: line.quantity,
        saleLineId: lineResult.insertId,
        reason: "Venta",
        description: `Venta ${sale.reference || `#${saleResult.insertId}`}`,
      });
      createdLines.push({ id: lineResult.insertId, productId: line.productId, quantity: line.quantity, movements: stockConsumption.movementIds });
    }
    const totalCents = subtotalCents + taxCents;
    await connection.execute("UPDATE ventas SET estado = 'confirmada', subtotal = ?, impuesto_total = ?, total = ?, fecha_confirmacion = NOW() WHERE id = ? AND tenant_id = ?", [subtotalCents / 100, taxCents / 100, totalCents / 100, saleResult.insertId, tenantId]);
    await connection.commit();
    return { id: saleResult.insertId, estado: "confirmada", subtotal: subtotalCents / 100, impuesto_total: taxCents / 100, total: totalCents / 100, lineas: createdLines };
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}
export { confirmSale, getSaleDetail, getSaleFilterOptions, getSaleSummary, listSales };
