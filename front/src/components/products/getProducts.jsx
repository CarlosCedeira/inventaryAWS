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
      const response = await fetch("http://192.168.0.18:3000/productos");
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
      let url;

      if (!searchValue) {
        url = "http://localhost:3000/productos";
      } else {
        url = `http://localhost:3000/productos/buscar/${searchValue}`;
      }

      const res = await fetch(url);
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

  // 🔹 Formatear fecha ISO -> YYYY-MM-DD (para mostrar en input type="date")
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium", // puedes usar medium, short, long, full
    }).format(date);
  };

  if (loading) return <Spinners />;

  return (
    <>
      <h1 className="bg-white sticky-top ms-3 mt-2 mb-3 ps-5 ps-md-4 py-3">
        Listado de productos
      </h1>

      <div className=" prueba  bg-white pt-2 pb-2 px-5 d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-2">
        {/* BLOQUE ORDENAR (siempre en una fila) */}
        <div className="d-flex flex-row align-items-center ps-2 ps-sm-0  gap-3">
          <select
            className="form-select w-auto"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="predefinido">Ordenar por</option>
            <option value="cantidad">Cantidad</option>
            <option value="precio_compra">Precio</option>
          </select>

          <select
            className="form-select w-auto"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="asc">Menor</option>
            <option value="desc">Mayor</option>
          </select>
        </div>

        {/* BLOQUE BUSCAR (en móvil baja a nueva fila, en desktop va en la misma) */}
        <input
          type="text"
          className="form-control ms-2 w-100"
          placeholder="Buscar producto..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      {/* 🔹 Tabla de productos */}
      <div
        className={`fade-init${
          fadeIn ? " fade-in" : ""
        } ms-0 me-0 ms-md-5 me-md-5`}
      >
        <table className="table table-responsive table-hover align-middle shadow ">
          <thead className="table-primary ">
            <tr>
              <th className="text-start ">Nombre</th>
              <th className="text-start d-none d-md-table-cell">Categoría</th>
              <th className="text-start">Cantidad</th>
              <th className="text-start d-none d-md-table-cell">
                Precio de Compra
              </th>
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
                <td
                  className="d-none d-md-table-cell"
                  onClick={() => handleTdClick(item)}
                >
                  {item.producto_categoria}
                </td>
                <td onClick={() => handleTdClick(item)}>{item.cantidad}</td>
                <td
                  className="d-none d-md-table-cell"
                  onClick={() => handleTdClick(item)}
                >
                  {item.precio_compra}
                </td>
                <td onClick={() => handleTdClick(item)}>
                  {formatDate(item.fecha_caducidad)}
                </td>
                <td>
                  <Publicado id={item.producto_id} publicado={item.publicado} />
                </td>
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
          formatDate={formatDate}
          id={selectedProduct.inventario_id}
          onClose={handleCloseCard}
        />
      )}
    </>
  );
};

export default GetProducts;
