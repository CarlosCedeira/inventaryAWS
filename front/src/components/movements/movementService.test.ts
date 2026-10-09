import { beforeEach, expect, test, vi } from "vitest";

const { fetchWithAuthMock } = vi.hoisted(() => ({
  fetchWithAuthMock: vi.fn(),
}));

vi.mock("../../services/authService", () => ({
  fetchWithAuth: fetchWithAuthMock,
}));

import { movementService } from "./movementService";

beforeEach(() => {
  fetchWithAuthMock.mockReset();
  fetchWithAuthMock.mockResolvedValue({
    ok: true,
    json: async () => [],
  });
});

test("envia tipo, rango de fechas y búsqueda al consultar movimientos", async () => {
  await movementService.getAll({
    type: "salida",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    search: "lote A-12",
  });

  expect(fetchWithAuthMock).toHaveBeenCalledWith(
    expect.stringMatching(/\/movimientos\?tipo=salida&fecha_desde=2026-01-01&fecha_hasta=2026-01-31&buscar=lote\+A-12$/),
  );
});

test("envía el límite al consultar los movimientos recientes", async () => {
  await movementService.getAll({ limit: 3 });

  expect(fetchWithAuthMock).toHaveBeenCalledWith(
    expect.stringMatching(/\/movimientos\?limite=3$/),
  );
});
