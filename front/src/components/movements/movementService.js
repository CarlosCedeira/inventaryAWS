import { fetchWithAuth } from "../../services/authService";

const API_URL = import.meta.env.VITE_API_URL;

export const movementService = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/movimientos`);
    if (!res.ok) throw new Error("Error al obtener movimientos");
    return res.json();
  },

  create: async (movementData) => {
    const res = await fetchWithAuth(`${API_URL}/movimientos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movementData),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "Error al registrar movimiento");
    }

    return res.json();
  },
};
