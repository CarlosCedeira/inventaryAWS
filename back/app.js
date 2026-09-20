const express = require("express");
require("tsx/cjs/api").register();
const helmet = require("helmet");
const cors = require("cors");
const { loginLimiter } = require("./middleware/rateLimit");
const { requestContext } = require("./middleware/requestContext");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors({ origin: "*" }));
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
app.use("/ventas", require("./modules/quickSales/quickSales.routes"));
app.use(errorHandler);

module.exports = app;
