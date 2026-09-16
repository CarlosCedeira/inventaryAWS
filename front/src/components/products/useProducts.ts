import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { productService } from "./productService";

// MySQL decimal and aggregate values may arrive as strings.
type NumericValue = number | string;
export type SortField = "predefinido" | "stock_total" | "stock_disponible" | "precio_compra" | "fecha_caducidad";
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
  stock_fisico: NumericValue;
  stock_disponible: NumericValue;
  stock_caducado: NumericValue;
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
  stock_fisico: NumericValue;
  stock_disponible: NumericValue;
  stock_caducado: NumericValue;
  fecha_caducidad: string | null;
}

export const useProducts = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("predefinido");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const requestId = useRef(0);
  const invalidateRequests = useCallback(() => { ++requestId.current; }, []);

  const fetchProducts = useCallback(async (): Promise<void> => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const data: Product[] = search
        ? await productService.search(search)
        : selectedCategory
          ? await productService.getByCategory(selectedCategory)
          : await productService.getAll();
      const filtered = selectedCategory
        ? data.filter((item) => String(item.categoria_id) === selectedCategory)
        : data;
      if (currentRequest === requestId.current) setItems(filtered);
    } catch (failure) {
      if (currentRequest === requestId.current) {
        setError(failure instanceof Error ? failure.message : "No se pudieron cargar los productos");
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [search, selectedCategory]);

  const fetchCategories = useCallback(async (): Promise<void> => {
    setCategoryError("");
    try {
      const data: Category[] = await productService.getCategories();
      setCategories(data);
    } catch {
      setCategoryError("No se pudieron cargar las categorías");
    }
  }, []);

  const handleCategoryFilter = (categoryId: string): void => {
    ++requestId.current;
    setSelectedCategory(categoryId);
  };

  const handleSearch = (value: string): void => {
    ++requestId.current;
    setSearch(value);
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
            ? { ...item, stock_total: result.stock_nuevo, stock_fisico: result.stock_fisico, stock_disponible: result.stock_disponible, stock_caducado: result.stock_caducado, fecha_caducidad: result.fecha_caducidad }
            : item
        )
      );
      await fetchProducts();
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  useEffect(() => {
    void fetchProducts();
    const refresh = () => { if (!document.hidden) void fetchProducts(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    // Refresh dates and stock while an inventory tab remains open overnight.
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      invalidateRequests();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(timer);
    };
  }, [fetchProducts, invalidateRequests]);

  useEffect(() => { void fetchCategories(); }, [fetchCategories]);

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
    error,
    categoryError,
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
