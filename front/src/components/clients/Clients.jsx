import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clientService } from "./clientService";
import ClientCardLayout from "./cardLayout/ClientCardLayout";
import ClientSaleModal from "../sales/ClientSaleModal";
import { useEscapeKey, useTableSelectionShortcutKeys } from "../../hooks/useEscapeKey";
import "./clients.css";

const emptyClient = {
  nombre: "",
  email: "",
  telefono: "",
  identificacion_fiscal: "",
  direccion: "",
  activo: true,
};

function normalizeClient(client) {
  return {
    nombre: client.nombre || "",
    email: client.email || "",
    telefono: client.telefono || "",
    identificacion_fiscal: client.identificacion_fiscal || "",
    direccion: client.direccion || "",
    activo: Boolean(client.activo),
  };
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [withoutPurchases, setWithoutPurchases] = useState(false);
  const [inactivePurchaseCount, setInactivePurchaseCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyClient);
  const [editingClient, setEditingClient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [saleClient, setSaleClient] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const tableRowRefs = useRef([]);

  const moveSelectedRow = (direction) => {
    setSelectedRowIndex((current) => {
      if (!clients.length) return -1;
      if (current < 0) return direction > 0 ? 0 : clients.length - 1;
      return Math.max(0, Math.min(clients.length - 1, current + direction));
    });
  };

  useTableSelectionShortcutKeys(
    !loading && clients.length > 0,
    () => moveSelectedRow(-1),
    () => moveSelectedRow(1),
    () => {
      const selectedClientRow = clients[selectedRowIndex];
      if (selectedClientRow) setSelectedClient(selectedClientRow);
    }
  );

  useEffect(() => {
    setSelectedRowIndex((current) => current >= clients.length ? clients.length - 1 : current);
  }, [clients.length]);

  useEffect(() => {
    if (selectedRowIndex >= 0) tableRowRefs.current[selectedRowIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedRowIndex]);

  const loadClients = useCallback(async (term = "", onlyWithoutPurchases = false) => {
    setLoading(true);
    try {
      setClients(await clientService.getAll(term, onlyWithoutPurchases ? 30 : null));
      setError("");
    } catch (requestError) {
      setError(requestError.message || "No se pudieron cargar los clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => void loadClients(search, withoutPurchases), 250);
    return () => clearTimeout(timeoutId);
  }, [search, withoutPurchases, loadClients]);

  useEffect(() => {
    void clientService.getAll("", 30).then((rows) => setInactivePurchaseCount(rows.length)).catch(() => setInactivePurchaseCount(null));
  }, []);

  const metrics = useMemo(() => ({
    total: clients.length,
    active: clients.filter((client) => client.activo).length,
  }), [clients]);

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyClient);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (client) => {
    setSelectedClient(null);
    setEditingClient(client);
    setForm(normalizeClient(client));
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (!saving) setShowForm(false);
  };
  useEscapeKey(showForm && !saving, closeForm);

  const saveClient = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editingClient) {
        await clientService.update(editingClient.id, form);
      } else {
        await clientService.create(form);
      }
      setShowForm(false);
      await loadClients(search, withoutPurchases);
    } catch (requestError) {
      setFormError(requestError.message || "No se pudo guardar el cliente");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (client) => {
    if (!window.confirm(`¿Desactivar a ${client.nombre}? Podrás volver a activarlo después.`)) return;
    try {
      await clientService.update(client.id, { ...normalizeClient(client), activo: false });
      await loadClients(search, withoutPurchases);
    } catch (requestError) {
      setError(requestError.message || "No se pudo desactivar el cliente");
    }
  };

  useEffect(() => {
    document.body.style.overflow = selectedClient ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedClient]);

  return (
    <main className="clients-page">
      <header className="clients-header">
        <div>
          <p className="text-secondary mb-1">Módulo comercial</p>
          <h1 className="clients-title">Clientes</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>Nuevo cliente</button>
      </header>

      <section className="clients-metrics" aria-label="Resumen de clientes">
        <article className="client-metric-card"><span>Clientes</span><strong>{loading ? "—" : metrics.total}</strong><small>Resultados actuales</small></article>
        <article className="client-metric-card"><span>Activos</span><strong>{loading ? "—" : metrics.active}</strong><small>Disponibles para ventas</small></article>
        <button type="button" className={`client-metric-card client-metric-filter${withoutPurchases ? " is-active" : ""}`} onClick={() => setWithoutPurchases((current) => !current)}><span>Sin compras recientes</span><strong>{inactivePurchaseCount ?? "—"}</strong><small>{withoutPurchases ? "Filtro activo · Desactivar" : "Sin ventas en 30 días · Filtrar"}</small></button>
      </section>

      {error && <div className="alert alert-danger" role="alert">{error} <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void loadClients(search, withoutPurchases)}>Reintentar</button></div>}

      <section className="clients-card">
        <div className="clients-toolbar">
          <label className="w-100">
            <span className="form-label">Buscar cliente</span>
            <input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, email o identificación fiscal" />
          </label>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 clients-table">
            <thead><tr><th>Cliente</th><th>Contacto</th><th>Identificación</th><th>Estado</th><th>Vender</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="clients-empty">Cargando clientes…</td></tr> : clients.length === 0 ? <tr><td colSpan="6" className="clients-empty">No hay clientes que coincidan con la búsqueda.</td></tr> : clients.map((client, index) => (
                <tr key={client.id} ref={(element) => { tableRowRefs.current[index] = element; }} className={`client-table-row${selectedRowIndex === index ? " keyboard-selected" : ""}`} onClick={() => setSelectedClient(client)}>
                  <td data-label="Cliente"><strong>{client.nombre}</strong>{client.direccion && <small>{client.direccion}</small>}</td>
                  <td data-label="Contacto"><div>{client.email || "Sin email"}</div><small>{client.telefono || "Sin teléfono"}</small></td>
                  <td data-label="Identificación">{client.identificacion_fiscal || "—"}</td>
                  <td data-label="Estado"><span className={`badge ${client.activo ? "text-bg-success" : "text-bg-secondary"}`}>{client.activo ? "Activo" : "Inactivo"}</span></td>
                  <td data-label="Vender">{client.activo ? <button type="button" className="btn btn-sm btn-success" onClick={(event) => { event.stopPropagation(); setSaleClient(client); }}>Vender</button> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ClientCardLayout client={selectedClient} onClose={() => setSelectedClient(null)} onEdit={openEdit} />
      {saleClient && <ClientSaleModal client={saleClient} onClose={() => setSaleClient(null)} onCreated={() => { setSaleClient(null); void loadClients(search, withoutPurchases); }} />}

      {showForm && <div className="client-modal-backdrop" role="presentation" onMouseDown={closeForm}>
        <section className="client-modal-card" role="dialog" aria-modal="true" aria-labelledby="client-form-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="d-flex justify-content-between align-items-center gap-3 mb-3"><h2 id="client-form-title">{editingClient ? "Editar cliente" : "Nuevo cliente"}</h2><button type="button" className="btn-close" aria-label="Cerrar" onClick={closeForm} /></div>
          <form onSubmit={saveClient}>
            <div className="row g-3">
              <label className="col-12"><span className="form-label">Nombre</span><input className="form-control" required minLength="2" maxLength="150" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} /></label>
              <label className="col-md-6"><span className="form-label">Email</span><input className="form-control" type="email" maxLength="150" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label className="col-md-6"><span className="form-label">Teléfono</span><input className="form-control" maxLength="30" value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} /></label>
              <label className="col-md-6"><span className="form-label">Identificación fiscal</span><input className="form-control" maxLength="30" value={form.identificacion_fiscal} onChange={(event) => setForm({ ...form, identificacion_fiscal: event.target.value })} /></label>
              <label className="col-md-6"><span className="form-label">Dirección</span><input className="form-control" maxLength="255" value={form.direccion} onChange={(event) => setForm({ ...form, direccion: event.target.value })} /></label>
              {editingClient && <label className="col-12 form-check ms-2"><input className="form-check-input" type="checkbox" checked={form.activo} onChange={(event) => setForm({ ...form, activo: event.target.checked })} /><span className="form-check-label">Cliente activo</span></label>}
            </div>
            {formError && <div className="alert alert-danger py-2 mt-3 mb-0">{formError}</div>}
            <div className="d-flex justify-content-end gap-2 mt-4"><button type="button" className="btn btn-outline-secondary" onClick={closeForm} disabled={saving}>Cancelar</button><button className="btn btn-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar cliente"}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
