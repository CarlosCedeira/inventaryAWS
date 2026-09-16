import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useProducts } from "./useProducts";
import { productService } from "./productService";

vi.mock("./productService", () => ({ productService: {
  getAll: vi.fn(), getCategories: vi.fn(), search: vi.fn(), getByCategory: vi.fn(),
  softDelete: vi.fn(), quickSale: vi.fn(),
} }));
const row = (id: number, category = 2) => ({ producto_id: id, categoria_id: category });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(productService.getAll).mockResolvedValue([row(1)]);
  vi.mocked(productService.getCategories).mockResolvedValue([]);
});
afterEach(cleanup);

test("una respuesta antigua no sobrescribe la busqueda actual", async () => {
  let resolveOld!: (rows: unknown[]) => void;
  vi.mocked(productService.search).mockImplementation((value: string) => value === "old"
    ? new Promise((resolve) => { resolveOld = resolve; })
    : Promise.resolve([row(3)]));
  const { result } = renderHook(useProducts);
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.handleSearch("old"));
  await waitFor(() => expect(resolveOld).toBeDefined());
  act(() => result.current.handleSearch("new"));
  await waitFor(() => expect(result.current.items[0]?.producto_id).toBe(3));
  await act(async () => { resolveOld([row(2)]); });
  expect(result.current.items[0].producto_id).toBe(3);
});

test("recargar conserva busqueda y categoria conjuntamente", async () => {
  vi.mocked(productService.getByCategory).mockResolvedValue([row(1)]);
  vi.mocked(productService.search).mockResolvedValue([row(2), row(3, 9)]);
  const { result } = renderHook(useProducts);
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => { result.current.handleCategoryFilter("2"); result.current.handleSearch("demo"); });
  await waitFor(() => expect(result.current.items.map((p) => p.producto_id)).toEqual([2]));
  await act(async () => { await result.current.refetch(); });
  expect(result.current.search).toBe("demo");
  expect(result.current.selectedCategory).toBe("2");
  expect(result.current.items.map((p) => p.producto_id)).toEqual([2]);
});

test("un fallo es visible y reintentar recupera el listado", async () => {
  vi.mocked(productService.getAll).mockRejectedValueOnce(new Error("Sin conexión"));
  const { result } = renderHook(useProducts);
  await waitFor(() => expect(result.current.error).toBe("Sin conexión"));
  await act(async () => { await result.current.refetch(); });
  expect(result.current.error).toBe("");
  expect(result.current.items).toHaveLength(1);
});

test("volver a la ventana refresca el inventario", async () => {
  const { result } = renderHook(useProducts);
  await waitFor(() => expect(result.current.loading).toBe(false));
  vi.mocked(productService.getAll).mockResolvedValue([row(4)]);
  act(() => window.dispatchEvent(new Event("focus")));
  await waitFor(() => expect(result.current.items[0]?.producto_id).toBe(4));
});
