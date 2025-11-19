import { useEffect, useState } from "react";
import Spinners from "../spiners";
import Publicado from "../products/publicado/putPublicado";
import "./cardLayout.css";

const CardLayout = ({ onClose, id }) => {
  const [formData, setFormData] = useState({});
  const [disabled, setDisabled] = useState(true);
  console.log("id en cardLayout", id);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductsID = async () => {
      try {
        const response = await fetch(`http://localhost:3000/productos/${id}`);
        if (!response.ok) throw new Error("Error al obtener los clientes");
        const data = await response.json();
        setFormData(data[0]);
      } catch (error) {
        console.error("Error en la solicitud:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsID();
  }, []);

  // 🔹 Formatear fecha ISO -> YYYY-MM-DD (para mostrar en input type="date")
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // 🔹 Actualiza los valores del formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    console.log("form data desde onchange", formData);
  };

  // 🔹 Al guardar, convierte la fecha al formato ISO
  const handleSubmit = async (e) => {
    console.log("on close desde handlesubmit", onClose);
    e.preventDefault();

    const updatedData = {
      ...formData,
      fecha_caducidad: formData.fecha_caducidad
        ? new Date(formData.fecha_caducidad).toISOString()
        : null,
      fecha_creacion: formData.fecha_creacion
        ? new Date(formData.fecha_creacion).toISOString()
        : null,
    };
    console.log("fecha cambiada a estring ", updatedData);

    try {
      console.log("feeeeechingggg");
      const response = await fetch(
        `http://localhost:3000/productos/actualizar/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );
      console.log("response", response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar los datos");
      }

      const result = await response.json();
      console.log("✅ Datos guardados con éxito:", result);

      // ✅ Cierra el modal automáticamente después de guardar
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("❌ Error al enviar los datos:", error);
      alert("Ocurrió un error al guardar los datos");
    }
  };

  if (loading) return <Spinners />;
  console.log("formdata fuera del loading", formData.publicado);
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center product-modal-backdrop">
      <div
        className="card shadow product-modal-card"
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body position-relative overflow-auto">
          <article className="modal-content">
            <button
              type="button"
              className="btn-close position-absolute top-0 end-0"
              onClick={onClose}
            ></button>

            <header className="modal-header justify-content-start mb-4 ms-5">
              <button
                className="btn btn-warning"
                onClick={() => setDisabled(!disabled)}
              >
                Editar
              </button>
              <>
                <label>Publicado</label>
                <Publicado
                  publicado={formData.publicado}
                  id={formData.producto_id}
                  className="mr-1"
                />
              </>

              {formData.destacado ? (
                <>
                  <label>Destacado</label>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="34px"
                    viewBox="0 -960 960 960"
                    width="34px"
                    fill="#75FB4C"
                  >
                    <path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70h400q100 0 170 70t70 170q0 100-70 170t-170 70H280Zm0-80h400q66 0 113-47t47-113q0-66-47-113t-113-47H280q-66 0-113 47t-47 113q0 66 47 113t113 47Zm400-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM480-480Z" />
                  </svg>
                </>
              ) : (
                <>
                  <label className="ms-4">Destacado</label>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="34px"
                    viewBox="0 -960 960 960"
                    width="34px"
                    fill="#EA3323"
                  >
                    <path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70h400q100 0 170 70t70 170q0 100-70 170t-170 70H280Zm0-80h400q66 0 113-47t47-113q0-66-47-113t-113-47H280q-66 0-113 47t-47 113q0 66 47 113t113 47Zm0-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm200-120Z" />
                  </svg>
                </>
              )}
              {formData.destacado ? (
                <>
                  <label>Recomendado</label>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="34px"
                    viewBox="0 -960 960 960"
                    width="34px"
                    fill="#75FB4C"
                  >
                    <path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70h400q100 0 170 70t70 170q0 100-70 170t-170 70H280Zm0-80h400q66 0 113-47t47-113q0-66-47-113t-113-47H280q-66 0-113 47t-47 113q0 66 47 113t113 47Zm400-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM480-480Z" />
                  </svg>
                </>
              ) : (
                <>
                  <label className="ms-4">Recomendado</label>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="34px"
                    viewBox="0 -960 960 960"
                    width="34px"
                    fill="#EA3323"
                  >
                    <path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70h400q100 0 170 70t70 170q0 100-70 170t-170 70H280Zm0-80h400q66 0 113-47t47-113q0-66-47-113t-113-47H280q-66 0-113 47t-47 113q0 66 47 113t113 47Zm0-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm200-120Z" />
                  </svg>
                </>
              )}
              {formData.ranking ? (
                <input
                  type="text"
                  name="producto_nombre"
                  value={formData.ranking || ""}
                  onChange={handleChange}
                  className="form-control w-25 "
                  disabled={disabled}
                />
              ) : (
                "Ranking 0"
              )}
            </header>

            <form onSubmit={handleSubmit}>
              <div className="container-fluid">
                {/* Nombre */}
                <div className="mb-3 row align-items-center">
                  <label className="col-sm-3 col-form-label text-nowrap">
                    Nombre
                  </label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      name="producto_nombre"
                      value={formData.producto_nombre || ""}
                      onChange={handleChange}
                      className="form-control"
                      disabled={disabled}
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div className="mb-3 row align-items-center">
                  <label className="col-sm-3 col-form-label text-nowrap">
                    Descripción
                  </label>
                  <div className="col-sm-9">
                    <textarea
                      name="producto_descripcion"
                      value={formData.producto_descripcion || ""}
                      onChange={handleChange}
                      className="form-control"
                      rows="2"
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="row">
                  {/* Columna 1 */}
                  <div className="col-md-6">
                    {[
                      ["categoría", "producto_categoria", "text"],
                      ["Variante", "tipo_variante", "text"],
                      ["Valor", "valor_variante", "text"],
                      ["Cantidad", "cantidad", "number"],
                      ["Precio de compra", "precio_compra", "number"],
                      ["Precio de venta", "precio_venta", "number"],
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
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Columna 2 */}
                  <div className="col-md-6">
                    {/* Fecha de caducidad */}
                    <div className="mb-3 row align-items-center">
                      <label className="col-sm-6 col-form-label text-nowrap">
                        Caducidad
                      </label>
                      <div className="col-sm-6">
                        <input
                          type="date"
                          name="fecha_caducidad"
                          value={formatDate(formData.fecha_caducidad)}
                          onChange={handleChange}
                          className="form-control"
                          disabled={disabled}
                        />
                      </div>
                    </div>

                    {/* Fecha de creación */}
                    <div className="mb-3 row align-items-center">
                      <label className="col-sm-6 col-form-label text-nowrap">
                        Fecha de creación
                      </label>
                      <div className="col-sm-6">
                        <input
                          type="date"
                          name="fecha_creacion"
                          value={formatDate(formData.fecha_creacion)}
                          className="form-control"
                          disabled
                        />
                      </div>
                    </div>

                    {/* Código de barras */}
                    <div className="mb-3 row align-items-center">
                      <label className="col-sm-6 col-form-label text-nowrap">
                        Código de barras
                      </label>
                      <div className="col-sm-6">
                        <input
                          type="text"
                          name="codigo_barras"
                          value={formData.codigo_barras || ""}
                          onChange={handleChange}
                          className="form-control"
                          disabled={disabled}
                        />
                      </div>
                    </div>

                    <div className="mb-3 row align-items-center">
                      <label className="col-sm-6 col-form-label text-nowrap">
                        Numero de lote
                      </label>
                      <div className="col-sm-6">
                        <input
                          type="text"
                          name="numero_lote"
                          value={formData.numero_lote || ""}
                          onChange={handleChange}
                          className="form-control"
                          disabled={disabled}
                        />
                      </div>
                    </div>

                    <div className="mb-3 row align-items-center">
                      <label className="col-sm-6 col-form-label text-nowrap">
                        Codigo SKU
                      </label>
                      <div className="col-sm-6">
                        <input
                          type="text"
                          name="sku"
                          value={formData.sku || ""}
                          onChange={handleChange}
                          className="form-control"
                          disabled={disabled}
                        />
                      </div>
                    </div>

                    <div className="mb-3 row align-items-center">
                      <label className="col-sm-6 col-form-label text-nowrap">
                        Estock mínimo
                      </label>
                      <div className="col-sm-6">
                        <input
                          type="number"
                          name="stock_minimo"
                          value={formData.stock_minimo || ""}
                          onChange={handleChange}
                          className="form-control"
                          disabled={disabled}
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-end pt-5 gap-5">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                      >
                        Cancelar
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                      >
                        Guardar cambios
                      </button>
                    </div>
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
