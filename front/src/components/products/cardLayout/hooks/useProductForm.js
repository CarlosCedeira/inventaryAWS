import { useEffect, useState } from "react";
import { getProductById, getCategorias, getImpuestos, updateProduct } from "../services/productService";

export function useProduct(id) {
  const [formData, setFormData] = useState({ inventario: [] });
  const [categorias, setCategorias] = useState([]);
  const [impuestos, setImpuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    async function load() {
      try {
        const [product, cats, taxes] = await Promise.all([getProductById(id), getCategorias(), getImpuestos()]);
        if (!active) return;
        setFormData({ ...product, categoria_id: product?.categoria_id ?? "", impuesto_id: product?.impuesto_id ?? "" });
        setCategorias(cats);
        setImpuestos(taxes);
      } catch (error) {
        if (active) setLoadError(error.message || "No se pudo cargar la ficha");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [id, revision]);
  return { formData, setFormData, categorias, impuestos, loading, loadError,
    reload: () => setRevision((value) => value + 1),
    update: (data) => updateProduct(id, data) };
}
