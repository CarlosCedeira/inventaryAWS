import { inventoryVersion } from "./inventory.version";
import type { ProductDetailRow } from "./inventory.types";

interface InventoryLot {
  inventario_id: number;
  version: string;
  cantidad: number | null;
  fecha_caducidad: Date | null;
  numero_lote: string | null;
}

interface ProductWithInventory {
  producto_id: number;
  nombre: string;
  descripcion: string | null;
  categoria_nombre: string | null;
  categoria_id: number | null;
  precio_compra: string;
  precio_venta: string;
  stock_minimo: number;
  inventario: InventoryLot[];
  impuesto_id?: number | null;
  impuesto_nombre?: string | null;
  impuesto_porcentaje?: string | null;
}

function groupProductWithInventory(rows: ProductDetailRow[]): ProductWithInventory | undefined {
  const map = new Map<number, ProductWithInventory>();

  rows.forEach(row => {
    if (!map.has(row.producto_id)) {
      const product: ProductWithInventory = {
        producto_id: row.producto_id,
        nombre: row.producto_nombre,
        descripcion: row.producto_descripcion,
        categoria_nombre: row.producto_categoria,
        categoria_id: row.categoria_id,
        precio_compra: row.precio_compra,
        precio_venta: row.precio_venta,
        stock_minimo: row.stock_minimo,
        inventario: []
      };
      if (Object.hasOwn(row, "impuesto_id")) {
        product.impuesto_id = row.impuesto_id;
        product.impuesto_nombre = row.impuesto_nombre;
        product.impuesto_porcentaje = row.impuesto_porcentaje;
      }
      map.set(row.producto_id, product);
    }

    const product = map.get(row.producto_id);
    if (row.inventario_id != null && product) product.inventario.push({
      inventario_id: row.inventario_id,
      version: inventoryVersion(row),
      cantidad: row.cantidad,
      fecha_caducidad: row.fecha_caducidad,
      numero_lote: row.numero_lote
    });
  });

  return Array.from(map.values())[0]; // si es un producto único
}

export {
  groupProductWithInventory
};
