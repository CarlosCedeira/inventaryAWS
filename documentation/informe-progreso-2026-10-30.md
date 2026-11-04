# Informe de progreso de Brétema — 30 de octubre de 2026

> **Registro histórico.** Describe el árbol revisado en esa fecha. No es la
> fuente de verdad del estado actual: la autorización dinámica de sesiones se
> implementó posteriormente. Consulta `AGENTS.md`,
> `documentation/session-authorization.md` y el código antes de planificar.

> **Base de evidencia:** rama `main` de GitHub, revisada el 4 de noviembre de
> 2026. Este informe no atribuye al repositorio publicado cambios que solo
> existan en un entorno local.

**No hubo cambios nuevos en GitHub durante la semana.** `main` continúa en
[`0767c245`](https://github.com/CarlosCedeira/inventaryAWS/commit/0767c245ecda7e6dbb5444d21a49f4804872558f), el mismo commit de referencia.

- Intervalo revisado: **23–30 de octubre de 2026**
- Rama: `main`
- Commits nuevos: **0**
- GitHub Actions: **sin ejecuciones registradas en la rama predeterminada**
- Estados de CI asociados: **ninguno**
- Último cambio verificable: **13 de octubre de 2026**

## Estado de la v1

| Módulo | Implementado en `main` | Pendiente de validar |
| --- | --- | --- |
| Inventario | Productos, categorías, lotes, stock, baja lógica y control de acceso por rol. | Concurrencia sobre el mismo producto y aislamiento exhaustivo entre tenants. |
| Movimientos | Entradas, salidas, ajustes, picking, auditoría, transacciones y bloqueos `FOR UPDATE`. | Rollback ante fallos intermedios y ausencia de movimientos duplicados. |
| Clientes | CRUD, filtro por `tenant_id` y alcance del vendedor mediante `usuario_id`. | Dos vendedores del mismo tenant y asignación de clientes antiguos cuyo creador sea `NULL`. |
| Ventas | Creación por líneas, consumo FEFO, finalización, anulación, devoluciones, métricas y CSV. | Venta simultánea, rollback multilínea y operaciones concurrentes de devolución o anulación. |
| Permisos | Roles `owner`, `admin`, `almacen` y `vendedor`, aplicados en backend y frontend. | Revocación de sesiones abiertas y licencia de módulos por tenant. |

El algoritmo vigente es **FEFO**: consume primero el lote con caducidad más
próxima y excluye existencias caducadas. Las cancelaciones y devoluciones
restauran el lote original dentro de una transacción. La lógica está publicada
en [movimientos](https://github.com/CarlosCedeira/inventaryAWS/blob/0767c245/back/modules/movements/movements.model.ts)
y [ventas](https://github.com/CarlosCedeira/inventaryAWS/blob/0767c245/back/modules/sales/sales.model.ts),
pero no hay una ejecución reciente de CI que demuestre esos recorridos con
éxito.

## Bloqueos para el piloto

Las pruebas críticas de
[`inventorySafety.integration.test.ts`](https://github.com/CarlosCedeira/inventaryAWS/blob/0767c245/back/tests/inventorySafety.integration.test.ts)
siguen utilizando la ruta histórica `PUT /ventas/:productId`. Por ello, los
casos de concurrencia, rollback y venta con IDs de otro tenant no validan el
flujo vigente de `POST /ventas` con cliente y líneas.

El [middleware de autenticación](https://github.com/CarlosCedeira/inventaryAWS/blob/0767c245/back/modules/auth/auth.middleware.ts)
confía en el rol y estado que contiene el JWT. El token publicado se emite con
una caducidad de [ocho horas](https://github.com/CarlosCedeira/inventaryAWS/blob/0767c245/back/modules/auth/auth.tokens.js),
sin consultar en cada petición el estado actual de usuario o tenant. Cambiar el
rol o desactivar una cuenta no invalida inmediatamente su sesión abierta.

No aparece en `main` una migración de módulos contratados por tenant ni un
middleware que autorice Inventario o Comercial según el plan de cada empresa.
Si ese trabajo existe localmente, todavía no es verificable desde GitHub.

La documentación también está desactualizada: el
[README publicado](https://github.com/CarlosCedeira/inventaryAWS/blob/0767c245/README.md)
solo describe `owner` y `admin`; además conserva la ruta histórica de venta y
tareas de backlog que deben revisarse frente a la implementación actual.

La aplicación mantiene capacidad funcional para un **piloto supervisado**, pero
esta semana no aporta evidencia nueva que aumente la confianza técnica. El
riesgo principal continúa en condiciones simultáneas, fallos parciales y
autorización con sesiones abiertas.

## Tres prioridades para la próxima semana

1. **Actualizar y ejecutar las pruebas críticas de ventas.**  
   Impacto: demostrar que el stock y la trazabilidad sobreviven a concurrencia y errores.  
   Terminado cuando pasen con MySQL real dos ventas simultáneas de la última
   unidad, rollback de una venta multilínea y fallo durante una devolución o
   anulación, sin stock negativo ni datos parciales.

2. **Subir y validar los módulos contratados por tenant.**  
   Impacto: aplicar correctamente los planes de 15 € y 39 €.  
   Terminado cuando un tenant con solo Inventario reciba `403` en clientes y
   ventas, incluso usando un token `owner`, con pruebas de integración en
   backend.

3. **Cerrar la autorización dinámica y los alcances comerciales.**  
   Impacto: impedir sesiones con permisos antiguos y accesos entre vendedores.  
   Terminado cuando desactivar una cuenta o cambiar su rol afecte a su sesión
   abierta y un vendedor no pueda listar ni operar clientes o ventas de otro
   vendedor mediante IDs directos.
