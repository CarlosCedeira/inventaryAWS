import { expect, test, vi } from "vitest";
import { fetchWithAuth } from "./authService";

test("un 403 se devuelve para que la interfaz muestre el error de permisos", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 403, ok: false }));

  const response = await fetchWithAuth("/recurso-protegido");

  expect(response.status).toBe(403);
  vi.unstubAllGlobals();
});

test("un 401 notifica al contexto para que limpie la sesión React", async () => {
  const listener = vi.fn();
  window.addEventListener("bretema:session-invalid", listener);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 401, ok: false }));

  await expect(fetchWithAuth("/recurso-protegido")).rejects.toThrow("Sesion expirada o no valida");

  expect(listener).toHaveBeenCalledTimes(1);
  window.removeEventListener("bretema:session-invalid", listener);
  vi.unstubAllGlobals();
});
