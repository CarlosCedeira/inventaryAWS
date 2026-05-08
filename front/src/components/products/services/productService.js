import { fetchWithAuth } from "../../../services/authService";

const API_URL = import.meta.env.VITE_API_URL;

export const productService = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/productos`);
    if (!res.ok) throw new Error("Error al obtener productos");
    return res.json();
  },

  search: async (search) => {
    const url = search
      ? `${API_URL}/productos/buscar/${search}`
      : `${API_URL}/productos`;

    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error("Error al buscar productos");
    return res.json();
  },

  getCategories: async () => {
    const res = await fetchWithAuth(`${API_URL}/productos/categorias`);
    if (!res.ok) throw new Error("Error al obtener categorias");
    return res.json();
  },

  getByCategory: async (categoryId) => {
    const res = await fetchWithAuth(`${API_URL}/productos/categoria/${categoryId}`);
    if (!res.ok) throw new Error("Error al filtrar por categoria");
    return res.json();
  },

  createCategory: async (categoryData) => {
    const res = await fetchWithAuth(`${API_URL}/productos/categorias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryData),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "Error al crear categoria");
    }

    return res.json();
  },

  softDelete: async (productId) => {
    const res = await fetchWithAuth(`${API_URL}/productos/eliminar/${productId}`, {
      method: "PATCH",
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "Error al eliminar producto");
    }

    return res.json();
  },
};
