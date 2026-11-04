const usersService = require("./users.service");
const { log, logUnexpectedError } = require("../../utils/logger");

function parseUserId(value) {
  const userId = Number(value);
  if (!Number.isSafeInteger(userId) || userId <= 0) throw Object.assign(new Error("Usuario inválido"), { statusCode: 400 });
  return userId;
}

function sendError(req, res, event, error) {
  if (error?.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Ya existe un usuario con ese email" });
  if (error?.statusCode) return res.status(error.statusCode).json({ error: error.message });
  logUnexpectedError(req, event, error);
  return res.status(500).json({ error: "Error interno del servidor" });
}

async function listUsers(req, res) {
  try {
    res.json(await usersService.listUsers(req.tenantId));
  } catch (error) {
    sendError(req, res, "users_list_failed", error);
  }
}

async function createUser(req, res) {
  try {
    const user = await usersService.createUser(req.tenantId, req.body);
    log("info", "tenant_user_created", { requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, createdUserId: user.id, role: user.rol });
    res.status(201).json(user);
  } catch (error) {
    sendError(req, res, "user_create_failed", error);
  }
}

async function updateUser(req, res) {
  try {
    const userId = parseUserId(req.params.id);
    const user = await usersService.updateUser(req.tenantId, req.user.id, userId, req.body);
    log("info", "tenant_user_updated", { requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, updatedUserId: userId, role: user.rol, active: user.activo });
    res.json(user);
  } catch (error) {
    sendError(req, res, "user_update_failed", error);
  }
}

async function resetPassword(req, res) {
  try {
    const userId = parseUserId(req.params.id);
    await usersService.resetPassword(req.tenantId, userId, req.body?.password);
    log("info", "tenant_user_password_reset", { requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, updatedUserId: userId });
    res.status(204).end();
  } catch (error) {
    sendError(req, res, "user_password_reset_failed", error);
  }
}

module.exports = { createUser, listUsers, resetPassword, updateUser };
