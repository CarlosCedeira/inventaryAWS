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

### Logs

El backend emite logs JSON con eventos de servidor, peticiones HTTP, autenticación,
productos, movimientos y ventas. Cada petición incluye el encabezado `X-Request-Id`
para relacionar su respuesta con los logs del servidor.

- En desarrollo, el nivel predeterminado es `debug`.
- En producción, el nivel predeterminado es `info`.
- En pruebas, los logs se silencian.
- Define `LOG_LEVEL=debug|info|warn|error|silent` para cambiar el nivel.
- Define `LOG_STACKS=false` si no quieres incluir trazas de pila en los errores del log.

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
|       |-- clients/
|       |-- sales/
|       `-- users/
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

## Documentación

La documentación se organiza por alcance: este README ofrece una visión general;
`documentation/` reúne los documentos transversales; y cada módulo puede incluir
un README propio para las instrucciones que solo le afectan.

| Documento | Contenido |
| --- | --- |
| [Guía para agentes](AGENTS.md) | Entrada rápida: estructura, comandos, reglas críticas y qué documentación consultar. |
| [Índice técnico](documentation/README.md) | Visión técnica del sistema, módulos, autenticación y modelo multi-tenant. |
| [Autorización de sesión](documentation/session-authorization.md) | Comprobación actual de cuenta, tenant y rol en cada petición protegida. |
| [ERS Brétema](documentation/ERS_Bretema.md) | Especificación de requisitos del sistema. |
| [Especificación funcional de productos](documentation/especificacion-funcional-productos.md) | Alcance, flujos, reglas, interfaz, permisos, API y aceptación del catálogo de productos. |
| [Especificación funcional de ventas](documentation/especificacion-funcional-ventas.md) | Flujos comerciales, estados, lotes, devoluciones, API, cobertura y límites del módulo de ventas. |
| [Registro de decisiones](documentation/decisions/README.md) | Decisiones respaldadas por código o requisitos y cuestiones pendientes de ratificar. |
| [Informe de progreso — 30 de octubre de 2026](documentation/informe-progreso-2026-10-30.md) | Estado verificable de la rama `main`, riesgos de piloto y prioridades. |
| [Informe local — 4 de noviembre de 2026](documentation/informe-progreso-local-2026-11-04.md) | Avances sin publicar, validación disponible y bloqueos de la v1. |
| [Arquitectura del servidor](documentation/server/Arquitecture.md) | Diseño y estructura del backend. |
| [Modelo de relaciones](documentation/Database/diagrama_relaciones.md) | Diagrama y relaciones de la base de datos. |
| [Descripción de base de datos](documentation/Database/describedatabase.txt) | Detalle de tablas y campos. |
| [Consultas de base de datos](documentation/Database/QueryForDatabase.txt) | Consultas SQL de apoyo. |
| [Flujos, invariantes y pruebas manuales](arquitectura_flujos_invariantes_testing_md.md) | Comportamientos críticos del inventario y sus validaciones. |
| [Guía de pruebas](back/tests/README.md) | Preparación y ejecución de pruebas del backend. |
| [Pruebas de integración con MySQL](back/tests/integration/README.md) | Requisitos específicos para las pruebas con MySQL real. |
| [Tareas pendientes](ToDo.md) | Trabajo planificado y mejoras abiertas. |

## Funcionalidades

### Autenticacion

- Login mediante `/auth/login`.
- Passwords validadas con bcrypt.
- La sesión se conserva en la cookie `HttpOnly` `bretema_session`; el navegador no puede leer el JWT.
- Las rutas privadas recuperan el token desde esa cookie y rellenan `req.user` y `req.tenantId`.
- El frontend mantiene el usuario y sus permisos en `SessionContext`; no persiste la sesión ni el rol en `localStorage`.
- Los roles son `owner` (dueño), `admin` (administración), `almacen` y `vendedor`.
- `owner` administra usuarios; `owner` y `admin` gestionan catálogo; `almacen` opera inventario y `vendedor` opera el área comercial dentro de su alcance.
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
- Las ventas consumen lotes por FEFO; una salida manual requiere seleccionar el lote.

### Clientes y ventas

- Clientes por empresa, con el alcance del usuario vendedor.
- Ventas por cliente y líneas mediante `POST /ventas`.
- El consumo de lotes usa FEFO: primero la caducidad más próxima y nunca stock caducado.
- Las anulaciones y devoluciones restauran el lote original dentro de una transacción.

### Ciclo de ventas

Brétema no gestiona cobros ni facturas. Una venta se crea como `pendiente_pago`
(pendiente de finalizar) y descuenta el stock inmediatamente. El usuario debe
marcarla como `completa` únicamente cuando la operación esté cerrada y lista
para exportarse al programa externo de facturación. Solo las ventas completas
se incluyen en el CSV de exportación. Las anulaciones restauran el stock y las
devoluciones ajustan los importes netos y el inventario.

Antes de poner una actualización en producción, validar al menos:

1. Cliente activo → venta → completar → exportar CSV.
2. Devolución parcial → importes netos y stock restaurado.
3. Anulación → stock restaurado y venta excluida del CSV.
4. Métricas mensuales netas tras una devolución.

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

La sesión autenticada expone además:

```text
GET  /auth/me
POST /auth/logout
```

### Protegidas

Todas requieren la cookie de sesión `bretema_session`. El encabezado
`Authorization: Bearer` se conserva únicamente para las pruebas de integración.

```text
GET    /productos
GET    /productos/categorias
POST   /productos/categorias
GET    /productos/impuestos
GET    /productos/categoria/:categoryId
GET    /productos/buscar/:name
GET    /productos/:id
PUT    /productos/actualizar/:id
POST   /productos/newProduct
PATCH  /productos/eliminar/:id

