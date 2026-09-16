import { useState, useEffect, useMemo } from "react";
import { productService } from "./productService";

// MySQL decimal and aggregate values may arrive as strings.
type NumericValue = number | string;
export type SortField = "predefinido" | "stock_total" | "precio_compra" | "fecha_caducidad";
export type SortOrder = "asc" | "desc";

export interface Product {
  producto_id: number;
  producto_nombre: string;
  producto_descripcion: string | null;
  categoria_id: number | null;
  producto_categoria: string | null;
  precio_compra: NumericValue;
  precio_venta: NumericValue;
  stock_minimo: NumericValue;
  stock_total: NumericValue;
  fecha_caducidad: string | null;
}

export interface Category {
  id: number;
  nombre: string;
  descripcion: string | null;
  tenant_id: number;
}

interface QuickSaleResult {
  stock_nuevo: NumericValue;
}

export const useProducts = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("predefinido");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (): Promise<void> => {
    try {
      const data: Product[] = await productService.getAll();
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (): Promise<void> => {
    try {
      const data: Category[] = await productService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCategoryFilter = async (categoryId: string): Promise<void> => {
    setSelectedCategory(categoryId);
    setSearch("");

    if (!categoryId) {
      await fetchProducts();
      return;
    }

    try {
      const data: Product[] = await productService.getByCategory(categoryId);
      setItems(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async (value: string): Promise<void> => {
    setSearch(value);

    if (!value && selectedCategory) {
      await handleCategoryFilter(selectedCategory);
      return;
    }

    if (selectedCategory) {
      setSelectedCategory("");
    }

    try {
      const data: Product[] = await productService.search(value);
      setItems(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSoftDelete = async (productId: Product["producto_id"]): Promise<void> => {
    try {
      await productService.softDelete(productId);
      setItems((prev) => prev.filter((item) => item.producto_id !== productId));
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleQuickSale = async (productId: Product["producto_id"], quantity: number): Promise<QuickSaleResult> => {
    try {
      const result: QuickSaleResult = await productService.quickSale(productId, quantity);
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
      let aVal: number;
      let bVal: number;

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
