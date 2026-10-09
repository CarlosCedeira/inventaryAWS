import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import "./toast.css";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeouts = useRef(new Map());
  const nextToastId = useRef(0);

  const dismiss = useCallback((id) => {
    window.clearTimeout(timeouts.current.get(id));
    timeouts.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message) => {
    // Compatible con navegadores que no exponen crypto.randomUUID.
    const id = `toast-${Date.now()}-${++nextToastId.current}`;
    setToasts((current) => [...current, { id, message }]);
    timeouts.current.set(id, window.setTimeout(() => dismiss(id), 4000));
  }, [dismiss]);

  useEffect(() => () => {
    timeouts.current.forEach((timeout) => window.clearTimeout(timeout));
  }, []);

  return (
    <ToastContext.Provider value={{ success }}>
      {children}
      <div className="app-toasts" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div className="app-toast app-toast-success" key={toast.id} role="status">
            <span aria-hidden="true">✓</span>
            <p>{toast.message}</p>
            <button type="button" aria-label="Cerrar aviso" onClick={() => dismiss(toast.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe utilizarse dentro de ToastProvider");
  return context;
}
