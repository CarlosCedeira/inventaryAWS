// server.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use("/productos", require("./routes/productos"));
app.use("/clientes", require("./routes/clientes"));
app.use("/ventas", require("./routes/ventas"));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
