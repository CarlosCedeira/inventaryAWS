import { useEffect, useState } from "react";
import Clients from "../clients/Clients";
import GetMovements from "../movements/GetMovements";
import GetProducts from "../products/getProducts";
import Sales from "../sales/Sales";
import { useViewShortcutKeys } from "../../hooks/useEscapeKey";
import "./workspaces.css";
const Switcher = ({ active, onChange, labels }) => (
  <section className="workspace-switcher">
    {labels.map(([id, label], index) => (
      <button
        key={id}
        type="button"
        className={active === id ? "active" : ""}
        onClick={() => onChange(id)}
        title={`Atajo: tecla ${index === 0 ? "A" : "D"}`}
        aria-keyshortcuts={index === 0 ? "A" : "D"}
      >
        {label}
      </button>
    ))}
  </section>
);

const ViewChangeNotice = ({ label }) => label ? (
  <div className="workspace-view-notice" role="status" aria-live="polite">
    <strong>{label}</strong>
  </div>
) : null;

export const InventoryWorkspace = () => {
  const [view, setView] = useState("products");
  const [notice, setNotice] = useState("");
  const changeView = (nextView) => {
    if (nextView === view) return;
    setView(nextView);
    setNotice(nextView === "products" ? "Productos" : "Movimientos");
  };
  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(""), 900);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);
  useViewShortcutKeys(true, () => changeView("products"), () => changeView("movements"));
  return (
    <>
      <Switcher
        active={view}
        onChange={changeView}
        labels={[
          ["products", "Productos"],
          ["movements", "Movimientos"],
        ]}
      />
      <ViewChangeNotice label={notice} />
      {view === "products" ? <GetProducts /> : <GetMovements />}
    </>
  );
};
export const CommercialWorkspace = () => {
  const [view, setView] = useState("clients");
  const [notice, setNotice] = useState("");
  const changeView = (nextView) => {
    if (nextView === view) return;
    setView(nextView);
    setNotice(nextView === "clients" ? "Clientes" : "Operaciones");
  };
  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(""), 900);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);
  useViewShortcutKeys(true, () => changeView("clients"), () => changeView("sales"));
  return (
    <>
      <Switcher
        active={view}
        onChange={changeView}
        labels={[
          ["clients", "Clientes"],
          ["sales", "operaciones"],
        ]}
      />
      <ViewChangeNotice label={notice} />
      {view === "clients" ? <Clients /> : <Sales />}
    </>
  );
};
