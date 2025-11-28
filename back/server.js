const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
dotenv.config();

const app = express();
const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.use(
  cors({
    origin: "*", // permitir todo (solo en desarrollo)
  })
);

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use("/productos", require("./routes/productos"));
app.use("/clientes", require("./routes/clientes"));
app.use("/ventas", require("./routes/ventas"));

app.listen(3000, "0.0.0.0", () => {
  console.log("API escuchando en todas las interfaces");
});

/*app.listen(PORT, () => {
  console.log(`Servidor corriendo en  http://localhost:${PORT}`);
});*/
