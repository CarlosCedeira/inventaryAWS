import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

const { getConnection } = require("../../db") as {
  getConnection: () => Promise<import("mysql2/promise").PoolConnection>;
};

export interface CommercialClientInput {
  nombre: string;
  email: string | null;
  telefono: string | null;
  identificacion_fiscal: string | null;
  direccion: string | null;
  activo: boolean;
}

export interface CommercialClientRow extends RowDataPacket, CommercialClientInput {
  id: number;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

async function listCommercialClients(tenantId: number, search = "", daysWithoutPurchase: number | null = null, activeStatus: boolean | null = null) {
  const connection = await getConnection();
  try {
    const pattern = `%${search}%`;
    const [rows] = await connection.execute<CommercialClientRow[]>(
      `
      SELECT id, tenant_id, nombre, contacto_email AS email, telefono, identificacion_fiscal,
             direccion, activo, created_at, updated_at,
             (SELECT MAX(COALESCE(v.fecha_confirmacion, v.created_at))
                FROM ventas v
               WHERE v.tenant_id = clientes.tenant_id
                 AND v.cliente_id = clientes.id
                 AND v.estado = 'completa') AS ultima_compra,
             (SELECT COUNT(*)
                FROM ventas v
               WHERE v.tenant_id = clientes.tenant_id
                 AND v.cliente_id = clientes.id
                 AND v.estado = 'completa'
                 AND COALESCE(v.fecha_confirmacion, v.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) AS compras_30d
      FROM clientes
      WHERE tenant_id = ?
        AND (? = '' OR nombre LIKE ? OR contacto_email LIKE ? OR identificacion_fiscal LIKE ?)
        AND (? IS NULL OR activo = ?)
        AND (? IS NULL OR (activo = TRUE AND NOT EXISTS (
          SELECT 1 FROM ventas v
          WHERE v.tenant_id = clientes.tenant_id AND v.cliente_id = clientes.id
            AND v.estado = 'completa' AND COALESCE(v.fecha_confirmacion, v.created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        )))
      ORDER BY activo DESC, nombre ASC, id ASC
      LIMIT 100
      `,
      [tenantId, search, pattern, pattern, pattern, activeStatus, activeStatus, daysWithoutPurchase, daysWithoutPurchase],
    );
    return rows;
  } finally {
    connection.release();
  }
}

async function createCommercialClient(tenantId: number, client: CommercialClientInput) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute<ResultSetHeader>(
      `
      INSERT INTO clientes
        (tenant_id, nombre, contacto_email, telefono, identificacion_fiscal, direccion, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [tenantId, client.nombre, client.email, client.telefono, client.identificacion_fiscal, client.direccion, client.activo],
    );
    return result.insertId;
  } finally {
    connection.release();
  }
}

async function updateCommercialClient(tenantId: number, clientId: number, client: CommercialClientInput) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute<ResultSetHeader>(
      `
      UPDATE clientes
      SET nombre = ?, contacto_email = ?, telefono = ?, identificacion_fiscal = ?, direccion = ?, activo = ?
      WHERE tenant_id = ? AND id = ?
      `,
      [client.nombre, client.email, client.telefono, client.identificacion_fiscal, client.direccion, client.activo, tenantId, clientId],
    );
    return result.affectedRows;
  } finally {
    connection.release();
  }
}

export { listCommercialClients, createCommercialClient, updateCommercialClient };
