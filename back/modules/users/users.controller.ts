import type { AuthenticatedRequest, ApiResponse } from "../../types/http";
import { isHttpError } from "../../types/http";
import { createUser as createUserService, listUsers as listUsersService, resetPassword as resetPasswordService, updateUser as updateUserService } from "./users.service";

const { log, logUnexpectedError } = require("../../utils/logger") as {
  log: (level: string, event: string, context?: Record<string, unknown>) => void;
  logUnexpectedError: (req: unknown, event: string, error: unknown) => void;
};

interface UserResponse extends ApiResponse { end(): UserResponse; status(code: number): UserResponse; json(body: unknown): UserResponse }

function parseUserId(value: string): number {
  const userId = Number(value);
  if (!Number.isSafeInteger(userId) || userId <= 0) throw Object.assign(new Error("Usuario inválido"), { statusCode: 400 });
  return userId;
}

function sendError(req: AuthenticatedRequest, res: UserResponse, event: string, error: unknown): UserResponse {
  if ((error as { code?: string })?.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Ya existe un usuario con ese email" });
  if (isHttpError(error) && error.statusCode) return res.status(error.statusCode).json({ error: error.message });
  logUnexpectedError(req, event, error);
  return res.status(500).json({ error: "Error interno del servidor" });
}

async function listUsers(req: AuthenticatedRequest, res: UserResponse): Promise<void> {
  try { res.json(await listUsersService(req.tenantId)); }
  catch (error) { sendError(req, res, "users_list_failed", error); }
}

async function createUser(req: AuthenticatedRequest, res: UserResponse): Promise<void> {
  try {
    const user = await createUserService(req.tenantId, req.body);
    log("info", "tenant_user_created", { requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, createdUserId: user.id, role: user.rol });
    res.status(201).json(user);
  } catch (error) { sendError(req, res, "user_create_failed", error); }
}

async function updateUser(req: AuthenticatedRequest, res: UserResponse): Promise<void> {
  try {
    const userId = parseUserId(req.params.id);
    const user = await updateUserService(req.tenantId, req.user.id, userId, req.body);
    log("info", "tenant_user_updated", { requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, updatedUserId: userId, role: user.rol, active: user.activo });
    res.json(user);
  } catch (error) { sendError(req, res, "user_update_failed", error); }
}

async function resetPassword(req: AuthenticatedRequest, res: UserResponse): Promise<void> {
  try {
    const userId = parseUserId(req.params.id);
    await resetPasswordService(req.tenantId, userId, req.body.password);
    log("info", "tenant_user_password_reset", { requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, updatedUserId: userId });
    res.status(204).end();
  } catch (error) { sendError(req, res, "user_password_reset_failed", error); }
}

export { createUser, listUsers, resetPassword, updateUser };
