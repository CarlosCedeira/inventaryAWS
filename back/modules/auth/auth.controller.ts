import type { ApiRequest, ApiResponse } from "../../types/http";
import { clearSessionCookie, sessionCookieOptions, type SessionCookieOptions } from "./auth.cookies";
import { login as authenticate } from "./auth.service";

const { log, logUnexpectedError } = require("../../utils/logger") as {
  log: (level: string, event: string, context?: Record<string, unknown>) => void;
  logUnexpectedError: (req: unknown, event: string, error: unknown) => void;
};

interface AuthRequest extends ApiRequest {
  body?: { email?: unknown; password?: unknown };
}

interface AuthResponse {
  status(code: number): AuthResponse;
  json(body: unknown): AuthResponse;
  cookie(name: string, value: string, options: SessionCookieOptions): AuthResponse;
  clearCookie(name: string, options: SessionCookieOptions): AuthResponse;
  end(): AuthResponse;
}

async function login(req: AuthRequest, res: AuthResponse): Promise<ApiResponse> {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email y password son obligatorios" });

    const session = await authenticate(email as string, password as string);
    if (!session) {
      log("warn", "login_rejected", { requestId: req.requestId });
      return res.status(401).json({ error: "Credenciales no validas" });
    }
    log("info", "login_succeeded", { requestId: req.requestId, tenantId: session.user.tenant_id, userId: session.user.id, role: session.user.rol });
    res.cookie("bretema_session", session.token, sessionCookieOptions());
    return res.json(process.env.NODE_ENV === "test" ? session : { user: session.user });
  } catch (error) {
    logUnexpectedError(req, "login_failed", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

function me(req: ApiRequest, res: ApiResponse): ApiResponse {
  return res.json({ user: req.user });
}

function logout(_req: ApiRequest, res: AuthResponse): AuthResponse {
  clearSessionCookie(res);
  return res.status(204).end();
}

export { login, logout, me };
