import { useState } from "react";
import Spinners from "../../spiners/spiners";
import "./cardLayout.css";

import { useProduct } from "./hooks/useProductForm";
import { formatDate } from "./utils/date";
import { validateProductForm } from "../utils/productFormUtils";

const CardLayout = ({ onClose, id }) => {
  const [disabled, setDisabled] = useState(true);
  const [error, setError] = useState("");

  const { formData, setFormData, categorias, loading, update } = useProduct(id);

  const normalizeFormForValidation = () => {
    const firstInventario = formData.inventario?.[0] || {};

    return {
      producto_nombre: formData.nombre || "",
      producto_descripcion: formData.descripcion || "",
      categoria_id: formData.categoria_id || "",
      precio_compra: formData.precio_compra || "",
      precio_venta: formData.precio_venta || "",
      stock_minimo: formData.stock_minimo || "",
      cantidad: firstInventario.cantidad || "",
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

    const validationError = validateProductForm(normalizeFormForValidation());

    if (validationError) {
      setError(validationError);
      return;
    }

    const updatedData = {
      ...formData,
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
    };

    console.log("Datos a actualizar enviados desde el formulario:", updatedData);

    await update(updatedData);
    onClose?.();
  };

  const totalCantidad = formData.inventario?.reduce(
    (acc, item) => acc + Number(item.cantidad || 0),
    0
  );

  if (loading) return <Spinners />;

  return (
    <div
      className="position-fixed top-0 start-0 d-flex align-items-center justify-content-center product-modal-backdrop py-md-3 py-lg-5"
      style={{
        width: window.innerWidth < 768 ? null : "100%",
      }}
    >
      <div
        className="card shadow product-modal-card pt-3 pb-5 py-md-0 mx-md-3 mx-lg-5"
        style={{ maxHeight: "50vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body position-relative overflow-auto">
          <button
            className="btn btn-close fs-5 position-absolute end-0"
            onClick={onClose}
          />

          <article className="modal-content">
            <button
              className="btn btn-primary position-absolute"
              onClick={() => setDisabled(!disabled)}
            >
              Editar
            </button>

            <header className="modal-header my-3 my-lg-0 ms-3 me-5" />

            <h3 className="text-center">Lotes de inventario</h3>

            <table className="mt-3">
              <thead>
                <tr>
                  <th>Cantidad</th>
                  <th>Caducidad</th>
                  <th>Número de lote</th>
                </tr>
              </thead>

              <tbody>
                {formData.inventario?.map((item, index) => (
                  <tr key={item.inventario_id}>
                    <td>
                      <input
                        type="number"
                        disabled={disabled}
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

                    <td>
                      <input
                        type="date"
                        disabled={disabled}
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

                    <td>
                      <input
                        type="text"
                        disabled={disabled}
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

                <tr>
                  <th>{totalCantidad} Cantidad total</th>
                </tr>
              </tbody>
            </table>

            <form onSubmit={handleSubmit}>
              <div className="container-fluid mt-5">
                <div className="mb-3 row align-items-center">
                  <label className="col-sm-3 col-form-label text-nowrap">
                    Nombre
                  </label>

                  <div className="col-sm-9">
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre || ""}
                      onChange={handleChange}
                      className="form-control"
                      disabled={disabled}
                      minLength={3}
                      maxLength={80}
                    />
                  </div>
                </div>

                <div className="mb-3 row align-items-center">
                  <label className="col-sm-3 col-form-label text-nowrap">
                    Descripción
                  </label>

                  <div className="col-sm-9">
                    <textarea
                      name="descripcion"
                      value={formData.descripcion || ""}
                      onChange={handleChange}
                      className="form-control"
                      rows="2"
                      disabled={disabled}
                      maxLength={300}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3 row align-items-center">
                      <label className="col-sm-6 col-form-label text-nowrap">
                        Categoria
                      </label>

                      <div className="col-sm-6">
                        <select
                          name="categoria_id"
                          value={formData.categoria_id || ""}
                          onChange={handleChange}
                          className="form-control"
                          disabled={disabled}
                        >
                          <option value="">Selecciona una categoria</option>

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
                        <label className="col-sm-6 col-form-label text-nowrap">
                          {label}
                        </label>

                        <div className="col-sm-6">
                          <input
                            type={type}
                            name={name}
                            value={formData[name] || ""}
                            onChange={handleChange}
                            className="form-control"
                            disabled={disabled}
                            min="0"
                            step={name.includes("precio") ? "0.01" : "1"}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="col-md-6"></div>

                  {error && (
                    <div className="alert alert-danger py-2">{error}</div>
                  )}

                  <div className="d-flex justify-content-between align-items-end gap-5">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={onClose}
                    >
                      Cancelar
                    </button>

                    <button
                      className="btn btn-success"
                      type="submit"
                      disabled={disabled}
                    >
                      Guardar cambios
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </article>
        </div>
      </div>
    </div>
  );
};

export default CardLayout;