import { test, expect } from "@jest/globals";
import request from "supertest";
import type { PoolConnection } from "mysql2/promise";
import { seedTenantAndUser, type SeededUser } from "./helpers/database";

const app = require("../app");
const express = require("express");
const { requireAuth, requireRoles, ROLES } = require("../modules/auth/auth.middleware");
const { getConnection } = require("../db") as { getConnection: () => Promise<PoolConnection> };
const { createToken } = require("../modules/auth/auth.tokens") as {
  createToken: (payload: Record<string, unknown>) => string;
};

// A restricted test route exercises the real middleware without changing product policy.
const restrictedApp = express();
restrictedApp.get("/owner-only", requireAuth, requireRoles(ROLES.OWNER),
  (_req: unknown, res: { sendStatus: (status: number) => void }) => res.sendStatus(204));

async function login(user: SeededUser): Promise<string> {
  const response = await request(app).post("/auth/login").send({ email: user.email, password: user.password });
  expect(response.status).toBe(200);
  return response.body.token;
}

async function loginWithCookie(user: SeededUser): Promise<string> {
  const response = await request(app).post("/auth/login").send({ email: user.email, password: user.password });
  expect(response.status).toBe(200);
  expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([expect.stringContaining("HttpOnly")]));
  return response.headers["set-cookie"][0];
}

async function execute(sql: string, values: Array<number | string>) {
  const connection = await getConnection();
  try {
    await connection.execute(sql, values);
  } finally {
    connection.release();
  }
}

test("un admin recibe 403 en una ruta reservada a owner", async () => {
  const token = await login(await seedTenantAndUser());
  const response = await request(restrictedApp).get("/owner-only").set("Authorization", `Bearer ${token}`);
  expect(response.status).toBe(403);
});

test.each(["usuario", "empresa"])("desactivar %s invalida la sesión abierta por cookie", async (target) => {
  const user = await seedTenantAndUser();
  const cookie = await loginWithCookie(user);
  const before = await request(app).get("/productos").set("Cookie", cookie);
  expect(before.status).toBe(200);
  await execute(target === "usuario"
    ? "UPDATE usuarios SET activo = FALSE WHERE id = ?"
    : "UPDATE tenants SET activo = FALSE WHERE id = ?", [target === "usuario" ? user.userId : user.tenantId]);
  const after = await request(app).get("/productos").set("Cookie", cookie);
  expect(after.status).toBe(401);
});

test.each([
  ["owner", "admin", 204, 403],
  ["admin", "owner", 403, 204],
] as const)("cambiar %s a %s aplica permisos SQL con la misma cookie", async (initial, updated, beforeStatus, afterStatus) => {
  const user = await seedTenantAndUser({ role: initial });
  const cookie = await loginWithCookie(user);
  const before = await request(restrictedApp).get("/owner-only").set("Cookie", cookie);
  expect(before.status).toBe(beforeStatus);
  await execute("UPDATE usuarios SET rol = ? WHERE id = ?", [updated, user.userId]);
  const after = await request(restrictedApp).get("/owner-only").set("Cookie", cookie);
  expect(after.status).toBe(afterStatus);
});

test("/auth/me devuelve el rol actual y nunca datos sensibles", async () => {
  const user = await seedTenantAndUser({ role: "owner" });
  const cookie = await loginWithCookie(user);
  await execute("UPDATE usuarios SET rol = ? WHERE id = ?", ["admin", user.userId]);

  const response = await request(app).get("/auth/me").set("Cookie", cookie);
  expect(response.status).toBe(200);
  expect(response.body.user).toMatchObject({ id: user.userId, tenant_id: user.tenantId, rol: "admin" });
  expect(response.body.user.password_hash).toBeUndefined();
  expect(response.body.user.activo).toBeUndefined();
});

test.each([
  ["usuario inexistente", (user: SeededUser) => ({ id: user.userId + 10_000, tenant_id: user.tenantId, rol: "admin" })],
  ["combinación de usuario y tenant incorrecta", (user: SeededUser) => ({ id: user.userId, tenant_id: user.tenantId + 10_000, rol: "admin" })],
])("%s devuelve 401 aunque el JWT sea válido", async (_description, payloadFor) => {
  const user = await seedTenantAndUser();
  const token = createToken(payloadFor(user));
  const response = await request(app).get("/productos").set("Authorization", `Bearer ${token}`);
  expect(response.status).toBe(401);
});
