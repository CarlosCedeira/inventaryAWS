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
  expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([expect.stringContaining("bretema_session=")]));
});

test("la cookie de sesión permite consultar /auth/me y cerrar sesión", async () => {
  const user = await seedTenantAndUser();
  const agent = request.agent(app);

  const login = await agent.post("/auth/login").send({ email: user.email, password: user.password });
  expect(login.status).toBe(200);
  expect(login.headers["set-cookie"]).toEqual(expect.arrayContaining([expect.stringContaining("HttpOnly")]));

  const me = await agent.get("/auth/me");
  expect(me.status).toBe(200);
  expect(me.body.user).toMatchObject({ id: user.userId, tenant_id: user.tenantId });

  expect((await agent.post("/auth/logout")).status).toBe(204);
  expect((await agent.get("/auth/me")).status).toBe(401);
});

test.each(["owner", "admin", "almacen"] as const)("el rol %s puede consultar las rutas del inventario", async (role) => {
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

test("almacen puede consultar y operar movimientos, pero no gestionar productos ni acceder a comercial", async () => {
  const user = await seedTenantAndUser({ email: "almacen@demo.com", role: "almacen" });
  const login = await request(app).post("/auth/login").send({
    email: user.email,
    password: user.password,
  });
  const authorization = `Bearer ${login.body.token}`;

  expect((await request(app).get("/movimientos").set("Authorization", authorization)).status).toBe(200);
  // Un 400 de validación confirma que el rol atravesó la autorización de movimientos.
  expect((await request(app).post("/movimientos").set("Authorization", authorization).send({})).status).toBe(400);

  for (const requestToProtect of [
    request(app).post("/productos/newProduct").set("Authorization", authorization).send({}),
    request(app).post("/productos/categorias").set("Authorization", authorization).send({}),
    request(app).put("/productos/actualizar/1").set("Authorization", authorization).send({}),
    request(app).get("/ventas").set("Authorization", authorization),
    request(app).get("/clientes").set("Authorization", authorization),
  ]) {
    expect((await requestToProtect).status).toBe(403);
  }
});

test("solo owner administra usuarios de su propio tenant", async () => {
  const owner = await seedTenantAndUser({ email: "owner-users@demo.com", role: "owner" });
  const admin = await seedTenantAndUser({ email: "admin-other@demo.com", role: "admin" });
  const ownerLogin = await request(app).post("/auth/login").send({ email: owner.email, password: owner.password });
  const adminLogin = await request(app).post("/auth/login").send({ email: admin.email, password: admin.password });
  const authorization = `Bearer ${ownerLogin.body.token}`;

  expect((await request(app).get("/usuarios").set("Authorization", `Bearer ${adminLogin.body.token}`)).status).toBe(403);

  const created = await request(app).post("/usuarios").set("Authorization", authorization).send({
    nombre: "Nueva comercial", email: "nueva-comercial@demo.com", password: "secreto123", rol: "vendedor",
  });
  expect(created.status).toBe(201);
  expect(created.body).toMatchObject({ nombre: "Nueva comercial", email: "nueva-comercial@demo.com", rol: "vendedor", activo: true });
  expect(created.body.password).toBeUndefined();

  const list = await request(app).get("/usuarios").set("Authorization", authorization);
  expect(list.status).toBe(200);
  expect(list.body).toHaveLength(2);
  expect(list.body.every((user: { tenant_id: number }) => user.tenant_id === owner.tenantId)).toBe(true);

  expect((await request(app).post("/usuarios").set("Authorization", authorization).send({
    nombre: "Otro owner", email: "otro-owner@demo.com", password: "secreto123", rol: "owner",
  })).status).toBe(400);
  expect((await request(app).patch(`/usuarios/${owner.userId}`).set("Authorization", authorization).send({
    nombre: "Owner cambiado", email: owner.email, rol: "admin", activo: false,
  })).status).toBe(403);
});

test("vendedor accede a comercial y al catálogo para vender, pero no al inventario ni a movimientos", async () => {
  const user = await seedTenantAndUser({ email: "vendedor@demo.com", role: "vendedor" });
  const login = await request(app).post("/auth/login").send({
    email: user.email,
    password: user.password,
  });
  const authorization = `Bearer ${login.body.token}`;

  for (const allowedRequest of [
    request(app).get("/clientes").set("Authorization", authorization),
    request(app).get("/ventas").set("Authorization", authorization),
    request(app).get("/productos").set("Authorization", authorization),
  ]) {
    expect((await allowedRequest).status).toBe(200);
  }

  for (const deniedRequest of [
    request(app).get("/movimientos").set("Authorization", authorization),
    request(app).get("/productos/sin-ventas").set("Authorization", authorization),
    request(app).post("/productos/newProduct").set("Authorization", authorization).send({}),
  ]) {
    expect((await deniedRequest).status).toBe(403);
  }
});

test("un token con un rol fuera de la política recibe 403", async () => {
  const user = await seedTenantAndUser();
  const token = createToken({
    id: user.userId,
    tenant_id: user.tenantId,
    rol: "rol_no_autorizado",
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
