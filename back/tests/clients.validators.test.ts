import test from "node:test";
import assert from "node:assert/strict";
import { buildCommercialClientPayload } from "../modules/clients/clients.validators";

test("normaliza un cliente comercial antes de persistirlo", () => {
  const result = buildCommercialClientPayload({
    nombre: "  Ana López  ",
    email: " ana@example.com ",
    telefono: " 600 000 000 ",
    identificacion_fiscal: " B123 ",
    direccion: " Calle Mayor 1 ",
  });

  assert.deepEqual(result, {
    client: {
      nombre: "Ana López",
      email: "ana@example.com",
      telefono: "600 000 000",
      identificacion_fiscal: "B123",
      direccion: "Calle Mayor 1",
      activo: true,
    },
  });
});

test("rechaza un email o estado de cliente no validos", () => {
  assert.deepEqual(buildCommercialClientPayload({ nombre: "Ana", email: "incorrecto" }), {
    error: "El email no es valido",
  });
  assert.deepEqual(buildCommercialClientPayload({ nombre: "Ana", activo: "si" }), {
    error: "El estado del cliente no es valido",
  });
});
