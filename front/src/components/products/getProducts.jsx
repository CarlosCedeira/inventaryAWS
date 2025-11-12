import React, { useEffect, useState } from "react";
import Spinners from "../spiners";
import "./getProducts.css";
import CardLayout from "../cardLayout/CardLayout";
import Publicado from "./publicado/putPublicado";

const GetProducts = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("predefinido");
  const [sortOrder, setSortOrder] = useState("asc");
  const [fadeIn, setFadeIn] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Función para obtener productos desde la API
  const fetchProducts = async () => {
    try {
      const response = await fetch(`http://localhost:3000/productos`);
      if (!response.ok) throw new Error("Error al obtener los productos");

      const data = await response.json();
      setItems(data);
      console.log(items, "items en getProducts");
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const productsSearch = useEffect(() => {
    fetchProducts();
  }, []);

  // Activa el fade-in solo cuando loading pasa a false
  useEffect(() => {
    if (!loading) {
      // Pequeño timeout para asegurar que el DOM se actualiza antes de aplicar la clase
      const fadeTimer = setTimeout(() => setFadeIn(true), 10);
      return () => clearTimeout(fadeTimer);
    } else {
      setFadeIn(false);
    }
  }, [loading]);

  useEffect(() => {
    if (showCard) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Limpieza por si el componente se desmonta con el modal abierto
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCard]);

  const handleTdClick = (product) => {
    setSelectedProduct(product);
    setShowCard(true);
  };

  const handleCloseCard = () => setShowCard(false);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/productos?search=${search}`
        );
        if (!response.ok) throw new Error("Error al obtener los productos");

        const data = await response.json();
        setItems(data);
        console.log(data, "items recibidos desde backend");
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
  };

  if (loading) return <Spinners />;

  return (
    <>
      <h1 className="text-center mt-3 mb-5">Listado de productos</h1>
      <div className="d-flex align-items-center justify-content-right ms-5 sticky-top w-90">
        <div className="m-2 d-flex justify-content-right">
          <input
            type="text"
            className="form-control w-100 "
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => handleSearch(e)}
          />
        </div>
        <div className="m-2 mx-5 d-flex align-items-center">
          <select
            className="form-select w-auto mx-2"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="predefinido">Ordenar por</option>
            <option value="cantidad">Cantidad</option>
            <option value="precio_compra">Precio</option>
          </select>
          <select
            className="form-select w-auto mx-2"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="asc">Menor</option>
            <option value="desc">Mayor</option>
          </select>
        </div>
      </div>
      <div className={`fade-init${fadeIn ? " fade-in" : ""} ms-5`}>
        <table className="table table-responsive table-hover align-middle shadow">
          <thead className="table-primary sticky-top ">
            <tr>
              <th className="text-start">Nombre</th>
              <th className="text-start">Categoria</th>
              <th className="text-start">Cantidad</th>
              <th className="text-start">Precio de Compra</th>
              <th className="text-start">Precio de venta</th>
              <th className="text-start">Caducidad</th>
              <th className="text-start">Publicado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.producto_id}>
                <td className="text-start" onClick={() => handleTdClick(item)}>
                  {item.producto_nombre}
                </td>

                <td className="text-start" onClick={() => handleTdClick(item)}>
                  {item.producto_categoria}
                </td>
                <td className="text-start" onClick={() => handleTdClick(item)}>
                  {item.cantidad}
                </td>
                <td className="text-start" onClick={() => handleTdClick(item)}>
                  {item.precio_compra}
                </td>
                <td className="text-start" onClick={() => handleTdClick(item)}>
                  {item.precio_venta}
                </td>
                <td className="text-start" onClick={() => handleTdClick(item)}>
                  {item.caducidad}
                </td>
                <Publicado producto={item} publicado={item.publicado} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showCard && selectedProduct && (
        <CardLayout product={selectedProduct} onClose={handleCloseCard} />
      )}
    </>
  );
};

export default GetProducts;
