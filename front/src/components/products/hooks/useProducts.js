import { useState, useEffect } from "react";
import { productService } from "../services/productService";

export const useProducts = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
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

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCategoryFilter = async (categoryId) => {
    setSelectedCategory(categoryId);
    setSearch("");

    if (!categoryId) {
      await fetchProducts();
      return;
    }

    try {
      const data = await productService.getByCategory(categoryId);
      setItems(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async (value) => {
    setSearch(value);

    if (!value && selectedCategory) {
      await handleCategoryFilter(selectedCategory);
      return;
    }

    if (selectedCategory) {
      setSelectedCategory("");
    }

    try {
      const data = await productService.search(value);
      setItems(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSoftDelete = async (productId) => {
    try {
      await productService.softDelete(productId);
      setItems((prev) => prev.filter((item) => item.producto_id !== productId));
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // inicial
  useEffect(() => {
    fetchProducts();
    fetchCategories();
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
    categories,
    selectedCategory,
    search,
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    handleCategoryFilter,
    handleSearch,
    handleSoftDelete,
    refetch: fetchProducts,
    refetchCategories: fetchCategories,
  };
};
