import type { ApiRequest, ApiResponse } from "../types/http";
import { logUnexpectedError } from "../utils/logger";

interface ErrorResponse extends ApiResponse {
  headersSent: boolean;
  status(code: number): ErrorResponse;
  json(body: unknown): ErrorResponse;
}

type ErrorNextFunction = (error?: unknown) => unknown;

function errorHandler(error: unknown, req: ApiRequest, res: ErrorResponse, next: ErrorNextFunction): unknown {
  logUnexpectedError(req, "unhandled_request_error", error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: "Error interno del servidor", requestId: req.requestId });
}

export { errorHandler };
