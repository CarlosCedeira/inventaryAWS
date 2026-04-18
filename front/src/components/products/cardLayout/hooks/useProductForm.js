import { useEffect, useState } from "react";
import {
  getProductById,
  getCategorias,
  updateProduct,
} from "../services/productService";

export function useProduct(id) {
  const [formData, setFormData] = useState({ inventario: [] });
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [product, cats] = await Promise.all([
          getProductById(id),
          getCategorias(),
        ]);

        setFormData(product);
        setCategorias(cats);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const update = (data) => updateProduct(id, data);

  return {
    formData,
    setFormData,
    categorias,
    loading,
    update,
  };
}