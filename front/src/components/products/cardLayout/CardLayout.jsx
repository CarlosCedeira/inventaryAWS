import { useState } from "react";
import Spinners from "../../spiners/spiners";
import "./cardLayout.css";

import { useProduct } from "./hooks/useProductForm";
import { formatDate } from "./utils/date";

const CardLayout = ({ onClose, id }) => {
  const [disabled, setDisabled] = useState(true);

  const {
    formData,
    setFormData,
    categorias,
    loading,
    update,
  } = useProduct(id);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedData = {
      ...formData,
      fecha_caducidad: formData.fecha_caducidad
        ? new Date(formData.fecha_caducidad).toISOString()
        : null,
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

              <h3>Lotes de inventario</h3>

  <table>
    <thead>
      <tr>
        <th>Cantidad</th>
        <th>Caducidad</th>
        <th>Número de lote</th>
      </tr>
    </thead>

   <tbody>
       

  {formData.inventario?.map((item, index) => (
    <tr key={item.inventario_id} >

      <td>
        <input
          type="number"
          disabled={disabled}
          value={item.cantidad}
onChange={(e) =>
    handleInventarioChange(index, "cantidad", e.target.value)
  }
          className="form-control"
        />
      </td>

      <td>
        <input
          type="date"
          disabled={disabled}
          value={formatDate(item.fecha_caducidad)}
          onChange={(e) =>
    handleInventarioChange(index, "fecha_caducidad", e.target.value)
  }        className="form-control"
        />
      </td>

      <td>
        <input type="number"
        disabled={disabled}
          value={item.numero_lote}
onChange={(e) =>
    handleInventarioChange(index, "numero_lote", e.target.value)
  }
          className="form-control" />
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
                {/* Nombre */}
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
                      name="descripcion"
                      value={formData.descripcion || ""}
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
                        <div>

</div>
                    {/* Fecha */}
                  
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