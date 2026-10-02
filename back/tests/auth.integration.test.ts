import { test, expect } from "@jest/globals";
import request from "supertest";
const app = require("../app");
import { seedTenantAndUser } from "./helpers/database";
const { createToken } = require("../modules/auth/auth.tokens") as {
  createToken: (payload: Record<string, unknown>) => string;
};

test("login correcto devuelve token y usuario sin password_hash", async () => {
  await seedTenantAndUser();

  const response = await request(app).post("/auth/login").send({
    email: "admin@demo.com",
    password: "password-correcta",
  });

  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));
  expect(response.body.user.email).toBe("admin@demo.com");
  expect(response.body.user.password_hash).toBeUndefined();
  expect(response.body.user.rol).toBe("admin");
});

test.each(["owner", "admin"] as const)("el rol %s puede acceder a las rutas del inventario", async (role) => {
  const user = await seedTenantAndUser({ email: `${role}@demo.com`, role });
  const login = await request(app).post("/auth/login").send({
    email: user.email,
    password: user.password,
  });

  expect(login.status).toBe(200);
  expect(login.body.user.rol).toBe(role);

  const response = await request(app)
    .get("/productos")
    .set("Authorization", `Bearer ${login.body.token}`);

  expect(response.status).toBe(200);
});

test("un token con un rol fuera de la política recibe 403", async () => {
  const user = await seedTenantAndUser();
  const token = createToken({
    id: user.userId,
    tenant_id: user.tenantId,
    rol: "vendedor",
  });

  const response = await request(app)
    .get("/productos")
    .set("Authorization", `Bearer ${token}`);

  expect(response.status).toBe(403);
  expect(response.body).toEqual({ error: "No tienes permisos para realizar esta accion" });
});

test.each([
  [{ email: "admin@demo.com", password: "incorrecta" }, "contraseña incorrecta"],
  [{ email: "nadie@demo.com", password: "password-correcta" }, "email inexistente"],
])("login rechaza %s", async (credentials, _description) => {
  await seedTenantAndUser();
  const response = await request(app).post("/auth/login").send(credentials);
  expect(response.status).toBe(401);
});

test.each([
  [{}, "ambos ausentes"],
  [{ email: "admin@demo.com" }, "password ausente"],
  [{ password: "password-correcta" }, "email ausente"],
])("login valida campos obligatorios: %s", async (payload, _description) => {
  const response = await request(app).post("/auth/login").send(payload);
  expect(response.status).toBe(400);
});

test.each([
  [{ userActive: false }, "usuario inactivo"],
  [{ tenantActive: false }, "tenant inactivo"],
])("login rechaza %s", async (seedOptions, _description) => {
  await seedTenantAndUser(seedOptions);
  const response = await request(app).post("/auth/login").send({
    email: "admin@demo.com",
    password: "password-correcta",
  });
  expect(response.status).toBe(401);
});
