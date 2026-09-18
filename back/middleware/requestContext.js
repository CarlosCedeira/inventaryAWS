const { randomUUID } = require("node:crypto");
const { log } = require("../utils/logger");

function requestContext(req, res, next) {
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
    });
  });

  next();
}

module.exports = { requestContext };
