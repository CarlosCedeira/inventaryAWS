import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { SaleInput, SaleListFilters, SaleReturnInput } from "./sales.validators";
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
              COALESCE(MAX(rd.total_devuelto), 0) AS total_devuelto,
              CASE WHEN v.estado = 'anulada' THEN 0 ELSE GREATEST(v.total - COALESCE(MAX(rd.total_devuelto), 0), 0) END AS total_neto,
              COALESCE(v.cliente_nombre, c.nombre, 'Venta sin cliente') AS cliente_nombre,
              u.nombre AS usuario_nombre,
              COUNT(l.id) AS lineas
       FROM ventas v
       LEFT JOIN clientes c ON c.id = v.cliente_id AND c.tenant_id = v.tenant_id
       INNER JOIN usuarios u ON u.id = v.usuario_id AND u.tenant_id = v.tenant_id
       LEFT JOIN lineas_venta l ON l.venta_id = v.id AND l.tenant_id = v.tenant_id
       LEFT JOIN (
         SELECT d.tenant_id, d.venta_id, SUM(d.total) AS total_devuelto
         FROM devoluciones d WHERE d.estado = 'confirmada'
         GROUP BY d.tenant_id, d.venta_id
       ) rd ON rd.venta_id = v.id AND rd.tenant_id = v.tenant_id
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
      connection.execute<RowDataPacket[]>(`SELECT COUNT(*) AS cantidad, COALESCE(SUM(v.total), 0) AS total FROM ventas v WHERE v.tenant_id = ? AND v.estado IN ('completa','parcialmente_devuelta') AND DATE(${confirmedDate}) = CURDATE()`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT COUNT(*) AS cantidad, COALESCE(SUM(v.total), 0) AS total FROM ventas v WHERE v.tenant_id = ? AND v.estado IN ('completa','parcialmente_devuelta') AND DATE(${confirmedDate}) >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT COALESCE(AVG(v.total), 0) AS total FROM ventas v WHERE v.tenant_id = ? AND v.estado IN ('completa','parcialmente_devuelta') AND DATE(${confirmedDate}) >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT COUNT(*) AS cantidad FROM clientes c WHERE c.tenant_id = ? AND c.activo = TRUE AND NOT EXISTS (SELECT 1 FROM ventas v WHERE v.tenant_id = c.tenant_id AND v.cliente_id = c.id AND v.estado IN ('completa','parcialmente_devuelta','devuelta') AND ${confirmedDate} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT COUNT(*) AS cantidad FROM (SELECT v.cliente_id FROM ventas v WHERE v.tenant_id = ? AND v.estado IN ('completa','parcialmente_devuelta','devuelta') AND v.cliente_id IS NOT NULL AND ${confirmedDate} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY v.cliente_id HAVING COUNT(*) > 1) recurrentes`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT l.producto_id, MAX(l.descripcion) AS nombre, COALESCE(SUM(l.cantidad - l.cantidad_devuelta), 0) AS unidades, COALESCE(SUM(l.importe_total), 0) AS total FROM lineas_venta l INNER JOIN ventas v ON v.id = l.venta_id AND v.tenant_id = l.tenant_id WHERE l.tenant_id = ? AND v.estado IN ('completa','parcialmente_devuelta') AND ${confirmedDate} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY l.producto_id HAVING unidades > 0 ORDER BY unidades DESC, total DESC LIMIT 1`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT COUNT(*) AS cantidad FROM (SELECT p.id FROM productos p INNER JOIN inventario i ON i.producto_id = p.id AND i.tenant_id = p.tenant_id WHERE p.tenant_id = ? AND p.eliminado = FALSE AND NOT EXISTS (SELECT 1 FROM lineas_venta l INNER JOIN ventas v ON v.id = l.venta_id AND v.tenant_id = l.tenant_id WHERE l.tenant_id = p.tenant_id AND l.producto_id = p.id AND l.cantidad > l.cantidad_devuelta AND v.estado IN ('completa','parcialmente_devuelta') AND ${confirmedDate} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) GROUP BY p.id HAVING SUM(i.cantidad) > 0) sin_ventas`, [tenantId]),
      connection.execute<RowDataPacket[]>(`SELECT COUNT(*) AS cantidad, COALESCE(SUM(v.total), 0) AS total FROM ventas v WHERE v.tenant_id = ? AND v.estado IN ('completa','parcialmente_devuelta') AND v.total >= 500 AND DATE(${confirmedDate}) >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`, [tenantId]),
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
      `SELECT v.id, v.referencia, v.estado, v.moneda, v.cliente_nombre, v.cliente_email, v.cliente_identificacion_fiscal,
              v.subtotal, v.descuento_total, v.impuesto_total, v.total, v.observaciones, v.fecha_confirmacion,
              v.fecha_anulacion, v.motivo_anulacion, v.anulada_por, ua.nombre AS anulada_por_nombre, v.created_at
       FROM ventas v
       LEFT JOIN usuarios ua ON ua.id = v.anulada_por AND ua.tenant_id = v.tenant_id
       WHERE v.id = ? AND v.tenant_id = ?`,
      [saleId, tenantId],
    );
    if (!sales.length) throw httpError(404, "Venta no encontrada");
    const [lines] = await connection.execute<RowDataPacket[]>(
      `SELECT l.id, l.producto_id, l.descripcion, l.cantidad, l.estado, l.cantidad_devuelta, l.precio_unitario,
              l.impuesto_nombre, l.impuesto_porcentaje, l.descuento_total, l.impuesto_total, l.importe_total,
              COALESCE(rd.subtotal_devuelto, 0) AS subtotal_devuelto,
              COALESCE(rd.impuesto_devuelto, 0) AS impuesto_devuelto,
              COALESCE(rd.importe_devuelto, 0) AS importe_devuelto,
              CASE WHEN l.estado = 'cancelada' THEN 0 ELSE GREATEST(l.cantidad - l.cantidad_devuelta, 0) END AS cantidad_facturable,
              CASE WHEN l.estado = 'cancelada' THEN 0 ELSE GREATEST((l.precio_unitario * l.cantidad) - COALESCE(rd.subtotal_devuelto, 0), 0) END AS subtotal_neto,
              CASE WHEN l.estado = 'cancelada' THEN 0 ELSE GREATEST(l.impuesto_total - COALESCE(rd.impuesto_devuelto, 0), 0) END AS impuesto_neto,
              CASE WHEN l.estado = 'cancelada' THEN 0 ELSE GREATEST(l.importe_total - COALESCE(rd.importe_devuelto, 0), 0) END AS importe_neto
       FROM lineas_venta l
       LEFT JOIN (
         SELECT ld.tenant_id, ld.linea_venta_id,
                SUM(ld.importe_total - ld.impuesto_total) AS subtotal_devuelto,
                SUM(ld.impuesto_total) AS impuesto_devuelto,
                SUM(ld.importe_total) AS importe_devuelto
         FROM lineas_devolucion ld
         INNER JOIN devoluciones d ON d.id = ld.devolucion_id AND d.tenant_id = ld.tenant_id
         WHERE d.estado = 'confirmada'
         GROUP BY ld.tenant_id, ld.linea_venta_id
       ) rd ON rd.linea_venta_id = l.id AND rd.tenant_id = l.tenant_id
       WHERE l.venta_id = ? AND l.tenant_id = ? ORDER BY l.id`,
      [saleId, tenantId],
    );
    const [movements] = await connection.execute<RowDataPacket[]>(
      `SELECT m.id, m.linea_venta_id, m.cantidad, m.numero_lote, m.fecha_caducidad, m.created_at,
              COALESCE((SELECT SUM(ld.cantidad) FROM lineas_devolucion ld INNER JOIN devoluciones d ON d.id = ld.devolucion_id AND d.tenant_id = ld.tenant_id WHERE ld.movimiento_salida_id = m.id AND ld.tenant_id = m.tenant_id AND d.estado = 'confirmada'), 0) AS cantidad_devuelta,
              p.nombre AS producto_nombre, u.nombre AS usuario_nombre
       FROM movimientos_inventario m
       INNER JOIN lineas_venta l ON l.id = m.linea_venta_id AND l.tenant_id = m.tenant_id
       INNER JOIN productos p ON p.id = m.producto_id AND p.tenant_id = m.tenant_id
       LEFT JOIN usuarios u ON u.id = m.usuario_id AND u.tenant_id = m.tenant_id
       WHERE l.venta_id = ? AND m.tenant_id = ? AND m.tipo = 'salida'
       ORDER BY m.id`,
      [saleId, tenantId],
    );
    const [returns] = await connection.execute<RowDataPacket[]>(
      `SELECT d.id, d.estado, d.motivo, d.subtotal, d.impuesto_total, d.total, d.fecha_devolucion, u.nombre AS usuario_nombre
       FROM devoluciones d INNER JOIN usuarios u ON u.id = d.usuario_id AND u.tenant_id = d.tenant_id
       WHERE d.venta_id = ? AND d.tenant_id = ? ORDER BY d.fecha_devolucion DESC, d.id DESC`,
      [saleId, tenantId],
    );
    const returnedSubtotal = returns.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const returnedTax = returns.reduce((sum, item) => sum + Number(item.impuesto_total || 0), 0);
    const returnedTotal = returns.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const cancelled = sales[0].estado === "anulada";
    return {
      ...sales[0],
      subtotal_devuelto: returnedSubtotal,
      impuesto_devuelto: returnedTax,
      total_devuelto: returnedTotal,
      subtotal_neto: cancelled ? 0 : Math.max(Number(sales[0].subtotal) - returnedSubtotal, 0),
      impuesto_neto: cancelled ? 0 : Math.max(Number(sales[0].impuesto_total) - returnedTax, 0),
      total_neto: cancelled ? 0 : Math.max(Number(sales[0].total) - returnedTotal, 0),
      lineas: lines,
      movimientos: movements,
      devoluciones: returns,
    };
  } finally { connection.release(); }
}

async function confirmSale(tenantId: number, userId: number, sale: SaleInput) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<ClientRow[]>("SELECT id,nombre,contacto_email,identificacion_fiscal FROM clientes WHERE id = ? AND tenant_id = ? AND activo = TRUE FOR UPDATE", [sale.clientId, tenantId]);
    if (!rows.length) throw httpError(404, "Cliente no encontrado");
    const client = rows[0];
    const [saleResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO ventas (tenant_id,cliente_id,usuario_id,estado,referencia,moneda,cliente_nombre,cliente_email,cliente_identificacion_fiscal,observaciones)
       VALUES (?,?,?,'borrador',?,?,?,?,?,?)`,
      [tenantId, sale.clientId, userId, sale.reference, sale.currency, client.nombre, client.contacto_email, client.identificacion_fiscal, sale.notes],
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
    await connection.execute("UPDATE ventas SET estado = 'pendiente_pago', subtotal = ?, impuesto_total = ?, total = ?, fecha_confirmacion = NOW() WHERE id = ? AND tenant_id = ?", [subtotalCents / 100, taxCents / 100, totalCents / 100, saleResult.insertId, tenantId]);
    await connection.commit();
    return { id: saleResult.insertId, estado: "pendiente_pago", subtotal: subtotalCents / 100, impuesto_total: taxCents / 100, total: totalCents / 100, lineas: createdLines };
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

async function cancelSale(tenantId: number, userId: number, saleId: number, reason: string) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const [sales] = await connection.execute<RowDataPacket[]>(
      "SELECT id, estado, referencia FROM ventas WHERE id = ? AND tenant_id = ? FOR UPDATE",
      [saleId, tenantId],
    );
    if (!sales.length) throw httpError(404, "Venta no encontrada");
    if (sales[0].estado === "anulada") throw httpError(409, "La venta ya está anulada");
    if (!["pendiente_pago", "completa"].includes(String(sales[0].estado))) throw httpError(409, "Solo se pueden anular ventas pendientes o completas sin devoluciones");

    const [movements] = await connection.execute<RowDataPacket[]>(
      `SELECT m.producto_id, m.linea_venta_id, m.cantidad, m.numero_lote, m.fecha_caducidad
       FROM movimientos_inventario m
       INNER JOIN lineas_venta l ON l.id = m.linea_venta_id AND l.tenant_id = m.tenant_id
       WHERE l.venta_id = ? AND m.tenant_id = ? AND m.tipo = 'salida'
       ORDER BY m.id
       FOR UPDATE`,
      [saleId, tenantId],
    );
    if (!movements.length) throw httpError(409, "La venta no tiene movimientos de salida para revertir");

    const restoredMovementIds: number[] = [];
    for (const movement of movements) {
      const restored = await movementsModel.restoreSaleStock(connection, {
        tenantId,
        userId,
        productId: Number(movement.producto_id),
        quantity: Number(movement.cantidad),
        lotNumber: movement.numero_lote || null,
        expirationDate: movement.fecha_caducidad || null,
        saleLineId: Number(movement.linea_venta_id),
        description: `Anulación de venta ${sales[0].referencia || `#${saleId}`}: ${reason}`,
      });
      restoredMovementIds.push(restored.movementId);
    }

    await connection.execute(
      `UPDATE ventas
       SET estado = 'anulada', fecha_anulacion = NOW(), anulada_por = ?, motivo_anulacion = ?
       WHERE id = ? AND tenant_id = ?`,
      [userId, reason, saleId, tenantId],
    );
    await connection.execute("UPDATE lineas_venta SET estado = 'cancelada' WHERE venta_id = ? AND tenant_id = ?", [saleId, tenantId]);
    await connection.commit();
    return { id: saleId, estado: "anulada", movimientos_entrada: restoredMovementIds };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function returnSale(tenantId: number, userId: number, saleId: number, saleReturn: SaleReturnInput) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const [sales] = await connection.execute<RowDataPacket[]>(
      "SELECT id, estado, referencia FROM ventas WHERE id = ? AND tenant_id = ? FOR UPDATE",
      [saleId, tenantId],
    );
    if (!sales.length) throw httpError(404, "Venta no encontrada");
    if (!["pendiente_pago", "completa", "parcialmente_devuelta"].includes(String(sales[0].estado))) {
      throw httpError(409, "La venta no admite más devoluciones");
    }

    const movementIds = saleReturn.lines.map((line) => line.movementId);
    const placeholders = movementIds.map(() => "?").join(",");
    const [movements] = await connection.execute<RowDataPacket[]>(
      `SELECT m.id, m.producto_id, m.linea_venta_id, m.cantidad, m.numero_lote, m.fecha_caducidad,
              l.precio_unitario, l.impuesto_porcentaje
       FROM movimientos_inventario m
       INNER JOIN lineas_venta l ON l.id = m.linea_venta_id AND l.tenant_id = m.tenant_id
       WHERE l.venta_id = ? AND m.tenant_id = ? AND m.tipo = 'salida' AND m.id IN (${placeholders})
       FOR UPDATE`,
      [saleId, tenantId, ...movementIds],
    );
    if (movements.length !== movementIds.length) throw httpError(404, "Alguno de los lotes no pertenece a la venta");

    const [previousReturns] = await connection.execute<RowDataPacket[]>(
      `SELECT ld.movimiento_salida_id, COALESCE(SUM(ld.cantidad), 0) AS cantidad
       FROM lineas_devolucion ld
       INNER JOIN devoluciones d ON d.id = ld.devolucion_id AND d.tenant_id = ld.tenant_id
       WHERE ld.tenant_id = ? AND d.estado = 'confirmada' AND ld.movimiento_salida_id IN (${placeholders})
       GROUP BY ld.movimiento_salida_id`,
      [tenantId, ...movementIds],
    );
    const alreadyReturned = new Map(previousReturns.map((row) => [Number(row.movimiento_salida_id), Number(row.cantidad)]));
    const movementById = new Map(movements.map((row) => [Number(row.id), row]));

    const [returnResult] = await connection.execute<ResultSetHeader>(
      "INSERT INTO devoluciones (tenant_id,venta_id,usuario_id,estado,motivo) VALUES (?,?,?,'confirmada',?)",
      [tenantId, saleId, userId, saleReturn.reason],
    );
    let subtotalCents = 0;
    let taxCents = 0;
    const restoredMovementIds: number[] = [];
    const touchedSaleLines = new Set<number>();

    for (const requested of saleReturn.lines) {
      const movement = movementById.get(requested.movementId)!;
      const available = Number(movement.cantidad) - (alreadyReturned.get(requested.movementId) || 0);
      if (requested.quantity > available) throw httpError(409, "La cantidad devuelta supera las unidades pendientes del lote");
      const unitCents = cents(movement.precio_unitario);
      const lineSubtotalCents = unitCents * requested.quantity;
      const lineTaxCents = Math.round(lineSubtotalCents * Number(movement.impuesto_porcentaje || 0) / 100);
      const lineTotalCents = lineSubtotalCents + lineTaxCents;
      const [returnLine] = await connection.execute<ResultSetHeader>(
        `INSERT INTO lineas_devolucion
          (tenant_id,devolucion_id,linea_venta_id,movimiento_salida_id,producto_id,cantidad,precio_unitario,impuesto_porcentaje,impuesto_total,importe_total)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [tenantId, returnResult.insertId, movement.linea_venta_id, movement.id, movement.producto_id, requested.quantity, unitCents / 100, movement.impuesto_porcentaje || 0, lineTaxCents / 100, lineTotalCents / 100],
      );
      const restored = await movementsModel.restoreSaleStock(connection, {
        tenantId,
        userId,
        productId: Number(movement.producto_id),
        quantity: requested.quantity,
        lotNumber: movement.numero_lote || null,
        expirationDate: movement.fecha_caducidad || null,
        saleLineId: Number(movement.linea_venta_id),
        returnLineId: returnLine.insertId,
        reason: "Devolución cliente",
        description: `Devolución de venta ${sales[0].referencia || `#${saleId}`}: ${saleReturn.reason}`,
      });
      restoredMovementIds.push(restored.movementId);
      touchedSaleLines.add(Number(movement.linea_venta_id));
      subtotalCents += lineSubtotalCents;
      taxCents += lineTaxCents;
    }

    for (const saleLineId of touchedSaleLines) {
      const [totals] = await connection.execute<RowDataPacket[]>(
        `SELECT l.cantidad, COALESCE(SUM(CASE WHEN d.estado = 'confirmada' THEN ld.cantidad ELSE 0 END), 0) AS devuelta
         FROM lineas_venta l
         LEFT JOIN lineas_devolucion ld ON ld.linea_venta_id = l.id AND ld.tenant_id = l.tenant_id
         LEFT JOIN devoluciones d ON d.id = ld.devolucion_id AND d.tenant_id = ld.tenant_id
         WHERE l.id = ? AND l.tenant_id = ? GROUP BY l.id, l.cantidad`,
        [saleLineId, tenantId],
      );
      const returnedQuantity = Number(totals[0].devuelta);
      const lineState = returnedQuantity >= Number(totals[0].cantidad) ? "devuelta" : "parcialmente_devuelta";
      await connection.execute("UPDATE lineas_venta SET cantidad_devuelta = ?, estado = ? WHERE id = ? AND tenant_id = ?", [returnedQuantity, lineState, saleLineId, tenantId]);
    }

    const [pendingLines] = await connection.execute<RowDataPacket[]>(
      "SELECT COUNT(*) AS cantidad FROM lineas_venta WHERE venta_id = ? AND tenant_id = ? AND cantidad_devuelta < cantidad",
      [saleId, tenantId],
    );
    const saleState = Number(pendingLines[0].cantidad) === 0 ? "devuelta" : "parcialmente_devuelta";
    const totalCents = subtotalCents + taxCents;
    await connection.execute("UPDATE devoluciones SET subtotal = ?, impuesto_total = ?, total = ? WHERE id = ? AND tenant_id = ?", [subtotalCents / 100, taxCents / 100, totalCents / 100, returnResult.insertId, tenantId]);
    await connection.execute("UPDATE ventas SET estado = ? WHERE id = ? AND tenant_id = ?", [saleState, saleId, tenantId]);
    await connection.commit();
    return { id: returnResult.insertId, venta_id: saleId, estado_venta: saleState, subtotal: subtotalCents / 100, impuesto_total: taxCents / 100, total: totalCents / 100, movimientos_entrada: restoredMovementIds };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function completeSale(tenantId: number, saleId: number) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute<ResultSetHeader>(
      "UPDATE ventas SET estado = 'completa' WHERE id = ? AND tenant_id = ? AND estado = 'pendiente_pago'",
      [saleId, tenantId],
    );
    if (result.affectedRows) return { id: saleId, estado: "completa" };
    const [sales] = await connection.execute<RowDataPacket[]>("SELECT estado FROM ventas WHERE id = ? AND tenant_id = ?", [saleId, tenantId]);
    if (!sales.length) throw httpError(404, "Venta no encontrada");
    throw httpError(409, "Solo se pueden completar ventas pendientes de pago");
  } finally {
    connection.release();
  }
}

export { cancelSale, completeSale, confirmSale, getSaleDetail, getSaleFilterOptions, getSaleSummary, listSales, returnSale };
