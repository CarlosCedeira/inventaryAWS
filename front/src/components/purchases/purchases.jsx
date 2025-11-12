import { useEffect, useState } from "react";
import Spinners from "../spiners.jsx";

const GetPurchases = () => {
  const [loading, setLoading] = useState(true);

  const [fadeIn, setFadeIn] = useState(false);

  // Función para obtener proveedores desde localStorage o getData.js

  useEffect(() => {
    const timer = setTimeout(() => {
      setPurchases(loadPurchases());
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
      <h1 className="text-center mt-3 mb-5">Lista de compras</h1>
      <button className="btn btn-success mb-4">Añadir compra</button>

      <div className={`fade-init${fadeIn ? " fade-in" : ""}`}>
        <table className="table table-responsive table-hover align-middle shadow">
          <thead className="table-primary sticky-top">
            <tr>
              <th className="text-start">Nombre producto</th>
              <th className="text-start">Nombre proveedor</th>
              <th className="text-start">Fecha</th>
              <th className="text-start">Cantidad</th>
              <th className="text-start">Precio unitario</th>
              <th className="text-start">Precio total</th>
              <th className="text-start">Numero de factura</th>
            </tr>
          </thead>
          {/*  <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="text-start">{purchase.fecha}</td>
                  <td className="text-start">{purchase.precioUnitario}</td>
                  <td className="text-center">{purchase.precioTotal}</td>
                  <td className="text-center">{purchase.numeroFactura}</td>
                </tr>
              ))}
            </tbody>*/}
        </table>
      </div>
    </>
  );
};

export default GetPurchases;
