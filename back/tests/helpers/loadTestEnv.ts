import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env.test") });

if (process.env.DATABASE !== "inventario_test") {
  throw new Error("Las pruebas de integración solo pueden usar DATABASE=inventario_test");
}

for (const key of ["DB_HOST", "DB_USER", "DB_PASSWORD", "AUTH_SECRET"]) {
  if (!process.env[key] || process.env[key] === "tu_password" || process.env[key] === "usuario_de_tests") {
    throw new Error(`Configura ${key} en back/.env.test antes de ejecutar las pruebas`);
  }
}
