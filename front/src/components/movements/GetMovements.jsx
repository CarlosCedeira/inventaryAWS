import { useEffect, useState } from "react";
import Spinners from "../spiners/spiners";
import { movementService } from "./services/movementService";

const GetMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const data = await movementService.getAll();
        setMovements(data);
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError.message || "No se pudieron cargar los movimientos");
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return "";

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  if (loading) return <Spinners />;

  return (
    <>
      <div className="bg-white d-flex justify-content-between align-items-center sticky-top">
        <h1 className="ms-4 mt-2 mb-3 ps-5 ps-md-4">Movimientos</h1>
      </div>

      <div className="px-5 py-3">
        {error && <div className="alert alert-danger">{error}</div>}

        {!error && movements.length === 0 && (
          <div className="alert alert-info">No hay movimientos registrados.</div>
        )}

        {!error && movements.length > 0 && (
          <table className="table table-hover shadow me-5">
            <thead className="table-primary">
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th className="d-none d-md-table-cell">Categoria</th>
                <th className="text-center">Tipo</th>
                <th className="text-center">Cantidad</th>
                <th className="d-none d-lg-table-cell">Motivo</th>
                <th className="d-none d-lg-table-cell text-center">Referencia</th>
              </tr>
            </thead>

            <tbody>
              {movements.map((movement) => (
                <tr key={movement.movimiento_id}>
                  <td>{formatDateTime(movement.fecha_movimiento)}</td>
                  <td>{movement.producto_nombre}</td>
                  <td className="d-none d-md-table-cell">
                    {movement.producto_categoria || ""}
                  </td>
                  <td className="text-center text-capitalize">{movement.tipo}</td>
                  <td className="text-center">{movement.cantidad}</td>
                  <td className="d-none d-lg-table-cell">{movement.motivo || ""}</td>
                  <td className="d-none d-lg-table-cell text-center">
                    {movement.numero_lote || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default GetMovements;
