import { useState, useEffect } from "react";
import { useProducts } from "./useProducts";

import Spinners from "../spiners";
import CardLayout from "./cardLayout/CardLayout";
import Publicado from "./publicado/putPublicado";
import NewProduct from "./newProduct/newProduct";
import InventoryDashboard from "./productsDashboard";

import "./getProducts.css";

const GetProducts = () => {
  const {
    items,
    loading,
    search,
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    handleSearch,
    refetch,
  } = useProducts();

  const [showCard, setShowCard] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // fade
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setFadeIn(true), 10);
      return () => clearTimeout(t);
    } else {
      setFadeIn(false);
    }
  }, [loading]);

  // scroll modal
  useEffect(() => {
    document.body.style.overflow = showCard ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showCard]);

  const handleTdClick = (product) => {
    setSelectedProduct(product);
    setShowCard(true);
  };

  const handleCloseCard = () => {
    setShowCard(false);
    refetch();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
    }).format(new Date(dateString));
  };

  if (loading) return <Spinners />;

  return (
    <>
      <InventoryDashboard inventory={items} />

      <div className="bg-white sticky-top d-flex justify-content-between align-items-center">
        <h1 className="ms-4 mt-2 mb-3 ps-5 ps-md-4">
          Listado de productos
        </h1>
        <NewProduct />
      </div>

      <div className="bg-white pt-2 pb-2 px-5 d-flex flex-column flex-md-row justify-content-between gap-2">
        <div className="d-flex gap-3">
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

        <input
          type="text"
          className="form-control"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className={`fade-init${fadeIn ? " fade-in" : ""}`}>
        <table className="table table-hover shadow">
          <thead className="table-primary">
            <tr>
              <th>Nombre</th>
              <th className="d-none d-md-table-cell">Categoría</th>
              <th className="text-center">Cantidad</th>
              <th className="d-none d-md-table-cell text-center">
                Precio
              </th>
              <th className="text-center">Caducidad</th>
              <th className="text-center">Publicado</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr >
                <td onClick={() => handleTdClick(item)}>
                  {item.producto_nombre}
                </td>

                <td className="d-none d-md-table-cell">
                  {item.producto_categoria}
                </td>

               <td
  className={`text-center ${
    item.cantidad <= item.stock_minimo ? "bg-stock-minimo" : ""
  }`}
>
  {item.cantidad}
</td>

                <td className="d-none d-md-table-cell text-center">
                  {item.precio_compra}
                </td>

                <td className="text-center">
                  {formatDate(item.fecha_caducidad)}
                </td>

                <Publicado
                  id={item.producto_id}
                  publicado={item.publicado}
                  cantidad={item.cantidad}
                  stock_minimo={item.stock_minimo}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
