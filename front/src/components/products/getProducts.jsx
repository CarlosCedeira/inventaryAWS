import { useState, useEffect } from "react";
import { useProducts } from "./useProducts";

import Spinners from "../spiners/spiners";
import CardLayout from "./cardLayout/CardLayout";
import NewProduct from "./newProduct/newProduct";
import NewCategory from "./newCategory/NewCategory";
//import InventoryDashboard from "./dashboard/productsDashboard";
import {
  normalizeStockQuantity,
  validateStockQuantity,
} from "../../utils/stockQuantity";

import "./getProducts.css";

const GetProducts = () => {
  const {
    items,
    loading,
    categories,
    selectedCategory,
    search,
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    handleCategoryFilter,
    handleSearch,
    handleQuickSale,
    refetch,
    refetchCategories,
  } = useProducts();

  const [showCard, setShowCard] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showExpirationDays, setShowExpirationDays] = useState(false);
  const [showStockComparison, setShowStockComparison] = useState(false);
  const [saleQuantities, setSaleQuantities] = useState({});
  const [sellingProductId, setSellingProductId] = useState(null);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setFadeIn(true), 10);
      return () => clearTimeout(t);
    } else {
      setFadeIn(false);
    }
  }, [loading]);

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

  const handleSaleQuantityChange = (productId, value) => {
    setSaleQuantities((current) => ({
      ...current,
      [productId]: value,
    }));
  };

  const handleQuickSaleSubmit = async (event, productId) => {
    event.preventDefault();
    event.stopPropagation();

    const quantityError = validateStockQuantity(saleQuantities[productId], {
      label: "La cantidad vendida",
    });

    if (quantityError) {
      alert(quantityError);
      return;
    }

    const quantity = normalizeStockQuantity(saleQuantities[productId]);

    try {
      setSellingProductId(productId);
      await handleQuickSale(productId, quantity);
      setSaleQuantities((current) => ({
        ...current,
        [productId]: "",
      }));
    } catch (error) {
      alert(error.message || "No se pudo registrar la venta");
    } finally {
      setSellingProductId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
    }).format(new Date(dateString));
  };

  const getDaysUntilExpiration = (dateString) => {
    if (!dateString) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = dateString.split("-");
    const expirationDate = new Date(year, month - 1, day);
    expirationDate.setHours(0, 0, 0, 0);

    return Math.round((expirationDate - today) / (1000 * 60 * 60 * 24));
  };

  const formatExpiration = (dateString) => {
    if (!showExpirationDays) return formatDate(dateString);

    const days = getDaysUntilExpiration(dateString);

    if (days === null) return "";
    if (days < 0) return `Caducado hace ${Math.abs(days)} días`;
    if (days === 0) return "Caduca hoy";
    if (days === 1) return "1 día restante";

    return `${days} días restantes`;
  };

  const formatQuantity = (stockTotal, stockMinimo) => {
    if (!showStockComparison) return stockTotal;

    const total = Number(stockTotal);
    const minimo = Number(stockMinimo);

    if (!minimo || minimo <= 0) {
      return "Sin mínimo";
    }

    const percentage = ((total - minimo) / minimo) * 100;
    const rounded = Math.round(Math.abs(percentage));

    if (total === minimo) {
      return "En el mínimo";
    }

    if (total > minimo) {
      return `${rounded}% `;
    }

    return `-${rounded}% `;
  };

  if (loading) return <Spinners />;

  return (
    <>
      <div className="bg-white d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center pt-2 ">
        <h1 className="ms-4 mt-2 mb-3 ps-5 ps-md-4 sticky-top">
          Listado de productos
        </h1>

        <div className="d-flex align-items-center gap-5">
          <NewCategory onCreated={refetchCategories} />
          <NewProduct onCreated={refetch} />
        </div>
      </div>

      <div className="bg-white py-3 px-md-5 px-3 d-flex">
        <div className="d-flex flex-column flex-md-row gap-3 alin-items-start align-items-md-center">
          <input
            type="text"
            className="form-control w-100 w-md-25"
            placeholder="Buscar por nombre"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />

          <select
            className="form-select w-auto"
            value={selectedCategory}
            onChange={(e) => handleCategoryFilter(e.target.value)}
          >
            <option value="">Todas las categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nombre}
              </option>
            ))}
          </select>

          <select
            className="form-select w-auto"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="predefinido">Ordenar por</option>
            <option value="stock_total">Cantidad</option>
            <option value="precio_compra">Precio</option>
            <option value="fecha_caducidad">Caducidad</option>
          </select>

          <select
            className="form-select w-auto"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="asc">Menor / más próxima</option>
            <option value="desc">Mayor / más lejana</option>
          </select>
        </div>
      </div>

      <div className={`fade-init${fadeIn ? " fade-in" : ""} px-md-5 py-3 px-3`}>
        <table className="table table-hover shadow me-5">
          <thead className="table-primary">
            <tr>
              <th>Nombre</th>

              <th className="d-none d-md-table-cell">Categoría</th>

              <th className="text-center">
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none fw-semibold text-dark"
                  title="Alternar entre cantidad y comparación con stock mínimo"
                  onClick={() => setShowStockComparison((current) => !current)}
                >
                  {showStockComparison ? "Estado del stock" : "Cantidad"}
                </button>
              </th>

              <th className="d-none d-md-table-cell text-center">
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none fw-semibold text-dark"
                  title="Alternar entre fecha de caducidad y días restantes"
                  onClick={() => setShowExpirationDays((current) => !current)}
                >
                  {showExpirationDays ? "Días restantes" : "Caducidad"}
                </button>
              </th>

              <th className="d-md-table-cell text-center">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr
                key={item.producto_id}
                onClick={() => handleTdClick(item)}
                style={{ cursor: "pointer" }}
              >
                <td>{item.producto_nombre}</td>

                <td className="d-none d-md-table-cell">
                  {item.producto_categoria}
                </td>

                <td
                  className={`text-center ${
                    item.stock_total <= item.stock_minimo ? "bg-stock-minimo" : ""
                  }`}
                >
                  {formatQuantity(item.stock_total, item.stock_minimo)}
                </td>

                <td
                  className={`d-none d-md-table-cell text-center ${
                    (() => {
                      const diferenciaDias = getDaysUntilExpiration(
                        item.fecha_caducidad
                      );

                      if (diferenciaDias === null) return "";

                      return diferenciaDias <= 40 ? "bg-stock-minimo" : "";
                    })()
                  }`}
                >
                  {formatExpiration(item.fecha_caducidad)}
                </td>

                <td className="d-md-table-cell text-center">
                  <div
                    className="product-actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {/*<button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none"
                      title="Eliminar producto"
                      onClick={(event) => handleDelete(event, item.producto_id)}
                    >
                      🗑️
                    </button></td>*/}
                    <form
                      className="quick-sale-form"
                      onSubmit={(event) =>
                        handleQuickSaleSubmit(event, item.producto_id)
                      }
                    >
                      <input
                        type="number"
                        className="form-control form-control-sm quick-sale-input"
                        min="1"
                        max={item.stock_total}
                        placeholder="0"
                        value={saleQuantities[item.producto_id] || ""}
                        onChange={(event) =>
                          handleSaleQuantityChange(
                            item.producto_id,
                            event.target.value
                          )
                        }
                        aria-label={`Cantidad vendida de ${item.producto_nombre}`}
                      />
                      <button
                        type="submit"
                        className="btn btn-sm quick-sale-button"
                        title="Registrar venta rapida"
                        disabled={sellingProductId === item.producto_id}
                      >
                        🛒
                      </button>
                    </form>

                    
                  </div>
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
