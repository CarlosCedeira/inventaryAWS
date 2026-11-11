type LogLevel = "debug" | "info" | "warn" | "error";
type ConfiguredLogLevel = LogLevel | "silent";
type LogContext = Record<string, unknown>;

interface RequestLogContext {
  requestId?: string;
  method?: string;
  originalUrl?: string;
  tenantId?: number;
}

const LEVELS: Record<ConfiguredLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: Infinity,
};

function configuredLevel(): ConfiguredLogLevel {
  const requestedLevel = process.env.LOG_LEVEL as ConfiguredLogLevel | undefined;
  if (requestedLevel && requestedLevel in LEVELS) return requestedLevel;
  if (process.env.NODE_ENV === "test") return "silent";
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function log(level: LogLevel, event: string, context: LogContext = {}): void {
  if (LEVELS[level] < LEVELS[configuredLevel()]) return;
  process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...context })}\n`);
}

function logUnexpectedError(
  req: RequestLogContext | null | undefined,
  event: string,
  error: unknown,
  context: LogContext = {},
): void {
  const exception = error instanceof Error ? error : undefined;
  log("error", event, {
    requestId: req?.requestId,
    method: req?.method,
    path: req?.originalUrl,
    tenantId: req?.tenantId,
    ...context,
    error: {
      name: exception?.name,
      message: exception?.message,
      ...(process.env.LOG_STACKS !== "false" && exception?.stack ? { stack: exception.stack } : {}),
    },
  });
}

export { log, logUnexpectedError };
