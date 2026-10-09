import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clientService } from "./clientService";
import ClientCardLayout from "./cardLayout/ClientCardLayout";
import ClientSaleModal from "../sales/ClientSaleModal";
import { salesService } from "../sales/salesService";
import { useEscapeKey, useTableSelectionShortcutKeys } from "../../hooks/useEscapeKey";
import { useToast } from "../feedback/ToastProvider";
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

export default function Clients({ onShowOperations, workspaceHeader }) {
  const { success } = useToast();
  const [clients, setClients] = useState([]);
  const [dashboardClients, setDashboardClients] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [search, setSearch] = useState("");
  const [withoutPurchases, setWithoutPurchases] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
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

  const loadClients = useCallback(async (term = "", onlyWithoutPurchases = false, status = "") => {
    setLoading(true);
    try {
      setClients(await clientService.getAll(term, onlyWithoutPurchases ? 30 : null, status));
      setError("");
    } catch (requestError) {
      setError(requestError.message || "No se pudieron cargar los clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => void loadClients(search, withoutPurchases, statusFilter), 250);
    return () => clearTimeout(timeoutId);
  }, [search, withoutPurchases, statusFilter, loadClients]);

  const loadDashboard = useCallback(async () => {
    try {
      const [clientRows, saleRows] = await Promise.all([
        clientService.getAll(),
        salesService.recent(),
      ]);
      setDashboardClients(clientRows);
      setRecentSales(saleRows);
    } catch {
      setDashboardClients([]);
      setRecentSales([]);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(() => ({
    active: dashboardClients.filter((client) => client.activo).length,
    inactive: dashboardClients.filter((client) => !client.activo).length,
    newClients: dashboardClients.filter((client) => {
      if (!client.created_at) return false;
      const createdAt = new Date(client.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdAt >= thirtyDaysAgo;
    }).length,
    withoutPurchases: dashboardClients.filter((client) => client.activo && !client.ultima_compra).length,
    recurring: dashboardClients.filter((client) => client.activo && Number(client.compras_30d || 0) >= 2).length,
    incompleteBilling: dashboardClients.filter((client) => client.activo && (!client.email || !client.identificacion_fiscal)).length,
  }), [dashboardClients]);

  const getInitials = (name = "") => name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "CL";

  const formatLastPurchase = (dateString) => {
    if (!dateString) return "Sin compras";
    const purchaseDate = new Date(dateString);
    if (Number.isNaN(purchaseDate.getTime())) return "Sin compras";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    purchaseDate.setHours(0, 0, 0, 0);
    const days = Math.round((today - purchaseDate) / 86400000);
    if (days <= 0) return "Hoy";
    if (days === 1) return "Ayer";
    if (days < 30) return `Hace ${days} días`;
    return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(purchaseDate);
  };

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
      success(editingClient ? "Cliente actualizado correctamente" : "Cliente creado correctamente");
      setShowForm(false);
      await Promise.all([
        loadClients(search, withoutPurchases, statusFilter),
        loadDashboard(),
      ]);
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
      await loadClients(search, withoutPurchases, statusFilter);
      await loadDashboard();
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
      {workspaceHeader}
      <header className="clients-header">
       
        <button type="button" className="btn btn-success" onClick={openCreate}>Nuevo cliente</button>
      </header>

      <section className="clients-dashboard" aria-label="Resumen de clientes">
        <section className="clients-metrics">
          <article className="client-metric-card"><span>Activos</span><strong>{loading ? "—" : metrics.active}</strong><small>Disponibles para ventas</small></article>
          <article className="client-metric-card"><span>Inactivos</span><strong>{loading ? "—" : metrics.inactive}</strong><small>Clientes desactivados</small></article>
          <article className="client-metric-card"><span>Nuevos 30d</span><strong>{loading ? "—" : metrics.newClients}</strong><small>Altas en los últimos 30 días</small></article>
          <button type="button" className={`client-metric-card client-metric-filter${withoutPurchases ? " is-active" : ""}`} aria-pressed={withoutPurchases} onClick={() => setWithoutPurchases((current) => !current)}><span>Sin compras 30d</span><strong>{loading ? "—" : metrics.withoutPurchases}</strong><small>{withoutPurchases ? "Filtro activo · Desactivar" : "Clientes activos sin compras"}</small></button>
          <article className="client-metric-card"><span>Recurrentes 30d</span><strong>{loading ? "—" : metrics.recurring}</strong><small>Dos o más compras completadas</small></article>
          <article className="client-metric-card"><span>Datos incompletos</span><strong>{loading ? "—" : metrics.incompleteBilling}</strong><small>Sin NIF/CIF o email</small></article>
        </section>
        <aside className="clients-recent-sales" aria-label="Últimas ventas">
          <h2>Últimas ventas</h2>
          <ul>
            {recentSales.map((sale) => <li key={sale.id}><span>{sale.cliente_nombre || "Venta sin cliente"}</span><strong>{new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(sale.total_neto ?? sale.total ?? 0))}</strong></li>)}
          </ul>
          <button type="button" onClick={onShowOperations}>Ver operaciones completas</button>
        </aside>
      </section>

      {error && <div className="alert alert-danger" role="alert">{error} <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void loadClients(search, withoutPurchases, statusFilter)}>Reintentar</button></div>}

      <section className="clients-card">
        <div className="clients-toolbar">
          <label className="w-100">
            <span className="form-label">Buscar cliente</span>
            <input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, email o identificación fiscal" />
          </label>
          <label className="client-status-filter">
            <span className="form-label">Estado</span>
            <select className="form-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </label>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 clients-table">
            <thead><tr><th>Cliente</th><th>Contacto</th><th>Identificación</th><th>Última compra</th><th>Estado</th><th>Vender</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="clients-empty">Cargando clientes…</td></tr> : clients.length === 0 ? <tr><td colSpan="6" className="clients-empty">No hay clientes que coincidan con la búsqueda.</td></tr> : clients.map((client, index) => (
                <tr key={client.id} ref={(element) => { tableRowRefs.current[index] = element; }} className={`client-table-row${selectedRowIndex === index ? " keyboard-selected" : ""}`} onClick={() => setSelectedClient(client)}>
                  <td data-label="Cliente"><div className="client-identity"><span className="client-avatar">{getInitials(client.nombre)}</span><div><strong>{client.nombre}</strong>{client.direccion && <small>{client.direccion}</small>}</div></div></td>
                  <td data-label="Contacto"><div>{client.email || "Sin email"}</div><small>{client.telefono || "Sin teléfono"}</small></td>
                  <td data-label="Identificación">{client.identificacion_fiscal || "—"}</td>
                  <td data-label="Última compra"><span className={client.ultima_compra ? "client-last-purchase" : "client-no-purchase"}>{formatLastPurchase(client.ultima_compra)}</span></td>
                  <td data-label="Estado"><span className={`badge ${client.activo ? "text-bg-success" : "text-bg-secondary"}`}>{client.activo ? "Activo" : "Inactivo"}</span></td>
                  <td data-label="Vender">{client.activo ? <button type="button" className="btn btn-sm btn-outline-primary" onClick={(event) => { event.stopPropagation(); setSaleClient(client); }}>Vender</button> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ClientCardLayout client={selectedClient} onClose={() => setSelectedClient(null)} onEdit={openEdit} />
      {saleClient && <ClientSaleModal client={saleClient} onClose={() => setSaleClient(null)} onCreated={() => { setSaleClient(null); void Promise.all([loadClients(search, withoutPurchases, statusFilter), loadDashboard()]); }} />}

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
