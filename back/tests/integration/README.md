# Pruebas con MySQL real

`npm test` omite esta suite si no está definida `TEST_DB_HOST`.

Usa una instancia local o dedicada a pruebas. Define en tu terminal
`TEST_DB_HOST`, `TEST_DB_USER` y `TEST_DB_PASSWORD`, y ejecuta desde `back`:

```powershell
npm run test:integration
```

No se carga el `.env` de la aplicación ni se usa su `DATABASE`. La suite crea
un esquema temporal `inventory_test_<identificador aleatorio>` y elimina
exclusivamente ese esquema al terminar. El usuario de pruebas necesita permisos
para crear/eliminar esquemas, tablas y triggers. Si el proceso se interrumpe a la
fuerza, puede quedar el esquema temporal para su limpieza manual.

Se comprueban consultas reales, ventas simultáneas, rollback ante un fallo,
aislamiento de empresas, conflicto de edición, ajuste a cero y liberación del pool.
El esquema es una fixture mínima de las tablas usadas, no una migración de producción.
