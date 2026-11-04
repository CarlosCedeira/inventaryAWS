# Brétema: guía de entrada para agentes

## Alcance actual

Brétema es una aplicación web multi-tenant de inventario por lotes y área
comercial. El código implementa autenticación, usuarios, catálogo, movimientos,
clientes, ventas, anulaciones y devoluciones. No implementa licencias de módulos
por tenant, facturación, cobros, proveedores ni recuperación de contraseña.

## Mapa del repositorio

- `back/`: API Express y acceso a MySQL.
  - `modules/auth/`: login, cookie de sesión, JWT y autorización.
  - `modules/inventory/`: productos, categorías, impuestos y lotes.
  - `modules/movements/`: entradas, salidas, ajustes y picking.
  - `modules/clients/`, `sales/`, `users/`: comercial y administración.
  - `migrations/`: migraciones manuales y ordenadas; no se ejecutan al iniciar.
  - `tests/`: unitarias e integración HTTP/MySQL.
- `front/`: React/Vite; `services/authService.js` centraliza la sesión HTTP y
  `utils/permissions.js` representa permisos de interfaz.
- `documentation/`: requisitos, especificaciones y registros históricos.

## Lectura recomendada

1. Empieza por `README.md` y `documentation/README.md`.
2. Para una tarea de permisos: `documentation/session-authorization.md`,
   `back/modules/auth/` y `back/modules/*/*.routes.js`.
3. Para inventario o catálogo: `documentation/especificacion-funcional-productos.md`,
   `back/modules/inventory/`, `back/modules/movements/` y sus pruebas.
4. Para ventas: `documentation/ERS_Bretema.md`, `back/modules/sales/` y
   `back/tests/sales.integration.test.ts`.
5. Para datos: migraciones y `back/tests/fixtures/schema.sql`. Los ficheros
   `documentation/Database/*.txt` son referencias históricas, no el esquema
   autoritativo.

## Comandos reales

Desde `back`:

```powershell
npm install
node server.js
npm test
npm run typecheck:tests
npm run test:integration:auth
npm run test:integration:safety
npm run test:integration:sales
```

Desde `front`:

```powershell
npm install
npm run dev
npm run typecheck
npm run test
npm run build
npm run lint
```

Las pruebas HTTP de `back` usan Jest/Supertest y MySQL real. Configura
`back/.env.test` para la base exclusiva `inventario_test`; sus helpers crean,
alteran y limpian tablas y datos. Nunca las ejecutes contra desarrollo o
producción, y no ejecutes suites que comparten esa base en paralelo.
`package.json` aún declara `test:integration:sql`, pero el archivo
`tests/integration/mysql.test.ts` no existe en este árbol; no lo uses como
comprobación hasta restaurar o sustituir esa suite.

## Convenciones y reglas críticas

- El backend mezcla CommonJS JavaScript y TypeScript; sigue las extensiones y
  estilo del módulo que edites. El flujo habitual es rutas → controlador →
  servicio → modelo, aunque algunos módulos pequeños lo compactan.
- Las consultas MySQL usan el pool de `back/db.js`, sentencias parametrizadas y
  siempre liberan la conexión; las operaciones de stock y ventas usan
  transacciones cuando cambian varias entidades.
- `tenant_id` procede de `requireAuth`, no del cuerpo ni de parámetros enviados
  por el cliente. Toda consulta o relación debe acotarse al tenant efectivo.
- La cookie `bretema_session` es HttpOnly. El JWT valida la sesión, pero cada
  petición protegida obtiene usuario, tenant activo y rol actual de MySQL.
  Bearer solo se acepta con `NODE_ENV=test` para integración.
- La autorización se impone en las rutas del servidor; los controles del
  frontend no sustituyen `requireRoles`.
- Todo cambio de stock debe preservar cantidades no negativas, lote y usuario,
  y dejar un movimiento trazable. Las ventas consumen por FEFO; las salidas
  manuales y ajustes operan sobre el lote seleccionado.

## Estado de la documentación

- `README.md`, `documentation/README.md` y las especificaciones funcionales
  describen el estado implementado, pero prevalece el código si difieren.
- `ToDo.md` y las secciones de decisiones pendientes son trabajo no aprobado o
  pendiente, no funcionalidades existentes.
- Los informes `documentation/informe-progreso-*.md` son registros de su fecha:
  no describen necesariamente el estado actual.

Al cambiar API, permisos, migraciones o reglas de negocio, actualiza el README
raíz, el índice de `documentation/`, la especificación afectada, la guía de
pruebas y este archivo si cambian rutas, comandos o invariantes.
