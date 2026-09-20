import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { movementService, type Movement, type MovementFilters, type MovementType } from "./movementService";
import NewMovement from "./NewMovement";
import MovementCardLayout from "./cardLayout/MovementCardLayout";
import "./GetMovements.css";

const GetMovements = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MovementType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const requestId = useRef(0);

  const apiFilters = useMemo<MovementFilters>(() => ({
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  }), [typeFilter, startDate, endDate]);

  const fetchMovements = useCallback(async (filters: MovementFilters) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const data = await movementService.getAll(filters);
      if (currentRequest === requestId.current) {
        setMovements(data);
        setError("");
      }
    } catch (fetchError) {
      if (currentRequest === requestId.current) {
        setError(fetchError instanceof Error ? fetchError.message : "No se pudieron cargar los movimientos");
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMovements(apiFilters);
  }, [apiFilters, fetchMovements]);

  const visibleMovements = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("es-ES");
    if (!normalizedSearch) return movements;
    return movements.filter((movement) =>
      movement.producto_nombre.toLocaleLowerCase("es-ES").includes(normalizedSearch),
    );
  }, [movements, search]);

  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => setFadeIn(true), 10);
      return () => clearTimeout(timeoutId);
    }

    setFadeIn(false);
  }, [loading]);

  useEffect(() => {
    document.body.style.overflow = selectedMovement ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedMovement]);

  const metrics = useMemo(() => {
    const totalQuantity = visibleMovements.reduce(
      (total, movement) => total + Number(movement.cantidad || 0),
      0
    );
    const entries = visibleMovements.filter(
      (movement) => movement.tipo === "entrada"
    ).length;
    const exits = visibleMovements.filter(
      (movement) => movement.tipo === "salida"
    ).length;
    const adjustments = visibleMovements.filter(
      (movement) => movement.tipo === "ajuste"
    ).length;

    return {
      totalMovements: visibleMovements.length,
      totalQuantity,
      entries,
      exits,
      adjustments,
    };
  }, [visibleMovements]);

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "";

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  const getMovementType = (type: string) => {
    const types = {
      entrada: {
        label: "Entrada",
        className: "movement-type-entry",
        symbol: "+",
      },
      salida: {
        label: "Salida",
        className: "movement-type-exit",
        symbol: "-",
      },
      ajuste: {
        label: "Ajuste",
        className: "movement-type-adjust",
        symbol: "",
      },
    };

    return (
      types[type as MovementType] || {
        label: type || "Movimiento",
        className: "movement-type-neutral",
        symbol: "",
      }
    );
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "MV";

  return (
    <main className="movements-page">
      <header className="movements-header">
        <div>
          <p className="text-secondary mb-1">Historial de stock</p>
          <h1 className="movements-title">Movimientos de inventario</h1>
        </div>

        <NewMovement onCreated={() => void fetchMovements(apiFilters)} />
      </header>

      <section className="movements-metrics">
        <article className="movement-metric-card">
          <span>Movimientos</span>
          {loading ? (
            <strong className="skeleton-text skeleton-text-short" />
          ) : (
            <strong>{metrics.totalMovements}</strong>
          )}
          <small>Registros actuales</small>
        </article>

        <article className="movement-metric-card">
          <span>Unidades movidas</span>
          {loading ? (
            <strong className="skeleton-text skeleton-text-short" />
          ) : (
            <strong>{metrics.totalQuantity}</strong>
          )}
          <small>Suma de cantidades</small>
        </article>

        <article className="movement-metric-card">
          <span>Entradas</span>
          {loading ? (
            <strong className="skeleton-text skeleton-text-short" />
          ) : (
            <strong className="text-success">{metrics.entries}</strong>
          )}
          <small>Compras, reposiciones y devoluciones</small>
        </article>

        <article className="movement-metric-card">
          <span>Salidas y ajustes</span>
          {loading ? (
            <strong className="skeleton-text skeleton-text-short" />
          ) : (
            <strong className="text-warning">
              {metrics.exits + metrics.adjustments}
            </strong>
          )}
          <small>Ventas, mermas y ajustes</small>
        </article>
      </section>

            <section className="movement-filters" aria-label="Filtrar movimientos">
        <label className="movement-filter-search">
          <span>Buscar producto</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre del producto"
          />
        </label>

        <label>
          <span>Tipo</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as MovementType | "")}>
            <option value="">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="ajuste">Ajustes</option>
          </select>
        </label>

        <label>
          <span>Desde</span>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>

        <label>
          <span>Hasta</span>
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm movement-filter-clear"
          disabled={!search && !typeFilter && !startDate && !endDate}
          onClick={() => {
            setSearch("");
            setTypeFilter("");
            setStartDate("");
            setEndDate("");
          }}
        >
          Limpiar filtros
        </button>
      </section>

      {error && <div className="alert alert-danger">{error}</div>}

      {!error && (
        <section
          className={`movement-table-card${loading ? "" : ` fade-init${fadeIn ? " fade-in" : ""}`}`}
        >
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 movement-table">
              <thead>
              <tr>
                <th>Producto</th>
                <th className="d-none d-md-table-cell">Categoria</th>
                <th>Tipo</th>
                <th className="text-center">Stock</th>
                <th className="d-none d-lg-table-cell text-center">Lote</th>
                <th className="d-none d-xl-table-cell">Fecha</th>
                <th className="d-none d-lg-table-cell text-end">Usuario</th>
              </tr>
              </thead>

              <tbody>
                {loading &&
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr className="skeleton-table-row" key={`movement-skeleton-${index}`}>
                      <td data-label="Producto">
                        <div className="movement-product-identity">
                          <span className="movement-product-avatar skeleton-avatar" />
                          <div className="skeleton-cell-stack">
                            <span className="skeleton-line skeleton-line-title" />
                            <span className="skeleton-line skeleton-line-small" />
                          </div>
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell" data-label="Categoria">
                        <span className="skeleton-line" />
                      </td>
                      <td data-label="Tipo">
                        <span className="skeleton-pill" />
                      </td>
                      <td className="text-center fw-semibold" data-label="Stock">
                        <span className="skeleton-line skeleton-line-number" />
                      </td>
                      <td
                        className="d-none d-lg-table-cell text-center"
                        data-label="Lote"
                      >
                        <span className="skeleton-line skeleton-line-number" />
                      </td>
                      <td className="d-none d-xl-table-cell" data-label="Fecha">
                        <span className="skeleton-line" />
                      </td>
                      <td
                        className="d-none d-lg-table-cell text-end"
                        data-label="Usuario"
                      >
                        <span className="skeleton-line" />
                      </td>
                    </tr>
                  ))}

                {!loading && visibleMovements.map((movement) => {
                  const type = getMovementType(movement.tipo);

                  return (
                    <tr
                      key={movement.movimiento_id}
                      onClick={() => setSelectedMovement(movement)}
                    >
                      <td data-label="Producto">
                        <div className="movement-product-identity">
                          <span className="movement-product-avatar">
                            {getInitials(movement.producto_nombre)}
                          </span>
                          <div>
                            <strong>{movement.producto_nombre}</strong>
                            <div className="text-secondary small">
                              {movement.motivo || "Sin motivo indicado"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="d-none d-md-table-cell" data-label="Categoria">
                        {movement.producto_categoria || "Sin categoria"}
                      </td>

                      <td data-label="Tipo">
                        <span className={`badge rounded-pill movement-type ${type.className}`}>
                          {type.label} {type.symbol}
                          {movement.cantidad}
                        </span>
                      </td>

                      <td className="text-center fw-semibold" data-label="Stock">
                        <span>{movement.stock_anterior}</span>
                        <span className="movement-stock-arrow">{"=>"}</span>
                        <span>{movement.stock_nuevo}</span>
                      </td>

                      <td
                        className="d-none d-lg-table-cell text-center"
                        data-label="Lote"
                      >
                        {movement.numero_lote || "Sin lote"}
                      </td>

                      <td className="d-none d-xl-table-cell" data-label="Fecha">
                        {formatDateTime(movement.created_at)}
                      </td>

                      <td
                        className="d-none d-lg-table-cell text-end"
                        data-label="Usuario"
                      >
                        {movement.usuario_nombre || "Sin usuario"}
                      </td>
                    </tr>
                  );
                })}

                {!loading && !visibleMovements.length && (
                  <tr>
                    <td colSpan={7} className="movement-empty-state">
                      No hay movimientos que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedMovement && (
        <MovementCardLayout
          movement={selectedMovement}
          onClose={() => setSelectedMovement(null)}
        />
      )}
    </main>
  );
};

export default GetMovements;
