import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProducts } from "./useProducts";
import { productService } from "./productService";

import CardLayout from "./cardLayout/CardLayout";
import ProductEditModal from "./cardLayout/ProductEditModal";
import NewMovement from "../movements/NewMovement";
import NewProduct from "./newProduct/newProduct";
import NewCategory from "./newCategory/NewCategory";
import { useTableSelectionShortcutKeys } from "../../hooks/useEscapeKey";
import { movementService } from "../movements/movementService";

import "./getProducts.css";

const EXPIRING_SOON_DAYS = 45;
const DESKTOP_MEDIA_QUERY = "(min-width: 992px)";

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

const metricFilters = {
  lowStock: {
    label: "Stock bajo",
    // Incluye el agotado: es el caso más urgente de stock bajo.
    matches: (item) => Number(item.stock_minimo) > 0 && Number(item.stock_disponible) <= Number(item.stock_minimo),
  },
  expiring: {
    label: "Caducidad",
    matches: (item) => {
      const days = getDaysUntilExpiration(item.fecha_caducidad);
      // Un producto puede tener un lote caducado y otro próximo a caducar.
      return Number(item.stock_caducado) > 0 || (days !== null && days >= 0 && days <= EXPIRING_SOON_DAYS);
    },
  },
  noSales: { label: "Sin ventas recientes", matches: () => false },
};

