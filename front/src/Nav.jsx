import React, { useState } from "react";
import { Routes, Route, Link, useLocation, useBlocker } from "react-router-dom";

import GetProducts from "./components/products/getProducts.jsx";
import GetClients from "./components/clients/getClients.jsx";
import GetSales from "./components/sales/sales.jsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./nav.css";
import UsersManager from "./logging.jsx";

function Nav() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="d-flex">
      {/* Botón flotante */}
      {isCollapsed && (
        <button
          className="navbar-toggler border-0 bg-dark"
          type="button"
          onClick={toggleSidebar}
        >
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
        className={`bg-dark sidebar-sticky${isCollapsed ? " collapsed" : ""}`}
        style={{
          width: isCollapsed ? "0" : "250px",
          padding: isCollapsed ? "0" : "0.1rem 0.1rem",
          overflowX: "hidden",
          transition:
            "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="sidebar-content">
          <div className="d-flex justify-content-center">
            <button
              className="btn btn-light mb-5 mt-5 w-15"
              onClick={toggleSidebar}
            >
              {isCollapsed ? "" : "Ocultar menú"}
            </button>
          </div>

          <ul className="navegation">
           
            <li className="nav-item mt-2">
              <Link
                to="/productos"
                className={`nav-link text-white ${
                  location.pathname === "/productos" ? "active" : ""
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="25px"
                  viewBox="0 -960 960 960"
                  width="25px"
                  fill="#FFFFFF"
                >
                  <path d="M620-159 460-319l43-43 117 117 239-239 43 43-282 282Zm220-414h-60v-207h-60v90H240v-90h-60v600h251v60H180q-26 0-43-17t-17-43v-600q0-26 17-43t43-17h202q7-35 34.5-57.5T480-920q36 0 63.5 22.5T578-840h202q26 0 43 17t17 43v207ZM480-780q17 0 28.5-11.5T520-820q0-17-11.5-28.5T480-860q-17 0-28.5 11.5T440-820q0 17 11.5 28.5T480-780Z" />
                </svg>{" "}
                Productos
              </Link>
            </li>
            <li className="nav-item mt-2">
              <Link
                to="/clientes"
                className={`nav-link text-white ${
                  location.pathname === "/clientes" ? "active" : ""
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#FFFFFF"
                >
                  <path d="M185-80q-17 0-29.5-12.5T143-122v-105q0-90 56-159t144-88q-40 28-62 70.5T259-312v190q0 11 3 22t10 20h-87Zm147 0q-17 0-29.5-12.5T290-122v-190q0-70 49.5-119T459-480h189q70 0 119 49t49 119v64q0 70-49 119T648-80H332Zm148-484q-66 0-112-46t-46-112q0-66 46-112t112-46q66 0 112 46t46 112q0 66-46 112t-112 46Z" />
                </svg>{" "}
                Clientes
              </Link>
            </li>
            <li className="nav-item d-block mt-2">
              <Link
                to="/ventas"
                className={`nav-link text-white ${
                  location.pathname === "/ventas" ? "active" : ""
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#FFFFFF"
                >
                  <path d="M856-390 570-104q-12 12-27 18t-30 6q-15 0-30-6t-27-18L103-457q-11-11-17-25.5T80-513v-287q0-33 23.5-56.5T160-880h287q16 0 31 6.5t26 17.5l352 353q12 12 17.5 27t5.5 30q0 15-5.5 29.5T856-390ZM513-160l286-286-353-354H160v286l353 354ZM260-640q25 0 42.5-17.5T320-700q0-25-17.5-42.5T260-760q-25 0-42.5 17.5T200-700q0 25 17.5 42.5T260-640Zm220 160Z" />
                </svg>{" "}
                Ventas
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-grow-1 ps-md-3">
        <Routes>
          <Route path="/" element={<UsersManager />} />
          <Route path="/productos" element={<GetProducts />} />
          <Route path="/clientes" element={<GetClients />} />
          <Route path="/ventas" element={<GetSales />} />
        </Routes>
      </div>
    </div>
  );
}

export default Nav;
