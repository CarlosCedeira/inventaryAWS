import { useState, useEffect } from "react";
import { useProducts } from "./hooks/useProducts";

import Spinners from "../spiners/spiners";
import CardLayout from "./cardLayout/CardLayout";
import NewProduct from "./newProduct/newProduct";
//import InventoryDashboard from "./dashboard/productsDashboard";

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

      <div className="bg-white  d-flex justify-content-between align-items-center sticky-top" >
        <h1 className="ms-4 mt-2 mb-3 ps-5 ps-md-4">
          Listado de productos
        </h1>
        <NewProduct />
      </div>

      <div className="bg-white pt-2 pb-2 px-5 d-flex flex-column flex-md-row justify-content-between gap-2 ">
        <div className="d-flex gap-3 ">
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
            className="form-select w-auto "
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

      <div className={`fade-init${fadeIn ? " fade-in" : ""} px-5 py-3`}>
        <table className="table table-hover shadow me-5">
          <thead className="table-primary">
            <tr>
              <th>Nombre</th>
              <th className="d-none d-md-table-cell">Categoría</th>
              <th className="text-center">Cantidad</th>
              <th className="d-none d-md-table-cell text-center">
                Precio
              </th>
            </tr>
          </thead>

          <tbody className=" ">
            {items.map((item) => (
              <tr key={item.producto_id} onClick={() => handleTdClick(item)} style={{ cursor: "pointer" }}>
                <td >
                  {item.producto_nombre}
                </td>

                <td className="d-none d-md-table-cell">
                  {item.producto_categoria}
                </td>

               <td
  className={`text-center ${
    item.stock_total <= item.stock_minimo ? "bg-stock-minimo" : ""
  }`}
>
  {item.stock_total}
</td>

                <td className="d-none d-md-table-cell text-center">
                  {item.precio_compra}
                </td>

               

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCard && selectedProduct && (
        <CardLayout
          product={selectedProduct}
          formatDate={formatDate}
          id={selectedProduct.producto_id}
          onClose={handleCloseCard}
        />
      )}

            {/*<InventoryDashboard inventory={items} />*/}

    </>
  );
};

export default GetProducts;
