const money = (value) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
const number = (value) => new Intl.NumberFormat("es-ES").format(Number(value || 0));

function MetricCard({ title, value, detail, onClick }) {
  const content = <><span>{title}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</>;
  return onClick ? <button type="button" className="sales-metric-card" onClick={onClick}>{content}</button> : <article className="sales-metric-card">{content}</article>;
}

export default function SalesOverview({ summary }) {
  if (!summary) return null;
  return <section className="sales-overview" aria-label="Resumen comercial">
    <MetricCard title="Facturación neta del mes" value={money(summary.month?.total)} detail={`${number(summary.month?.cantidad)} ventas · devoluciones descontadas`} />
    <MetricCard title="Ticket medio neto" value={money(summary.averageTicket?.total)} detail="Promedio del mes actual · devoluciones descontadas" />
    <MetricCard title="Producto más vendido" value={summary.topProduct ? summary.topProduct.nombre : "Sin datos"} detail={summary.topProduct ? `${number(summary.topProduct.unidades)} uds. · ${money(summary.topProduct.total)} · últimos 30 días` : "Últimos 30 días"} />
  </section>;
}
