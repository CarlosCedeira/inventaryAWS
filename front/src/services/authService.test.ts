import { beforeEach, expect, test, vi } from "vitest";
import { fetchWithAuth, getSession, saveSession } from "./authService";

beforeEach(() => localStorage.clear());
test("sesion corrupta vuelve a login sin lanzar excepciones", () => {
  localStorage.setItem("inventory_session", "{invalid");
  expect(getSession()).toBeNull();
  expect(localStorage.getItem("inventory_session")).toBeNull();
});
test("sesion incompleta se descarta", () => {
  localStorage.setItem("inventory_session", JSON.stringify({ token: "demo" }));
  expect(getSession()).toBeNull();
});
test("sesion valida se conserva", () => {
  const session = { user: { tenant_id: 1 } };
  localStorage.setItem("inventory_session_user", JSON.stringify(session));
  expect(getSession()).toEqual(session);
});

test("un 403 conserva la sesión y se devuelve para mostrar el error de permisos", async () => {
  saveSession({ user: { tenant_id: 1, rol: "admin" } });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 403, ok: false }));

  const response = await fetchWithAuth("/recurso-protegido");

  expect(response.status).toBe(403);
  expect(getSession()).toEqual({ user: { tenant_id: 1, rol: "admin" } });
  vi.unstubAllGlobals();
});
