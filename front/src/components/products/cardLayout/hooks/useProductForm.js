import { useEffect, useState } from "react";
import { getProductById, getCategorias, updateProduct } from "../services/productService";

export function useProduct(id) {
  const [formData, setFormData] = useState({ inventario: [] });
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    async function load() {
      try {
        const [product, cats] = await Promise.all([getProductById(id), getCategorias()]);
        if (!active) return;
        setFormData({ ...product, categoria_id: product?.categoria_id ?? "" });
        setCategorias(cats);
      } catch (error) {
        if (active) setLoadError(error.message || "No se pudo cargar la ficha");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [id, revision]);
  return { formData, setFormData, categorias, loading, loadError,
    reload: () => setRevision((value) => value + 1),
    update: (data) => updateProduct(id, data) };
}
