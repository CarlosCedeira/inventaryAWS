import type { ApiRequest, ApiResponse, AuthenticatedUser, NextFunction, Role } from "../../types/http";
const { verifyToken } = require("./auth.tokens") as {
  verifyToken: (token: string) => AuthenticatedUser | null;
};
const { log } = require("../../utils/logger");

const ROLES = Object.freeze({
  OWNER: "owner",
  ADMIN: "admin",
});

function requireAuth(req: ApiRequest, res: ApiResponse, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const user = verifyToken(token);
    if (!user) return res.status(401).json({ error: "Token invalido" });

    req.user = user;
    req.tenantId = user.tenant_id;
    next();
  } catch (error) {
    log("warn", "authentication_failed", { requestId: req.requestId, path: req.originalUrl });
    res.status(401).json({ error: "Token invalido" });
  }
}

function requireRoles(...allowedRoles: Role[]) {
  const allowedRoleSet = new Set<string>(allowedRoles);

  return (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
    const role = req.user?.rol;
    if (!role || !allowedRoleSet.has(role)) {
      log("warn", "authorization_denied", {
        requestId: req.requestId,
        path: req.originalUrl,
        tenantId: req.tenantId,
        userId: req.user?.id,
        role: role || null,
        allowedRoles,
      });
      return res.status(403).json({ error: "No tienes permisos para realizar esta accion" });
    }

    next();
  };
}

export {
  ROLES,
  requireAuth,
  requireRoles,
};
