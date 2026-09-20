import { fetchWithAuth } from "../../services/authService";

const API_URL = import.meta.env.VITE_API_URL;

export type MovementType = "entrada" | "salida" | "ajuste";
export type NumericValue = number | string;

export interface Movement {
  movimiento_id: number;
  tenant_id: number;
  producto_id: number;
  producto_nombre: string;
  categoria_id: number | null;
  producto_categoria: string | null;
  inventario_id: number | null;
  tipo: MovementType;
  cantidad: NumericValue;
  stock_anterior: NumericValue;
  stock_nuevo: NumericValue;
  numero_lote: string | null;
  fecha_caducidad: string | null;
  motivo: string | null;
  descripcion: string | null;
  usuario_id: number;
  usuario_nombre: string | null;
  created_at: string;
}

export interface MovementFilters {
  type?: MovementType;
  startDate?: string;
  endDate?: string;
}

export interface CreateMovementPayload {
  tipo: MovementType;
  producto_id: number;
  inventario_id: number | null;
  cantidad: number;
  numero_lote?: string | null;
  fecha_caducidad?: string | null;
  motivo?: string | null;
}

function buildFiltersQuery(filters: MovementFilters): string {
  const params = new URLSearchParams();
  if (filters.type) params.set("tipo", filters.type);
  if (filters.startDate) params.set("fecha_desde", filters.startDate);
  if (filters.endDate) params.set("fecha_hasta", filters.endDate);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const movementService = {
  getAll: async (filters: MovementFilters = {}): Promise<Movement[]> => {
    const res = await fetchWithAuth(`${API_URL}/movimientos${buildFiltersQuery(filters)}`);
    if (!res.ok) throw new Error("Error al obtener movimientos");
    return res.json() as Promise<Movement[]>;
  },

  create: async (movementData: CreateMovementPayload) => {
    const res = await fetchWithAuth(`${API_URL}/movimientos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movementData),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "Error al registrar movimiento");
    }

    return res.json() as Promise<{ movementId: number; stock_anterior: number; stock_nuevo: number }>;
  },
};
