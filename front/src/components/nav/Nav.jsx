import { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { CommercialWorkspace, InventoryWorkspace } from "../workspaces/Workspaces";
import UsersManager from "../logging.jsx";
import { clearSession, getSession } from "../../services/authService";
import { canAccessCommercial, canAccessInventory } from "../../utils/permissions";
import { useNavigationShortcutKeys } from "../../hooks/useEscapeKey";

import "./nav.css";

function ProtectedRoute({ isAuthenticated, hasAccess = true, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess) return <Navigate to="/inventario" replace />;

  return children;
}

function Nav() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(true);
  const [isScrollToTopVisible, setIsScrollToTopVisible] = useState(false);
  const [navigationNotice, setNavigationNotice] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const user = session?.user;
  const hasInventoryAccess = canAccessInventory(user);
  const hasCommercialAccess = canAccessCommercial(user);
  const defaultWorkspace = hasInventoryAccess ? "/inventario" : "/ventas";
  const isAuthenticated = Boolean(session?.token && session?.user?.tenant_id);
  const wasAuthenticated = useRef(isAuthenticated); // <-- esto faltaba
  const lastScrollY = useRef(0);
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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 160) {
        setIsScrollToTopVisible(false);
      } else if (Math.abs(scrollDifference) >= 8) {
        setIsScrollToTopVisible(scrollDifference < 0);
      }

      if (!isMobileViewport()) {
        setIsMobileMenuVisible(true);
      } else if (currentScrollY <= 8) {
        setIsMobileMenuVisible(true);
      } else if (Math.abs(scrollDifference) >= 8) {
        setIsMobileMenuVisible(scrollDifference < 0);
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const changeSection = (path, label) => {
    if (location.pathname === path) return;
    navigate(path);
    setNavigationNotice(label);
  };

  useEffect(() => {
    if (!navigationNotice) return undefined;
    const timeoutId = window.setTimeout(() => setNavigationNotice(""), 900);
    return () => window.clearTimeout(timeoutId);
  }, [navigationNotice]);

  useNavigationShortcutKeys(
    isAuthenticated,
    () => { if (hasInventoryAccess) changeSection("/inventario", "Productos"); },
    () => { if (hasCommercialAccess) changeSection("/ventas", "Clientes"); }
  );

  return (
    <div className="d-flex w-100 min-vh-100">
      {isAuthenticated && isCollapsed && (
        <>
          <button
            className="navbar-toggler navigation-menu-trigger"
            type="button"
            onClick={toggleSidebar}
            aria-label="Mostrar navegación"
          >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          </button>

          <button
            className={`mobile-menu-toggle${isMobileMenuVisible ? "" : " is-hidden"}`}
            type="button"
            onClick={toggleSidebar}
            aria-label="Abrir menú de navegación"
            aria-expanded="false"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </>
      )}

      {isAuthenticated && !isCollapsed && (
        <button
          className="mobile-navigation-backdrop"
          type="button"
          onClick={toggleSidebar}
          aria-label="Cerrar menú de navegación"
        />
      )}

      {isAuthenticated && (
        <aside
          className={`sidebar-sticky${isCollapsed ? " collapsed" : ""}`}
          style={{
            width: isCollapsed ? "0" : "240px",
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
              <button
                className="mobile-sidebar-close"
                type="button"
                onClick={toggleSidebar}
                aria-label="Cerrar menú de navegación"
              >
                ×
              </button>
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
{hasInventoryAccess && <li className="nav-item mt-2">
  <Link
    to="/inventario"
    onClick={handleNavLinkClick}
    className={`nav-link text-white ${
      location.pathname === "/inventario" ? "active" : ""
    }`}
    title="Atajo: tecla W"
    aria-keyshortcuts="W"
  >
    {/* ...svg... */}
    Inventario
  </Link>
</li>}

{hasCommercialAccess && <li className="nav-item mt-2">
  <Link to="/ventas" onClick={handleNavLinkClick} className={`nav-link text-white ${location.pathname === "/ventas" ? "active" : ""}`} title="Atajo: tecla S" aria-keyshortcuts="S">Comercial</Link>
</li>}

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

      <div className={`flex-grow-1 ps-md-3 app-content${["/inventario", "/ventas"].includes(location.pathname) ? " app-surface" : ""}`} style={{ minWidth: 0 }}>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? defaultWorkspace : "/login"} replace />}
          />
          <Route path="/inventario" element={<ProtectedRoute isAuthenticated={isAuthenticated} hasAccess={hasInventoryAccess}><InventoryWorkspace /></ProtectedRoute>} />
          <Route path="/ventas" element={<ProtectedRoute isAuthenticated={isAuthenticated} hasAccess={hasCommercialAccess}><CommercialWorkspace /></ProtectedRoute>} />
          <Route path="/productos" element={<Navigate to={defaultWorkspace} replace />} />
          <Route path="/movimientos" element={<Navigate to={defaultWorkspace} replace />} />
          <Route path="/clientes" element={<Navigate to="/ventas" replace />} />
          <Route path="/ventas" element={<Navigate to="/ventas" replace />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to={defaultWorkspace} replace /> : <UsersManager />}
          />
        </Routes>
      {isAuthenticated && <footer className="app-footer"><span>Brétema · Gestión de inventario</span><span>© 2026 Cedeira.dev · v1.0</span></footer>}
      </div>
      {isAuthenticated && isScrollToTopVisible && (
        <button
          type="button"
          className="scroll-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Volver al inicio de la página"
          title="Volver arriba"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 19V5m0 0-6 6m6-6 6 6" />
          </svg>
        </button>
      )}
      {navigationNotice && <div className="navigation-view-notice" role="status" aria-live="polite"><strong>{navigationNotice}</strong></div>}
    </div>
  );
}

export default Nav;
