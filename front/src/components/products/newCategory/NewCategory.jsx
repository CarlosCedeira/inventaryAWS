import { useState } from "react";
import { productService } from "../services/productService";

const initialForm = {
  nombre: "",
  descripcion: "",
};

const NewCategory = ({ onCreated }) => {
  const [form, setForm] = useState(initialForm);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleOpenModal = () => {
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
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await productService.createCategory(form);
      onCreated?.();
      handleCloseModal();
    } catch (submitError) {
      console.error("Error al crear categoria:", submitError);
      setError(submitError.message || "No se pudo crear la categoria");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button className="btn btn-warning my-3" onClick={handleOpenModal}>
        Nueva categoria
      </button>

      {showModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title w-100 text-center">Nueva categoria</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={saving}
                />
              </div>

              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Descripcion</label>
                    <textarea
                      name="descripcion"
                      value={form.descripcion}
                      onChange={handleChange}
                      className="form-control"
                      rows="3"
                    />
                  </div>

                  {error && <div className="alert alert-danger py-2">{error}</div>}

                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseModal}
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-warning" disabled={saving}>
                      {saving ? "Creando..." : "Crear categoria"}
                    </button>
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

export default NewCategory;
