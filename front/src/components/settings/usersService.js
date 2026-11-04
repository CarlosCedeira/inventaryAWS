import { fetchWithAuth } from "../../services/authService";

const API_URL = import.meta.env.VITE_API_URL;

async function request(path, init) {
  const response = await fetchWithAuth(`${API_URL}${path}`, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "No se pudo completar la operación");
  }
  return response.status === 204 ? null : response.json();
}

export const usersService = {
  list: () => request("/usuarios"),
  create: (user) => request("/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) }),
  update: (id, user) => request(`/usuarios/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) }),
  resetPassword: (id, password) => request(`/usuarios/${id}/restablecer-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) }),
};
