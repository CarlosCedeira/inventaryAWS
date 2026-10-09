export default function NewSaleModal({
  activeClients,
  availableProducts,
  clientId,
  error,
  lines,
  onAddLine,
  onClose,
  onConfirm,
  onLineQuantityChange,
  onProductChange,
  onReferenceChange,
  onRemoveLine,
  onSelectClient,
  productIdToAdd,
  reference,
  saving,
  totals,
}) {
  const money = (value) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(Number(value || 0));
  const lineTotal = (line) => {
    const subtotal =
      Number(line.precio_venta || 0) * Number(line.cantidad || 0);
    return subtotal + (subtotal * Number(line.impuesto_porcentaje || 0)) / 100;
  };

  return (
    <div
      className="sale-create-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <section className="sale-create-card" aria-labelledby="sale-create-title">
          <header className="sale-create-header">
            <h2 id="sale-create-title">Nueva venta</h2>
            <button
              type="button"
              className="sale-create-close"
              aria-label="Cerrar"
              onClick={onClose}
              disabled={saving}
            >×</button>
          </header>
          <form className="sale-create-form" onSubmit={onConfirm}>
            <div className="sale-create-body">
              <div className="sales-form-grid">
                <label>
                  Cliente
                  <select
                    className="form-select"
                    value={clientId}
                    onChange={(event) => onSelectClient(event.target.value)}
                  >
                    <option value="">Venta sin cliente</option>
                    {activeClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Referencia
                  <input
                    className="form-control"
                    value={reference}
                    onChange={(event) => onReferenceChange(event.target.value)}
                    placeholder="V-00042"
                    maxLength="64"
                  />
                </label>
              </div>
              <div className="sales-lines">
                {lines.map((line) => (
                  <div className="sales-line" key={line.producto_id}>
                    <div>
                      <strong>{line.producto_nombre}</strong>
                      <small>
                        Disponible: {line.stock_disponible} · Base:{" "}
                        {money(line.precio_venta)} · IVA{" "}
                        {line.impuesto_porcentaje || 0}%
                      </small>
                    </div>
                    <input
                      className="form-control"
                      type="number"
                      min="1"
                      max={line.stock_disponible}
                      value={line.cantidad}
                      onChange={(event) =>
                        onLineQuantityChange(
                          line.producto_id,
                          event.target.value,
                        )
                      }
                    />
                    <strong>{money(lineTotal(line))}</strong>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => onRemoveLine(line.producto_id)}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
              <div className="sales-actions">
                <select
                  className="form-select"
                  aria-label="Producto para añadir"
                  value={productIdToAdd}
                  onChange={(event) => onProductChange(event.target.value)}
                  disabled={!availableProducts.length}
                >
                  <option value="">Selecciona un producto</option>
                  {availableProducts.map((product) => (
                    <option
                      key={product.producto_id}
                      value={product.producto_id}
                    >
                      {product.producto_nombre} · IVA{" "}
                      {product.impuesto_porcentaje ?? "sin asignar"}% ·
                      Disponible: {product.stock_disponible}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={onAddLine}
                  disabled={!availableProducts.length}
                >
                  Añadir producto
                </button>
              </div>
              {error && (
                <div className="alert alert-danger mt-3 mb-0">{error}</div>
              )}
            </div>
            <footer className="sale-create-footer">
              <span className="sales-modal-total">
                Base: {money(totals.subtotal)} · IVA: {money(totals.tax)} ·
                Total: {money(totals.total)}
              </span>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button className="btn btn-success" disabled={saving}>
                  {saving
                    ? "Confirmando…"
                    : `Confirmar venta · ${money(totals.total)}`}
                </button>
              </div>
            </footer>
          </form>
      </section>
    </div>
  );
}
