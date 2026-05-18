import { fetchWithAuth } from "../../../../services/authService";

const API_URL = import.meta.env.VITE_API_URL;

export async function getProductById(id) {
  const res = await fetchWithAuth(`${API_URL}/productos/${id}`);
  if (!res.ok) throw new Error("Error al obtener producto");
  return res.json();
}

export async function updateProduct(id, data) {
  console.log("Updating product id:", id);
  console.log("Updating product with data:", data);

  const res = await fetchWithAuth(`${API_URL}/productos/actualizar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Error al actualizar");
  }

  return res.json();
}

export async function getCategorias() {
  const res = await fetchWithAuth(`${API_URL}/productos/categorias`);
  if (!res.ok) throw new Error("Error categorías");
  return res.json();
}
