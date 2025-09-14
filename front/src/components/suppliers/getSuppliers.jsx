import { useEffect, useState } from "react";
import getSuppliers from "./getData.js";
import Spinners from "../spiners.jsx";

const GetSupliers = () => {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);

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

  // Función para obtener proveedores desde localStorage o getData.js
  const loadSuppliers = () => {
    const localSuppliers = localStorage.getItem("proveedores");
    if (localSuppliers) {
      const parsedSuppliers = JSON.parse(localSuppliers);
      localStorage.setItem("proveedores", JSON.stringify(parsedSuppliers));
      localStorage.setItem(
        "proveedoresBackup",
        JSON.stringify(parsedSuppliers)
      );
      return parsedSuppliers;
    }
    localStorage.setItem("proveedores", JSON.stringify(getSuppliers));
    localStorage.setItem("proveedoresBackup", JSON.stringify(getSuppliers));
    return getSuppliers;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSuppliers(loadSuppliers());
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Activa el fade-in solo cuando loading pasa a false
  useEffect(() => {
    if (!loading) {
      // Pequeño timeout para asegurar que el DOM se actualiza antes de aplicar la clase
      const fadeTimer = setTimeout(() => setFadeIn(true), 10);
      return () => clearTimeout(fadeTimer);
    } else {
      setFadeIn(false);
    }
  }, [loading]);

  if (loading) return <Spinners />;

  const handleAddClick = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    // Crear nuevo cliente con id único
    const newClient = {
      id: Date.now(),
      ...form,
    };
    const updatedClients = [...suppliers, newClient];
    setSuppliers(updatedClients);
    localStorage.setItem("proveedores", JSON.stringify(updatedClients));
    localStorage.setItem("proveedoresBackup", JSON.stringify(updatedClients));
    setShowModal(false);
    // Limpiar formulario
    setForm({
      nombre: "",
      telefono: "",
      direccion: "",
      correo: "",
    });
  };

  return (
    <>
      <h1 className="text-center mt-3 mb-5">Listado de proveedores</h1>
      <button className="btn btn-success mb-4 ms-3" onClick={handleAddClick}>
        Añadir Proveedor
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
                <h5 className="modal-title w-100 text-center">
                  Añadir Proveedor
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-4 mb-2"></div>
                  </div>
                  <fieldset className="mb-3">
                    <div className="row">
                      <div className="col-md-4 mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nombre"
                          name="nombre"
                          value={form.nombre}
                          onChange={handleChange}
                          required
                        />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Teléfono"
                          name="telefono"
                          value={form.telefono}
                          onChange={handleChange}
                        />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Dirección"
                          name="direccion"
                          value={form.direccion}
                          onChange={handleChange}
                        />
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Correo"
                          name="correo"
                          value={form.correo}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </fieldset>

                  <button type="submit" className="btn btn-primary mt-2">
                    Añadir
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={`fade-init${fadeIn ? " fade-in" : ""} ms-3`}>
        <table className="table table-responsive table-hover align-middle shadow">
          <thead className="table-primary sticky-top">
            <tr>
              <th className="text-start">Nombre</th>
              <th className="text-start">Direccion</th>
              <th className="text-start">Correo</th>
              <th className="text-start">Telefono</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((client) => (
              <tr key={client.id}>
                <td className="text-start">{client.nombre}</td>
                <td className="text-start">{client.direccion}</td>
                <td className="text-center">{client.correo}</td>
                <td className="text-center">{client.telefono}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default GetSupliers;

{
  /*const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from the API
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          "https://76ywzcxwjf7oz4a6ag5eqo3ncq0nljiu.lambda-url.eu-west-1.on.aws/"
        );
        if (!response.ok) {
          throw new Error("Error fetching data");
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
*/
}
