import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("./clientService", () => ({ clientService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn() } }));
vi.mock("../sales/salesService", () => ({ salesService: { recent: vi.fn() } }));
import { clientService } from "./clientService";
import { salesService } from "../sales/salesService";
import Clients from "./Clients";

const client = {
  id: 7,
  nombre: "Ana López",
  email: "ana@demo.test",
  telefono: "600 000 001",
  identificacion_fiscal: "B12345678",
  direccion: "Calle Mayor 1",
  activo: true,
  created_at: "2026-01-10T12:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(clientService.getAll).mockResolvedValue([client]);
  vi.mocked(salesService.recent).mockResolvedValue([]);
});

test("la búsqueda consulta la API y una fila abre la ficha ampliada", async () => {
  render(<Clients />);
  await screen.findByText("Ana López");

  fireEvent.change(screen.getByLabelText("Buscar cliente"), { target: { value: "B123" } });
  await waitFor(() => expect(clientService.getAll).toHaveBeenLastCalledWith("B123", null, ""));

  fireEvent.click(screen.getByText("Ana López").closest("tr"));
  expect(await screen.findByRole("dialog", { name: "Ana López" })).toBeInTheDocument();
  expect(screen.getAllByText("B12345678")).toHaveLength(2);
  expect(screen.getAllByText("Calle Mayor 1")).toHaveLength(2);
});

test("editar desde la ficha abre el formulario del cliente seleccionado", async () => {
  render(<Clients />);
  fireEvent.click(await screen.findByText("Ana López"));
  fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
  expect(screen.getByRole("dialog", { name: "Editar cliente" })).toBeInTheDocument();
  expect(screen.getByDisplayValue("ana@demo.test")).toBeInTheDocument();
});
