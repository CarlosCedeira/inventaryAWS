const money = (value) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
const number = (value) => new Intl.NumberFormat("es-ES").format(Number(value || 0));

function MetricCard({ title, value, detail, onClick }) {
  const content = <><span>{title}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</>;
  return onClick ? <button type="button" className="sales-metric-card" onClick={onClick}>{content}</button> : <article className="sales-metric-card">{content}</article>;
}

export default function SalesOverview({ summary, onApplyFilter }) {
  if (!summary) return null;
  return <section className="sales-overview" aria-label="Resumen comercial">
    <MetricCard title="Ventas de hoy" value={number(summary.today?.cantidad)} detail={money(summary.today?.total)} onClick={() => onApplyFilter({ periodo: "today" })} />
    <MetricCard title="Facturación del mes" value={money(summary.month?.total)} detail={`${number(summary.month?.cantidad)} ventas`} onClick={() => onApplyFilter({ periodo: "month" })} />
    <MetricCard title="Ticket medio" value={money(summary.averageTicket?.total)} detail="Promedio mensual" onClick={() => onApplyFilter({ periodo: "month" })} />
    <MetricCard title="Clientes recurrentes" value={number(summary.recurringClients?.cantidad)} detail="Dos o más compras en 30 días" />
    <MetricCard title="Producto más vendido" value={summary.topProduct ? summary.topProduct.nombre : "Sin datos"} detail={summary.topProduct ? `${number(summary.topProduct.unidades)} uds. · ${money(summary.topProduct.total)}` : "Últimos 30 días"} onClick={summary.topProduct ? () => onApplyFilter({ producto_id: summary.topProduct.producto_id }) : undefined} />
    <MetricCard title="Ventas de importe alto" value={number(summary.highSales?.cantidad)} detail={`${money(summary.highSales?.total)} · desde 500 €`} onClick={() => onApplyFilter({ periodo: "month", importe_minimo: "500" })} />
  </section>;
}
