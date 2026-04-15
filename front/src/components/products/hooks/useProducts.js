import { useState, useEffect } from "react";
import { productService } from "../services/productService";

export const useProducts = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("predefinido");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const data = await productService.getAll();
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value) => {
    setSearch(value);
    try {
      const data = await productService.search(value);
      setItems(data);
    } catch (error) {
      console.error(error);
    }
  };

  // inicial
  useEffect(() => {
    fetchProducts();
  }, []);

  // ordenar
  useEffect(() => {
    if (sortField === "predefinido") return;

    const sorted = [...items].sort((a, b) => {
      const aVal = Number(a[sortField]);
      const bVal = Number(b[sortField]);

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    setItems(sorted);
  }, [sortField, sortOrder]);

  return {
    items,
    loading,
    search,
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    handleSearch,
    refetch: fetchProducts,
  };
};