import React, { useEffect, useState } from "react";
import Spinners from "../spiners";
import "./getProducts.css";
import CardLayout from "../cardLayout/CardLayout";

const GetProducts = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("predefinido");
  const [sortOrder, setSortOrder] = useState("asc");
  const [fadeIn, setFadeIn] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Función para obtener productos desde la API
  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:3000/productos");
      if (!response.ok) {
        throw new Error("Error al obtener los productos");
      }
      const data = await response.json();
      console.log(data);
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      <h1 className="text-center mt-3 mb-5">Listado de productos</h1>
      <div className="d-flex align-items-center justify-content-right ms-5 sticky-top w-90">
        <div className="m-2 d-flex justify-content-right">
          <input
            type="text"
            className="form-control w-100 "
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                  categorai
                </td>
                <td
                  className="text-start"
                  onClick={() => handleTdClick(product)}
                >
                  {product.cantidad}
                </td>
                <td
                  className="text-start"
                  onClick={() => handleTdClick(product)}
                >
                  {product.precio_compra}
                </td>
                <td
                  className="text-start"
                  onClick={() => handleTdClick(product)}
                >
                  {product.precio_venta}
                </td>
                <td
                  className="text-start"
                  onClick={() => handleTdClick(product)}
                >
                  {product.caducidad}
                </td>
                <td
                  className="text-center"
                  onClick={() => handleTdClick(product)}
                >
                  {product.publicado ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="34px"
                      viewBox="0 -960 960 960"
                      width="34px"
                      fill="#75FB4C"
                    >
                      <path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70h400q100 0 170 70t70 170q0 100-70 170t-170 70H280Zm0-80h400q66 0 113-47t47-113q0-66-47-113t-113-47H280q-66 0-113 47t-47 113q0 66 47 113t113 47Zm400-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM480-480Z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#EA3323"
                    >
                      <path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70h400q100 0 170 70t70 170q0 100-70 170t-170 70H280Zm0-80h400q66 0 113-47t47-113q0-66-47-113t-113-47H280q-66 0-113 47t-47 113q0 66 47 113t113 47Zm0-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm200-120Z" />
                    </svg>
                  )}
                </td>
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
