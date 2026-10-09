import { beforeEach, expect, test, vi } from "vitest";

const { fetchWithAuthMock } = vi.hoisted(() => ({ fetchWithAuthMock: vi.fn() }));
vi.mock("../../services/authService", () => ({ fetchWithAuth: fetchWithAuthMock }));

import { clientService } from "./clientService";

beforeEach(() => {
  fetchWithAuthMock.mockReset();
  fetchWithAuthMock.mockResolvedValue({ ok: true, json: async () => [] });
});

test("consulta clientes con el texto de búsqueda codificado", async () => {
  await clientService.getAll("Ana López");
  expect(fetchWithAuthMock).toHaveBeenCalledWith(expect.stringMatching(/\/clientes\?buscar=Ana(?:\+|%20)L%C3%B3pez$/));
});

test("consulta clientes por estado", async () => {
  await clientService.getAll("", null, "activo");
  expect(fetchWithAuthMock).toHaveBeenCalledWith(expect.stringMatching(/\/clientes\?estado=activo$/));
});

test("crea y actualiza clientes mediante las rutas esperadas", async () => {
  const client = { nombre: "Ana", email: "ana@test.com" };
  await clientService.create(client);
  await clientService.update(7, { ...client, activo: false });
  expect(fetchWithAuthMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/\/clientes$/), expect.objectContaining({ method: "POST" }));
  expect(fetchWithAuthMock).toHaveBeenNthCalledWith(2, expect.stringMatching(/\/clientes\/7$/), expect.objectContaining({ method: "PATCH" }));
});
