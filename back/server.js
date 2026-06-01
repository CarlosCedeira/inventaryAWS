const express = require("express");
const helmet = require("helmet");
const dotenv = require("dotenv");
const { loginLimiter } = require("./middleware/rateLimit");
const cors = require("cors");
dotenv.config();

const app = express();
app.use(helmet());
const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.use(
  cors({
    origin: "*", // permitir todo (solo en desarrollo)
  })
);

// Middleware
app.use(express.json());

// Rutas
app.use("/auth", loginLimiter, require("./modules/auth/auth.routes"));
app.use("/productos", require("./modules/inventory/inventory.routes"));
app.use("/movimientos", require("./modules/movements/movements.routes"));
app.use("/ventas", require("./modules/quickSales/quickSales.routes"));


app.listen(3000, "0.0.0.0", () => {
  console.log("API escuchando en todas las interfaces");
});

/*app.listen(PORT, () => {
  console.log(`Servidor corriendo en  http://localhost:${PORT}`);
});*/
