import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { movementService, type Movement, type MovementFilters, type MovementType } from "./movementService";
import MovementCardLayout from "./cardLayout/MovementCardLayout";
import { useTableSelectionShortcutKeys } from "../../hooks/useEscapeKey";
import "./GetMovements.css";

const dateInputValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const defaultDateRange = () => {
  const end = new Date();
  const start = new Date(end);
  const originalDay = start.getDate();
  start.setDate(1);
  start.setMonth(start.getMonth() - 1);
  start.setDate(Math.min(originalDay, new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()));
  return { startDate: dateInputValue(start), endDate: dateInputValue(end) };
};

type MovementMetric = "all" | "purchases" | "replenishments" | "sales" | "waste" | "adjustments";

const normalizedReason = (movement: Movement) => movement.motivo?.trim().toLocaleLowerCase("es-ES") || "";
const isPurchase = (movement: Movement) => movement.tipo === "entrada" && normalizedReason(movement) === "compra proveedor";
const isSale = (movement: Movement) => movement.tipo === "salida" && normalizedReason(movement) === "venta";
const metricFilters: Record<MovementMetric, { label: string; matches: (movement: Movement) => boolean }> = {
  all: { label: "Todos los movimientos", matches: () => true },
  purchases: { label: "Compras", matches: isPurchase },
  replenishments: { label: "Reposiciones", matches: (movement) => movement.tipo === "entrada" && !isPurchase(movement) },
  sales: { label: "Ventas", matches: isSale },
  waste: { label: "Mermas", matches: (movement) => movement.tipo === "salida" && !isSale(movement) },
  adjustments: { label: "Ajustes", matches: (movement) => movement.tipo === "ajuste" },
};

const logisticsStatusLabels = {
  pendiente_picking: { label: "Pendiente de picking", className: "movement-logistics-pending" },
  finalizado: { label: "Finalizado", className: "movement-logistics-complete" },
  cancelado: { label: "Cancelado", className: "movement-logistics-cancelled" },
} as const;

