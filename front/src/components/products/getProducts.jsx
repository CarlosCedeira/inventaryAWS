import { useState, useEffect } from "react";
import Spinners from "../spiners";
import CardLayout from "../cardLayout/CardLayout";
import Publicado from "./publicado/putPublicado";
import "./getProducts.css";

const GetProducts = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [showCard, setShowCard] = useState(false);
  const [sortField, setSortField] = useState("predefinido");
  const [sortOrder, setSortOrder] = useState("asc");
  const [fadeIn, setFadeIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:3000/productos");
      if (!response.ok) throw new Error("Error al obtener los productos");
      const data = await response.json();
      setItems(data);
      console.log("Productos cargados:", data);
      console.log("publicado en getProducts useEffect", data.publicado);
    } catch (error) {
      console.error("Error en la solicitud:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Cargar productos al montar el componente
  useEffect(() => {
    fetchProducts();
  }, []);

  // 🔹 Efecto para el fade-in cuando termina de cargar
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setFadeIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setFadeIn(false);
    }
  }, [loading]);

  // 🔹 Control del scroll del body cuando se abre el modal
  useEffect(() => {
    document.body.style.overflow = showCard ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showCard]);

  // 🔹 Mostrar modal con el producto seleccionado
  const handleTdClick = (product) => {
    setSelectedProduct(product);
    setShowCard(true);
  };

  // 🔹 Cerrar modal
  const handleCloseCard = () => {
    setShowCard(false);
    fetchProducts();
  };

  // 🔹 Buscar productos por nombre
  const handleSearch = async (e) => {
    const searchValue = e.target.value;
    setSearch(searchValue);

    try {
      const res = await fetch(
        `http://localhost:3000/productos/buscar/${searchValue}`
      );
      if (!res.ok) throw new Error("Error al obtener los productos");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Error al buscar productos:", error);
    }
  };

  // 🔹 Ordenar productos cuando cambia sortField o sortOrder
  useEffect(() => {
    if (sortField === "predefinido") {
      return; // No ordenar si está en modo predefinido
    }

    const sortedItems = [...items].sort((a, b) => {
      const fieldA = Number(a[sortField]);
      const fieldB = Number(b[sortField]);

      if (sortOrder === "asc") return fieldA - fieldB;
      return fieldB - fieldA;
    });

    setItems(sortedItems);
  }, [sortField, sortOrder]);

  if (loading) return <Spinners />;

  return (
    <>
      <h1 className="text-center mt-3 mb-5">Listado de productos</h1>

      {/* 🔹 Barra de búsqueda y ordenamiento */}
      <div className="d-flex align-items-center justify-content-right ms-5 sticky-top w-90">
        <div className="m-2 d-flex justify-content-right">
          <input
            type="text"
            className="form-control w-100"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={handleSearch}
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

      {/* 🔹 Tabla de productos */}
      <div className={`fade-init${fadeIn ? " fade-in" : ""} ms-5`}>
        <table className="table table-responsive table-hover align-middle shadow">
          <thead className="table-primary sticky-top">
            <tr>
              <th className="text-start">Nombre</th>
              <th className="text-start">Categoría</th>
              <th className="text-start">Cantidad</th>
              <th className="text-start">Precio de Compra</th>
              <th className="text-start">Precio de Venta</th>
              <th className="text-start">Caducidad</th>
              <th className="text-start">Publicado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.producto_id}>
                <td onClick={() => handleTdClick(item)}>
                  {item.producto_nombre}
                </td>
                <td onClick={() => handleTdClick(item)}>
                  {item.producto_categoria}
                </td>
                <td onClick={() => handleTdClick(item)}>{item.cantidad}</td>
                <td onClick={() => handleTdClick(item)}>
                  {item.precio_compra}
                </td>
                <td onClick={() => handleTdClick(item)}>{item.precio_venta}</td>
                <td onClick={() => handleTdClick(item)}>
                  {item.fecha_caducidad}
                </td>
                <Publicado id={item.producto_id} publicado={item.publicado} />
                {console.log("publicado en getProducts", item.publicado)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔹 Modal con detalles del producto */}
      {showCard && selectedProduct && (
        <CardLayout
          product={selectedProduct}
          onClose={handleCloseCard}
          id={selectedProduct.inventario_id}
        />
      )}
    </>
  );
};

export default GetProducts;
