const express = require("express");
require("tsx/cjs/api").register();
const helmet = require("helmet");
const cors = require("cors");
const { loginLimiter } = require("./middleware/rateLimit");
const { requestContext } = require("./middleware/requestContext");
const { errorHandler } = require("./middleware/errorHandler");
const { COOKIE_NAME } = require("./modules/auth/auth.cookies");

const app = express();

app.use(helmet());
const corsOriginConfig = process.env.CORS_ORIGIN || (process.env.NODE_ENV === "production" ? "" : "http://localhost:5173,http://127.0.0.1:5173,http://192.168.0.15:5173");
if (!corsOriginConfig) throw new Error("Falta CORS_ORIGIN en producción");
const allowedOrigins = corsOriginConfig
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origen no permitido por CORS"));
  },
  credentials: true,
}));
app.use((req, res, next) => {
  const usesSessionCookie = (req.headers.cookie || "").includes(`${COOKIE_NAME}=`);
  const isStateChangingMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);

  // Con cookie de sesión, los cambios deben venir del frontend autorizado.
  // Las pruebas y la compatibilidad temporal con Authorization no usan cookie.
  if (usesSessionCookie && isStateChangingMethod && process.env.NODE_ENV === "production") {
    const origin = req.headers.origin;
    if (!origin || !allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: "Origen no permitido" });
    }
  }
  next();
});
app.use(express.json());
app.use(requestContext);

const authRoutes = require("./modules/auth/auth.routes");
if (process.env.NODE_ENV === "test") {
  app.use("/auth", authRoutes);
} else {
  app.use("/auth", loginLimiter, authRoutes);
}
app.use("/productos", require("./modules/inventory/inventory.routes"));
app.use("/movimientos", require("./modules/movements/movements.routes"));
app.use("/ventas", require("./modules/sales/sales.routes"));
app.use("/clientes", require("./modules/clients/clients.routes"));
app.use("/usuarios", require("./modules/users/users.routes"));
app.use(errorHandler);

module.exports = app;
