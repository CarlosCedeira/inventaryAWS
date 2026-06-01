import "./movementCardLayout.css";

const MOVEMENT_TYPES = {
  entrada: {
    label: "Entrada",
    className: "movement-detail-type-entry",
    sign: "+",
  },
  salida: {
    label: "Salida",
    className: "movement-detail-type-exit",
    sign: "-",
  },
  ajuste: {
    label: "Ajuste",
    className: "movement-detail-type-adjust",
    sign: "",
  },
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "MV";

const formatDateTime = (dateString) => {
  if (!dateString) return "Sin fecha";

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
};

const formatDate = (dateString) => {
  if (!dateString) return "Sin caducidad";

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
  }).format(new Date(dateString));
};

const DetailItem = ({ label, value }) => (
  <div className="movement-detail-item">
    <span>{label}</span>
    <strong>{value || "No indicado"}</strong>
  </div>
);

const MovementCardLayout = ({ movement, onClose }) => {
  if (!movement) return null;

  const type = MOVEMENT_TYPES[movement.tipo] || {
    label: movement.tipo || "Movimiento",
    className: "movement-detail-type-neutral",
    sign: "",
  };
  const quantity = Number(movement.cantidad || 0);
  const stockBefore = Number(movement.stock_anterior || 0);
  const stockAfter = Number(movement.stock_nuevo || 0);
  const difference = stockAfter - stockBefore;
  const formattedDifference =
    difference > 0 ? `+${difference}` : String(difference);
  const movementAmount = `${type.sign}${quantity}`;

  return (
    <div
      className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center movement-detail-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <article className="movement-detail-card" onClick={(e) => e.stopPropagation()}>
        <header className="movement-detail-header">
          <div className="movement-detail-heading">
            <span className="movement-detail-avatar">
              {getInitials(movement.producto_nombre)}
            </span>

            <div>
              <p className="text-secondary mb-1">Detalle de movimiento</p>
              <h2>{movement.producto_nombre || "Producto"}</h2>
              <div className="movement-detail-meta">
                <span className={`badge rounded-pill ${type.className}`}>
                  {type.label} {movementAmount}
                </span>
                <span>{formatDateTime(movement.created_at)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar"
            onClick={onClose}
          />
        </header>

        <div className="movement-detail-body">
          <section className="movement-detail-summary">
            <article className="movement-detail-metric">
              <span>Cantidad</span>
              <strong>{quantity}</strong>
              <small>{type.label}</small>
            </article>

            <article className="movement-detail-metric">
              <span>Stock anterior</span>
              <strong>{stockBefore}</strong>
              <small>Antes del registro</small>
            </article>

            <article className="movement-detail-metric">
              <span>Stock nuevo</span>
              <strong>{stockAfter}</strong>
              <small>Despues del registro</small>
            </article>

            <article className="movement-detail-metric">
              <span>Diferencia</span>
              <strong className={difference < 0 ? "text-danger" : "text-success"}>
                {formattedDifference}
              </strong>
              <small>Impacto neto</small>
            </article>
          </section>

          <section className="movement-detail-section">
            <div className="movement-detail-section-title">
              <h3>Trazabilidad</h3>
              <span>ID #{movement.movimiento_id}</span>
            </div>

            <div className="movement-trace">
              <div className="movement-trace-node">
                <span>Stock anterior</span>
                <strong>{stockBefore}</strong>
              </div>
              <div className="movement-trace-connector">{"=>"}</div>
              <div className={`movement-trace-node movement-trace-action ${type.className}`}>
                <span>{type.label}</span>
                <strong>{movementAmount}</strong>
              </div>
              <div className="movement-trace-connector">{"=>"}</div>
              <div className="movement-trace-node">
                <span>Stock nuevo</span>
                <strong>{stockAfter}</strong>
              </div>
            </div>
          </section>

          <section className="movement-detail-section">
            <div className="movement-detail-section-title">
              <h3>Detalles operativos</h3>
            </div>

            <div className="movement-detail-grid">
              <DetailItem label="Categoria" value={movement.producto_categoria || "Sin categoria"} />
              <DetailItem label="Lote" value={movement.numero_lote || "Sin lote"} />
              <DetailItem label="Caducidad" value={formatDate(movement.fecha_caducidad)} />
              <DetailItem label="Usuario" value={movement.usuario_nombre || "Sin usuario"} />
              <DetailItem label="Motivo" value={movement.motivo} />
              <DetailItem label="Descripcion" value={movement.descripcion} />
            </div>
          </section>

          <footer className="movement-detail-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Cerrar
            </button>
          </footer>
        </div>
      </article>
    </div>
  );
};

export default MovementCardLayout;
