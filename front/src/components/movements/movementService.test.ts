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

test("envia tipo y rango de fechas al consultar movimientos", async () => {
  await movementService.getAll({
    type: "salida",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
  });

  expect(fetchWithAuthMock).toHaveBeenCalledWith(
    expect.stringMatching(/\/movimientos\?tipo=salida&fecha_desde=2026-01-01&fecha_hasta=2026-01-31$/),
  );
});
