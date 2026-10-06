import { useEscapeKey } from "../../hooks/useEscapeKey";

export default function NewSaleModal({
  activeClients, availableProducts, clientId, error, lines, onAddLine, onClose,
  onConfirm, onLineQuantityChange, onProductChange, onReferenceChange, onRemoveLine,
  onSelectClient, productIdToAdd, reference, saving, totals, lockedClient = false,
}) {
  useEscapeKey(!saving, onClose);
  const money = (value) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
  const lineTotal = (line) => {
    const subtotal = Number(line.precio_venta || 0) * Number(line.cantidad || 0);
    return subtotal + subtotal * Number(line.impuesto_porcentaje || 0) / 100;
  };

  return <div className="modal d-block sale-create-modal" tabIndex="-1" style={{ background: "rgba(15,23,42,.5)" }} role="dialog" aria-modal="true">
    <div className="modal-dialog modal-xl modal-dialog-scrollable">
      <div className="modal-content">
        <div className="modal-header"><div><p className="text-secondary mb-1">Módulo comercial</p><h2 className="modal-title">Nueva venta</h2></div><button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} disabled={saving} /></div>
        <form onSubmit={onConfirm}>
          <div className="modal-body">
            <div className="sales-form-grid"><label>Cliente *{lockedClient ? <input className="form-control" value={activeClients[0]?.nombre || ""} disabled /> : <select className="form-select" value={clientId} onChange={(event) => onSelectClient(event.target.value)} required><option value="">Selecciona un cliente</option>{activeClients.map((client) => <option key={client.id} value={client.id}>{client.nombre}</option>)}</select>}</label><label>Referencia<input className="form-control" value={reference} onChange={(event) => onReferenceChange(event.target.value)} placeholder="V-00042" maxLength="64" /></label></div>
            <div className="sales-lines">{lines.map((line) => <div className="sales-line" key={line.producto_id}><div><strong>{line.producto_nombre}</strong><small>Disponible: {line.stock_disponible} · Base: {money(line.precio_venta)} · IVA {line.impuesto_porcentaje || 0}%</small></div><input className="form-control" type="number" min="1" max={line.stock_disponible} value={line.cantidad} onChange={(event) => onLineQuantityChange(line.producto_id, event.target.value)} /><strong>{money(lineTotal(line))}</strong><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onRemoveLine(line.producto_id)}>Quitar</button></div>)}</div>
            <div className="sales-actions"><select className="form-select" aria-label="Producto para añadir" value={productIdToAdd} onChange={(event) => onProductChange(event.target.value)} disabled={!availableProducts.length}><option value="">Selecciona un producto</option>{availableProducts.map((product) => <option key={product.producto_id} value={product.producto_id}>{product.producto_nombre} · IVA {product.impuesto_porcentaje ?? "sin asignar"}% · Disponible: {product.stock_disponible}</option>)}</select><button type="button" className="btn btn-outline-primary" onClick={onAddLine} disabled={!availableProducts.length}>Añadir producto</button></div>
            {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
          </div>
          <div className="modal-footer justify-content-between"><span className="sales-modal-total">Base: {money(totals.subtotal)} · IVA: {money(totals.tax)} · Total: {money(totals.total)}</span><div className="d-flex gap-2"><button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancelar</button><button className="btn btn-success" disabled={saving}>{saving ? "Confirmando…" : `Confirmar venta · ${money(totals.total)}`}</button></div></div>
        </form>
      </div>
    </div>
  </div>;
}
