import { useEffect, useState } from "react";
import { productService } from "../products/productService";
import { movementService } from "./movementService";
import {
  normalizeStockQuantity,
  validateStockQuantity,
} from "../../utils/stockQuantity";

const MOVEMENT_TYPES = ["entrada", "salida", "ajuste", "devolucion", "merma"];

const initialForm = {
  tipo: "entrada",
  producto_id: "",
  producto_nombre: "",
  cantidad: "",
  numero_lote: "",
  fecha_caducidad: "",
  motivo: "",
  descripcion: "",
};

const NewMovement = ({ onCreated }) => {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!showModal || form.producto_nombre.trim().length < 2 || form.producto_id) {
      setProducts([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await productService.search(form.producto_nombre.trim());
        setProducts(results);
      } catch (searchError) {
        console.error(searchError);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [form.producto_id, form.producto_nombre, showModal]);

  const handleOpen = () => {
    setError("");
    setShowModal(true);
  };

  const handleClose = () => {
    if (saving) return;
    setShowModal(false);
    setError("");
    setProducts([]);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "producto_nombre" ? { producto_id: "" } : {}),
    }));

    if (error) setError("");
  };

  const handleSelectProduct = (product) => {
    setForm((current) => ({
      ...current,
      producto_id: product.producto_id,
      producto_nombre: product.producto_nombre,
    }));
    setProducts([]);
  };

  const validateForm = () => {
    if (!form.producto_id) return "Selecciona un producto de la lista";
    if (!form.tipo) return "Selecciona el tipo de movimiento";

    const quantityError = validateStockQuantity(form.cantidad);
    if (quantityError) return quantityError;

    if (form.numero_lote.length > 100) {
      return "El numero de lote no puede superar los 100 caracteres";
    }

    if (form.motivo.length > 255) {
      return "El motivo no puede superar los 255 caracteres";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await movementService.create({
        tipo: form.tipo,
        producto_id: Number(form.producto_id),
        cantidad: normalizeStockQuantity(form.cantidad),
        numero_lote: form.numero_lote.trim() || null,
        fecha_caducidad: form.fecha_caducidad || null,
        motivo: form.motivo.trim() || null,
        descripcion: form.descripcion.trim() || null,
      });

      await onCreated?.();
      handleClose();
    } catch (submitError) {
      console.error(submitError);
      setError(submitError.message || "No se pudo registrar el movimiento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button className="btn btn-success my-3 me-5" onClick={handleOpen}>
        Nuevo movimiento
      </button>

      {showModal && (
        <div
          className="modal d-block modal-lg"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title w-100 text-center">Anadir movimiento</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleClose}
                  disabled={saving}
                />
              </div>

              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="container-fluid">
                    <div className="mb-3 row align-items-center position-relative">
                      <label className="col-sm-3 col-form-label text-nowrap">Producto</label>
                      <div className="col-sm-9">
                        <input
                          type="text"
                          name="producto_nombre"
                          value={form.producto_nombre}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Buscar por nombre"
                          autoComplete="off"
                          required
                        />
                        {products.length > 0 && (
                          <div className="list-group position-absolute start-0 end-0 mx-3 mt-1 shadow movement-product-results">
                            {products.map((product) => (
                              <button
                                type="button"
                                className="list-group-item list-group-item-action"
                                key={product.producto_id}
                                onClick={() => handleSelectProduct(product)}
                              >
                                {product.producto_nombre}
                                <span className="text-muted ms-2">
                                  Stock: {product.stock_total}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {searching && (
                          <div className="form-text">Buscando productos...</div>
                        )}
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3 row align-items-center">
                          <label className="col-sm-5 col-form-label text-nowrap">Tipo</label>
                          <div className="col-sm-7">
                            <select
                              name="tipo"
                              value={form.tipo}
                              onChange={handleChange}
                              className="form-control"
                              required
                            >
                              {MOVEMENT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mb-3 row align-items-center">
                          <label className="col-sm-5 col-form-label text-nowrap">
                            {form.tipo === "ajuste" ? "Stock nuevo" : "Cantidad"}
                          </label>
                          <div className="col-sm-7">
                            <input
                              type="number"
                              name="cantidad"
                              value={form.cantidad}
                              onChange={handleChange}
                              className="form-control"
                              min="1"
                              step="1"
                              required
                            />
                          </div>
                        </div>

                        <div className="mb-3 row align-items-center">
                          <label className="col-sm-5 col-form-label text-nowrap">Motivo</label>
                          <div className="col-sm-7">
                            <input
                              type="text"
                              name="motivo"
                              value={form.motivo}
                              onChange={handleChange}
                              className="form-control"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3 row align-items-center">
                          <label className="col-sm-5 col-form-label text-nowrap">Lote</label>
                          <div className="col-sm-7">
                            <input
                              type="text"
                              name="numero_lote"
                              value={form.numero_lote}
                              onChange={handleChange}
                              className="form-control"
                            />
                          </div>
                        </div>

                        <div className="mb-3 row align-items-center">
                          <label className="col-sm-5 col-form-label text-nowrap">Caducidad</label>
                          <div className="col-sm-7">
                            <input
                              type="date"
                              name="fecha_caducidad"
                              value={form.fecha_caducidad}
                              onChange={handleChange}
                              className="form-control"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Descripcion</label>
                      <textarea
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                        className="form-control"
                        rows="2"
                      />
                    </div>

                    {error && <div className="alert alert-danger py-2">{error}</div>}

                    <div className="d-flex justify-content-between align-items-end gap-5">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleClose}
                        disabled={saving}
                      >
                        Cancelar
                      </button>
                      <button className="btn btn-success" type="submit" disabled={saving}>
                        {saving ? "Guardando..." : "Crear movimiento"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewMovement;
