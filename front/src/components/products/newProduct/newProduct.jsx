  import { useEffect, useState } from "react";
import Spinners from "../../spiners.jsx";

const NewProduct = () => {

  const [fadeIn, setFadeIn] = useState(false);
   const [showModal, setShowModal] = useState(false);

 // Estado para el formulario
  const [form, setForm] = useState({
    nombre: "",
    tipo_cliente: "",
    documento: "",
    telefono: "",
    direccion: "",
    correo: "",
    anadido_por: "",
  });




  const handleAddClick = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    
  };

return (
<>

<button className="btn btn-success my-3 me-5" onClick={handleAddClick}>
        Añadir producto
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
                <h5 className="modal-title w-100 text-center">
                  Añadir producto
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
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
                      onChange={handleChange}
                      className="form-control"
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
                      onChange={handleChange}
                      className="form-control"
                      rows="2"
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
                          value="categoria"
                          onChange={handleChange}
                          className="form-control"
                            >
                         
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
                            onChange={handleChange}
                            className="form-control"
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
                          onChange={handleChange}
                          className="form-control"
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
                          onChange={handleChange}
                          className="form-control"
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
                          onChange={handleChange}
                          className="form-control"
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
                          onChange={handleChange}
                          className="form-control"
                            />
                      </div>

                    </div>

                     
                 
                  </div>

                  <div className="d-flex justify-content-between align-items-end gap-5">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCloseModal}

                      >
                        Cancelar
                      </button>
                      <button className="btn btn-success" type="submit">
                        Crear producto
                      </button>
                    </div>

                    
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