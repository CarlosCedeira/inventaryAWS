import { useEffect, useState } from "react";
import Clients from "../clients/Clients";
import GetMovements from "../movements/GetMovements";
import GetProducts from "../products/getProducts";
import Sales from "../sales/Sales";
import { useViewShortcutKeys } from "../../hooks/useEscapeKey";
import "./workspaces.css";
const viewIcons = {
  products: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
      <path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v9" />
    </svg>
  ),
  movements: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h12m0 0-3.5-3.5M16 7l-3.5 3.5M20 17H8m0 0 3.5-3.5M8 17l3.5 3.5" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 8h4M18 6v4M16 15h4" />
    </svg>
  ),
  sales: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16l-1 15H5L4 5Zm3-2v4m10-4v4M4 10h16" />
      <path d="M9 14h6" />
    </svg>
  ),
};

const Switcher = ({ active, onChange, labels, title = "Espacio de trabajo" }) => (
  <section className="workspace-switcher" role="tablist" aria-label={`Vistas de ${title.toLowerCase()}`}>
    {labels.map(([id, label], index) => (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={active === id}
        className={active === id ? "active" : ""}
        onClick={() => onChange(id)}
        title={`${label} · Atajo: tecla ${index === 0 ? "A" : "D"}`}
        aria-keyshortcuts={index === 0 ? "A" : "D"}
      >
        <span className="workspace-switcher-icon">{viewIcons[id]}</span>
        <span>{label}</span>
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
  const inventorySwitcher = (
    <Switcher
      active={view}
      onChange={changeView}
      title="Inventario"
      labels={[
        ["products", "Productos"],
        ["movements", "Movimientos"],
      ]}
    />
  );
  return (
    <>
      <ViewChangeNotice label={notice} />
      {view === "products" ? (
        <GetProducts
          onShowMovements={() => changeView("movements")}
          workspaceHeader={inventorySwitcher}
        />
      ) : (
        <GetMovements workspaceHeader={inventorySwitcher} />
      )}
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
  const commercialSwitcher = (
    <Switcher
      active={view}
      onChange={changeView}
      title="Comercial"
      labels={[
        ["clients", "Clientes"],
        ["sales", "operaciones"],
      ]}
    />
  );
  return (
    <>
      <ViewChangeNotice label={notice} />
      {view === "clients" ? (
        <Clients
          onShowOperations={() => changeView("sales")}
          workspaceHeader={commercialSwitcher}
        />
      ) : (
        <Sales workspaceHeader={commercialSwitcher} />
      )}
    </>
  );
};
