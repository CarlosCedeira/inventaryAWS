import { createContext, useState, useEffect } from "react";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch general
  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:3000/productos");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ProductContext.Provider
      value={{
        items,
        setItems,
        loading,
        setLoading,
        selectedProduct,
        setSelectedProduct,
        fetchProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
