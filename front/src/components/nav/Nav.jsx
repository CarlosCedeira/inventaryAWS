import { useState } from "react";
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import GetProducts from "../products/GetProducts.jsx";
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
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const userInitial = user?.nombre?.trim()?.charAt(0)?.toUpperCase() || "U";

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
          <div className="sidebar-content d-flex flex-column h-100">
            <div className="d-flex justify-content-center">
              <button
                className="btn btn-light mb-5 mt-5 w-15"
                onClick={toggleSidebar}
              >
                {isCollapsed ? "" : "Ocultar menu"}
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
            </ul>

            <div className="sidebar-user mt-auto mx-3 mb-4 p-3">
              <div className="d-flex align-items-center gap-3">
                <div className="sidebar-user-avatar">{userInitial}</div>
                <div className="sidebar-user-meta">
                  <div className="sidebar-user-name">{user?.nombre || "Usuario"}</div>
                  <div className="sidebar-user-email">{user?.email || ""}</div>
                  <div className="sidebar-user-tenant">{user?.tenant_nombre || ""}</div>
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
        </div>
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
            path="/login"
            element={isAuthenticated ? <Navigate to="/productos" replace /> : <UsersManager />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default Nav;
