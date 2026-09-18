const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: Infinity };

function configuredLevel() {
  if (process.env.LOG_LEVEL && LEVELS[process.env.LOG_LEVEL]) {
    return process.env.LOG_LEVEL;
  }
  if (process.env.NODE_ENV === "test") return "silent";
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function log(level, event, context = {}) {
  if (LEVELS[level] < LEVELS[configuredLevel()]) return;

  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  };
  process.stdout.write(`${JSON.stringify(record)}\n`);
}

function logUnexpectedError(req, event, error, context = {}) {
  log("error", event, {
    requestId: req?.requestId,
    method: req?.method,
    path: req?.originalUrl,
    tenantId: req?.tenantId,
    ...context,
    error: {
      name: error?.name,
      message: error?.message,
      ...(process.env.LOG_STACKS !== "false" && error?.stack
        ? { stack: error.stack }
        : {}),
    },
  });
}

module.exports = { log, logUnexpectedError };
