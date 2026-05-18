import { useEffect, useMemo, useState } from "react";
import { useProducts } from "./useProducts";

import Spinners from "../spiners/spiners";
import CardLayout from "./cardLayout/CardLayout";
import NewProduct from "./newProduct/newProduct";
import NewCategory from "./newCategory/NewCategory";
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
    }

    setFadeIn(false);
  }, [loading]);

  useEffect(() => {
    document.body.style.overflow = showCard ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showCard]);

  const metrics = useMemo(() => {
    const products = items || [];
    const productsWithoutStock = products.filter(
      (item) => Number(item.stock_total) <= 0
    ).length;
    const lowStockProducts = products.filter((item) => {
      const stock = Number(item.stock_total);
      const minStock = Number(item.stock_minimo);

      return stock > 0 && minStock > 0 && stock <= minStock;
    }).length;
    const inventoryValue = products.reduce(
      (total, item) =>
        total + Number(item.stock_total || 0) * Number(item.precio_compra || 0),
      0
    );

    return {
      activeProducts: products.length,
      lowStockProducts,
      productsWithoutStock,
      inventoryValue,
    };
  }, [items]);

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

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const formatDate = (dateString) => {
    if (!dateString) return "";

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
    }).format(new Date(dateString));
  };

  const parseExpirationDate = (dateValue) => {
    if (!dateValue) return null;

    if (dateValue instanceof Date) {
      return Number.isNaN(dateValue.getTime()) ? null : dateValue;
    }

    const textValue = String(dateValue);
    const dateOnly = textValue.split("T")[0];
    const [year, month, day] = dateOnly.split("-").map(Number);

    if (!year || !month || !day) return null;

    const parsedDate = new Date(year, month - 1, day);

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const getDaysUntilExpiration = (dateString) => {
    const expirationDate = parseExpirationDate(dateString);

    if (!expirationDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    expirationDate.setHours(0, 0, 0, 0);

    return Math.round((expirationDate - today) / (1000 * 60 * 60 * 24));
  };

  const formatExpiration = (dateString) => {
    if (!dateString) return "Sin caducidad";
    if (!showExpirationDays) return formatDate(dateString);

    const days = getDaysUntilExpiration(dateString);

    if (days === null) return "Sin caducidad";
    if (days < 0) return `Caducado hace ${Math.abs(days)} dias`;
    if (days === 0) return "Caduca hoy";
    if (days === 1) return "1 dia restante";

    return `${days} dias restantes`;
  };

  const formatQuantity = (stockTotal, stockMinimo) => {
    if (!showStockComparison) return stockTotal;

    const total = Number(stockTotal);
    const minimo = Number(stockMinimo);

    if (!minimo || minimo <= 0) return "Sin minimo";
    if (total === minimo) return "En minimo";

    const percentage = ((total - minimo) / minimo) * 100;
    const rounded = Math.round(Math.abs(percentage));

    return total > minimo ? `+${rounded}%` : `-${rounded}%`;
  };

  const getStockStatus = (item) => {
    const stock = Number(item.stock_total);
    const minStock = Number(item.stock_minimo);

    if (stock <= 0) {
      return { label: "Sin stock", className: "text-bg-danger" };
    }

    if (minStock > 0 && stock <= minStock) {
      return { label: "Stock bajo", className: "stock-low" };
    }

    return { label: "Stock correcto", className: "stock-ok" };
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "PR";

  if (loading) return <Spinners />;

  return (
    <main className="inventory-page">
      <header className="inventory-header">
        <div>
          <p className="text-secondary mb-1">Control de inventario</p>
          <h1 className="inventory-title">Panel de productos</h1>
        </div>

        <div className="inventory-header-actions">
          <NewCategory onCreated={refetchCategories} />
          <NewProduct onCreated={refetch} />
        </div>
      </header>

      <section className="inventory-metrics">
        <article className="metric-card">
          <span>Productos activos</span>
          <strong>{metrics.activeProducts}</strong>
          <small>Listado actual</small>
        </article>

        <article className="metric-card">
          <span>Valor del inventario</span>
          <strong>{formatCurrency(metrics.inventoryValue)}</strong>
          <small>Segun precio de compra</small>
        </article>

        <article className="metric-card">
          <span>Stock bajo</span>
          <strong className="text-warning">{metrics.lowStockProducts}</strong>
          <small>Requieren reposicion</small>
        </article>

        <article className="metric-card">
          <span>Sin stock</span>
          <strong className="text-danger">{metrics.productsWithoutStock}</strong>
          <small>Ventas detenidas</small>
        </article>
      </section>

      <section className={`product-table-card fade-init${fadeIn ? " fade-in" : ""}`}>
        <div className="product-table-toolbar">
          <div className="toolbar-field toolbar-search">
            <label className="form-label small text-secondary">Buscar producto</label>
            <input
              type="search"
              className="form-control"
              placeholder="Buscar por nombre"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="toolbar-field">
            <label className="form-label small text-secondary">Categoria</label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => handleCategoryFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-field">
            <label className="form-label small text-secondary">Ordenar por</label>
            <select
              className="form-select"
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
            >
              <option value="predefinido">Predefinido</option>
              <option value="stock_total">Cantidad</option>
              <option value="precio_compra">Precio compra</option>
              <option value="fecha_caducidad">Caducidad</option>
            </select>
          </div>

          <div className="toolbar-field">
            <label className="form-label small text-secondary">Direccion</label>
            <select
              className="form-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="asc">Menor / proxima</option>
              <option value="desc">Mayor / lejana</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 product-table">
            <thead>
              <tr >
                <th >Producto</th>
                <th className="d-none d-md-table-cell">Categoria</th>
                <th className="text-center">
                  <button
                    type="button"
                    className="table-heading-button"
                    title="Alternar entre cantidad y comparacion con stock minimo"
                    onClick={() => setShowStockComparison((current) => !current)}
                  >
                    {showStockComparison ? "Estado stock" : "Cantidad"}
                  </button>
                </th>
                <th className="d-none d-lg-table-cell text-center">Precio venta</th>
                <th className="d-none d-md-table-cell text-center">
                  <button
                    type="button"
                    className="table-heading-button"
                    title="Alternar entre fecha de caducidad y dias restantes"
                    onClick={() => setShowExpirationDays((current) => !current)}
                  >
                    {showExpirationDays ? "Dias restantes" : "Caducidad"}
                  </button>
                </th>
                <th>Estado</th>
                <th className="text-end">Venta rapida</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => {
                const status = getStockStatus(item);

                return (
                  <tr
                    key={item.producto_id}
                    onClick={() => handleTdClick(item)}
                  >
                    <td data-label="Producto">
                      <div className="product-identity">
                        <span className="product-avatar">
                          {getInitials(item.producto_nombre)}
                        </span>
                        <div>
                          <strong>{item.producto_nombre}</strong>
                          <div className="text-secondary small">
                            Minimo: {item.stock_minimo}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="d-none d-md-table-cell" data-label="Categoria">
                      {item.producto_categoria || "Sin categoria"}
                    </td>

                    <td className="text-center fw-semibold" data-label="Cantidad">
                      {formatQuantity(item.stock_total, item.stock_minimo)}
                    </td>

                    <td
                      className="d-none d-lg-table-cell text-center"
                      data-label="Precio venta"
                    >
                      {formatCurrency(item.precio_venta)}
                    </td>

                    <td
                      className="d-none d-md-table-cell text-center"
                      data-label="Caducidad"
                    >
                      {formatExpiration(item.fecha_caducidad)}
                    </td>

                    <td data-label="Estado">
                      <span className={`badge rounded-pill ${status.className}`}>
                        {status.label}
                      </span>
                    </td>

                    <td className="text-end" data-label="Venta rapida">
                      <form
                        className="quick-sale-form"
                        onClick={(event) => event.stopPropagation()}
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
                          className="btn btn-sm btn-outline-primary"
                          disabled={sellingProductId === item.producto_id}
                        >
                          Vender
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}

              {!items.length && (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No hay productos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showCard && selectedProduct && (
        <CardLayout
          product={selectedProduct}
          formatDate={formatDate}
          id={selectedProduct.producto_id}
          onClose={handleCloseCard}
        />
      )}
    </main>
  );
};

export default GetProducts;
