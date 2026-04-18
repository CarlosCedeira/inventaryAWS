  import { useEffect, useState } from "react";
import Spinners from "../../spiners/spiners.jsx";

const NewProduct = () => {

  const API_URL = import.meta.env.VITE_API_URL;

const [categorias, setCategorias] = useState([]);
const [loadingCategorias, setLoadingCategorias] = useState(true);

   const [showModal, setShowModal] = useState(false);

 // Estado para el formulario
const [form, setForm] = useState({
  producto_nombre: "",
  producto_descripcion: "",
  producto_categoria: "",
  ranking: "",
  cantidad: "",
  precio_compra: "",
  precio_venta: "",
  stock_minimo: "",
  fecha_caducidad: "",
  codigo_barras: "",
  numero_lote: "",
  sku: "",
});


  useEffect(() => {
  const fetchCategorias = async () => {
    try {
      const res = await fetch(`${API_URL}/productos/categorias`);
      if (!res.ok) throw new Error("Error al obtener categorías");
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




  const handleAddClick = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


  const dataToSend = {
    ...form,
    fecha_caducidad: form.fecha_caducidad
      ? new Date(form.fecha_caducidad).toISOString()
      : null,
  };

  try {
    const response = await fetch(`${API_URL}/productos/newProduct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al guardar los datos");
    }

    const result = await response.json();
    console.log("Producto creado:", result);

    handleCloseModal(); // cerrar modal
  } catch (error) {
    console.error("Error al guardar:", error);
    alert("Ocurrió un error al guardar los datos");
  }
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
  value={form.producto_categoria}
  onChange={handleChange}
  className="form-control"
>
  <option value="">Selecciona una categoría</option>

  {categorias.map((c) => (
    <option key={c.id} value={c.id}>
      {c.nombre}
    </option>
  ))}
</select>

                      </div>
                    </div>

                    {/* Inputs dinámicos */}
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
                            onChange={handleChange}
                            className="form-control"
                                />
                        </div>
                      </div>
                    ))}
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