const API_URL = import.meta.env.VITE_API_URL;

export async function getProductById(id) {
  const res = await fetch(`${API_URL}/productos/${id}`);
  if (!res.ok) throw new Error("Error al obtener producto");
  return res.json();
}

export async function updateProduct(id, data) {
  console.log("Updating product id:", id);
  
  const {
    producto_id,
    producto_categoria,
    nombre,
    descripcion,
    precio_compra,
    precio_venta,
    stock_minimo
   
  } = data;
  console.log("Updating product with data:", data);

  const res = await fetch(`${API_URL}/productos/actualizar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Error al actualizar");
  }

  return res.json();
}

export async function getCategorias() {
  const res = await fetch(`${API_URL}/productos/categorias`);
  if (!res.ok) throw new Error("Error categorías");
  return res.json();
}