import { useEffect, useMemo, useState } from "react";
import Spinners from "../spiners/spiners";
import { movementService } from "./movementService";
import NewMovement from "./NewMovement";
import "./GetMovements.css";

const GetMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fadeIn, setFadeIn] = useState(false);

  const fetchMovements = async () => {
    try {
      const data = await movementService.getAll();
      setMovements(data);
      setError("");
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || "No se pudieron cargar los movimientos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => setFadeIn(true), 10);
      return () => clearTimeout(timeoutId);
    }

    setFadeIn(false);
  }, [loading]);

  const metrics = useMemo(() => {
    const totalQuantity = movements.reduce(
      (total, movement) => total + Number(movement.cantidad || 0),
      0
    );
    const entries = movements.filter((movement) =>
      ["entrada", "devolucion"].includes(movement.tipo)
    ).length;
    const exits = movements.filter((movement) =>
      ["salida", "merma"].includes(movement.tipo)
    ).length;
    const adjustments = movements.filter(
      (movement) => movement.tipo === "ajuste"
    ).length;

    return {
      totalMovements: movements.length,
      totalQuantity,
      entries,
      exits,
      adjustments,
    };
  }, [movements]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "";

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  const getMovementType = (type) => {
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
      devolucion: {
        label: "Devolucion",
        className: "movement-type-return",
        symbol: "+",
      },
      merma: {
        label: "Merma",
        className: "movement-type-loss",
        symbol: "-",
      },
    };

    return (
      types[type] || {
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

  if (loading) return <Spinners />;

  return (
    <main className="movements-page">
      <header className="movements-header">
        <div>
          <p className="text-secondary mb-1">Historial de stock</p>
          <h1 className="movements-title">Movimientos de inventario</h1>
        </div>

        <NewMovement onCreated={fetchMovements} />
      </header>

      <section className="movements-metrics">
        <article className="movement-metric-card">
          <span>Movimientos</span>
          <strong>{metrics.totalMovements}</strong>
          <small>Registros actuales</small>
        </article>

        <article className="movement-metric-card">
          <span>Unidades movidas</span>
          <strong>{metrics.totalQuantity}</strong>
          <small>Suma de cantidades</small>
        </article>

        <article className="movement-metric-card">
          <span>Entradas</span>
          <strong className="text-success">{metrics.entries}</strong>
          <small>Incluye devoluciones</small>
        </article>

        <article className="movement-metric-card">
          <span>Salidas y ajustes</span>
          <strong className="text-warning">
            {metrics.exits + metrics.adjustments}
          </strong>
          <small>Salidas, mermas y ajustes</small>
        </article>
      </section>

      {error && <div className="alert alert-danger">{error}</div>}

      {!error && (
        <section className={`movement-table-card fade-init${fadeIn ? " fade-in" : ""}`}>
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
                {movements.map((movement) => {
                  const type = getMovementType(movement.tipo);

                  return (
                    <tr key={movement.movimiento_id}>
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

                {!movements.length && (
                  <tr>
                    <td colSpan="7" className="movement-empty-state">
                      No hay movimientos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
};

export default GetMovements;
