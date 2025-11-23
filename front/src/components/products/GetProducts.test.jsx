import { render, screen, within, waitFor } from "@testing-library/react";
import GetProducts from "./GetProducts";

vi.mock("../spiners", () => ({
  default: () => <div data-testid="spinner">Cargando...</div>,
}));

// Mock del componente Publicado
vi.mock("./publicado/putPublicado", () => ({
  default: () => <td data-testid="publicado">Mock Pub</td>,
}));

const mockProductos = [
  {
    inventario_id: 1,
    tenant_id: 1,
    producto_id: 11,
    producto_nombre: "Camiseta básica ",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 50,
    precio_compra: "5.00",
    precio_venta: "12.99",
    fecha_caducidad: "2026-02-12T23:00:00.000Z",
    publicado: 1,
  },
  {
    inventario_id: 2,
    tenant_id: 1,
    producto_id: 21,
    producto_nombre: "Camiseta básica",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 44,
    precio_compra: "5.00",
    precio_venta: "12.99",
    fecha_caducidad: "2025-11-29T23:00:00.000Z",
    publicado: 1,
  },
  {
    inventario_id: 3,
    tenant_id: 1,
    producto_id: 12,
    producto_nombre: "Pantalón vaquero",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 30,
    precio_compra: "10.00",
    precio_venta: "25.99",
    fecha_caducidad: "2025-11-27T23:00:00.000Z",
    publicado: 1,
  },
  {
    inventario_id: 4,
    tenant_id: 1,
    producto_id: 22,
    producto_nombre: "Pantalón vaquero",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 25,
    precio_compra: "10.00",
    precio_venta: "25.99",
    fecha_caducidad: null,
    publicado: 1,
  },
  {
    inventario_id: 5,
    tenant_id: 1,
    producto_id: 13,
    producto_nombre: "Sudadera con capucha",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 20,
    precio_compra: "15.00",
    precio_venta: "30.00",
    fecha_caducidad: null,
    publicado: 0,
  },
  {
    inventario_id: 6,
    tenant_id: 1,
    producto_id: 23,
    producto_nombre: "Sudadera con capucha",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 15,
    precio_compra: "15.00",
    precio_venta: "30.00",
    fecha_caducidad: null,
    publicado: 0,
  },
  {
    inventario_id: 7,
    tenant_id: 1,
    producto_id: 14,
    producto_nombre: "Zapatillas deportivas",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 60,
    precio_compra: "20.00",
    precio_venta: "45.00",
    fecha_caducidad: null,
    publicado: 0,
  },
  {
    inventario_id: 8,
    tenant_id: 1,
    producto_id: 24,
    producto_nombre: "Zapatillas deportivas",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 55,
    precio_compra: "20.00",
    precio_venta: "45.00",
    fecha_caducidad: null,
    publicado: 0,
  },
  {
    inventario_id: 9,
    tenant_id: 1,
    producto_id: 15,
    producto_nombre: "Camisa formal",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 35,
    precio_compra: "12.00",
    precio_venta: "28.00",
    fecha_caducidad: null,
    publicado: 1,
  },
  {
    inventario_id: 10,
    tenant_id: 1,
    producto_id: 25,
    producto_nombre: "Camisa formal",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 30,
    precio_compra: "12.00",
    precio_venta: "28.00",
    fecha_caducidad: null,
    publicado: 1,
  },
  {
    inventario_id: 11,
    tenant_id: 1,
    producto_id: 16,
    producto_nombre: "Vestido de verano",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 1,
    precio_compra: "1.00",
    precio_venta: "1.00",
    fecha_caducidad: null,
    publicado: 0,
  },
  {
    inventario_id: 12,
    tenant_id: 1,
    producto_id: 26,
    producto_nombre: "Vestido de verano",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 20,
    precio_compra: "18.00",
    precio_venta: "40.00",
    fecha_caducidad: null,
    publicado: 0,
  },
  {
    inventario_id: 13,
    tenant_id: 1,
    producto_id: 17,
    producto_nombre: "Gorra de béisbol",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 40,
    precio_compra: "4.00",
    precio_venta: "10.00",
    fecha_caducidad: null,
    publicado: 0,
  },
  {
    inventario_id: 14,
    tenant_id: 1,
    producto_id: 27,
    producto_nombre: "Gorra de béisbol",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 35,
    precio_compra: "4.00",
    precio_venta: "10.00",
    fecha_caducidad: null,
    publicado: 0,
  },
  {
    inventario_id: 15,
    tenant_id: 1,
    producto_id: 18,
    producto_nombre: "Chaqueta de cuero",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 15,
    precio_compra: "50.00",
    precio_venta: "120.00",
    fecha_caducidad: null,
    publicado: 0,
  },
  {
    inventario_id: 16,
    tenant_id: 1,
    producto_id: 28,
    producto_nombre: "Chaqueta de cuero",
    producto_categoria: "Moda",
    categoria_id: 8,
    cantidad: 10,
    precio_compra: "50.00",
    precio_venta: "125.00",
    fecha_caducidad: null,
    publicado: 0,
  },
];

test("muestra spinner, carga datos y renderiza la tabla correctamente", async () => {
  const fetchMock = vi.spyOn(global, "fetch").mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: async () => mockProductos,
    })
  );

  render(<GetProducts />);

  // Spinner visible mientras loading
  expect(screen.getByTestId("spinner")).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();

  // Esperar a la tabla
  await waitFor(() => {
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/productos");

  // Spinner desaparece
  expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();

  const rows = await screen.findAllByRole("row");
  const dataRows = rows.slice(1);

  mockProductos.forEach((producto, idx) => {
    const row = dataRows[idx];
    const cells = within(row).getAllByRole("cell");

    expect(cells).toHaveLength(7);

    expect(cells[0]).toHaveTextContent(producto.producto_nombre.trim());
    expect(cells[1]).toHaveTextContent(producto.producto_categoria);
    expect(cells[2]).toHaveTextContent(producto.cantidad.toString());
    expect(cells[3]).toHaveTextContent(producto.precio_compra);
    expect(cells[4]).toHaveTextContent(producto.precio_venta);

    if (producto.fecha_caducidad) {
      const fecha = new Date(producto.fecha_caducidad);
      const fechaStr = fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      expect(cells[5]).toHaveTextContent(fechaStr);
    } else {
      expect(cells[5]).toHaveTextContent("");
    }

    // Columna Publicado mockeada
    expect(cells[6]).toHaveTextContent("Mock Pub");
  });
});
