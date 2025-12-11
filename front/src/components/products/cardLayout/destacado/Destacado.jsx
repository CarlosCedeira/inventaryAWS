import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;


const Destacado = ({ id, destacado }) => {
  const [estaDestacado, setEstaDestacado] = useState(Number(destacado));

  const putDestacado = async () => {
    try {
      const response = await fetch(
        `${API_URL}/productos/destacar/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar los datos");
      }

      const result = await response.json();
      if (estaDestacado === 1) {
        setEstaDestacado(0);
      } else {
        setEstaDestacado(1);
      }

      console.log("✅ Datos guardados con éxito:", result);
    } catch (error) {
      console.error("❌ Error al enviar los datos:", error);
      alert("Ocurrió un error al guardar los datos");
    }
  };
  return (
    <>
      {estaDestacado === 1 ? (
        <svg
          onClick={putDestacado}
          xmlns="http://www.w3.org/2000/svg"
          height="34px"
          viewBox="0 -960 960 960"
          width="34px"
          fill="#75FB4C"
        >
          <path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70h400q100 0 170 70t70 170q0 100-70 170t-170 70H280Zm0-80h400q66 0 113-47t47-113q0-66-47-113t-113-47H280q-66 0-113 47t-47 113q0 66 47 113t113 47Zm400-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM480-480Z" />
        </svg>
      ) : (
        <svg
          onClick={putDestacado}
          xmlns="http://www.w3.org/2000/svg"
          height="34px"
          viewBox="0 -960 960 960"
          width="34px"
          fill="#EA3323"
        >
          <path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70h400q100 0 170 70t70 170q0 100-70 170t-170 70H280Zm0-80h400q66 0 113-47t47-113q0-66-47-113t-113-47H280q-66 0-113 47t-47 113q0 66 47 113t113 47Zm0-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm200-120Z" />
        </svg>
      )}
    </>
  );
};

export default Destacado;
