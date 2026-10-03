import { beforeEach, expect, test, vi } from "vitest";

const { fetchWithAuthMock } = vi.hoisted(() => ({ fetchWithAuthMock: vi.fn() }));
vi.mock("../../services/authService", () => ({ fetchWithAuth: fetchWithAuthMock }));

import { salesService } from "./salesService";

beforeEach(() => {
  fetchWithAuthMock.mockReset();
  fetchWithAuthMock.mockResolvedValue({ ok: true, json: async () => [] });
});

test("consulta el historial de ventas", async () => {
  await salesService.list();
  expect(fetchWithAuthMock).toHaveBeenCalledWith(expect.stringMatching(/\/ventas$/), undefined);
});

test("codifica los filtros de ventas en la consulta", async () => {
  await salesService.list({ buscar: "Ana López", periodo: "month", iva: 21 });
  expect(fetchWithAuthMock).toHaveBeenCalledWith(expect.stringMatching(/buscar=Ana(?:%20|\+)L%C3%B3pez.*periodo=month.*iva=21/), undefined);
});

test("consulta las opciones del filtro de usuario", async () => {
  await salesService.filterOptions();
  expect(fetchWithAuthMock).toHaveBeenCalledWith(expect.stringMatching(/\/ventas\/filtros$/), undefined);
});

test("consulta el resumen comercial", async () => {
  await salesService.summary();
  expect(fetchWithAuthMock).toHaveBeenCalledWith(expect.stringMatching(/\/ventas\/resumen$/), undefined);
});

test("consulta el detalle de una venta", async () => {
  await salesService.getById(12);
  expect(fetchWithAuthMock).toHaveBeenCalledWith(expect.stringMatching(/\/ventas\/12$/), undefined);
});

test("envía una nueva venta al endpoint de ventas", async () => {
  const sale = { cliente_id: 2, lineas: [{ producto_id: 8, cantidad: 3 }] };
  await salesService.create(sale);
  expect(fetchWithAuthMock).toHaveBeenCalledWith(expect.stringMatching(/\/ventas$/), expect.objectContaining({ method: "POST", body: JSON.stringify(sale) }));
});
