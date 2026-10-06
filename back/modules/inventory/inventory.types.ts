import type { RowDataPacket } from "mysql2/promise";

export type ProductId = number | string;
export type InventoryDate = string | number | Date | null;

export interface ProductFields {
  nombre: string;
  descripcion: string;
  categoria_id: number;
  impuesto_id: number | null;
  precio_compra: number;
  precio_venta: number;
  stock_minimo: number;
}

export interface InventoryFields {
  cantidad: number;
  fecha_caducidad: InventoryDate;
  numero_lote: string | null;
}

export interface InventoryUpdate extends InventoryFields {
  inventario_id: ProductId;
  version: string;
}

export interface CategoryFields {
  nombre: string;
  descripcion: string | null;
}

export interface TaxFields {
  id: number;
  nombre: string;
  porcentaje: string;
}

export interface InventoryRow extends RowDataPacket {
  id: number;
  cantidad: number;
  fecha_caducidad: Date | string | null;
  numero_lote: string | null;
}

export interface ProductRow extends RowDataPacket {
  producto_id: number;
  producto_nombre: string;
  producto_descripcion: string | null;
  categoria_id: number | null;
  producto_categoria: string | null;
  impuesto_id: number | null;
  impuesto_nombre: string | null;
  impuesto_porcentaje: string | null;
  precio_compra: string;
  precio_venta: string;
  stock_minimo: number;
}

export interface ProductSummaryRow extends ProductRow {
  stock_total: string;
  lotes_activos: number;
  stock_fisico: string;
  stock_disponible: string;
  stock_caducado: string;
  fecha_caducidad: Date | null;
}

export interface ProductDetailRow extends ProductRow {
  tenant_id: number;
  inventario_id: number | null;
  cantidad: number | null;
  fecha_caducidad: Date | null;
  updated_at: Date | null;
  numero_lote: string | null;
}

export interface InventoryMovement {
  tenantId: number;
  productId: ProductId;
  inventoryId: ProductId;
  userId: number;
  type: "entrada" | "salida" | "ajuste";
  quantity: number;
  previousStock: number;
  newStock: number;
  lotNumber: string | null;
  expirationDate: InventoryDate;
  reason: string;
  description: string;
}
