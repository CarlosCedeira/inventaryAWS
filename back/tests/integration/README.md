# Estado de la antigua suite SQL temporal

`back/package.json` conserva `npm run test:integration:sql`, pero este árbol no
contiene `tests/integration/mysql.test.ts`, el archivo que el script intenta
ejecutar. Por tanto, la suite descrita originalmente en este documento no está
disponible ni debe presentarse como comprobación vigente.

Las pruebas MySQL ejecutables actuales usan `back/.env.test` y la base dedicada
`inventario_test`; consulta [`../README.md`](../README.md). Si se restaura una
suite que cree esquemas temporales con `TEST_DB_*`, deberá documentar permisos,
limpieza y aislamiento antes de volver a habilitar ese comando.
