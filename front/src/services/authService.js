const API_URL = import.meta.env.VITE_API_URL;
const SESSION_KEY = "inventory_session_user";

export function getSession() {
  // Limpia la clave usada por versiones anteriores, que contenía el JWT.
  localStorage.removeItem("inventory_session");
  const rawSession = localStorage.getItem(SESSION_KEY);
  try {
    const session = rawSession ? JSON.parse(rawSession) : null;
    if (session?.user?.tenant_id) return session;
  } catch { /* Discard malformed or obsolete sessions. */ }
  localStorage.removeItem(SESSION_KEY);
  return null;
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user: session.user }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function fetchWithAuth(input, init = {}) {
  const headers = {
    ...(init.headers || {}),
  };

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    clearSession();

    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }

    throw new Error("Sesion expirada o no valida");
  }

  return response;
}

export async function login(email, password) {

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });


  const data = await res.json().catch(() => null);


  if (!res.ok) {
    throw new Error(data?.error || "No se pudo iniciar sesión");
  }

  saveSession(data);
  return data;
}

export async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
  } finally {
    clearSession();
  }
}

export async function getCurrentUser() {
  const response = await fetchWithAuth(`${API_URL}/auth/me`);
  if (!response.ok) throw new Error("Sesión expirada o no válida");
  const data = await response.json();
  saveSession(data);
  return data.user;
}