const GetProducts = ({ onShowMovements, workspaceHeader }) => {
  const {
    items,
    error,
    categoryError,
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
    refetch,
    refetchCategories,
  } = useProducts();

  const [activeMetric, setActiveMetric] = useState(null);
  const [productsWithoutSales, setProductsWithoutSales] = useState(new Set());
  const [loadingProductsWithoutSales, setLoadingProductsWithoutSales] = useState(true);
  const [recentMovements, setRecentMovements] = useState([]);
  const [loadingRecentMovements, setLoadingRecentMovements] = useState(true);
  const [recentMovementsError, setRecentMovementsError] = useState("");
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_MEDIA_QUERY).matches);
  const visibleItems = activeMetric === "noSales" ? items.filter((item) => productsWithoutSales.has(item.producto_id)) : activeMetric ? items.filter(metricFilters[activeMetric].matches) : items;
  const toggleMetric = (key) => setActiveMetric((current) => current === key ? null : key);

  const [showCard, setShowCard] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [movementProduct, setMovementProduct] = useState(null);
  const [showExpirationDays, setShowExpirationDays] = useState(false);
  const [showStockComparison, setShowStockComparison] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const tableRowRefs = useRef([]);

  const moveSelectedRow = (direction) => {
    setSelectedRowIndex((current) => {
      if (!visibleItems.length) return -1;
      if (current < 0) return direction > 0 ? 0 : visibleItems.length - 1;
      return Math.max(0, Math.min(visibleItems.length - 1, current + direction));
    });
  };

  useTableSelectionShortcutKeys(
    !loading && visibleItems.length > 0,
    () => moveSelectedRow(-1),
    () => moveSelectedRow(1),
    () => {
      const selectedItem = visibleItems[selectedRowIndex];
      if (selectedItem) handleTdClick(selectedItem);
    }
  );

  useEffect(() => {
    setSelectedRowIndex((current) => current >= visibleItems.length ? visibleItems.length - 1 : current);
  }, [visibleItems.length]);

  useEffect(() => {
    if (selectedRowIndex >= 0) tableRowRefs.current[selectedRowIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedRowIndex]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setFadeIn(true), 10);
      return () => clearTimeout(t);
    }

    setFadeIn(false);
  }, [loading]);

  useEffect(() => {
    document.body.style.overflow = showCard || editingProductId ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showCard, editingProductId]);

  useEffect(() => {
    let active = true;
    productService.getWithoutRecentSales().then((rows) => {
      if (active) setProductsWithoutSales(new Set(rows.map((row) => Number(row.producto_id))));
    }).catch(() => { if (active) setProductsWithoutSales(new Set()); }).finally(() => { if (active) setLoadingProductsWithoutSales(false); });
    return () => { active = false; };
  }, [items.length]);

  const loadRecentMovements = useCallback(async () => {
    setLoadingRecentMovements(true);
    try {
      const movements = await movementService.getAll({ limit: 15 });
      setRecentMovements(movements);
      setRecentMovementsError("");
    } catch (recentError) {
      setRecentMovementsError(recentError instanceof Error ? recentError.message : "No se pudieron cargar los últimos movimientos");
    } finally {
      setLoadingRecentMovements(false);
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handleViewportChange = () => setIsDesktop(mediaQuery.matches);

    handleViewportChange();
    mediaQuery.addEventListener("change", handleViewportChange);
    return () => mediaQuery.removeEventListener("change", handleViewportChange);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setLoadingRecentMovements(false);
      return;
    }

    void loadRecentMovements();
  }, [isDesktop, loadRecentMovements]);

  const metrics = useMemo(() => {
    const products = items || [];
    const lowStockProducts = products.filter(metricFilters.lowStock.matches).length;
    const expiringSoonProducts = products.filter(metricFilters.expiring.matches).length;
    const activeLots = products.reduce((total, item) => total + Number(item.lotes_activos || 0), 0);
    const availableUnits = products.reduce((total, item) => total + Number(item.stock_disponible || 0), 0);
    const inventoryValue = products.reduce(
      (total, item) =>
        total + Number(item.stock_total || 0) * Number(item.precio_compra || 0),
      0
    );

   

    return {
      activeProducts: products.length,
      activeLots,
      availableUnits,
      expiringSoonProducts,
      lowStockProducts,
      productsWithoutSales: products.filter((item) => productsWithoutSales.has(item.producto_id)).length,
      inventoryValue,
    };
  }, [items, productsWithoutSales]);

  const handleTdClick = (product) => {
    setSelectedProduct(product);
    setShowCard(true);
  };

  const handleCloseCard = () => {
    setShowCard(false);
    refetch();
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
      timeZone: "UTC",
    }).format(new Date(dateString));
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

  const getExpirationStatus = (item) => {
  const days = getDaysUntilExpiration(item.fecha_caducidad);

  if (days === null) return null;

  if (days < 0) {
    return { label: "Caducado", className: "text-bg-danger" };
  }

  if (days <= EXPIRING_SOON_DAYS) {
    return { label: "Caduca pronto", className: "text-bg-warning" };
  }

  return null;
};

  const getStockStatus = (item) => {
    const stock = Number(item.stock_disponible);
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

  return (
    <main className="inventory-page">
      {workspaceHeader}
      <header className="inventory-header">
            
            <div className="inventory-value">
              <span>Valor del inventario:</span>
              <strong>{loading ? "—" : formatCurrency(metrics.inventoryValue)}</strong>
            </div>
        <div className="inventory-header-actions">
          <NewCategory onCreated={refetchCategories} />
          <NewProduct onCreated={refetch} />
        </div>
      </header>

      {error && <div className="alert alert-danger" role="alert">{error} <button type="button" className="btn btn-sm btn-outline-danger" onClick={refetch}>Reintentar</button></div>}
      {categoryError && <div className="alert alert-warning" role="alert">{categoryError} <button type="button" className="btn btn-sm btn-outline-secondary" onClick={refetchCategories}>Reintentar categorías</button></div>}
      <section className="inventory-overview">
      <section className="inventory-metrics">
        <article className="metric-card">
          <span>Productos</span>
          {loading ? (
            <strong className="skeleton-text skeleton-text-short" />
          ) : (
            <strong>{metrics.activeProducts}</strong>
          )}
          <small>Activos actuales</small>
        </article>

        <article className="metric-card">
          <span>Lotes activos</span>
          {loading ? (
            <strong className="skeleton-text skeleton-text-short" />
          ) : (
            <strong>{metrics.activeLots}</strong>
          )}
          <small>Con unidades disponibles</small>
        </article>

        <article className="metric-card">
          <span>Unidades disponibles</span>
          {loading ? (
            <strong className="skeleton-text skeleton-text-short" />
          ) : (
            <strong>{metrics.availableUnits}</strong>
          )}
          <small>Stock vendible actual</small>
        </article>

        <button
          type="button"
          className={`metric-card metric-filter${activeMetric === "lowStock" ? " is-active" : ""}`}
          aria-pressed={activeMetric === "lowStock"}
          aria-controls="products-table"
          disabled={loading}
          onClick={() => toggleMetric("lowStock")}
        >
          <span>Stock bajo</span>
          {loading ? (
            <strong className="skeleton-text skeleton-text-short" />
          ) : (
            <strong className="text-warning">{metrics.lowStockProducts}</strong>
          )}
          <small>Bajo mínimo o sin stock</small>
                  <span className="metric-filter-hint">{activeMetric === "lowStock" ? "✓ Filtro activo · Desactivar" : "Filtrar productos"}</span>
        </button>

        <button
          type="button"
          className={`metric-card metric-filter${activeMetric === "expiring" ? " is-active" : ""}`}
          aria-pressed={activeMetric === "expiring"}
          aria-controls="products-table"
          disabled={loading}
          onClick={() => toggleMetric("expiring")}
        >
          <span>Caducidad</span>
          {loading ? (
            <strong className="skeleton-text skeleton-text-short" />
          ) : (
            <strong className="text-warning">{metrics.expiringSoonProducts}</strong>
          )}
          <small>Caducados y de hoy a {EXPIRING_SOON_DAYS} días</small>
                  <span className="metric-filter-hint">{activeMetric === "expiring" ? "✓ Filtro activo · Desactivar" : "Filtrar productos"}</span>
        </button>
        <button type="button" className={`metric-card metric-filter${activeMetric === "noSales" ? " is-active" : ""}`}
          aria-pressed={activeMetric === "noSales"} aria-controls="products-table" disabled={loading || loadingProductsWithoutSales}
          onClick={() => toggleMetric("noSales")}>
          <span>Sin ventas 30d</span>
          {loading || loadingProductsWithoutSales ? <strong className="skeleton-text skeleton-text-short" /> : <strong className="text-warning">{metrics.productsWithoutSales}</strong>}
          <small>Con stock y sin ventas en 30 días</small>
          <span className="metric-filter-hint">{activeMetric === "noSales" ? "✓ Filtro activo · Desactivar" : "Filtrar productos"}</span>
        </button>
      </section>

      {isDesktop && <section className="recent-movements-card" aria-labelledby="recent-movements-title">
        <div className="recent-movements-heading">
          <h2 id="recent-movements-title">Últimos movimientos</h2>
        </div>

        {loadingRecentMovements ? (
          <div className="recent-movements-loading" aria-label="Cargando últimos movimientos">
            <span className="skeleton-text" />
            <span className="skeleton-text" />
            <span className="skeleton-text" />
          </div>
        ) : recentMovementsError ? (
          <div className="recent-movements-message">
            <span>No se pudo cargar la actividad.</span>
            <button type="button" onClick={() => void loadRecentMovements()}>Reintentar</button>
          </div>
        ) : recentMovements.length ? (
          <ul className="recent-movements-list">
            {recentMovements.map((movement) => (
              <li key={movement.movimiento_id}>
                <div className="recent-movement-detail">
                  <strong>{movement.producto_nombre}</strong>
                </div>
                <strong className={`recent-movement-quantity recent-movement-${movement.tipo}`}>
                  {movement.tipo === "entrada" ? "+" : movement.tipo === "salida" ? "−" : "±"}{Math.abs(Number(movement.cantidad))}
                </strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="recent-movements-message">Todavía no hay movimientos registrados.</p>
        )}

        <button type="button" className="recent-movements-link" onClick={onShowMovements}>
          Ver historial completo
        </button>
      </section>
      }
      </section>

      <section
        className={`product-table-card${loading ? "" : ` fade-init${fadeIn ? " fade-in" : ""}`}`}
      >
        <div className="product-table-toolbar">
          <div className="product-toolbar-row product-toolbar-primary">
            <div className="toolbar-field toolbar-search">
            <label className="w-100">
                        <span className="form-label">Buscar producto</span>

            <input
              type="search"
              className="form-control"
              placeholder="Buscar por nombre"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              />
              </label>
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
          </div>

          <div className="product-toolbar-row product-toolbar-secondary">
            <div className="toolbar-field">
            <label className="form-label small text-secondary">Ordenar por</label>
            <select
              className="form-select"
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
            >
              <option value="predefinido">Predefinido</option>
              <option value="stock_disponible">Stock disponible</option>
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
        </div>

        <div className="metric-filter-summary" role="status">
          {activeMetric ? (
            <>
              <span>{metricFilters[activeMetric].label} · {visibleItems.length} productos</span>
              <button type="button" onClick={() => setActiveMetric(null)}>Quitar filtro</button>
            </>
          ) : <span>Mostrando {items.length} productos</span>}
        </div>
        <div className="table-responsive">
          <table id="products-table" className="table table-hover align-middle mb-0 product-table">
            <thead>
              <tr >
                <th className="sticky-top">Producto</th>
                <th className="sticky-top d-none d-md-table-cell">Categoria</th>
                <th className="sticky-top text-center">
                  <button
                    type="button"
                    className="table-heading-button"
                    title="Alternar entre cantidad y comparacion con stock minimo"
                    onClick={() => setShowStockComparison((current) => !current)}
                  >
                    {showStockComparison ? "Estado stock" : "Disponible"}
                  </button>
                </th>
                <th className="sticky-top d-none d-lg-table-cell text-center">Precio sin IVA</th>
                <th className="sticky-top d-none d-md-table-cell text-center">
                  <button
                    type="button"
                    className="table-heading-button"
                    title="Alternar entre fecha de caducidad y dias restantes"
                    onClick={() => setShowExpirationDays((current) => !current)}
                  >
                    {showExpirationDays ? "Dias restantes" : "Caducidad"}
                  </button>
                </th>
                <th className="sticky-top">Estado</th><th className="sticky-top">Movimiento</th>
              </tr>
            </thead>

            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <tr className="skeleton-table-row" key={`product-skeleton-${index}`}>
                    <td data-label="Producto">
                      <div className="product-identity">
                        <span className="product-avatar skeleton-avatar" />
                        <div className="skeleton-cell-stack">
                          <span className="skeleton-line skeleton-line-title" />
                          <span className="skeleton-line skeleton-line-small" />
                        </div>
                      </div>
                    </td>
                    <td className="d-none d-md-table-cell" data-label="Categoria">
                      <span className="skeleton-line" />
                    </td>
                    <td className="text-center fw-semibold" data-label="Cantidad">
                      <span className="skeleton-line skeleton-line-number" />
                    </td>
                    <td
                      className="d-none d-lg-table-cell text-center"
                      data-label="Precio sin IVA"
                    >
                      <span className="skeleton-line skeleton-line-number" />
                    </td>
                    <td
                      className="d-none d-md-table-cell text-center"
                      data-label="Caducidad"
                    >
                      <span className="skeleton-line" />
                    </td>
                    <td data-label="Estado">
                      <span className="skeleton-pill" />
                    </td>
                  </tr>
                ))}

              {!loading && visibleItems.map((item, index) => {
const stockStatus = getStockStatus(item);
const expirationStatus = getExpirationStatus(item);
                return (
                  <tr
                    key={item.producto_id}
                    ref={(element) => { tableRowRefs.current[index] = element; }}
                    className={selectedRowIndex === index ? "keyboard-selected" : ""}
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
                      {formatQuantity(item.stock_disponible, item.stock_minimo)}
                      <div className="small text-secondary">Lotes: {item.lotes_activos}</div>
                    </td>

                    <td
                      className="d-none d-lg-table-cell text-center"
                      data-label="Precio sin IVA"
                    >
                      {formatCurrency(item.precio_venta)}
                      <div className="small text-secondary">
                        IVA: {item.impuesto_porcentaje ?? "sin asignar"}
                        {item.impuesto_porcentaje !== null && item.impuesto_porcentaje !== undefined ? "%" : ""}
                      </div>
                    </td>

                    <td
                      className="d-none d-md-table-cell text-center"
                      data-label="Caducidad"
                    >
                      {formatExpiration(item.fecha_caducidad)}
                    </td>

                    <td data-label="Estado">
  <div className="d-flex flex-column gap-1 align-items-start">
    <span className={`badge rounded-pill ${stockStatus.className}`}>
      {stockStatus.label}
    </span>

    {Number(item.stock_caducado) > 0 && <span className="badge rounded-pill text-bg-danger">Stock caducado</span>}
    {expirationStatus && (
      <span className={`badge rounded-pill ${expirationStatus.className}`}>
        {expirationStatus.label}
      </span>
    )}
  </div>
</td>
                    <td data-label="Movimiento"><button type="button" className="btn btn-sm btn-outline-primary" onClick={(event) => { event.stopPropagation(); setMovementProduct(item); }}>Movimiento</button></td>

                  </tr>
                );
              })}

              {!loading && !error && !visibleItems.length && (
                <tr>
                    <td colSpan="7" className="empty-state">
                    {activeMetric ? "No hay productos que coincidan con este filtro." : "No hay productos para mostrar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {movementProduct && <NewMovement preselectedProduct={movementProduct} hideTrigger onClose={() => setMovementProduct(null)} onCreated={async () => { setMovementProduct(null); await Promise.all([refetch(), ...(isDesktop ? [loadRecentMovements()] : [])]); }} />}

      {showCard && selectedProduct && (
        <CardLayout
          product={selectedProduct}
          formatDate={formatDate}
          id={selectedProduct.producto_id}
          onClose={handleCloseCard}
          onEdit={() => {
            setShowCard(false);
            setEditingProductId(selectedProduct.producto_id);
          }}
        />
      )}
      {editingProductId && <ProductEditModal id={editingProductId} onClose={() => setEditingProductId(null)} onSaved={async () => { setEditingProductId(null); await refetch(); }} />}
    </main>
  );
};

export default GetProducts;
