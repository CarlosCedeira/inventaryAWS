📦 Estructura del Backend por Módulos

El backend del proyecto está organizado siguiendo una arquitectura modular basada en funcionalidades (por ejemplo: inventory, sales, customers).
Cada módulo contiene todos los archivos necesarios para gestionar su lógica de forma independiente.

🧱 Estructura de un módulo

Cada módulo incluye los siguientes archivos:

*.routes.js
*.controller.js
*.service.js
*.model.js
🔹 routes

Define las rutas de la API (endpoints).
Su función es mapear una URL a una función del controller.

Ejemplo:

router.get('/', getProducts);
router.post('/', createProduct);

No contiene lógica de negocio.

🔹 controller

Gestiona la entrada y salida de las peticiones HTTP.

Se encarga de:

Leer datos de la request (req)
Llamar al service
Devolver la respuesta (res)
Manejar errores

Ejemplo:

export const getProducts = async (req, res) => {
  const products = await inventoryService.getAllProducts();
  res.json(products);
};
🔹 service

Contiene la lógica de negocio de la aplicación.

Se encarga de:

Validaciones
Reglas de negocio
Procesamiento de datos
Llamar al model

Ejemplo:

export const createProduct = async (data) => {
  if (!data.name) throw new Error('Nombre requerido');
  return await inventoryModel.create(data);
};
🔹 model

Gestiona el acceso a la base de datos.

Se encarga de:

Ejecutar queries SQL
Devolver datos desde la base de datos

Ejemplo:

export const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM productos');
  return rows;
};
🔄 Flujo de una petición

El flujo de datos sigue este orden:

Cliente → Routes → Controller → Service → Model → Base de datos
y de vuelta:

Base de datos → Model → Service → Controller → Cliente

📌 Resumen
routes → define endpoints
controller → gestiona request/response
service → lógica de negocio
model → acceso a base de datos

Esta separación permite un código más escalable, mantenible y fácil de ampliar en el futuro.