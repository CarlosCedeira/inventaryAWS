import { useState, useEffect, useMemo } from "react";
import { productService } from "./productService";

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

  const handleQuickSale = async (productId, quantity) => {
    try {
      const result = await productService.quickSale(productId, quantity);
      setItems((prev) =>
        prev.map((item) =>
          item.producto_id === productId
            ? { ...item, stock_total: result.stock_nuevo }
            : item
        )
      );
      return result;
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
  const sortedItems = useMemo(() => {
    if (sortField === "predefinido") return items;

    return [...items].sort((a, b) => {
      let aVal;
      let bVal;

      if (sortField === "fecha_caducidad") {
        aVal = a.fecha_caducidad
          ? new Date(a.fecha_caducidad).getTime()
          : Infinity;

        bVal = b.fecha_caducidad
          ? new Date(b.fecha_caducidad).getTime()
          : Infinity;
      } else {
        aVal = Number(a[sortField]);
        bVal = Number(b[sortField]);
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [items, sortField, sortOrder]);

  return {
    items: sortedItems,
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
    handleQuickSale,
    refetch: fetchProducts,
    refetchCategories: fetchCategories,
  };
};
