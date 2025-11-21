import React from "react";
import "./spiners.css"; // Asegúrate de que aquí esté la clase .reverse-spin

const Spinners = () => (
  <div
    className="d-flex justify-content-center align-items-center flex-column"
    style={{ minHeight: "100vh", position: "relative", zIndex: "100" }}
  >
    <div style={{ position: "relative", marginBottom: "2rem" }}>
      {/* Spinner grande */}
      <div
        className="spinner-border text-primary"
        role="status"
        style={{ width: "7rem", height: "7rem" }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {/* Spinner pequeño, centrado encima y girando al revés */}
      <div
        className="spinner-border text-dark reverse-spin"
        role="status"
        style={{
          width: "3.5rem",
          height: "3.5rem",
          position: "absolute",
          left: "50%",
          top: "50%",
          marginLeft: "-1.75rem",
          marginTop: "-1.75rem",
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  </div>
);

export default Spinners;
