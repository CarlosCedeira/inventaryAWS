# Primer test de integración: login

Las pruebas y sus helpers están escritos en TypeScript. Ejecuta
`npm run typecheck:tests` desde `back` para comprobar sus tipos sin ejecutarlas.
Las unitarias y la suite SQL usan `tsx` con `node:test`; las de HTTP usan
Jest con `ts-jest`. El backend combina JavaScript y TypeScript: movimientos,
el modelo, controlador y validadores de inventario, el modelo de ventas rapidas
y el middleware de autenticacion estan en TypeScript. `typecheck:tests` comprueba
todos los modulos TypeScript, los tipos compartidos y los tests. `app.js` registra
`tsx` para cargar estos modulos desde las rutas y servicios CommonJS existentes.

1. Crea una base MySQL vacía llamada `inventario_test` y un usuario limitado a
   esa base, con permisos para crear tablas, consultar, insertar y borrar datos.
   No uses la base de desarrollo. El esquema requiere MySQL 8.
2. Edita `back/.env.test` y sustituye `DB_USER` y `DB_PASSWORD` por las
   credenciales de ese usuario. Este archivo está ignorado por Git.
3. Desde `back`, ejecuta:

```powershell
npm run test:integration:auth
```

La suite usa Jest y Supertest. Supertest importa `app.js`, por lo que no abre
el puerto HTTP. Antes de la primera prueba crea las seis tablas necesarias con
`CREATE TABLE IF NOT EXISTS`, usando `fixtures/schema.sql`, basado en el esquema
documentado en `documentation/Database/describedatabase.txt`. No modifica tablas
ajenas a las pruebas ni crea la base de datos. La fixture si normaliza la columna
de roles de usuarios existente mediante ALTER TABLE y UPDATE.

Antes de cada prueba borra, en este orden, los movimientos,
inventario, productos, categorías, usuarios y tenants de `inventario_test`.
Después crea únicamente el tenant y el usuario que cada caso necesita.
Al terminar limpia los datos y después cierra el pool, incluso si falla la limpieza.
Las tablas se conservan vacías para la siguiente ejecución.

Los casos iniciales cubren login correcto, contraseña incorrecta, email que no
existe, campos ausentes, usuario inactivo y tenant inactivo. La vista de
productos también comprueba que exige sesión y que solo muestra los productos,
la categoría y los stocks del tenant autenticado. También cubre el ciclo completo
de creación, listado, búsqueda, filtro por categoría, detalle, edición y borrado
lógico, incluido el rechazo de consultas y borrados desde otro tenant.

La suite de movimientos cubre el registro de entradas, salidas y ajustes a cero,
el cálculo de stock resultante, el historial por tenant, el rechazo sin sesión,
el stock insuficiente y la protección frente a movimientos sobre productos de otro
tenant. Los movimientos son inmutables: no existen endpoints para editarlos ni
eliminarlos, porque son la trazabilidad del inventario.

`npm test` mantiene las pruebas unitarias existentes con `node:test`.
`npm run test:integration:sql` conserva la suite SQL temporal anterior; es
independiente de esta base fija de pruebas.

## Pruebas de cierre de inventario v1

```powershell
npm run typecheck:tests
npm run test:integration:safety
```

Las dos suites nuevas usan MySQL real en `inventario_test`, con la misma
configuracion y limpieza descritas arriba. Nunca deben apuntar a una base con
datos que quieras conservar. El usuario de pruebas necesita tambien permisos
UPDATE, ALTER y TRIGGER. No ejecutes dos suites contra esta base a la vez.

- `inventorySafety.integration.test.ts`: rollback de entradas, salidas, ajustes
  y ventas cuando falla el movimiento; dos ventas HTTP de la ultima unidad;
  rechazo de productos y lotes ajenos, incluso enviando otro tenant en el body.
  Comprueba el estado persistido, incluida la ausencia de movimientos duplicados.
- `sessionAuthorization.integration.test.ts`: rechazo por rol, desactivacion de
  usuario o empresa con sesion abierta, y cambios de rol usando el mismo token.
  Usa una ruta exclusiva de prueba para owner con los middleware reales, porque
  las rutas actuales permiten tanto owner como admin.

Los cuatro casos de desactivacion y cambio de rol expresan el comportamiento
requerido para v1 y actualmente fallan: `requireAuth` solo consulta el JWT.
No estan omitidos ni marcados como fallos esperados; la suite seguira roja hasta
que la autenticacion compruebe el usuario y la empresa en SQL en cada peticion.
No se ha cambiado la politica de permisos de la aplicacion al crear estos tests.

Estas suites no verifican copias/restauracion, migraciones ni la interfaz.
