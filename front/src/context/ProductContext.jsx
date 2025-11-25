import { createContext, useState } from "react";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [publishedStates, setPublishedStates] = useState({});

  const togglePublished = (id) => {
    setPublishedStates((prev) => ({
      ...prev,
      [id]: prev[id] === 1 ? 0 : 1,
    }));
  };

  return (
    <ProductContext.Provider
      value={{
        items,
        setItems,
        loading,
        setLoading,
        selectedProduct,
        setSelectedProduct,

        // 🔥 nuevo manejo GLOBAL por id
        publishedStates,
        togglePublished,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
