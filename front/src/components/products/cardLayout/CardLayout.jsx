import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;
import Spinners from "../../spiners";
import "./cardLayout.css";
import Destacado from "./destacado/Destacado";
import Recomendado from "./recomendado/Recomendado";

const CardLayout = ({ onClose, id }) => {
  const [formData, setFormData] = useState({});
  const [disabled, setDisabled] = useState(true);
  const [categorias, setCategorias] = useState([]);

  const [loadingProducto, setLoadingProducto] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  console.log("id en cardLayout", id);

  useEffect(() => {
    const fetchProductsID = async () => {
      try {
        const response = await fetch(`${API_URL}/productos/${id}`);
        if (!response.ok) throw new Error("Error al obtener el producto");
        const data = await response.json();
        setFormData(data[0]);
        console.log("data", data);
      } catch (error) {
        console.error("Error al obtener producto:", error);
      } finally {
        setLoadingProducto(false);
      }
    };

    const fetchCategorias = async () => {
      try {
        const response = await fetch(
          `${API_URL}/productos/categorias`
        );
        if (!response.ok) throw new Error("Error al obtener categorías");

        const data = await response.json();
        setCategorias(data);
        console.log("categorias data", data);
      } catch (error) {
        console.error("Error al obtener categorías:", error);
      } finally {
        setLoadingCategorias(false);
      }
    };

    fetchProductsID();
    fetchCategorias();
  }, [id]);

  // ============================
  //  FORMATEO DE FECHAS
  // ============================
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // ============================
  //  HANDLE CHANGE
  // ============================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ============================
  //  SUBMIT FORMULARIO
  // ============================
  const handleSubmit = async (e) => {
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

    try {
      const response = await fetch(
        `${API_URL}/productos/actualizar/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar los datos");
      }

      const result = await response.json();
      console.log("Datos guardados:", result);

      if (onClose) onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Ocurrió un error al guardar los datos");
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0     d-flex align-items-center justify-content-center product-modal-backdrop py-md-3 py-lg-5"
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
          ></button>
          <article className="modal-content">
            {loadingCategorias && loadingProducto ? <Spinners /> : null}
            {/* Botón cerrar */}

            {/* Botón editar */}
            <button
              className="btn btn-primary position-absolute"
              onClick={() => setDisabled(!disabled)}
            >
              Editar
            </button>

            {/* Publicado / Destacado / Recomendado */}

            <header className="modal-header my-3 my-lg-0  ms-3 me-5"></header>

            <div className="d-flex align-items-center justify-content-evenly flex-wrap my-3 ">
              <div className="d-flex align-items-center justify-content-between ">
                <label className="me-2">Destacado</label>
                <Destacado
                  destacado={formData.destacado}
                  id={formData.producto_id}
                />
              </div>

              <div className="d-flex align-items-center ">
                <label className="me-2">Recomendado</label>
                <Recomendado
                  recomendado={formData.recomendado}
                  id={formData.producto_id}
                />
              </div>

             
            </div>

            {/* FORMULARIO */}
            <form onSubmit={handleSubmit}>
              <div className="container-fluid">
                {/* Nombre y Ranking */}
                <div className="mb-3 row align-items-center">
                  <label className="col-sm-3 col-form-label text-nowrap">
                    Nombre
                  </label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      name="producto_nombre"
                      value={id ? formData.producto_nombre || "" : ""}
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
                    {/* Categoría */}
                    <div className="mb-3 row align-items-center">
                      <label className="col-sm-6 col-form-label text-nowrap">
                        Categoria
                      </label>
                      <div className="col-sm-6">
                        <select
                          name="producto_categoria"
                          value={formData.producto_categoria}
                          onChange={handleChange}
                          className="form-control"
                          disabled={disabled}
                        >
                          {categorias.map((c) => (
                            <option key={c.id} value={c.producto_categoria}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Inputs dinámicos */}
                    {[
                      ["Ranking", "ranking", "number"],
                      ["Cantidad", "cantidad", "number"],
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

                    {/* Número de lote */}
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

                    {/* SKU */}
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

                     
                 
                  </div>

                  <div className="d-flex justify-content-between align-items-end gap-5">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                      >
                        Cancelar
                      </button>
                      <button className="btn btn-success" type="submit">
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
