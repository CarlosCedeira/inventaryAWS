import React from "react";
import "./spiners.css";

const Spinners = () => (
  <div className="bretema-loader" role="status" aria-live="polite">
    <div className="bretema-loader-mark">
      <span />
      <span />
      <span />
    </div>
    <p>Clarificando inventario...</p>
  </div>
);

export default Spinners;
