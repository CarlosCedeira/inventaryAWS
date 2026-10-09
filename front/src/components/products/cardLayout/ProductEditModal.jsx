import { useState } from "react";
import Spinners from "../../spiners/spiners";
import { useProduct } from "./hooks/useProductForm";
import { validateProductForm } from "../productFormUtils";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { useToast } from "../../feedback/ToastProvider";
import "./productEditModal.css";

export default function ProductEditModal({ id, onClose, onSaved }) {
  const { success } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { formData, setFormData, categorias, impuestos, loading, loadError, update } = useProduct(id);
  useEscapeKey(!saving, onClose);

  const changeField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationError = validateProductForm({
      producto_nombre: formData.nombre || "",
      producto_descripcion: formData.descripcion || "",
      categoria_id: formData.categoria_id || "",
      impuesto_id: formData.impuesto_id || "",
      precio_compra: formData.precio_compra ?? "",
      precio_venta: formData.precio_venta ?? "",
      stock_minimo: formData.stock_minimo ?? "",
      cantidad: 1,
      fecha_caducidad: "",
      numero_lote: "",
    }, { allowZeroQuantity: true });

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      await update({
        nombre: formData.nombre.trim(),
        descripcion: (formData.descripcion || "").trim(),
        categoria_id: formData.categoria_id,
        impuesto_id: formData.impuesto_id,
        precio_compra: formData.precio_compra,
        precio_venta: formData.precio_venta,
        stock_minimo: formData.stock_minimo,
      });
      success("Producto actualizado correctamente");
      await onSaved?.();
    } catch (failure) {
      setError(failure.message || "No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="product-edit-backdrop"><Spinners /></div>;
  if (loadError) return <div className="product-edit-backdrop"><section className="product-edit-modal"><p role="alert">{loadError}</p><button className="btn btn-outline-secondary" onClick={onClose}>Cerrar</button></section></div>;

  return <div className="product-edit-backdrop" role="presentation" onMouseDown={() => !saving && onClose()}>
    <section className="product-edit-modal" role="dialog" aria-modal="true" aria-labelledby="product-edit-title" onMouseDown={(event) => event.stopPropagation()}>
      <header className="product-edit-header"><h2 id="product-edit-title">Editar producto</h2><button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} disabled={saving} /></header>
      <form onSubmit={submit}>
        <div className="row g-3">
          <label className="col-12"><span className="form-label">Nombre</span><input className="form-control" name="nombre" value={formData.nombre || ""} onChange={changeField} minLength="3" maxLength="80" required disabled={saving} /></label>
          <label className="col-12"><span className="form-label">Descripción</span><textarea className="form-control" name="descripcion" value={formData.descripcion || ""} onChange={changeField} rows="2" maxLength="300" required disabled={saving} /></label>
          <label className="col-md-6"><span className="form-label">Categoría</span><select className="form-select" name="categoria_id" value={formData.categoria_id || ""} onChange={changeField} required disabled={saving}><option value="">Selecciona una categoría</option>{categorias.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select></label>
          <label className="col-md-6"><span className="form-label">IVA aplicable</span><select className="form-select" name="impuesto_id" value={formData.impuesto_id || ""} onChange={changeField} required disabled={saving}>{impuestos.map((tax) => <option key={tax.id} value={tax.id}>{tax.nombre} · {tax.porcentaje}%</option>)}</select></label>
          <label className="col-md-4"><span className="form-label">Precio de compra</span><input className="form-control" type="number" name="precio_compra" value={formData.precio_compra ?? ""} onChange={changeField} min="0" step="0.01" required disabled={saving} /></label>
          <label className="col-md-4"><span className="form-label">Precio de venta sin IVA</span><input className="form-control" type="number" name="precio_venta" value={formData.precio_venta ?? ""} onChange={changeField} min="0" step="0.01" required disabled={saving} /></label>
          <label className="col-md-4"><span className="form-label">Stock mínimo</span><input className="form-control" type="number" name="stock_minimo" value={formData.stock_minimo ?? ""} onChange={changeField} min="0" step="1" required disabled={saving} /></label>
        </div>
        {error && <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">{error}</div>}
        <footer className="product-edit-footer"><button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancelar</button><button className="btn btn-success" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button></footer>
      </form>
    </section>
  </div>;
}
