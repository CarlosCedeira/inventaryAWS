const API_URL = import.meta.env.VITE_API_URL;
const SESSION_INVALID_EVENT = "bretema:session-invalid";

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
    window.dispatchEvent(new Event(SESSION_INVALID_EVENT));
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

  return data;
}

export async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
  } finally { /* SessionProvider clears the React state. */ }
}

export async function getCurrentUser() {
  const response = await fetchWithAuth(`${API_URL}/auth/me`);
  if (!response.ok) throw new Error("Sesión expirada o no válida");
  const data = await response.json();
  return data.user;
}
