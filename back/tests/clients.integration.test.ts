import { test, expect } from "@jest/globals";
import request from "supertest";
import { seedTenantAndUser, type SeededUser } from "./helpers/database";

const app = require("../app");

async function loginAs(user: SeededUser): Promise<string> {
  const response = await request(app).post("/auth/login").send({ email: user.email, password: user.password });
  expect(response.status).toBe(200);
  return response.body.token;
}

const clientPayload = {
  nombre: "Ana Comercio",
  email: "ana@comercio.test",
  telefono: "600 000 001",
  identificacion_fiscal: "B12345678",
  direccion: "Calle Mayor 1",
};

test("clientes exige autenticación", async () => {
  const response = await request(app).get("/clientes");
  expect(response.status).toBe(401);
});

test("clientes crea, lista, busca y edita sin exponer datos de otro tenant", async () => {
  const owner = await seedTenantAndUser({ email: "clientes@demo.test" });
  const otherOwner = await seedTenantAndUser({ email: "clientes-otro@demo.test" });
  const token = await loginAs(owner);
  const otherToken = await loginAs(otherOwner);

  const createResponse = await request(app).post("/clientes").set("Authorization", `Bearer ${token}`).send(clientPayload);
  expect(createResponse.status).toBe(201);
  expect(createResponse.body).toMatchObject({ id: expect.any(Number), ...clientPayload, activo: true });
  const clientId = createResponse.body.id;

  const listResponse = await request(app).get("/clientes").set("Authorization", `Bearer ${token}`);
  expect(listResponse.status).toBe(200);
  expect(listResponse.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: clientId, nombre: "Ana Comercio" })]));

  const searchByName = await request(app).get("/clientes?buscar=Comercio").set("Authorization", `Bearer ${token}`);
  const searchByEmail = await request(app).get("/clientes?buscar=ana@comercio").set("Authorization", `Bearer ${token}`);
  const searchByTaxId = await request(app).get("/clientes?buscar=B123").set("Authorization", `Bearer ${token}`);
  expect(searchByName.body).toHaveLength(1);
  expect(searchByEmail.body[0]).toMatchObject({ id: clientId });
  expect(searchByTaxId.body[0]).toMatchObject({ id: clientId });

  const foreignList = await request(app).get("/clientes").set("Authorization", `Bearer ${otherToken}`);
  expect(foreignList.status).toBe(200);
  expect(foreignList.body).toHaveLength(0);

  const foreignUpdate = await request(app).patch(`/clientes/${clientId}`).set("Authorization", `Bearer ${otherToken}`).send(clientPayload);
  expect(foreignUpdate.status).toBe(404);

  const updateResponse = await request(app).patch(`/clientes/${clientId}`).set("Authorization", `Bearer ${token}`).send({
    ...clientPayload,
    nombre: "Ana Comercio Actualizada",
    activo: false,
  });
  expect(updateResponse.status).toBe(200);
  expect(updateResponse.body).toMatchObject({ id: clientId, nombre: "Ana Comercio Actualizada", activo: false });
});

test("clientes valida los datos y evita identificaciones repetidas dentro del tenant", async () => {
  const user = await seedTenantAndUser({ email: "clientes-validacion@demo.test" });
  const token = await loginAs(user);

  const invalid = await request(app).post("/clientes").set("Authorization", `Bearer ${token}`).send({ nombre: "A", email: "no-es-email" });
  expect(invalid.status).toBe(400);

  expect((await request(app).post("/clientes").set("Authorization", `Bearer ${token}`).send(clientPayload)).status).toBe(201);
  const duplicate = await request(app).post("/clientes").set("Authorization", `Bearer ${token}`).send({ ...clientPayload, nombre: "Otra empresa" });
  expect(duplicate.status).toBe(409);
});
