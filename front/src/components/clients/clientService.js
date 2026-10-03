import { fetchWithAuth } from "../../services/authService";

const API_URL = import.meta.env.VITE_API_URL;

async function readError(response, fallback) {
  const payload = await response.json().catch(() => ({}));
  return payload.error || fallback;
}

export const clientService = {
  async getAll(search = "", daysWithoutPurchase = null) {
    const params = new URLSearchParams();
    if (search.trim()) params.set("buscar", search.trim());
    if (daysWithoutPurchase) params.set("sin_compras_dias", String(daysWithoutPurchase));
    const query = params.size ? `?${params.toString()}` : "";
    const response = await fetchWithAuth(`${API_URL}/clientes${query}`);
    if (!response.ok) throw new Error(await readError(response, "No se pudieron cargar los clientes"));
    return response.json();
  },

  async create(client) {
    const response = await fetchWithAuth(`${API_URL}/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error(await readError(response, "No se pudo crear el cliente"));
    return response.json();
  },

  async update(clientId, client) {
    const response = await fetchWithAuth(`${API_URL}/clientes/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error(await readError(response, "No se pudo actualizar el cliente"));
    return response.json();
  },
};
