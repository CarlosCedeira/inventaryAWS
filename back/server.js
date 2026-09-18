const dotenv = require("dotenv");
dotenv.config({ path: require("node:path").join(__dirname, ".env") });
for (const key of ["DB_HOST", "DATABASE", "DB_USER", "AUTH_SECRET"]) {
  if (!process.env[key]?.trim()) throw new Error(`Falta la variable de entorno ${key}`);
}
if (process.env.DB_PASSWORD === undefined) throw new Error("Falta la variable de entorno DB_PASSWORD");
const { closePool } = require("./db");
const { log, logUnexpectedError } = require("./utils/logger");
const app = require("./app");
const PORT = Number(process.env.PORT || 3000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error("PORT debe estar entre 1 y 65535");
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  log("info", "server_started", {
    host: HOST, port: PORT, environment: process.env.NODE_ENV || "development",
  });
});

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => {
    log("error", "server_shutdown_timeout", { timeoutMs: 15_000 });
    server.closeAllConnections();
    process.exit(1);
  }, 15_000);
  deadline.unref();
  // Stop accepting requests; let active transactions finish before closing MySQL.
  server.close(async (error) => {
    try {
      await closePool();
      if (error) throw error;
      log("info", "server_stopped");
    } catch (closeError) {
      logUnexpectedError(null, "server_shutdown_failed", closeError);
      process.exitCode = 1;
    } finally {
      clearTimeout(deadline);
    }
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
