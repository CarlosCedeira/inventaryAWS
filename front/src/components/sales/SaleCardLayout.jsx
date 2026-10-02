import "./saleCardLayout.css";

const money = (value) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
const dateTime = (value) => value ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "No indicada";

export default function SaleCardLayout({ sale, onClose }) {
  return <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center sale-detail-backdrop" role="dialog" aria-modal="true">
    <article className="sale-detail-card" onClick={(event) => event.stopPropagation()}>
      <header className="sale-detail-header"><div><p className="text-secondary mb-1">Detalle de venta</p><h2>{sale.referencia || `Venta #${sale.id}`}</h2><span>{dateTime(sale.fecha_confirmacion || sale.created_at)}</span></div><button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} /></header>
      <div className="sale-detail-body"><section className="sale-detail-summary"><article><span>Total</span><strong>{money(sale.total)}</strong></article><article><span>Cliente</span><strong>{sale.cliente_nombre || "Venta sin cliente"}</strong></article><article><span>Líneas</span><strong>{sale.lineas.length}</strong></article><article><span>Estado</span><strong className="text-success">{sale.estado}</strong></article></section>
        <section className="sale-detail-section"><h3>Productos vendidos</h3><div className="table-responsive"><table className="table table-sm mb-0"><thead><tr><th>Producto</th><th className="text-center">Cantidad</th><th className="text-end">Precio</th><th className="text-end">Importe</th></tr></thead><tbody>{sale.lineas.map((line) => <tr key={line.id}><td>{line.descripcion}</td><td className="text-center">{line.cantidad}</td><td className="text-end">{money(line.precio_unitario)}</td><td className="text-end">{money(line.importe_total)}</td></tr>)}</tbody></table></div></section>
        <section className="sale-detail-section"><h3>Lotes enviados</h3>{!sale.movimientos.length ? <p className="mb-0 text-secondary">No hay movimientos asociados.</p> : <div className="sale-lot-list">{sale.movimientos.map((movement) => <div key={movement.id}><strong>{movement.producto_nombre}</strong><span>Lote {movement.numero_lote || "sin número"} · {movement.cantidad} unidades</span></div>)}</div>}</section>
        <footer className="sale-detail-footer"><button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cerrar</button></footer>
      </div>
    </article>
  </div>;
}
