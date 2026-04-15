const API_URL = import.meta.env.VITE_API_URL;

export const getProductById = async (id) => {
  const res = await fetch(`${API_URL}/productos/${id}`);
  if (!res.ok) throw new Error("Error al obtener producto");
  return res.json();
};

export const getCategorias = async () => {
  const res = await fetch(`${API_URL}/productos/categorias`);
  if (!res.ok) throw new Error("Error al obtener categorías");
  return res.json();
};

export const updateProduct = async (id, data) => {
  const res = await fetch(`${API_URL}/productos/actualizar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Error al actualizar");
  return res.json();
};