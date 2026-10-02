export type Role = "owner" | "admin";

export interface AuthenticatedUser {
  id: number;
  tenant_id: number;
  // Signed tokens can still contain legacy or unsupported roles.
  rol?: string;
}

export interface ApiRequest {
  headers: { authorization?: string };
  originalUrl: string;
  requestId?: string;
  tenantId?: number;
  user?: AuthenticatedUser;
}

export interface AuthenticatedRequest extends ApiRequest {
  tenantId: number;
  user: AuthenticatedUser;
  params: Record<string, string>;
  body: Record<string, unknown>;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): ApiResponse;
}

export type NextFunction = () => void;
export interface HttpError extends Error { statusCode?: number }

export function isHttpError(error: unknown): error is HttpError & { statusCode: number } {
  return error instanceof Error && "statusCode" in error && typeof error.statusCode === "number";
}
