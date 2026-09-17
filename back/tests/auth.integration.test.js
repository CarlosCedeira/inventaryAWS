const request = require("supertest");
const app = require("../app");
const { seedTenantAndUser } = require("./helpers/database");

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
});

test.each([
  [{ email: "admin@demo.com", password: "incorrecta" }, "contraseña incorrecta"],
  [{ email: "nadie@demo.com", password: "password-correcta" }, "email inexistente"],
])("login rechaza %s", async (credentials) => {
  await seedTenantAndUser();
  const response = await request(app).post("/auth/login").send(credentials);
  expect(response.status).toBe(401);
});

test.each([
  [{}, "ambos ausentes"],
  [{ email: "admin@demo.com" }, "password ausente"],
  [{ password: "password-correcta" }, "email ausente"],
])("login valida campos obligatorios: %s", async (payload) => {
  const response = await request(app).post("/auth/login").send(payload);
  expect(response.status).toBe(400);
});

test.each([
  [{ userActive: false }, "usuario inactivo"],
  [{ tenantActive: false }, "tenant inactivo"],
])("login rechaza %s", async (seedOptions) => {
  await seedTenantAndUser(seedOptions);
  const response = await request(app).post("/auth/login").send({
    email: "admin@demo.com",
    password: "password-correcta",
  });
  expect(response.status).toBe(401);
});
