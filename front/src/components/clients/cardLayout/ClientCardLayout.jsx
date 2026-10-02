import "./clientCardLayout.css";

const getInitials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "CL";

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value))
  : "No disponible";

const DetailItem = ({ label, value }) => (
  <div className="client-detail-item">
    <span>{label}</span>
    <strong>{value || "No indicado"}</strong>
  </div>
);

export default function ClientCardLayout({ client, onClose, onEdit }) {
  if (!client) return null;

  return (
    <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center client-detail-backdrop" role="dialog" aria-modal="true" aria-labelledby="client-detail-title" onMouseDown={onClose}>
      <article className="client-detail-card" onMouseDown={(event) => event.stopPropagation()}>
        <header className="client-detail-header">
          <div className="client-detail-heading">
            <span className="client-detail-avatar">{getInitials(client.nombre)}</span>
            <div>
              <p className="text-secondary mb-1">Ficha de cliente</p>
              <h2 id="client-detail-title">{client.nombre}</h2>
              <div className="client-detail-meta">
                <span className={`badge rounded-pill ${client.activo ? "text-bg-success" : "text-bg-secondary"}`}>{client.activo ? "Activo" : "Inactivo"}</span>
                <span>Cliente #{client.id}</span>
              </div>
            </div>
          </div>
          <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
        </header>

        <div className="client-detail-body">
          <section className="client-detail-summary">
            <article className="client-detail-metric"><span>Estado</span><strong>{client.activo ? "Activo" : "Inactivo"}</strong><small>Disponible para ventas</small></article>
            <article className="client-detail-metric"><span>Contacto</span><strong>{client.email ? "Email" : "Pendiente"}</strong><small>{client.email || "Sin correo registrado"}</small></article>
            <article className="client-detail-metric"><span>Registro</span><strong>{formatDate(client.created_at)}</strong><small>Fecha de alta</small></article>
          </section>

          <section className="client-detail-section">
            <div className="client-detail-section-title"><h3>Información de contacto</h3></div>
            <div className="client-detail-grid">
              <DetailItem label="Email" value={client.email} />
              <DetailItem label="Teléfono" value={client.telefono} />
              <DetailItem label="Dirección" value={client.direccion} />
              <DetailItem label="Identificación fiscal" value={client.identificacion_fiscal} />
            </div>
          </section>

          <footer className="client-detail-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cerrar</button>
            <button type="button" className="btn btn-primary" onClick={() => onEdit(client)}>Editar cliente</button>
          </footer>
        </div>
      </article>
    </div>
  );
}
