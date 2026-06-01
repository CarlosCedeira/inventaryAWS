# Inventory AWS

Aplicacion web de inventario con frontend React/Vite, backend Node.js/Express y base de datos MySQL. El sistema gestiona productos, categorias, autenticacion por usuario/tenant y movimientos de stock con trazabilidad por lote.

## Estado actual

El repositorio contiene una aplicacion full-stack en desarrollo:

- `front/`: interfaz React con Vite, Bootstrap y React Router.
- `back/`: API Express modular con MySQL, JWT, bcrypt, helmet y rate limiting.
- `documentation/`: recursos de base de datos y documentacion auxiliar.
- `arquitectura_flujos_invariantes_testing_md.md`: flujos funcionales, invariantes y pruebas manuales del nucleo de inventario.

El README anterior describia principalmente una arquitectura Lambda/API Gateway. El codigo actual usa un servidor Express local en `back/server.js`, aunque el frontend puede apuntar a una URL remota mediante `VITE_API_URL`.

## Tecnologias

### Frontend

- React 19
- Vite
- React Router
- Bootstrap
- Vitest y Testing Library

### Backend

- Node.js
- Express 5
- MySQL con `mysql2/promise`
- JWT para autenticacion
- bcrypt para password hashing
- helmet para cabeceras de seguridad
- express-rate-limit para limitar intentos de login

### Base de datos

- MySQL
- Preparado para modelo multi-tenant mediante `tenant_id`
- Tablas principales esperadas: usuarios, productos, categorias, inventario y movimientos de inventario

## Estructura principal

```text
.
|-- back/
|   |-- db.js
|   |-- server.js
|   |-- middleware/
|   |   `-- rateLimit.js
|   `-- modules/
|       |-- auth/
|       |-- inventory/
|       |-- movements/
|       `-- quickSales/
|-- front/
|   `-- src/
|       |-- components/
|       |   |-- dashboard/
|       |   |-- movements/
|       |   |-- nav/
|       |   |-- products/
|       |   `-- spiners/
|       |-- services/
|       `-- utils/
|-- documentation/
|-- ToDo.md
`-- arquitectura_flujos_invariantes_testing_md.md
```

## Funcionalidades

### Autenticacion

- Login mediante `/auth/login`.
- Passwords validadas con bcrypt.
- Sesion guardada en `localStorage` bajo `inventory_session`.
- Token JWT enviado como `Authorization: Bearer <token>`.
- Las rutas privadas del backend rellenan `req.user` y `req.tenantId` desde el token.
- Rate limit aplicado a rutas bajo `/auth`.

### Productos e inventario

- Listado de productos.
- Busqueda de productos.
- Consulta por categoria.
- Creacion y actualizacion de productos.
- Borrado logico mediante marca `eliminado`.
- Stock calculado desde lotes de inventario.
- Categorias asociadas a tenant.

### Movimientos de stock

- Historial de movimientos.
- Creacion de movimientos tipo:
  - `entrada`
  - `salida`
  - `ajuste`
- Trazabilidad por producto, lote, usuario, stock anterior y stock nuevo.
- Las operaciones criticas usan transacciones.
- Las salidas y ajustes requieren lote de inventario seleccionado.
- La salida sin lote en la logica interna puede aplicar FIFO, usado por venta rapida.

### Venta rapida

- Endpoint `/ventas/:productId`.
- Descuenta stock aplicando FIFO.
- Registra movimientos de salida.

### Frontend

- Login protegido.
- Navegacion lateral con usuario y cierre de sesion.
- Vista de productos.
- Vista de movimientos con metricas, tabla responsive y detalle en modal/card.
- Servicios HTTP centralizados con `fetchWithAuth`.

## API actual

### Publica

```text
POST /auth/login
```

### Protegidas

Todas requieren `Authorization: Bearer <token>`.

```text
GET    /productos
GET    /productos/categorias
POST   /productos/categorias
GET    /productos/categoria/:categoryId
GET    /productos/buscar/:name
GET    /productos/:id
PUT    /productos/actualizar/:id
POST   /productos/newProduct
PATCH  /productos/eliminar/:id

GET    /movimientos
POST   /movimientos

PUT    /ventas/:productId
```

## Configuracion

### Backend

Crear `back/.env` o `back/.env.development` con las variables necesarias:

```env
PORT=3000
HOST=0.0.0.0
DB_HOST=localhost
DATABASE=inventory
DB_USER=root
DB_PASSWORD=password
JWT_SECRET=change-me
```

La conexion MySQL se configura en `back/db.js`.

### Frontend

Crear o ajustar `front/.env`:

```env
VITE_API_URL=http://localhost:3000
```

Actualmente el repositorio puede tener `VITE_API_URL` apuntando a una URL remota de AWS/API Gateway. Para desarrollo local debe apuntar al backend Express local.

## Desarrollo local

Instalar dependencias:

```bash
cd back
npm install

cd ../front
npm install
```

Levantar backend:

```bash
cd back
node server.js
```

Levantar frontend:

```bash
cd front
npm run dev
```

Por defecto:

- Backend: `http://localhost:3000`
- Frontend Vite: URL indicada por Vite, normalmente `http://localhost:5173`

## Scripts

### Backend

```bash
npm test
```

Actualmente el backend no tiene tests implementados y el script devuelve error por defecto.

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:watch
npm run preview
```

## Seguridad

Estado actual:

- JWT para rutas privadas.
- `tenant_id` se extrae del token y se usa como limite de datos.
- Rate limiting en login.
- Helmet activado en Express.
- Passwords con bcrypt.

Pendiente o a revisar:

- Restringir CORS. Actualmente `server.js` permite `origin: "*"` para desarrollo.
- Completar sanitizacion/validacion en todos los endpoints.
- Confirmar que todos los accesos a datos filtran siempre por `tenant_id`.
- Revisar secretos y archivos `.env` antes de despliegue.

## Testing

Hay documentacion de pruebas manuales en `arquitectura_flujos_invariantes_testing_md.md`.

Estado actual:

- Frontend preparado con Vitest.
- Backend sin suite de tests.
- `ToDo.md` contiene tareas pendientes de tests para productos.

Pruebas prioritarias recomendadas:

- Login valido e invalido.
- Token ausente, invalido y expirado.
- Crear producto con stock inicial.
- Crear entrada sobre lote existente y lote nuevo.
- Crear salida con lote seleccionado.
- Rechazar salida con stock insuficiente.
- Crear ajuste de lote.
- Venta rapida FIFO.
- Aislamiento por tenant.

## Pendientes principales

Ver `ToDo.md` para la lista completa. Los puntos mas relevantes son:

- Completar filtros avanzados de productos.
- Normalizar formato de fechas en entrada y salida.
- Completar selects de variante/valor.
- Consolidar sanitizacion backend/frontend.
- Completar filtrado por `tenant_id`.
- Ampliar modelo de producto con campos como marca, peso o medida.
- Implementar tests unitarios y de integracion.
- Actualizar documentacion de base de datos si cambia el esquema.

## Notas de despliegue

El proyecto conserva referencias a AWS en documentacion y configuracion. Si se despliega en AWS, hay dos caminos posibles:

- Mantener backend Express en un runtime compatible, por ejemplo EC2, ECS, Elastic Beanstalk o Lambda con adaptador.
- Separar una version Lambda/API Gateway si se quiere volver a la arquitectura serverless descrita originalmente.

Antes de desplegar:

- Definir origen CORS permitido.
- Configurar variables de entorno seguras.
- Confirmar conectividad con RDS/MySQL.
- Revisar indices y restricciones de tenant/lote en base de datos.
- Ejecutar build del frontend.
