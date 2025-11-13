import { createContext, useState } from "react";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [itsPublish, setItsPublish] = useState(false);

  // 🔹 Función que acepta un id opcional

  return (
    <ProductContext.Provider
      value={{
        items,
        setItems,
        loading,
        setLoading,
        selectedProduct,
        setSelectedProduct,
        itsPublish,
        setItsPublish,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
