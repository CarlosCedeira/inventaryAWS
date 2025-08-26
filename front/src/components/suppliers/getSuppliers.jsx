import { useEffect, useState } from "react";
import getClients from "./getData.js";
import Spinners from "../spiners.jsx";

const GetSupliers = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);

  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setClients(getClients);
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

  return (
    <>
      <h1 className="text-center mt-3 mb-5">Lista de proveedores</h1>
      <button className="btn btn-success mb-3">Añadir proveedor</button>

      <div className={`fade-init${fadeIn ? " fade-in" : ""}`}>
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
            {clients.map((client) => (
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