const MovementCompletionDialog = ({ movement, onCancel, onConfirm, pending }: {
  movement: Movement;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) => (
  <div className="movement-completion-backdrop" role="dialog" aria-modal="true" aria-labelledby="movement-completion-title">
    <section className="movement-completion-dialog">
      <h2 id="movement-completion-title">Finalizar picking</h2>
      <p>¿Confirmas que el almacén ha preparado esta mercancía?</p>
      <dl>
        <div><dt>Producto</dt><dd>{movement.producto_nombre}</dd></div>
        <div><dt>Lote</dt><dd>{movement.numero_lote || "Sin lote"}</dd></div>
        <div><dt>Estado logístico</dt><dd>Pendiente de picking <span aria-hidden="true">→</span> Finalizado</dd></div>
      </dl>
      <div className="movement-completion-actions">
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={pending}>Cancelar</button>
        <button type="button" className="btn btn-success" onClick={onConfirm} disabled={pending}>
          {pending ? "Finalizando…" : "Finalizar picking"}
        </button>
      </div>
    </section>
  </div>
);

const GetMovements = ({ workspaceHeader }: { workspaceHeader?: ReactNode }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [movementToComplete, setMovementToComplete] = useState<Movement | null>(null);
  const [completingPicking, setCompletingPicking] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MovementType | "">("");
  const [activeMetric, setActiveMetric] = useState<MovementMetric | null>(null);
  const [startDate, setStartDate] = useState(() => defaultDateRange().startDate);
  const [endDate, setEndDate] = useState(() => defaultDateRange().endDate);
  const requestId = useRef(0);
  const tableRowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

  const apiFilters = useMemo<MovementFilters>(() => ({
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  }), [typeFilter, startDate, endDate, search]);

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
    const timeoutId = setTimeout(() => void fetchMovements(apiFilters), 250);
    return () => clearTimeout(timeoutId);
  }, [apiFilters, fetchMovements]);

  const visibleMovements = useMemo(
    () => activeMetric ? movements.filter(metricFilters[activeMetric].matches) : movements,
    [activeMetric, movements],
  );

  const moveSelectedRow = (direction: number) => {
    setSelectedRowIndex((current) => {
      if (!visibleMovements.length) return -1;
      if (current < 0) return direction > 0 ? 0 : visibleMovements.length - 1;
      return Math.max(0, Math.min(visibleMovements.length - 1, current + direction));
    });
  };

  useTableSelectionShortcutKeys(
    !loading && visibleMovements.length > 0,
    () => moveSelectedRow(-1),
    () => moveSelectedRow(1),
    () => {
      const selectedMovementRow = visibleMovements[selectedRowIndex];
      if (selectedMovementRow) setSelectedMovement(selectedMovementRow);
    }
  );

  useEffect(() => {
    setSelectedRowIndex((current) => current >= visibleMovements.length ? visibleMovements.length - 1 : current);
  }, [visibleMovements.length]);

  useEffect(() => {
    if (selectedRowIndex >= 0) tableRowRefs.current[selectedRowIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedRowIndex]);

  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => setFadeIn(true), 10);
      return () => clearTimeout(timeoutId);
    }

    setFadeIn(false);
  }, [loading]);

  useEffect(() => {
    document.body.style.overflow = selectedMovement || movementToComplete ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedMovement, movementToComplete]);

  const completePicking = async () => {
    if (!movementToComplete) return;

    setCompletingPicking(true);
    try {
      const updated = await movementService.completePicking(movementToComplete.movimiento_id);
      const applyLogisticsStatus = (movement: Movement) => (
        movement.movimiento_id === updated.movementId
          ? { ...movement, estado_logistico: updated.estado_logistico }
          : movement
      );
      setMovements((current) => current.map(applyLogisticsStatus));
      setSelectedMovement((current) => current ? applyLogisticsStatus(current) : null);
      setMovementToComplete(null);
      setError("");
    } catch (completionError) {
      setError(completionError instanceof Error ? completionError.message : "No se pudo finalizar el picking");
    } finally {
      setCompletingPicking(false);
    }
  };

  const metrics = useMemo(() => {
    const purchases = movements.filter(isPurchase).length;
    const sales = movements.filter(isSale).length;
    const adjustments = movements.filter(metricFilters.adjustments.matches).length;

    return {
      totalMovements: movements.length,
      purchases,
      replenishments: movements.filter(metricFilters.replenishments.matches).length,
      sales,
      waste: movements.filter(metricFilters.waste.matches).length,
      adjustments,
    };
  }, [movements]);

  const toggleMetric = (metric: MovementMetric) => {
    setActiveMetric((current) => current === metric ? null : metric);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "";

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  const formatExpirationDate = (dateString: string | null) => {
    if (!dateString) return "Sin caducidad";

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeZone: "UTC",
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

  const formatPeriod = () => {
    const formatDate = (value: string) => new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));

    if (startDate && endDate) return `Del ${formatDate(startDate)} al ${formatDate(endDate)}`;
    if (startDate) return `Desde ${formatDate(startDate)}`;
    if (endDate) return `Hasta ${formatDate(endDate)}`;
    return "Todo el historial";
  };

  const activePeriodLabel = formatPeriod();

  return (
    <main className="movements-page">
      {workspaceHeader}
  

      <section className="movements-metrics">
        <article className="movement-metric-card movement-metric-total">
          <span>Movimientos</span>
          {loading ? (
            <strong className="skeleton-text skeleton-text-short" />
          ) : (
            <strong>{metrics.totalMovements}</strong>
          )}
          <small>{activePeriodLabel}</small>
        </article>

        <section className="movement-metric-group movement-metric-group-entry" aria-label="Entradas">
          <header><span>Entradas</span><strong>{loading ? "—" : metrics.purchases + metrics.replenishments}</strong></header>
          <div className="movement-metric-group-items">
            <button type="button" className={`movement-metric-card movement-metric-filter${activeMetric === "purchases" ? " is-active" : ""}`} onClick={() => toggleMetric("purchases")} aria-pressed={activeMetric === "purchases"}>
              <span>Compras</span><strong className="text-success">{loading ? "—" : metrics.purchases}</strong><small>{activeMetric === "purchases" ? "Filtro activo · Desactivar" : "Entradas de proveedor"}</small>
            </button>
            <button type="button" className={`movement-metric-card movement-metric-filter${activeMetric === "replenishments" ? " is-active" : ""}`} onClick={() => toggleMetric("replenishments")} aria-pressed={activeMetric === "replenishments"}>
              <span>Reposiciones</span><strong className="text-success">{loading ? "—" : metrics.replenishments}</strong><small>{activeMetric === "replenishments" ? "Filtro activo · Desactivar" : "Otras entradas"}</small>
            </button>
          </div>
        </section>

        <section className="movement-metric-group movement-metric-group-exit" aria-label="Salidas">
          <header><span>Salidas</span><strong>{loading ? "—" : metrics.sales + metrics.waste}</strong></header>
          <div className="movement-metric-group-items">
            <button type="button" className={`movement-metric-card movement-metric-filter${activeMetric === "sales" ? " is-active" : ""}`} onClick={() => toggleMetric("sales")} aria-pressed={activeMetric === "sales"}>
              <span>Ventas</span><strong className="text-danger">{loading ? "—" : metrics.sales}</strong><small>{activeMetric === "sales" ? "Filtro activo · Desactivar" : "Salidas al vender"}</small>
            </button>
            <button type="button" className={`movement-metric-card movement-metric-filter${activeMetric === "waste" ? " is-active" : ""}`} onClick={() => toggleMetric("waste")} aria-pressed={activeMetric === "waste"}>
              <span>Mermas</span><strong className="text-danger">{loading ? "—" : metrics.waste}</strong><small>{activeMetric === "waste" ? "Filtro activo · Desactivar" : "Otras salidas"}</small>
            </button>
          </div>
        </section>

        <section className="movement-metric-group movement-metric-group-adjustment" aria-label="Ajustes">
          <header><span>Ajustes</span><strong>{loading ? "—" : metrics.adjustments}</strong></header>
          <div className="movement-metric-group-items">
            <button type="button" className={`movement-metric-card movement-metric-filter${activeMetric === "adjustments" ? " is-active" : ""}`} onClick={() => toggleMetric("adjustments")} aria-pressed={activeMetric === "adjustments"}>
              <span>Correcciones</span><strong className="text-warning">{loading ? "—" : metrics.adjustments}</strong><small>{activeMetric === "adjustments" ? "Filtro activo · Desactivar" : "Correcciones de inventario"}</small>
            </button>
          </div>
        </section>
      </section>

      <section className={`movement-table-card${loading ? "" : ` fade-init${fadeIn ? " fade-in" : ""}`}`}>
        <section className="movement-filters" aria-label="Filtrar movimientos">
      <div className="movement-filter-row movement-filter-primary">
       <div className="toolbar-field toolbar-search">
         <label className="w-100">
          <span className="form-label">Buscar </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre del producto, numero de lote y usuario"
          />
        </label>
       </div>

        <label>
          <span>Tipo de movimiento</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as MovementType | "")}>
            <option value="">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="ajuste">Ajustes</option>
          </select>
        </label>
      </div>

      <div className="movement-filter-row movement-filter-secondary">
        <label>
          <span>Desde</span>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>

        <label>
          <span>Hasta</span>
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
      </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm movement-filter-clear"
          disabled={!search && !typeFilter && !startDate && !endDate && !activeMetric}
          onClick={() => {
            setSearch("");
            setTypeFilter("");
            setStartDate("");
            setEndDate("");
            setActiveMetric(null);
          }}
        >
          Limpiar filtros
        </button>
      </section>

      <div className="movement-results-summary" aria-live="polite">
        {loading ? "Cargando movimientos…" : `Mostrando ${visibleMovements.length} ${visibleMovements.length === 1 ? "movimiento" : "movimientos"}${activeMetric ? ` · ${metricFilters[activeMetric].label}` : ""} · ${activePeriodLabel}`}
      </div>

      {error ? <div className="alert alert-danger m-3">{error}</div> : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 movement-table">
              <thead>
              <tr>
                <th>Producto</th>
                <th className="d-none d-md-table-cell">Categoria</th>
                <th>Tipo</th>
                <th className="d-none d-lg-table-cell">Estado logístico</th>
                <th className="text-center">Stock</th>
                <th className="d-none d-lg-table-cell text-center">Lote</th>
                <th className="d-none d-xl-table-cell">Caducidad</th>
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
                      <td className="d-none d-lg-table-cell" data-label="Estado logístico">
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
                      <td className="d-none d-xl-table-cell" data-label="Caducidad">
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

                {!loading && visibleMovements.map((movement, index) => {
                  const type = getMovementType(movement.tipo);
                  const logisticsStatus = logisticsStatusLabels[movement.estado_logistico] || logisticsStatusLabels.finalizado;

                  return (
                    <tr
                      key={movement.movimiento_id}
                      ref={(element) => { tableRowRefs.current[index] = element; }}
                      className={selectedRowIndex === index ? "keyboard-selected" : ""}
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

                      <td className="d-none d-lg-table-cell" data-label="Estado logístico">
                        {movement.estado_logistico === "pendiente_picking" ? (
                          <button
                            type="button"
                            className={`badge rounded-pill movement-logistics-status movement-logistics-action ${logisticsStatus.className}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setMovementToComplete(movement);
                            }}
                          >
                            {logisticsStatus.label}
                          </button>
                        ) : (
                          <span className={`badge rounded-pill movement-logistics-status ${logisticsStatus.className}`}>
                            {logisticsStatus.label}
                          </span>
                        )}
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

                      <td className="d-none d-xl-table-cell" data-label="Caducidad">
                        {formatExpirationDate(movement.fecha_caducidad)}
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
                    <td colSpan={8} className="movement-empty-state">
                      No hay movimientos que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      )}
      </section>

      {selectedMovement && (
        <MovementCardLayout
          movement={selectedMovement}
          onClose={() => setSelectedMovement(null)}
        />
      )}

      {movementToComplete && (
        <MovementCompletionDialog
          movement={movementToComplete}
          onCancel={() => !completingPicking && setMovementToComplete(null)}
          onConfirm={() => void completePicking()}
          pending={completingPicking}
        />
      )}
    </main>
  );
};

export default GetMovements;
