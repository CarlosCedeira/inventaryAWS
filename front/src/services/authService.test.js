import { beforeEach, expect, test } from "vitest";
import { getSession } from "./authService";

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
  const session = { token: "demo", user: { tenant_id: 1 } };
  localStorage.setItem("inventory_session", JSON.stringify(session));
  expect(getSession()).toEqual(session);
});