GET    /movimientos?producto_id=&tipo=&fecha_desde=&fecha_hasta=
POST   /movimientos
PATCH  /movimientos/:movimientoId/finalizar-picking

GET    /clientes
POST   /clientes
PATCH  /clientes/:id

GET    /ventas
GET    /ventas/filtros
GET    /ventas/resumen
GET    /ventas/exportar
GET    /ventas/:id
POST   /ventas
POST   /ventas/:id/completar
POST   /ventas/:id/anular
POST   /ventas/:id/devolver

GET    /usuarios
POST   /usuarios
PATCH  /usuarios/:id
POST   /usuarios/:id/restablecer-password
```

### Rutas de la interfaz

- `/login`: acceso.
- `/inventario`: catálogo, categorías, lotes y movimientos; es la vista inicial
  para `owner`, `admin` y `almacen`.
- `/ventas`: clientes y ventas; es la vista inicial para `vendedor`.
- `/configuracion`: gestión de usuarios de la empresa, solo para `owner`.

Las rutas históricas `/productos`, `/movimientos` y `/clientes` redirigen al
espacio de trabajo correspondiente; no son vistas independientes.

## Configuracion

### Backend

Crear `back/.env` con las variables necesarias (se carga desde el directorio del backend):

```env
PORT=3000
HOST=0.0.0.0
DB_HOST=localhost
DATABASE=inventory
DB_USER=root
DB_PASSWORD=password
AUTH_SECRET=change-me
```

La conexion MySQL se configura en `back/db.js`.

### Migraciones

Las migraciones de `back/migrations/` son manuales, ordenadas y no se ejecutan
al arrancar. Antes de aplicarlas a una base existente, revisa qué versión de
esquema tiene esa base y el contenido de todas las migraciones pendientes
(`001` a `009` en este árbol). No ejecutes `001_normalize_user_roles.sql` de
forma aislada como instrucción general: corresponde a una transición anterior
de roles.

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

El backend usa `node:test` para validadores, inventario, conflictos de edición y ventas. Las pruebas MySQL reales requieren configuración explícita; ver `back/tests/integration/README.md`.

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
- Autorización por roles `owner`, `admin`, `almacen` y `vendedor` según la ruta.
- `tenant_id`, rol y versión de sesión se recuperan del usuario activo en MySQL
  después de validar el token; se usan como límite de datos, autorización e
  invalidación efectiva de sesiones tras restablecer contraseña.
- Rate limiting en login.
- Helmet activado en Express.
- Passwords con bcrypt.

Un restablecimiento de contraseña incrementa la versión de sesión del usuario;
los JWT emitidos antes del cambio quedan invalidados en la siguiente petición.
Una baja de usuario/tenant o un cambio de rol también se aplica en la siguiente
petición protegida.

Pendiente o a revisar:

- Revisar y acordar `CORS_ORIGIN` antes de producción. `app.js` exige ese valor
  en producción y usa una lista local explícita fuera de ella.
- Completar sanitizacion/validacion en todos los endpoints.
- Confirmar que todos los accesos a datos filtran siempre por `tenant_id`.
- Revisar secretos y archivos `.env` antes de despliegue.

## Testing

Hay documentacion de pruebas manuales en `arquitectura_flujos_invariantes_testing_md.md`.

Estado actual:

- Frontend preparado con Vitest.
- Backend con pruebas unitarias y suite de integración MySQL optativa.
- `ToDo.md` contiene tareas pendientes de tests para productos.

Pruebas prioritarias recomendadas:

- Login valido e invalido.
- Token ausente, invalido y expirado.
- Crear producto sin stock inicial y registrar una entrada posterior.
- Crear entrada sobre lote existente y lote nuevo.
- Crear salida con lote seleccionado.
- Rechazar salida con stock insuficiente.
- Crear ajuste de lote.
- Venta por cliente y líneas con consumo FEFO.
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

## Comportamiento del inventario

- La ficha devuelve una `version` por lote. Las actualizaciones deben devolver ese valor; si el lote cambió se responde HTTP 409 y se debe recargar la ficha. No requiere migración de tablas.
- Los ajustes permiten stock final cero; entradas y salidas exigen cantidades positivas.
- La búsqueda y categoría se combinan y se conservan al refrescar. El listado se actualiza al recuperar el foco y cada minuto mientras está visible.
- La tarjeta Stock caducado cuenta productos con existencias vencidas y permite filtrarlos.
- El backend valida sus variables al arrancar, usa PORT/HOST y limita el cierre ordenado a 15 segundos.
