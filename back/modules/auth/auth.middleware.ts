import type { ApiRequest, ApiResponse, AuthenticatedUser, NextFunction, Role } from "../../types/http";
const { verifyToken } = require("./auth.tokens") as {
  verifyToken: (token: string) => AuthenticatedUser | null;
};
const { log } = require("../../utils/logger");
const { COOKIE_NAME } = require("./auth.cookies") as { COOKIE_NAME: string };
const authModel = require("./auth.model") as {
  findActiveSessionUser: (userId: number, tenantId: number) => Promise<AuthenticatedUser | null>;
};

const ROLES = Object.freeze({
  OWNER: "owner",
  ADMIN: "admin",
  WAREHOUSE: "almacen",
  SELLER: "vendedor",
});

async function requireAuth(req: ApiRequest, res: ApiResponse, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const [scheme, bearerToken] = authHeader.split(" ");
  const cookieHeader = (req.headers as { cookie?: string }).cookie || "";
  const cookieToken = cookieHeader
    .split(";")
    .map((part: string) => part.trim())
    .find((part: string) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  // Authorization se conserva solo para las pruebas de integración. En
  // ejecución normal la sesión se autentica exclusivamente por cookie HttpOnly.
  const token = cookieToken || (process.env.NODE_ENV === "test" && scheme === "Bearer" ? bearerToken : null);

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const tokenUser = verifyToken(token);
    if (!tokenUser?.id || !tokenUser.tenant_id) return res.status(401).json({ error: "Token invalido" });

    const user = await authModel.findActiveSessionUser(tokenUser.id, tokenUser.tenant_id);
    if (!user) return res.status(401).json({ error: "Sesion no valida" });

    // Nunca se conserva el rol contenido en el token: este objeto procede de SQL.
    req.user = user;
    req.tenantId = user.tenant_id;
    return next();
  } catch (error) {
    log("error", "session_state_lookup_failed", { requestId: req.requestId, path: req.originalUrl });
    return next(error instanceof Error ? error : new Error("Error al consultar la sesión"));
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
