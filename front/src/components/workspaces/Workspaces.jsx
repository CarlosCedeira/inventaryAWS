import { useState } from "react";
import Clients from "../clients/Clients";
import GetMovements from "../movements/GetMovements";
import GetProducts from "../products/getProducts";
import Sales from "../sales/Sales";
import "./workspaces.css";
const Switcher = ({ active, onChange, labels }) => (
  <section className="workspace-switcher">
    {labels.map(([id, label]) => (
      <button
        key={id}
        type="button"
        className={active === id ? "active" : ""}
        onClick={() => onChange(id)}
      >
        {label}
      </button>
    ))}
  </section>
);
export const InventoryWorkspace = () => {
  const [view, setView] = useState("products");
  return (
    <>
      <Switcher
        active={view}
        onChange={setView}
        labels={[
          ["products", "Productos"],
          ["movements", "Movimientos"],
        ]}
      />
      {view === "products" ? <GetProducts /> : <GetMovements />}
    </>
  );
};
export const CommercialWorkspace = () => {
  const [view, setView] = useState("clients");
  return (
    <>
      <Switcher
        active={view}
        onChange={setView}
        labels={[
          ["clients", "Clientes"],
          ["sales", "operaciones"],
        ]}
      />
      {view === "clients" ? <Clients /> : <Sales />}
    </>
  );
};
