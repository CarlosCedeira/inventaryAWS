import { useState } from "react";
import Spinners from "../../spiners/spiners";
import "./cardLayout.css";

import { useProduct } from "./hooks/useProductForm";
import { formatDate } from "./utils/date";
import { validateProductForm } from "../productFormUtils";

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

const CardLayout = ({ onClose, id }) => {
  const [disabled, setDisabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { formData, setFormData, categorias, loading, loadError, reload, update } = useProduct(id);

  const normalizeFormForValidation = () => {
    const firstInventario = formData.inventario?.[0] || {};

    return {
      producto_nombre: formData.nombre || "",
      producto_descripcion: formData.descripcion || "",
      categoria_id: formData.categoria_id || "",
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
        <form className="product-detail" onSubmit={handleSubmit}>
          <header className="product-detail-header">
            <div className="product-detail-heading">
              <span className="product-detail-avatar">
                {getInitials(formData.nombre)}
              </span>

              <div>
                <p className="text-secondary mb-1">Detalle de producto</p>
                <h2>{formData.nombre || "Producto"}</h2>
                <span className="badge rounded-pill product-category-pill">
                  {formData.categoria_nombre || "Inventario"}
                </span>
              </div>
            </div>

            <div className="product-detail-actions">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setDisabled(!disabled)}
              >
                {disabled ? "Editar" : "Bloquear"}
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
            <section className="product-detail-summary">
              <article className="product-detail-metric">
                <span>Stock total</span>
                <strong>{totalCantidad}</strong>
                <small>Unidades disponibles</small>
              </article>

              <article className="product-detail-metric">
                <span>Precio compra</span>
                <strong>{formData.precio_compra || 0}</strong>
                <small>Coste unitario</small>
              </article>

              <article className="product-detail-metric">
                <span>Precio venta</span>
                <strong>{formData.precio_venta || 0}</strong>
                <small>Venta al publico</small>
              </article>
            </section>

            <section className="product-detail-section">
              <div className="product-detail-section-title">
                <h3>Lotes de inventario</h3>
                <span>{formData.inventario?.length || 0} lotes</span>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 product-lots-table">
                  <thead>
                    <tr>
                      <th>Cantidad</th>
                      <th>Caducidad</th>
                      <th>Numero de lote</th>
                    </tr>
                  </thead>

                  <tbody>
                    {formData.inventario?.map((item, index) => (
                      <tr key={item.inventario_id}>
                        <td data-label="Cantidad">
                          <input
                            type="number"
                            disabled={disabled || saving}
                            value={item.cantidad || ""}
                            onChange={(e) =>
                              handleInventarioChange(
                                index,
                                "cantidad",
                                e.target.value
                              )
                            }
                            className="form-control"
                            min="0"
                            step="1"
                          />
                        </td>

                        <td data-label="Caducidad">
                          <input
                            type="date"
                            disabled={disabled || saving}
                            value={formatDate(item.fecha_caducidad)}
                            onChange={(e) =>
                              handleInventarioChange(
                                index,
                                "fecha_caducidad",
                                e.target.value
                              )
                            }
                            className="form-control"
                          />
                        </td>

                        <td data-label="Numero de lote">
                          <input
                            type="text"
                            disabled={disabled || saving}
                            value={item.numero_lote || ""}
                            onChange={(e) =>
                              handleInventarioChange(
                                index,
                                "numero_lote",
                                e.target.value
                              )
                            }
                            className="form-control"
                            maxLength={50}
                          />
                        </td>
                      </tr>
                    ))}

                    {!formData.inventario?.length && (
                      <tr>
                        <td colSpan="3" className="product-detail-empty">
                          No hay lotes registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="product-detail-section">
              <div className="product-detail-section-title">
                <h3>Informacion general</h3>
              </div>

              <div className="product-form-grid">
                <div className="product-form-field product-form-field-wide">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre || ""}
                    onChange={handleChange}
                    className="form-control"
                    disabled={disabled || saving}
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
                    disabled={disabled || saving}
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
                    disabled={disabled || saving}
                  >
                    <option value="">Selecciona una categoria</option>

                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {[
                  ["Precio de compra", "precio_compra", "number"],
                  ["Precio de venta", "precio_venta", "number"],
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
                      disabled={disabled || saving}
                      min="0"
                      step={name.includes("precio") ? "0.01" : "1"}
                    />
                  </div>
                ))}
              </div>
            </section>

            {error && <div className="alert alert-danger py-2" role="alert">{error} <button type="button" className="btn btn-sm btn-outline-danger" disabled={saving} onClick={() => { setError(""); reload(); }}>Recargar ficha (descarta cambios)</button></div>}

            <footer className="product-detail-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>

              <button className="btn btn-success" type="submit" disabled={disabled || saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </footer>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardLayout;
