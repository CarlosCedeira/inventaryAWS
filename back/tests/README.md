# Primer test de integración: login

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
que ya existan ni crea la base de datos.

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
