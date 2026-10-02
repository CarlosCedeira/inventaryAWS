import { useEffect, useMemo, useState } from "react";
import { clientService } from "../clients/clientService";
import GetMovements from "../movements/GetMovements";
import { productService } from "../products/productService";
import SaleCardLayout from "./SaleCardLayout";
import { salesService } from "./salesService";
import "./sales.css";

const money = (value) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));

export default function Sales() {
  const [activeView, setActiveView] = useState("sales");
  const [sales, setSales] = useState([]); const [products, setProducts] = useState([]); const [clients, setClients] = useState([]);
  const [lines, setLines] = useState([]); const [clientId, setClientId] = useState(""); const [reference, setReference] = useState(""); const [productIdToAdd, setProductIdToAdd] = useState("");
  const [selectedSale, setSelectedSale] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); try { const [saleRows, productRows, clientRows] = await Promise.all([salesService.list(), productService.getAll(), clientService.getAll()]); setSales(saleRows); setProducts(productRows); setClients(clientRows.filter((client) => client.activo)); setError(""); } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudieron cargar las ventas"); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  useEffect(() => { document.body.style.overflow = selectedSale ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [selectedSale]);
  const total = useMemo(() => lines.reduce((sum, line) => sum + Number(line.precio_venta) * Number(line.cantidad), 0), [lines]);
  const availableProducts = products.filter((item) => !lines.some((line) => line.producto_id === item.producto_id) && Number(item.stock_disponible) > 0);
  const addLine = () => { const product = availableProducts.find((item) => String(item.producto_id) === productIdToAdd); if (!product) return setError("Selecciona un producto disponible"); setLines([...lines, { ...product, cantidad: 1 }]); setProductIdToAdd(""); setError(""); };
  const confirm = async (event) => { event.preventDefault(); if (!lines.length) return setError("Añade al menos un producto"); setSaving(true); try { await salesService.create({ cliente_id: clientId || null, referencia: reference || null, lineas: lines.map((line) => ({ producto_id: line.producto_id, cantidad: Number(line.cantidad) })) }); setLines([]); setClientId(""); setReference(""); await load(); } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo confirmar la venta"); } finally { setSaving(false); } };
  const openSale = async (saleId) => { try { setSelectedSale(await salesService.getById(saleId)); } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo cargar el detalle de la venta"); } };
  return <>
    <section className="commercial-switcher" aria-label="Sección comercial"><button type="button" className={activeView === "sales" ? "active" : ""} onClick={() => setActiveView("sales")}>Ventas</button><button type="button" className={activeView === "movements" ? "active" : ""} onClick={() => setActiveView("movements")}>Movimientos</button></section>
    {activeView === "movements" ? <GetMovements /> : <main className="sales-page"><header className="sales-header"><div><p className="text-secondary mb-1">Módulo comercial</p><h1>Ventas</h1></div><span className="sales-total">Total actual: {money(total)}</span></header>
      {error && <div className="alert alert-danger">{error}</div>}
      <section className="sales-composer"><h2>Nueva venta</h2><form onSubmit={confirm}><div className="sales-form-grid"><label>Cliente<select className="form-select" value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="">Venta sin cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nombre}</option>)}</select></label><label>Referencia<input className="form-control" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="V-00042" maxLength="64" /></label></div>
        <div className="sales-lines">{lines.map((line) => <div className="sales-line" key={line.producto_id}><div><strong>{line.producto_nombre}</strong><small>Disponible: {line.stock_disponible} · {money(line.precio_venta)}</small></div><input className="form-control" type="number" min="1" max={line.stock_disponible} value={line.cantidad} onChange={(event) => setLines(lines.map((item) => item.producto_id === line.producto_id ? { ...item, cantidad: event.target.value } : item))} /><strong>{money(Number(line.precio_venta) * Number(line.cantidad || 0))}</strong><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setLines(lines.filter((item) => item.producto_id !== line.producto_id))}>Quitar</button></div>)}</div>
        <div className="sales-actions"><select className="form-select" aria-label="Producto para añadir" value={productIdToAdd} onChange={(event) => setProductIdToAdd(event.target.value)} disabled={!availableProducts.length}><option value="">Selecciona un producto</option>{availableProducts.map((product) => <option key={product.producto_id} value={product.producto_id}>{product.producto_nombre} · Disponible: {product.stock_disponible}</option>)}</select><button type="button" className="btn btn-outline-primary" onClick={addLine} disabled={!availableProducts.length}>Añadir producto</button><button className="btn btn-primary" disabled={saving}>{saving ? "Confirmando…" : `Confirmar venta · ${money(total)}`}</button></div></form></section>
      <section className="sales-list"><h2>Ventas registradas</h2><div className="table-responsive"><table className="table table-hover mb-0"><thead><tr><th>Referencia</th><th>Cliente</th><th>Fecha</th><th>Líneas</th><th>Estado</th><th>Total</th></tr></thead><tbody>{loading ? <tr><td colSpan="6">Cargando ventas…</td></tr> : !sales.length ? <tr><td colSpan="6">Todavía no hay ventas.</td></tr> : sales.map((sale) => <tr className="sale-row" key={sale.id} onClick={() => void openSale(sale.id)}><td>{sale.referencia || `#${sale.id}`}</td><td>{sale.cliente_nombre}</td><td>{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(sale.created_at))}</td><td>{sale.lineas}</td><td><span className="badge text-bg-success">{sale.estado}</span></td><td>{money(sale.total)}</td></tr>)}</tbody></table></div></section></main>}
    {selectedSale && <SaleCardLayout sale={selectedSale} onClose={() => setSelectedSale(null)} />}
  </>;
}
