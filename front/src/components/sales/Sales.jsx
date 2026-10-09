import { useCallback, useEffect, useMemo, useState } from "react";
import { clientService } from "../clients/clientService";
import GetMovements from "../movements/GetMovements";
import { productService } from "../products/productService";
import NewSaleModal from "./NewSaleModal";
import SaleCardLayout from "./SaleCardLayout";
import SalesOverview from "./SalesOverview";
import { salesService } from "./salesService";
import { useToast } from "../feedback/ToastProvider";
import "./sales.css";

const money = (value) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
    Number(value || 0),
  );
const lineAmounts = (line) => {
  const subtotal = Number(line.precio_venta || 0) * Number(line.cantidad || 0);
  const tax = (subtotal * Number(line.impuesto_porcentaje || 0)) / 100;
  return { subtotal, tax, total: subtotal + tax };
};
const toDateInputValue = (date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const createDefaultFilters = () => {
  const endDate = new Date();
  const startDate = new Date();
  const originalDay = startDate.getDate();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - 1);
  startDate.setDate(Math.min(originalDay, new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()));
  return {
    buscar: "",
    fecha_desde: toDateInputValue(startDate),
    fecha_hasta: toDateInputValue(endDate),
    importe_minimo: "",
    estado: "",
    usuario_id: "",
  };
};

const createDefaultExportDates = () => {
  const filters = createDefaultFilters();
  return { from: filters.fecha_desde, to: filters.fecha_hasta };
};

