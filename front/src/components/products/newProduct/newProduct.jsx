import { useEffect, useState } from "react";
import { fetchWithAuth } from "../../../services/authService";
import {
  validateProductForm,
  buildProductPayload,
} from "../productFormUtils";

const API_URL = import.meta.env.VITE_API_URL;

const initialForm = {
  producto_nombre: "",
  producto_descripcion: "",
  categoria_id: "",
  precio_compra: "",
  precio_venta: "",
  stock_minimo: "",
  cantidad: "",
  fecha_caducidad: "",
  numero_lote: "",
};

const numberFields = new Set([
  "producto_categoria",
  "cantidad",
  "precio_compra",
  "precio_venta",
  "stock_minimo",
]);

const NewProduct = ({ onCreated }) => {
  const [categorias, setCategorias] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/productos/categorias`);

        if (!res.ok) throw new Error("Error al obtener categorias");

        const data = await res.json();
        setCategorias(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCategorias(false);
      }
    };

    fetchCategorias();
  }, []);

  const handleAddClick = () => {
    setError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setError("");
    setForm(initialForm);
  };

  const handleChange = (e) => {
  const { name, value } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]: value,
  }));

  if (error) {
    setError("");
  }
};

  const handleSubmit = async (e) => {
  e.preventDefault();

  const validationError = validateProductForm(form);

  if (validationError) {
    setError(validationError);
    return;
  }

  setSaving(true);
  setError("");

  try {
    const response = await fetchWithAuth(`${API_URL}/productos/newProduct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildProductPayload(form)),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(
        errorData.error ||
          errorData.message ||
          "Error al guardar los datos"
      );
    }

    await response.json();
    onCreated?.();
    handleCloseModal();
  } catch (submitError) {
    console.error("Error al guardar:", submitError);
    setError(submitError.message || "Ocurrió un error al guardar los datos");
  } finally {
    setSaving(false);
  }
};

  return (
    <>
      <button className="btn btn-primary" onClick={handleAddClick}>
        Nuevo producto
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
                <h5 className="modal-title w-100 text-center">Anadir producto</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={saving}
                />
              </div>

              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="container-fluid">
                    <div className="mb-3 row align-items-center">
                      <label className="col-sm-3 col-form-label text-nowrap">Nombre</label>
                      <div className="col-sm-9">
                        <input
                          type="text"
                          name="producto_nombre"
                          value={form.producto_nombre}
                          onChange={handleChange}
                          className="form-control"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3 row align-items-center">
                      <label className="col-sm-3 col-form-label text-nowrap">Descripcion</label>
                      <div className="col-sm-9">
                        <textarea
                          name="producto_descripcion"
                          value={form.producto_descripcion}
                          onChange={handleChange}
                          className="form-control"
                          rows="2"
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3 row align-items-center">
                          <label className="col-sm-6 col-form-label text-nowrap">Categoria</label>
                          <div className="col-sm-6">
                            <select
  name="categoria_id"
  value={form.categoria_id}
  onChange={handleChange}
  className="form-control"
  disabled={loadingCategorias}
  required
>
  <option value="">
    {loadingCategorias ? "Cargando..." : "Selecciona una categoria"}
  </option>
  {categorias.map((c) => (
    <option key={c.id} value={c.id}>
      {c.nombre}
    </option>
  ))}
</select>
                          </div>
                        </div>

                        {[
                          ["Precio de compra", "precio_compra", "number"],
                          ["Precio de venta", "precio_venta", "number"],
                          ["Stock minimo", "stock_minimo", "number"],
                        ].map(([label, name, type]) => (
                          <div className="mb-3 row align-items-center" key={name}>
                            <label className="col-sm-6 col-form-label text-nowrap">{label}</label>
                            <div className="col-sm-6">
                              <input
                                type={type}
                                name={name}
                                value={form[name]}
                                onChange={handleChange}
                                className="form-control"
                                min="0"
                                step={numberFields.has(name) && name.includes("precio") ? "0.01" : "1"}
                                required
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="col-md-6">
                        {[
                          ["Cantidad inicial", "cantidad", "number"],
                          ["Fecha de caducidad", "fecha_caducidad", "date"],
                          ["Numero de lote", "numero_lote", "text"],
                        ].map(([label, name, type]) => (
                          <div className="mb-3 row align-items-center" key={name}>
                            <label className="col-sm-6 col-form-label text-nowrap">{label}</label>
                            <div className="col-sm-6">
                              <input
                                type={type}
                                name={name}
                                value={form[name]}
                                onChange={handleChange}
                                className="form-control"
                                min={type === "number" ? "0" : undefined}
                                step={type === "number" ? "1" : undefined}
                                required={name === "cantidad"}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {error && <div className="alert alert-danger py-2">{error}</div>}

                    <div className="d-flex justify-content-between align-items-end gap-5">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCloseModal}
                        disabled={saving}
                      >
                        Cancelar
                      </button>
                      <button className="btn btn-success" type="submit" disabled={saving}>
                        {saving ? "Creando..." : "Crear producto"}
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

export default NewProduct;
