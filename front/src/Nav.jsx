import React, { useState } from "react";
import GetProducts from "./components/products/getProducts.jsx";
import GetClients from "./components/clients/getClients.jsx";
import GetSupliers from "./components/suppliers/getSuppliers.jsx";
// Importa aquí tus otros componentes de página
// import Clientes from "./components/Clientes";
// import Ventas from "./components/Ventas";
// import Compras from "./components/Compras";
// etc.
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./nav.css";

function Nav() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("inicio");

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // Renderiza el componente según la página activa
  const renderContent = () => {
    switch (activePage) {
      case "productos":
        return <GetProducts />;
      case "clientes":
        return <GetClients />;
      // case "ventas":
      //   return <Ventas />;
      // case "compras":
      //   return <Compras />;
      case "proveedores":
        return <GetSupliers />;
      // case "movimientos":
      //   return <Movimientos />;
      // case "configuracion":
      //   return <Configuracion />;
      default:
        return <h2 className="text-center mt-5">Panel del inventario</h2>;
    }
  };

  return (
    <div className="d-flex">
      {/* Botón flotante para mostrar menú */}
      {isCollapsed && (
        <button
          className="navbar-toggler border-0 bg-dark"
          type="button"
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            zIndex: 2000,
            padding: 0,
            borderRadius: "0 0 1.5rem 0",
            width: "48px",
            height: "68px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {/* SVG de solapa/flecha oscura */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            fill="currentColor"
            className="text-white"
            viewBox="0 0 16 16"
          >
            <circle cx="8" cy="8" r="8" fill="#212529" />
            <path
              fillRule="evenodd"
              d="M6 4l4 4-4 4"
              stroke="#fff"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      {/* Sidebar */}
      <div
        className={`bg-dark text-black vh-100 sidebar-sticky${
          isCollapsed ? " collapsed" : ""
        }`}
        style={{
          width: isCollapsed ? "0" : "200px",
          padding: isCollapsed ? "0" : "1rem",
          overflowX: "hidden",
          transition:
            "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="sidebar-content">
          <div className="d-flex justify-content-center">
            <button
              className="btn btn-light mb-5 mt-3 w-75"
              onClick={toggleSidebar}
            >
              {isCollapsed ? "Mostrar menú" : "Ocultar menú"}
            </button>
          </div>
          <ul className="nav flex-column">
            <li className="nav-item">
              <a
                className={`nav-link text-white ${
                  activePage === "inicio" ? "active" : ""
                }`}
                href="#"
                onClick={() => setActivePage("inicio")}
              >
                inicio
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link text-white ${
                  activePage === "productos" ? "active" : ""
                }`}
                href="#"
                onClick={() => setActivePage("productos")}
              >
                Productos
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link text-white ${
                  activePage === "clientes" ? "active" : ""
                }`}
                href="#"
                onClick={() => setActivePage("clientes")}
              >
                Clientes
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link text-white ${
                  activePage === "ventas" ? "active" : ""
                }`}
                href="#"
                onClick={() => setActivePage("ventas")}
              >
                Ventas
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link text-white ${
                  activePage === "compras" ? "active" : ""
                }`}
                href="#"
                onClick={() => setActivePage("compras")}
              >
                Compras
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link text-white ${
                  activePage === "proveedores" ? "active" : ""
                }`}
                href="#"
                onClick={() => setActivePage("proveedores")}
              >
                Proveedores
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link text-white ${
                  activePage === "movimientos" ? "active" : ""
                }`}
                href="#"
                onClick={() => setActivePage("movimientos")}
              >
                Movimientos
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link text-white ${
                  activePage === "configuracion" ? "active" : ""
                }`}
                href="#"
                onClick={() => setActivePage("configuracion")}
              >
                Configuración
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-grow-1 p-3">{renderContent()}</div>
    </div>
  );
}

export default Nav;
