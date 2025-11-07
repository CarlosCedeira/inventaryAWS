import { useEffect, useState } from "react";
import Spinners from "../spiners.jsx";

const GetSales = () => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (!loading) {
      const fadeTimer = setTimeout(() => setFadeIn(true), 10);
      return () => clearTimeout(fadeTimer);
    } else {
      setFadeIn(false);
    }
  }, [loading]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("http://localhost:3000/ventas");
        if (!response.ok) throw new Error("Error al obtener los clientes");
        const data = await response.json();
        setSales(data);
      } catch (error) {
        console.error("Error en la solicitud:", error);
      } finally {
        setLoading(false);
      }
    };
    console.log(sales);
    fetchClients();
  }, []);

  return (
    <>
      <h1 className="text-center mt-3 mb-5">Ventas</h1>

      <div className={`fade-init${fadeIn ? " fade-in" : ""}`}>
        <table className="table table-responsive table-hover align-middle shadow">
          <thead className="table-primary sticky-top">
            <tr>
              <th className="text-start">Nombre producto</th>
              <th className="text-start">Nombre cliente</th>
              <th className="text-start">Precio venta</th>
              <th className="text-start">Cantidad</th>
              <th className="text-start">Precio total</th>
              <th className="text-start">metodo de pago</th>
              <th className="text-start">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="text-start">{sale.nombre_producto}</td>
                <td className="text-start">{sale.nombre_cliente}</td>
                <td className="text-center">{sale.precio_venta}</td>
                <td className="text-center">{sale.cantidad}</td>
                <td className="text-center">{sale.total}</td>
                <td className="text-center">{sale.metodo_pago}</td>
                <td className="text-center">{sale.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default GetSales;
