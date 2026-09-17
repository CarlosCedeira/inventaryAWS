import { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import GetProducts from "../products/getProducts.jsx";
import GetMovements from "../movements/GetMovements.jsx";
import UsersManager from "../logging.jsx";
import { clearSession, getSession } from "../../services/authService";

import "./nav.css";

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function Nav() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const user = session?.user;
  const isAuthenticated = Boolean(session?.token && session?.user?.tenant_id);
  const wasAuthenticated = useRef(isAuthenticated); // <-- esto faltaba
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const userInitial = user?.nombre?.trim()?.charAt(0)?.toUpperCase() || "U";

  const isMobileViewport = () =>
    window.matchMedia("(max-width: 668px)").matches;

  useEffect(() => {
    if (!wasAuthenticated.current && isAuthenticated && isMobileViewport()) {
      setIsCollapsed(true);
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

  const handleNavLinkClick = () => {
    if (!isCollapsed && isMobileViewport()) {
      setIsCollapsed(true);
    }
  };

  const handleLogout = () => {
    clearSession();
    setIsCollapsed(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="d-flex">
      {isAuthenticated && isCollapsed && (
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

      {isAuthenticated && (
        <aside
          className={`sidebar-sticky${isCollapsed ? " collapsed" : ""}`}
          style={{
            width: isCollapsed ? "0" : "200px",
            padding: isCollapsed ? "0" : "0.1rem 0.1rem",
            overflowX: "hidden",
            transition:
              "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div className="sidebar-content d-flex flex-column h-100">
            <div className="sidebar-brand">
              <span className="sidebar-brand-mark">B</span>
              <span>Brétema</span>
            </div>

            <div className="d-flex justify-content-center">
              <button
                className="btn btn-outline-light btn-sm sidebar-toggle-button"
                onClick={toggleSidebar}
              >
                {isCollapsed ? "" : "Ocultar"}
              </button>
            </div>

            <ul className="navegation">
            <li className="nav-item mt-2">
  <Link
    to="/productos"
    onClick={handleNavLinkClick}
    className={`nav-link text-white ${
      location.pathname === "/productos" ? "active" : ""
    }`}
  >
    {/* ...svg... */}
    Productos
  </Link>
</li>
<li className="nav-item mt-2">
  <Link
    to="/movimientos"
    onClick={handleNavLinkClick}
    className={`nav-link text-white ${
      location.pathname === "/movimientos" ? "active" : ""
    }`}
  >
    {/* ...svg... */}
    Movimientos
  </Link>
</li>
            </ul>

            <div className=" mt-auto mx-2 mb-4 ">
              <div className="d-flex align-items-center gap-3">
                <div className="sidebar-user-avatar">{userInitial}</div>
                <div className="sidebar-user-meta">
                  <div className="sidebar-user-name">{user?.nombre || "Usuario"}</div>
                  <div className="sidebar-user-email">{user?.email || ""}</div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline-light btn-sm w-100 mt-3"
                onClick={handleLogout}
              >
                Cerrar sesion
              </button>
            </div>
          </div>
        </aside>
      )}

      <div className="flex-grow-1 ps-md-3">
        <Routes>
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/productos" : "/login"} replace />}
          />
          <Route
            path="/productos"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <GetProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/movimientos"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <GetMovements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/productos" replace /> : <UsersManager />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default Nav;
