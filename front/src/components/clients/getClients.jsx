import { useEffect, useState } from "react";
import getClients from "./getData.js";
import Spinners from "../spiners.jsx";

const GetClients = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
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

  // Función para obtener clientes desde localStorage o getData.js
  const loadClients = () => {
    const localClients = localStorage.getItem("clientes");
    if (localClients) {
      const parsedClients = JSON.parse(localClients);
      localStorage.setItem("clientes", JSON.stringify(parsedClients));
      localStorage.setItem("clientesBackup", JSON.stringify(parsedClients));
      return parsedClients;
    }
    localStorage.setItem("clientes", JSON.stringify(getClients));
    localStorage.setItem("clientesBackup", JSON.stringify(getClients));
    return getClients;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setClients(loadClients());
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
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
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    localStorage.setItem("clientes", JSON.stringify(updatedClients));
    localStorage.setItem("clientesBackup", JSON.stringify(updatedClients));
    setShowModal(false);
    // Limpiar formulario
    setForm({
      nombre: "",
      tipo_cliente: "",
      documento: "",
      telefono: "",
      direccion: "",
      correo: "",
      anadido_por: "",
    });
  };

  return (
    <>
      <h1 className="text-center mt-3 mb-5">Lista de clientes</h1>
      <button className="btn btn-success mb-4 ms-3" onClick={handleAddClick}>
        Añadir cliente
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
                  Añadir cliente
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <fieldset className="mb-3">
                    <legend className="fs-6">Datos del cliente</legend>
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
                      </div>
                      <div className="col-md-4 mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Tipo de cliente"
                          name="tipo_cliente"
                          value={form.tipo_cliente}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-4 mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Documento"
                          name="documento"
                          value={form.documento}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </fieldset>
                  <fieldset className="mb-3">
                    <legend className="fs-6">Contacto</legend>
                    <div className="row">
                      <div className="col-md-4 mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Teléfono"
                          name="telefono"
                          value={form.telefono}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4 mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Dirección"
                          name="direccion"
                          value={form.direccion}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4 mb-2">
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
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Añadido por"
                      name="anadido_por"
                      value={form.anadido_por}
                      onChange={handleChange}
                    />
                  </div>
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
              <th className="text-start">Tipo de cleinte</th>
            </tr>
          </thead>
          <tbody>
            {console.log(clients)}
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="text-start">{client.nombre}</td>
                <td className="text-start">{client.direccion}</td>
                <td className="text-center">{client.correo}</td>
                <td className="text-center">{client.telefono}</td>
                <td className="text-start">{client.tipo_cliente}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default GetClients;
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
