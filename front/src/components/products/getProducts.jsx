import React, { useEffect, useState } from "react";
import getProducts from "./getData.js";
import Spinners from "../spiners";
import "./getProducts.css";
import CardLayout from "../CardLayout";

const GetProducts = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("predefinido");
  const [sortOrder, setSortOrder] = useState("asc");
  const [fadeIn, setFadeIn] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProducts(getProducts);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
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

  const filteredProducts = products
    .filter((product) =>
      product.nombre.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortField === "predefinido") {
        return;
      }
      if (sortOrder === "asc") {
        return a[sortField] - b[sortField];
      } else {
        return b[sortField] - a[sortField];
      }
    });

  if (loading) return <Spinners />;

  return (
    <>
      <h1 className="text-center mt-3 mb-5">Lista de productos</h1>
      <div className="d-flex align-items-center justify-content-right mb-3">
        <div className="mb-3 d-flex justify-content-right">
          <input
            type="text"
            className="form-control w-100"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mb-3 mx-5 d-flex align-items-center">
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
      <div className={`fade-init${fadeIn ? " fade-in" : ""}`}>
        <table className="table table-responsive table-hover align-middle shadow">
          <thead className="table-primary sticky-top">
            <tr>
              <th className="text-start">Nombre</th>
              <th className="text-start">Categoría</th>
              <th className="text-start">Cantidad</th>
              <th className="text-start">Precio de Compra</th>
              <th className="text-start">Caducidad</th>
              <th className="text-start">Ubicación</th>
              {/*<th className="text-start">Unidad de medida</th> */}
              {/* <th className="text-start">Cantidad de medida</th> */}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td
                  className="text-start"
                  onClick={() => handleTdClick(product)}
                >
                  {product.nombre}
                </td>
                <td
                  className="text-start"
                  onClick={() => handleTdClick(product)}
                >
                  {product.id_categoria}
                </td>
                <td
                  className="text-center"
                  onClick={() => handleTdClick(product)}
                >
                  {product.cantidad}
                </td>
                <td
                  className="text-center"
                  onClick={() => handleTdClick(product)}
                >
                  {product.precio_compra}
                </td>
                <td
                  className="text-start"
                  onClick={() => handleTdClick(product)}
                >
                  {product.caducidad}
                </td>
                <td
                  className="text-start"
                  onClick={() => handleTdClick(product)}
                >
                  {product.ubicacion}
                </td>
                {/*<td
                  className="text-start"
                  onClick={() => handleTdClick(product)}
                >
                  {product.unidad_medida}
                </td>
                <td
                  className="text-start"
                  onClick={() => handleTdClick(product)}
                >
                  {product.cantidad_medida}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showCard && selectedProduct && (
        <CardLayout
          product={selectedProduct}
          onClose={handleCloseCard}
          // Puedes pasar más props si lo necesitas
        />
      )}
    </>
  );
};

export default GetProducts;

{
  /*const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from the API
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          "https://76ywzcxwjf7oz4a6ag5eqo3ncq0nljiu.lambda-url.eu-west-1.on.aws/"
        );
        if (!response.ok) {
          throw new Error("Error fetching data");
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
*/
}
