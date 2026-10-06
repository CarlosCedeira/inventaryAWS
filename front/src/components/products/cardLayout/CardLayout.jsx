import { useState } from "react";
import Spinners from "../../spiners/spiners";
import "./cardLayout.css";

import { useProduct } from "./hooks/useProductForm";
import { formatDate } from "./utils/date";
import { validateProductForm } from "../productFormUtils";
import { useEscapeKey } from "../../../hooks/useEscapeKey";

const validateEditableStockQuantity = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "La cantidad es obligatoria";
  }

  const quantity = Number(value);

  if (!Number.isFinite(quantity)) return "La cantidad debe ser un numero valido";
  if (!Number.isInteger(quantity)) return "La cantidad debe ser un numero entero";
  if (quantity < 0) return "La cantidad no puede ser negativa";

  return null;
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "PR";

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));

const CardLayout = ({ onClose, onEdit, id }) => {
  const [disabled, setDisabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { formData, setFormData, categorias, impuestos, loading, loadError, reload, update } = useProduct(id);
  useEscapeKey(!saving, onClose);

  const normalizeFormForValidation = () => {
    const firstInventario = formData.inventario?.[0] || {};

    return {
      producto_nombre: formData.nombre || "",
      producto_descripcion: formData.descripcion || "",
      categoria_id: formData.categoria_id || "",
      impuesto_id: formData.impuesto_id || "",
      precio_compra: formData.precio_compra ?? "",
      precio_venta: formData.precio_venta ?? "",
      stock_minimo: formData.stock_minimo ?? "",
      cantidad: firstInventario.cantidad ?? 0,
      fecha_caducidad: firstInventario.fecha_caducidad || "",
      numero_lote: firstInventario.numero_lote || "",
    };
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) setError("");
  };

  const handleInventarioChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedInventario = [...prev.inventario];

      updatedInventario[index] = {
        ...updatedInventario[index],
        [field]: value,
      };

      return {
        ...prev,
        inventario: updatedInventario,
      };
    });

    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const validationError = validateProductForm(normalizeFormForValidation(), {
      allowZeroQuantity: true,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    for (const item of formData.inventario || []) {
      const quantityError = validateEditableStockQuantity(item.cantidad);

      if (quantityError) {
        setError(quantityError);
        return;
      }
    }

    const updatedData = {
      ...formData,
      nombre: formData.nombre.trim(),
      descripcion: (formData.descripcion || "").trim(),
    };

    setSaving(true);
    setError("");
    try {
      await update(updatedData);
      onClose?.();
    } catch (failure) {
      setError(failure.message || "No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const totalCantidad = formData.inventario?.reduce(
    (acc, item) => acc + Number(item.cantidad || 0),
    0
  );
  const categoriaActual = categorias.find((categoria) => String(categoria.id) === String(formData.categoria_id));
  const impuestoActual = impuestos.find((impuesto) => String(impuesto.id) === String(formData.impuesto_id));

  if (loading) return <Spinners />;
  if (loadError) return <div className="product-modal-backdrop position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" role="dialog" aria-modal="true" aria-label="Error al cargar producto">
    <div className="product-modal-card p-4"><p role="alert">{loadError}</p>
      <button className="btn btn-primary me-2" onClick={reload}>Reintentar</button>
      <button className="btn btn-outline-secondary" onClick={onClose}>Cerrar</button>
    </div></div>;

  return (
    <div
      className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center product-modal-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <div className="product-modal-card" onClick={(e) => e.stopPropagation()}>
        <form className={`product-detail${disabled ? " is-readonly" : ""}`} onSubmit={handleSubmit}>
          <header className="product-detail-header">
            <div className="product-detail-heading">
              <span className="product-detail-avatar">
                {getInitials(formData.nombre)}
              </span>

              <div>
                <h2>{formData.nombre || "Producto"}</h2>
              </div>
            </div>

            <div className="product-detail-actions">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={onEdit}
              >
                Editar
              </button>

              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={onClose}
              />
            </div>
          </header>

          <div className="product-detail-body">
            <section className="product-detail-summary" aria-label="Resumen del producto">
              <article className="product-detail-metric">
                <span>Disponibles</span>
                <strong>{totalCantidad}</strong>
                <small>unidades</small>
              </article>

              <article className="product-detail-metric">
                <span>Coste</span>
                <strong>{formatCurrency(formData.precio_compra)}</strong>
                <small>por unidad</small>
              </article>

              <article className="product-detail-metric">
                <span>Precio de venta</span>
                <strong>{formatCurrency(formData.precio_venta)}</strong>
                <small>sin IVA</small>
              </article>
            </section>

            <section className="product-detail-section">
              <div className="product-detail-section-title">
                <h3>Información</h3>
              </div>

              {disabled ? (
                <dl className="product-readonly-details">
                  <div className="product-readonly-detail product-readonly-detail-wide">
                    <dt>Descripción</dt>
                    <dd>{formData.descripcion || "Sin descripción"}</dd>
                  </div>
                  <div className="product-readonly-detail">
                    <dt>Categoría</dt>
                    <dd>{formData.categoria_nombre || categoriaActual?.nombre || "Sin categoría"}</dd>
                  </div>
                  <div className="product-readonly-detail">
                    <dt>IVA</dt>
                    <dd>{impuestoActual ? `${impuestoActual.nombre} · ${impuestoActual.porcentaje}%` : "No definido"}</dd>
                  </div>
                  <div className="product-readonly-detail">
                    <dt>Stock mínimo</dt>
                    <dd>{formData.stock_minimo ?? 0} unidades</dd>
                  </div>
                </dl>
              ) : <div className="product-form-grid">
                <div className="product-form-field product-form-field-wide">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre || ""}
                    onChange={handleChange}
                    className="form-control"
                    disabled={saving}
                    minLength={3}
                    maxLength={80}
                  />
                </div>

                <div className="product-form-field product-form-field-wide">
                  <label className="form-label">Descripcion</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion || ""}
                    onChange={handleChange}
                    className="form-control"
                    rows="2"
                    disabled={saving}
                    maxLength={300}
                  />
                </div>

                <div className="product-form-field">
                  <label className="form-label">Categoria</label>
                  <select
                    name="categoria_id"
                    value={formData.categoria_id || ""}
                    onChange={handleChange}
                    className="form-select"
                    disabled={saving}
                  >
                    <option value="">Selecciona una categoria</option>

                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="product-form-field">
                  <label className="form-label">IVA aplicable</label>
                  <select
                    name="impuesto_id"
                    value={formData.impuesto_id || ""}
                    onChange={handleChange}
                    className="form-select"
                    disabled={saving}
                  >
                    {impuestos.map((impuesto) => (
                      <option key={impuesto.id} value={impuesto.id}>
                        {impuesto.nombre} · {impuesto.porcentaje}%
                      </option>
                    ))}
                  </select>
                </div>

                {[
                  ["Precio de compra", "precio_compra", "number"],
                  ["Precio de venta (sin IVA)", "precio_venta", "number"],
                  ["Stock minimo", "stock_minimo", "number"],
                ].map(([label, name, type]) => (
                  <div className="product-form-field" key={name}>
                    <label className="form-label">{label}</label>
                    <input
                      type={type}
                      name={name}
                      value={formData[name] || ""}
                      onChange={handleChange}
                      className="form-control"
                      disabled={saving}
                      min="0"
                      step={name.includes("precio") ? "0.01" : "1"}
                    />
                  </div>
                ))}
              </div>}
            </section>

            <section className="product-detail-section">
              <div className="product-detail-section-title">
                <h3>Lotes</h3>
                <span>{formData.inventario?.length || 0} {formData.inventario?.length === 1 ? "lote" : "lotes"}</span>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 product-lots-table">
                  <thead><tr><th>Cantidad</th><th>Caducidad</th><th>Nº lote</th></tr></thead>
                  <tbody>
                    {formData.inventario?.map((item, index) => (
                      <tr key={item.inventario_id}>
                        <td data-label="Cantidad">{disabled ? item.cantidad : <input type="number" disabled={saving} value={item.cantidad || ""} onChange={(e) => handleInventarioChange(index, "cantidad", e.target.value)} className="form-control" min="0" step="1" />}</td>
                        <td data-label="Caducidad">{disabled ? (item.fecha_caducidad ? new Intl.DateTimeFormat("es-ES").format(new Date(`${formatDate(item.fecha_caducidad)}T00:00:00`)) : "Sin caducidad") : <input type="date" disabled={saving} value={formatDate(item.fecha_caducidad)} onChange={(e) => handleInventarioChange(index, "fecha_caducidad", e.target.value)} className="form-control" />}</td>
                        <td data-label="Nº lote">{disabled ? (item.numero_lote || "Sin número") : <input type="text" disabled={saving} value={item.numero_lote || ""} onChange={(e) => handleInventarioChange(index, "numero_lote", e.target.value)} className="form-control" maxLength={50} />}</td>
                      </tr>
                    ))}
                    {!formData.inventario?.length && <tr><td colSpan="3" className="product-detail-empty">No hay lotes registrados.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            {error && <div className="alert alert-danger py-2" role="alert">{error} <button type="button" className="btn btn-sm btn-outline-danger" disabled={saving} onClick={() => { setError(""); reload(); }}>Recargar ficha (descarta cambios)</button></div>}

            
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardLayout;
