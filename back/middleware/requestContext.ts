import { randomUUID } from "node:crypto";
import type { ApiRequest, NextFunction } from "../types/http";
import { log } from "../utils/logger";

interface RequestWithContext extends ApiRequest {
  method: string;
}

interface ContextResponse {
  statusCode: number;
  setHeader(name: string, value: string): unknown;
  on(event: "finish", listener: () => void): unknown;
}

function requestContext(req: RequestWithContext, res: ContextResponse, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    log(res.statusCode >= 400 ? "warn" : "info", "http_request_completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
      tenantId: req.tenantId,
      userId: req.user?.id,
      role: req.user?.rol,
    });
  });
  next();
}

export { requestContext };
