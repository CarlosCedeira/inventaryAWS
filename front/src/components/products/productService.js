const API_URL = import.meta.env.VITE_API_URL;

export const productService = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/productos`);
    if (!res.ok) throw new Error("Error al obtener productos");
    return res.json();
  },

  search: async (search) => {
    const url = search
      ? `${API_URL}/productos/buscar/${search}`
      : `${API_URL}/productos`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Error al buscar productos");
    return res.json();
  },
};