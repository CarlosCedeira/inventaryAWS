import { fetchWithAuth } from "../../services/authService";
const API_URL = import.meta.env.VITE_API_URL;
async function request(url, init) { const response = await fetchWithAuth(url, init); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || "No se pudo completar la operación"); } return response.json(); }
export const salesService = {
  list: (filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) query.set(key, String(value));
    });
    const suffix = query.size ? `?${query.toString()}` : "";
    return request(`${API_URL}/ventas${suffix}`);
  },
  filterOptions: () => request(`${API_URL}/ventas/filtros`),
  export: async (dateFrom, dateTo) => {
    const response = await fetchWithAuth(`${API_URL}/ventas/exportar?fecha_desde=${encodeURIComponent(dateFrom)}&fecha_hasta=${encodeURIComponent(dateTo)}`);
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || "No se pudieron exportar las ventas"); }
    return response.blob();
  },
  summary: () => request(`${API_URL}/ventas/resumen`),
  getById: (saleId) => request(`${API_URL}/ventas/${saleId}`),
  create: (sale) => request(`${API_URL}/ventas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sale) }),
  cancel: (saleId, reason) => request(`${API_URL}/ventas/${saleId}/anular`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ motivo: reason }) }),
  return: (saleId, saleReturn) => request(`${API_URL}/ventas/${saleId}/devolver`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(saleReturn) }),
  complete: (saleId) => request(`${API_URL}/ventas/${saleId}/completar`, { method: "POST" }),
};
