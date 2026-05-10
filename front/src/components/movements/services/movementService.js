import { fetchWithAuth } from "../../../services/authService";

const API_URL = import.meta.env.VITE_API_URL;

export const movementService = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/movimientos`);
    if (!res.ok) throw new Error("Error al obtener movimientos");
    return res.json();
  },
};
