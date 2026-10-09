import "./clientCardLayout.css";
import { useEscapeKey } from "../../../hooks/useEscapeKey";

const getInitials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "CL";

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value))
  : "No disponible";

const DetailItem = ({ label, value, wide = false }) => (
  <div className={`client-readonly-detail${wide ? " client-readonly-detail-wide" : ""}`}>
    <dt>{label}</dt>
    <dd>{value || "No indicado"}</dd>
  </div>
);

export default function ClientCardLayout({ client, onClose, onEdit }) {
  useEscapeKey(Boolean(client), onClose);
  if (!client) return null;

  return (
    <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center client-detail-backdrop" role="dialog" aria-modal="true" aria-labelledby="client-detail-title" onMouseDown={onClose}>
      <article className="client-detail-card" onMouseDown={(event) => event.stopPropagation()}>
        <header className="client-detail-header">
          <div className="client-detail-heading">
            <span className="client-detail-avatar">{getInitials(client.nombre)}</span>
            <div>
              <h2 id="client-detail-title">{client.nombre}</h2>
            </div>
          </div>
          <div className="client-detail-actions">
            <button type="button" className="btn btn-outline-primary" onClick={() => onEdit(client)}>Editar</button>
            <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
          </div>
        </header>

        <div className="client-detail-body">
          <section className="client-detail-summary">
            <article className="client-detail-metric"><span>Estado</span><strong>{client.activo ? "Activo" : "Inactivo"}</strong><small>Disponible para ventas</small></article>
            <article className="client-detail-metric"><span>Contacto</span><strong>{client.email ? "Email" : "Pendiente"}</strong><small>{client.email || "Sin correo registrado"}</small></article>
            <article className="client-detail-metric"><span>Registro</span><strong>{formatDate(client.created_at)}</strong><small>Fecha de alta</small></article>
          </section>

          <section className="client-detail-section">
            <div className="client-detail-section-title"><h3>Información</h3></div>
            <dl className="client-readonly-details">
              <DetailItem label="Email" value={client.email} wide />
              <DetailItem label="Teléfono" value={client.telefono} />
              <DetailItem label="Identificación fiscal" value={client.identificacion_fiscal} />
              <DetailItem label="Dirección" value={client.direccion} wide />
              <DetailItem label="Cliente" value={`#${client.id}`} />
              <DetailItem label="Estado" value={client.activo ? "Activo" : "Inactivo"} />
            </dl>
          </section>
        </div>
      </article>
    </div>
  );
}