export default function Sales({ workspaceHeader }) {
  const { success } = useToast();
  const [activeView, setActiveView] = useState("sales");
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(createDefaultFilters);
  const [summary, setSummary] = useState(null);
  const [exportDates, setExportDates] = useState(createDefaultExportDates);
  const [lines, setLines] = useState([]);
  const [clientId, setClientId] = useState("");
  const [reference, setReference] = useState("");
  const [productIdToAdd, setProductIdToAdd] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [showNewSale, setShowNewSale] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saleAction, setSaleAction] = useState("");

  const loadCatalog = useCallback(async () => {
    const [productRows, clientRows, options] = await Promise.all([
      productService.getAll(),
      clientService.getAll(),
      salesService.filterOptions(),
    ]);
    setProducts(productRows);
    setClients(clientRows);
    setUsers(options.users || []);
  }, []);
  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      setSales(await salesService.list(filters));
      setError("");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "No se pudieron cargar las ventas",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);
  const loadSummary = useCallback(async () => {
    try {
      setSummary(await salesService.summary());
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "No se pudo cargar el resumen comercial",
      );
    }
  }, []);
  useEffect(() => {
    void loadCatalog().catch((failure) =>
      setError(
        failure instanceof Error
          ? failure.message
          : "No se pudieron cargar los datos comerciales",
      ),
    );
  }, [loadCatalog]);
  useEffect(() => {
    const timeout = window.setTimeout(() => void loadSales(), 250);
    return () => window.clearTimeout(timeout);
  }, [loadSales]);
  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);
  useEffect(() => {
    document.body.style.overflow = selectedSale || showNewSale ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedSale, showNewSale]);

  const totals = useMemo(
    () =>
      lines.reduce(
        (result, line) => {
          const amount = lineAmounts(line);
          return {
            subtotal: result.subtotal + amount.subtotal,
            tax: result.tax + amount.tax,
            total: result.total + amount.total,
          };
        },
        { subtotal: 0, tax: 0, total: 0 },
      ),
    [lines],
  );
  const activeClients = clients.filter((client) => client.activo);
  const availableProducts = products.filter(
    (item) =>
      !lines.some((line) => line.producto_id === item.producto_id) &&
      Number(item.stock_disponible) > 0,
  );
  const setFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };
  const addLine = () => {
    const product = availableProducts.find(
      (item) => String(item.producto_id) === productIdToAdd,
    );
    if (!product) return setError("Selecciona un producto disponible");
    setLines([...lines, { ...product, cantidad: 1 }]);
    setProductIdToAdd("");
    setError("");
  };
  const resetNewSale = () => {
    setLines([]);
    setClientId("");
    setReference("");
    setProductIdToAdd("");
  };
  const closeNewSale = () => {
    if (saving) return;
    resetNewSale();
    setError("");
    setShowNewSale(false);
  };
  const confirm = async (event) => {
    event.preventDefault();
    if (!lines.length) return setError("Añade al menos un producto");
    setSaving(true);
    try {
      await salesService.create({
        cliente_id: clientId || null,
        referencia: reference || null,
        lineas: lines.map((line) => ({
          producto_id: line.producto_id,
          cantidad: Number(line.cantidad),
        })),
      });
      success("Venta registrada correctamente");
      resetNewSale();
      setShowNewSale(false);
      await Promise.all([loadCatalog(), loadSales(), loadSummary()]);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "No se pudo confirmar la venta",
      );
    } finally {
      setSaving(false);
    }
  };
  const openSale = async (saleId) => {
    try {
      setSelectedSale(await salesService.getById(saleId));
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "No se pudo cargar el detalle de la venta",
      );
    }
  };
  const refreshSaleAfterAction = async (saleId) => {
    const [updatedSale] = await Promise.all([
      salesService.getById(saleId),
      loadSales(),
      loadSummary(),
    ]);
    setSelectedSale(updatedSale);
  };
  const completeSale = async (saleId) => {
    setSaleAction("complete");
    try {
      await salesService.complete(saleId);
      await refreshSaleAfterAction(saleId);
    } finally {
      setSaleAction("");
    }
  };
  const cancelSale = async (saleId, reason) => {
    setSaleAction("cancel");
    try {
      await salesService.cancel(saleId, reason);
      await refreshSaleAfterAction(saleId);
    } finally {
      setSaleAction("");
    }
  };
  const returnSale = async (saleId, saleReturn) => {
    setSaleAction("return");
    try {
      await salesService.return(saleId, saleReturn);
      await refreshSaleAfterAction(saleId);
    } finally {
      setSaleAction("");
    }
  };
  const exportSales = async () => {
    if (!exportDates.from || !exportDates.to) {
      setError("Indica una fecha inicial y final para exportar");
      return;
    }
    if (exportDates.from > exportDates.to) {
      setError("La fecha inicial no puede ser posterior a la final");
      return;
    }
    setExporting(true);
    try {
      const file = await salesService.export(exportDates.from, exportDates.to);
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ventas_${exportDates.from}_${exportDates.to}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setError("");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "No se pudieron exportar las ventas",
      );
    } finally {
      setExporting(false);
    }
  };

  const operationsSwitcher = (
    <section className="commercial-switcher" aria-label="Sección comercial">
        <button
          type="button"
          className={activeView === "sales" ? "active" : ""}
          onClick={() => setActiveView("sales")}
        >
          Ventas
        </button>
        <button
          type="button"
          className={activeView === "movements" ? "active" : ""}
          onClick={() => setActiveView("movements")}
        >
          Movimientos
        </button>
    </section>
  );

  return (
    <>
      {activeView === "movements" ? (
        <GetMovements workspaceHeader={<>{workspaceHeader}{operationsSwitcher}</>} />
      ) : (
        <main className="sales-page">
          {workspaceHeader}
          {operationsSwitcher}
          {error && <div className="alert alert-danger">{error}</div>}
          <SalesOverview summary={summary} />
          <section className="sales-export" aria-label="Exportar ventas completadas">
            <div>
              <strong>Exportar CSV</strong>
              <small>Incluye únicamente las ventas completadas.</small>
            </div>
            <label>
              Desde
              <input className="form-control" type="date" value={exportDates.from} max={exportDates.to} onChange={(event) => setExportDates((current) => ({ ...current, from: event.target.value }))} />
            </label>
            <label>
              Hasta
              <input className="form-control" type="date" value={exportDates.to} min={exportDates.from} onChange={(event) => setExportDates((current) => ({ ...current, to: event.target.value }))} />
            </label>
            <button type="button" className="btn btn-outline-primary" onClick={() => void exportSales()} disabled={exporting}>
              {exporting ? "Generando…" : "Exportar CSV"}
            </button>
          </section>
          <section className="sales-list">
            <div className="sales-list-heading">
              <div>
                <h2>Ventas registradas</h2>
                <p>
                  {loading
                    ? "Buscando ventas…"
                    : `${sales.length} resultado${sales.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setFilters(createDefaultFilters())}
              >
                Limpiar filtros
              </button>
            </div>
            <div className="sales-result-filters">
              <label className="sales-search">
                Buscar
                <input
                  className="form-control"
                  name="buscar"
                  value={filters.buscar}
                  onChange={setFilter}
                  placeholder="Referencia, cliente, producto, lote o usuario"
                />
              </label>
              <label>
                Desde
                <input
                  className="form-control"
                  type="date"
                  name="fecha_desde"
                  value={filters.fecha_desde}
                  onChange={setFilter}
                />
              </label>
              <label>
                Hasta
                <input
                  className="form-control"
                  type="date"
                  name="fecha_hasta"
                  value={filters.fecha_hasta}
                  onChange={setFilter}
                />
              </label>
              <label>
                Importe mínimo
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  name="importe_minimo"
                  value={filters.importe_minimo}
                  onChange={setFilter}
                  placeholder="500,00"
                />
              </label>
              <label>
                Estado
                <select className="form-select" name="estado" value={filters.estado} onChange={setFilter}>
                  <option value="">Todos</option>
                  <option value="pendiente_pago">Pendiente de pago</option>
                  <option value="completa">Completada</option>
                  <option value="parcialmente_devuelta">Parcialmente devuelta</option>
                  <option value="devuelta">Devuelta</option>
                  <option value="anulada">Anulada</option>
                </select>
              </label>
              <label>
                Registró
                <select
                  className="form-select"
                  name="usuario_id"
                  value={filters.usuario_id}
                  onChange={setFilter}
                >
                  <option value="">Todos</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Registró</th>
                    <th>Fecha</th>
                    <th>Líneas</th>
                    <th>Estado</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="sales-empty">
                        Cargando ventas…
                      </td>
                    </tr>
                  ) : !sales.length ? (
                    <tr>
                      <td colSpan="7" className="sales-empty">
                        No hay ventas que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr
                        className="sale-row"
                        key={sale.id}
                        onClick={() => void openSale(sale.id)}
                      >
                        
                        <td data-label="Cliente">{sale.cliente_nombre}</td>
                        <td data-label="Registró">{sale.usuario_nombre}</td>
                        <td data-label="Fecha">
                          {new Intl.DateTimeFormat("es-ES", {
                            dateStyle: "medium",
                          }).format(
                            new Date(
                              sale.fecha_confirmacion || sale.created_at,
                            ),
                          )}
                        </td>
                        <td data-label="Líneas">{sale.lineas}</td>
                        <td data-label="Estado">
                          <span className="badge text-bg-success">
                            {sale.estado}
                          </span>
                        </td>
                        <td data-label="Total">{money(sale.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}
      {showNewSale && (
        <NewSaleModal
          activeClients={activeClients}
          availableProducts={availableProducts}
          clientId={clientId}
          error={error}
          lines={lines}
          onAddLine={addLine}
          onClose={closeNewSale}
          onConfirm={confirm}
          onLineQuantityChange={(productId, quantity) =>
            setLines(
              lines.map((line) =>
                line.producto_id === productId
                  ? { ...line, cantidad: quantity }
                  : line,
              ),
            )
          }
          onProductChange={setProductIdToAdd}
          onReferenceChange={setReference}
          onRemoveLine={(productId) =>
            setLines(lines.filter((line) => line.producto_id !== productId))
          }
          onSelectClient={setClientId}
          productIdToAdd={productIdToAdd}
          reference={reference}
          saving={saving}
          totals={totals}
        />
      )}
      {selectedSale && (
        <SaleCardLayout
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onComplete={completeSale}
          onCancel={cancelSale}
          onReturn={returnSale}
          completing={saleAction === "complete"}
          cancelling={saleAction === "cancel"}
          returning={saleAction === "return"}
        />
      )}
    </>
  );
}
