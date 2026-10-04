import { useState } from "react";
import "./saleCardLayout.css";

const money = (value) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
const dateTime = (value) => value ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "No indicada";
const statusClass = (status) => status === "anulada" ? "badge text-bg-danger" : ["pendiente_pago", "devuelta", "parcialmente_devuelta"].includes(status) ? "badge sale-status-warning" : "badge text-bg-success";

export default function SaleCardLayout({ sale, onCancel, onClose, onComplete, onReturn, cancelling = false, completing = false, returning = false }) {
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationError, setCancellationError] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnQuantities, setReturnQuantities] = useState({});
  const [returnError, setReturnError] = useState("");

  const handleCancel = async () => {
    const reason = cancellationReason.trim();
    if (!reason) return setCancellationError("Indica el motivo de la anulación");
    try { setCancellationError(""); await onCancel(sale.id, reason); }
    catch (error) { setCancellationError(error instanceof Error ? error.message : "No se pudo anular la venta"); }
  };

  const handleComplete = async () => {
    try { await onComplete(sale.id); }
    catch (error) { setCancellationError(error instanceof Error ? error.message : "No se pudo completar la venta"); }
  };

  const returnableMovements = sale.movimientos.filter((movement) => Number(movement.cantidad) > Number(movement.cantidad_devuelta || 0));
  const invoiceLines = sale.lineas.filter((line) => Number(line.cantidad_facturable || 0) > 0);
  const handleReturn = async (allPending = false) => {
    const reason = returnReason.trim();
    if (!reason) return setReturnError("Indica el motivo de la devolución");
    const lines = returnableMovements.map((movement) => {
      const pending = Number(movement.cantidad) - Number(movement.cantidad_devuelta || 0);
      const quantity = allPending ? pending : Number(returnQuantities[movement.id] || 0);
      return { movimiento_id: movement.id, cantidad: quantity, pending };
    }).filter((line) => line.cantidad > 0);
    if (!lines.length) return setReturnError("Indica al menos una cantidad para devolver");
    if (lines.some((line) => !Number.isInteger(line.cantidad) || line.cantidad > line.pending)) return setReturnError("La cantidad supera las unidades pendientes del lote");
    try {
      setReturnError("");
      await onReturn(sale.id, { motivo: reason, lineas: lines.map(({ movimiento_id, cantidad }) => ({ movimiento_id, cantidad })) });
      setReturnReason(""); setReturnQuantities({});
    } catch (error) { setReturnError(error instanceof Error ? error.message : "No se pudo registrar la devolución"); }
  };

  return <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center sale-detail-backdrop" role="dialog" aria-modal="true">
    <article className="sale-detail-card" onClick={(event) => event.stopPropagation()}>
      <header className="sale-detail-header"><div><p className="text-secondary mb-1">Detalle de venta</p><h2>{sale.referencia || `Venta #${sale.id}`}</h2><span>{dateTime(sale.fecha_confirmacion || sale.created_at)}</span></div><button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} /></header>
      <div className="sale-detail-body">
        <section className="sale-detail-summary"><article><span>Base neta</span><strong>{money(sale.subtotal_neto)}</strong></article><article><span>IVA neto</span><strong>{money(sale.impuesto_neto)}</strong></article><article><span>Total original</span><strong>{money(sale.total)}</strong></article><article><span>Devuelto</span><strong>{money(sale.total_devuelto)}</strong></article><article><span>Total neto</span><strong>{money(sale.total_neto)}</strong></article><article><span>Cliente</span><strong>{sale.cliente_nombre}</strong></article><article><span>Líneas</span><strong>{sale.lineas.length}</strong></article><article><span>Estado</span><strong className={statusClass(sale.estado)}>{sale.estado}</strong></article></section>


        <section className="sale-detail-section"><h3>Lotes enviados</h3>{!sale.movimientos.length ? <p className="mb-0 text-secondary">No hay movimientos asociados.</p> : <div className="sale-lot-list">{sale.movimientos.map((movement) => { const returned = Number(movement.cantidad_devuelta || 0); return <div key={movement.id}><strong>{movement.producto_nombre}</strong><span>Lote {movement.numero_lote || "sin número"} · {movement.cantidad} enviadas{returned > 0 ? ` · ${returned} devueltas` : ""}</span></div>; })}</div>}</section>

        {sale.devoluciones?.length > 0 && <section className="sale-detail-section"><h3>Devoluciones</h3><div className="sale-return-history">{sale.devoluciones.map((item) => <div key={item.id}><strong>Devolución #{item.id} · {money(item.total)}</strong><span>{item.motivo} · {dateTime(item.fecha_devolucion)} · {item.usuario_nombre}</span></div>)}</div></section>}
        <section className="sale-detail-section"><h3>Productos facturables</h3>{!invoiceLines.length ? <p className="mb-0 text-secondary">No quedan productos ni importes pendientes de facturar.</p> : <div className="table-responsive"><table className="table table-sm mb-0"><thead><tr><th>Producto</th><th className="text-center">Cantidad</th><th className="text-end">Precio</th><th className="text-end">Base neta</th><th className="text-end">IVA neto</th><th className="text-end">Total</th></tr></thead><tbody>{invoiceLines.map((line) => <tr key={line.id}><td>{line.descripcion}<small className="d-block text-secondary">{line.impuesto_nombre || "Sin IVA"} · {line.impuesto_porcentaje || 0}%{Number(line.cantidad_devuelta || 0) > 0 ? ` · ${line.cantidad_devuelta} devueltas` : ""}</small></td><td className="text-center">{line.cantidad_facturable}</td><td className="text-end">{money(line.precio_unitario)}</td><td className="text-end">{money(line.subtotal_neto)}</td><td className="text-end">{money(line.impuesto_neto)}</td><td className="text-end">{money(line.importe_neto)}</td></tr>)}</tbody></table></div>}</section>
        {sale.estado === "anulada" && <section className="sale-detail-section"><h3>Anulación</h3><p className="mb-1"><strong>Motivo:</strong> {sale.motivo_anulacion}</p><p className="mb-1"><strong>Fecha:</strong> {dateTime(sale.fecha_anulacion)}</p><p className="mb-0"><strong>Anulada por:</strong> {sale.anulada_por_nombre || `Usuario #${sale.anulada_por}`}</p></section>}

        {["pendiente_pago", "completa", "parcialmente_devuelta"].includes(sale.estado) && returnableMovements.length > 0 && <section className="sale-detail-section"><h3>Registrar devolución</h3><label className="form-label">Motivo</label><textarea className="form-control mb-3" rows="2" maxLength="255" value={returnReason} onChange={(event) => { setReturnReason(event.target.value); setReturnError(""); }} disabled={returning} required /><div className="sale-return-lines">{returnableMovements.map((movement) => { const pending = Number(movement.cantidad) - Number(movement.cantidad_devuelta || 0); return <label key={movement.id}><span>{movement.producto_nombre} · lote {movement.numero_lote || "sin número"}<small>{pending} pendientes</small></span><input className="form-control" type="number" min="0" max={pending} step="1" value={returnQuantities[movement.id] || ""} onChange={(event) => { setReturnQuantities((current) => ({ ...current, [movement.id]: event.target.value })); setReturnError(""); }} disabled={returning} /></label>; })}</div>{returnError && <div className="alert alert-danger py-2 mt-2 mb-0">{returnError}</div>}<div className="d-flex flex-wrap gap-2 mt-3"><button type="button" className="btn btn-warning" onClick={() => void handleReturn(false)} disabled={returning}>{returning ? "Guardando…" : "Devolver selección"}</button><button type="button" className="btn btn-outline-warning" onClick={() => void handleReturn(true)} disabled={returning}>{returning ? "Guardando…" : "Devolver todo lo pendiente"}</button></div></section>}

        {["pendiente_pago", "completa"].includes(sale.estado) && <section className="sale-detail-section"><h3>Anular venta</h3><label className="form-label" htmlFor={`cancel-sale-${sale.id}`}>Motivo de la anulación</label><textarea id={`cancel-sale-${sale.id}`} className="form-control" rows="3" maxLength="255" value={cancellationReason} onChange={(event) => { setCancellationReason(event.target.value); setCancellationError(""); }} disabled={cancelling} required />{cancellationError && <div className="alert alert-danger py-2 mt-2 mb-0">{cancellationError}</div>}</section>}
        <footer className="sale-detail-footer">{sale.estado === "pendiente_pago" && <button type="button" className="btn btn-success" onClick={() => void handleComplete()} disabled={completing}>{completing ? "Completando…" : "Marcar como completada"}</button>}{["pendiente_pago", "completa"].includes(sale.estado) && <button type="button" className="btn btn-outline-danger" onClick={() => void handleCancel()} disabled={cancelling}>{cancelling ? "Anulando…" : "Anular venta"}</button>}<button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cerrar</button></footer>
      </div>
    </article>
  </div>;
}
