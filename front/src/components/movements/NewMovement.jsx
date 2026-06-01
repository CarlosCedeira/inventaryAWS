import { useEffect, useState } from "react";
import { productService } from "../products/productService";
import { movementService } from "./movementService";
import {
  normalizeStockQuantity,
  validateStockQuantity,
} from "../../utils/stockQuantity";

const MOVEMENT_TYPES = ["entrada", "salida", "ajuste"];
const OTHER_REASON = "__otro__";

const MOVEMENT_REASONS = {
  entrada: [
    "Compra proveedor",
    "Reposicion",
    "Devolucion cliente",
    "Entrada manual",
  ],
  salida: [
    "Venta",
    "Rotura",
    "Caducado",
    "Perdida",
    "Consumo interno",
    "Salida manual",
  ],
  ajuste: [
    "Conteo inventario",
    "Correccion manual",
    "Regularizacion",
    "Error previo",
  ],
};

const initialForm = {
  tipo: "entrada",
  producto_id: "",
  producto_nombre: "",
  inventario_id: "",
  cantidad: "",
  numero_lote: "",
  fecha_caducidad: "",
  motivo: "",
  motivo_personalizado: "",
};

const NewMovement = ({ onCreated }) => {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingLots, setLoadingLots] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [availableLots, setAvailableLots] = useState([]);
  const [form, setForm] = useState(initialForm);

  const isEntry = form.tipo === "entrada";

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
    setAvailableLots([]);
    setForm(initialForm);
  };

  const normalizeDateValue = (date) => {
    if (!date) return "";
    return String(date).slice(0, 10);
  };

  const getLotLabel = (lot) => {
    const lotNumber = lot.numero_lote || "Sin lote";
    const expiration = normalizeDateValue(lot.fecha_caducidad) || "Sin caducidad";
    return `${lotNumber} - Cad: ${expiration} - Stock: ${lot.cantidad}`;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "producto_nombre"
        ? {
            producto_id: "",
            inventario_id: "",
            numero_lote: "",
            fecha_caducidad: "",
          }
        : {}),
      ...(name === "tipo"
        ? {
            motivo: "",
            motivo_personalizado: "",
            inventario_id: "",
            numero_lote: "",
            fecha_caducidad: "",
          }
        : {}),
      ...(name === "motivo" && value !== OTHER_REASON
        ? { motivo_personalizado: "" }
        : {}),
    }));

    if (name === "producto_nombre") {
      setAvailableLots([]);
    }

    if (error) setError("");
  };

  const handleSelectProduct = async (product) => {
    setForm((current) => ({
      ...current,
      producto_id: product.producto_id,
      producto_nombre: product.producto_nombre,
      inventario_id: "",
      numero_lote: "",
      fecha_caducidad: "",
    }));
    setProducts([]);

    try {
      setLoadingLots(true);
      const productDetail = await productService.getById(product.producto_id);
      setAvailableLots(productDetail?.inventario || []);
    } catch (lotError) {
      console.error(lotError);
      setAvailableLots([]);
      setError(lotError.message || "No se pudieron cargar los lotes del producto");
    } finally {
      setLoadingLots(false);
    }
  };

  const handleSelectLot = (event) => {
    const inventoryId = event.target.value;
    const selectedLot = availableLots.find(
      (lot) => String(lot.inventario_id) === inventoryId
    );

    setForm((current) => ({
      ...current,
      inventario_id: inventoryId,
      numero_lote: selectedLot?.numero_lote || "",
      fecha_caducidad: normalizeDateValue(selectedLot?.fecha_caducidad),
    }));

    if (error) setError("");
  };

  const validateForm = () => {
    if (!form.producto_id) return "Selecciona un producto de la lista";
    if (!form.tipo) return "Selecciona el tipo de movimiento";

    const quantityError = validateStockQuantity(form.cantidad);
    if (quantityError) return quantityError;

    if (form.numero_lote.length > 100) {
      return "El numero de lote no puede superar los 100 caracteres";
    }

    if (!isEntry && !form.inventario_id) {
      return "Selecciona el lote que quieres modificar";
    }

    const finalReason =
      form.motivo === OTHER_REASON
        ? form.motivo_personalizado.trim()
        : form.motivo.trim();

    if (form.motivo === OTHER_REASON && !finalReason) {
      return "Escribe el motivo personalizado";
    }

    if (finalReason.length > 255) {
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
      const finalReason =
        form.motivo === OTHER_REASON
          ? form.motivo_personalizado.trim()
          : form.motivo.trim();

      await movementService.create({
        tipo: form.tipo,
        producto_id: Number(form.producto_id),
        inventario_id: isEntry ? null : Number(form.inventario_id),
        cantidad: normalizeStockQuantity(form.cantidad),
        numero_lote: isEntry ? form.numero_lote.trim() || null : null,
        fecha_caducidad: isEntry ? form.fecha_caducidad || null : null,
        motivo: finalReason || null,
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
                            <select
                              name="motivo"
                              value={form.motivo}
                              onChange={handleChange}
                              className="form-control"
                            >
                              <option value="">Selecciona un motivo</option>
                              {MOVEMENT_REASONS[form.tipo].map((reason) => (
                                <option key={reason} value={reason}>
                                  {reason}
                                </option>
                              ))}
                              <option value={OTHER_REASON}>Otro</option>
                            </select>

                            {form.motivo === OTHER_REASON && (
                              <input
                                type="text"
                                name="motivo_personalizado"
                                value={form.motivo_personalizado}
                                onChange={handleChange}
                                className="form-control mt-2"
                                placeholder="Escribe el motivo"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        {isEntry ? (
                          <>
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
                          </>
                        ) : (
                          <div className="mb-3 row align-items-center">
                            <label className="col-sm-5 col-form-label text-nowrap">Lote</label>
                            <div className="col-sm-7">
                              <select
                                name="inventario_id"
                                value={form.inventario_id}
                                onChange={handleSelectLot}
                                className="form-control"
                                disabled={!form.producto_id || loadingLots}
                                required
                              >
                                <option value="">
                                  {loadingLots ? "Cargando lotes..." : "Selecciona un lote"}
                                </option>
                                {availableLots.map((lot) => (
                                  <option
                                    key={lot.inventario_id}
                                    value={lot.inventario_id}
                                  >
                                    {getLotLabel(lot)}
                                  </option>
                                ))}
                              </select>
                              {!loadingLots && form.producto_id && !availableLots.length && (
                                <div className="form-text">
                                  Este producto no tiene lotes con stock.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
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
