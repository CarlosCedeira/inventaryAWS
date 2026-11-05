# Brétema: especificación funcional de Ventas

## 1. Propósito, alcance y estado

Ventas registra operaciones comerciales por cliente y líneas de producto,
reserva el stock mediante salidas trazables y permite finalizar, anular y
devolver esas operaciones. Esta especificación describe el comportamiento que
está implementado en el backend y en la interfaz actual; no sustituye las
decisiones de producto pendientes.

Incluye clientes comerciales, ventas, consumo de lotes, importes, estados,
devoluciones, exportación CSV y métricas. No incluye facturas, cobros,
contabilidad, pasarelas de pago, presupuestos, reservas de stock, descuentos
comerciales configurables ni idempotencia de creación.

## 2. Roles y alcance de datos

Toda ruta requiere sesión válida, y el `tenant_id` efectivo procede de la
sesión, no del cuerpo HTTP. Los valores de rol reales son `owner`, `admin`,
`almacen` y `vendedor`.

| Acción | owner | admin | almacen | vendedor |
| --- | --- | --- | --- | --- |
| Crear, listar y consultar ventas | Sí | Sí | No | Solo las propias |
| Completar, anular y devolver ventas | Sí | Sí | No | Solo las propias |
| Crear, listar y editar clientes | Sí | Sí | No | Solo los propios |
| Consultar filtros de ventas | Sí | Sí | No | Solo su usuario |
| Resumen y exportación CSV | Sí | Sí | No | No |

Una venta se vincula al creador en `ventas.usuario_id`; un vendedor solo puede
consultar u operar las ventas cuyo creador es él. Los clientes nuevos también
se guardan con su creador. Los clientes heredados con `usuario_id = NULL` no
son visibles para un vendedor porque el filtro exige coincidencia de usuario;
esta política necesita ratificación de producto.

## 3. Estados y transiciones

La creación inserta `borrador` dentro de una transacción, pero ese estado es
transitorio y no se devuelve ni queda confirmado: la misma transacción termina
en `pendiente_pago` y descuenta el stock.

| Estado persistente | Transición permitida | Resultado |
| --- | --- | --- |
| `pendiente_pago` | Completar | `completa`; no cambia stock. |
| `pendiente_pago` o `completa` | Anular | `anulada`; repone todas las salidas de la venta. |
| `pendiente_pago`, `completa` o `parcialmente_devuelta` | Devolver cantidades válidas | `parcialmente_devuelta` o `devuelta`; repone los lotes elegidos. |
| `anulada` o `devuelta` | Completar, anular o devolver | Se rechaza con `409`. |

Una anulación no está permitida tras ninguna devolución, incluida una parcial.
Una venta pasa a `devuelta` cuando todas sus líneas han devuelto toda la
cantidad; de otro modo queda `parcialmente_devuelta`.

## 4. Flujos implementados

### CU-VEN-01. Crear venta

1. Un usuario comercial selecciona un cliente activo de su alcance y una o más
   líneas con `producto_id` y cantidad entera positiva.
2. El servidor bloquea el cliente, crea la cabecera transitoria y, por cada
   línea, bloquea el producto, toma su precio e IVA actuales y crea un
   snapshot en `lineas_venta`.
3. Cada línea consume lotes vendibles por FEFO, crea salidas de inventario y
   actualiza la cabecera a `pendiente_pago` con sus totales.
4. Todo ocurre en una única transacción: un producto inexistente, IVA inactivo
   o stock insuficiente revierte cabecera, líneas, movimientos y cantidades.

El frontend muestra solo clientes activos y productos con stock disponible,
pero el backend vuelve a validar todo. El cuerpo HTTP puede repetir un mismo
`producto_id` en varias líneas; la interfaz lo evita, pero la API no lo
rechaza expresamente.

### CU-VEN-02. Completar para exportación

El usuario autorizado cambia una venta `pendiente_pago` a `completa`. Esta
transición no vuelve a descontar stock: el descuento ya ocurrió al crearla.
Solo las ventas cuyo estado aún es `completa` aparecen en el CSV.

### CU-VEN-03. Anular

Una anulación exige un motivo de 1 a 255 caracteres. El sistema bloquea la
venta y sus salidas, repone exactamente los lotes originales, crea movimientos
de entrada con motivo `Venta cancelada`, cancela las salidas que seguían
`pendiente_picking`, marca líneas `cancelada` y la venta `anulada`. Una segunda
anulación responde `409` y no repone el stock otra vez.

Si ya no existe el lote original, se rechaza la operación en vez de inventar
un lote nuevo; la transacción se revierte completa.

### CU-VEN-04. Devolver parcial o totalmente

La devolución identifica movimientos de salida concretos y cantidades enteras
positivas. Para cada movimiento, el servidor calcula lo devuelto previamente,
rechaza un exceso, registra `devoluciones` y `lineas_devolucion`, y repone el
lote original con un movimiento de entrada. Una devolución completa de una
salida pendiente cancela su tarea de picking. Los snapshots históricos de
precio e IVA sirven para calcular el importe devuelto y los importes netos.

### CU-VEN-05. Consultar, filtrar, resumir y exportar

La lista admite búsqueda, periodo, fechas, cliente, producto, categoría, IVA,
usuario, total mínimo, estado y límite. Detalle y lista incluyen importes
devueltos y netos. En el resumen, el acumulado mensual, ticket medio y producto
destacado descuentan devoluciones confirmadas; las métricas «hoy» y «ventas de
alto importe» suman el total bruto de ventas parcialmente devueltas. Esta
inconsistencia está pendiente de corregir o de ratificar como política.

La exportación requiere fecha inicial y final, genera CSV con BOM y separador
`;`, escapa comillas y usa snapshots históricos. **Limitación observada:** su
consulta filtra `v.estado = 'completa'`; una venta devuelta pasa a otro estado
y no aparece, aunque las columnas calculan importes netos. No existe una
prueba que ratifique que esta exclusión sea el resultado de producto deseado.

## 5. Reglas de negocio

| ID | Regla implementada |
| --- | --- |
| RN-VEN-01 | Una venta exige un cliente activo del tenant y alcance del usuario, y al menos una línea válida. |
| RN-VEN-02 | Productos, clientes, inventario, ventas, devoluciones y movimientos se consultan con el tenant efectivo. Un recurso ajeno se trata como no encontrado. |
| RN-VEN-03 | La cantidad de cada línea es un entero positivo. No hay unidades fraccionarias. |
| RN-VEN-04 | El precio unitario y el IVA se obtienen del producto y del impuesto activos al crear la venta y quedan guardados en la línea. |
| RN-VEN-05 | Los cálculos monetarios convierten primero el precio a céntimos, redondean el IVA por línea y guardan subtotal, impuesto y total con dos decimales. No hay descuento de venta implementado: `descuento_total` queda a cero. |
| RN-VEN-06 | Se consumen solo lotes con cantidad positiva y sin caducar; se ordenan por fecha de caducidad ascendente, sin fecha al final e ID como desempate (FEFO). |
| RN-VEN-07 | La creación, anulación y devolución son atómicas; los bloqueos `FOR UPDATE` protegen la selección de cliente, producto, lotes, venta y salidas afectadas. |
| RN-VEN-08 | La anulación solo puede hacerse una vez y no se permite tras devoluciones. Repone los lotes originales, no lotes sustitutos. |
| RN-VEN-09 | La suma de devoluciones confirmadas de un movimiento no puede superar su cantidad de salida. |
| RN-VEN-10 | Repetir `POST /ventas` no es idempotente. Una referencia no nula es única por tenant y un duplicado devuelve `409`; sin referencia —o con otra— puede crear una venta adicional. |
| RN-VEN-11 | Una venta no equivale a factura ni a cobro. `completa` es el estado que habilita su exportación CSV en la implementación actual. |

## 6. Contrato HTTP implementado

Errores controlados usan `{ "error": "mensaje" }`. Las validaciones devuelven
`400`, un recurso no visible o inexistente `404`, y conflictos de estado,
stock, referencia o cantidades `409`. Fallos no controlados devuelven `500`.

| Método y ruta | Uso | Roles |
| --- | --- | --- |
| `GET /ventas` | Lista y filtra ventas. | owner, admin, vendedor con alcance propio |
| `GET /ventas/filtros` | Usuarios disponibles para filtros. | owner, admin, vendedor con alcance propio |
| `GET /ventas/:id` | Cabecera, líneas, salidas y devoluciones. | owner, admin, vendedor con alcance propio |
| `POST /ventas` | Crea la venta y consume stock. | owner, admin, vendedor |
| `POST /ventas/:id/completar` | `pendiente_pago` → `completa`. | owner, admin, vendedor con alcance propio |
| `POST /ventas/:id/anular` | Anula y repone stock. | owner, admin, vendedor con alcance propio |
| `POST /ventas/:id/devolver` | Registra devolución y repone lotes. | owner, admin, vendedor con alcance propio |
| `GET /ventas/resumen` | Métricas comerciales. | owner, admin |
| `GET /ventas/exportar` | Descarga CSV de ventas completas. | owner, admin |

`POST /ventas` recibe `cliente_id`, `lineas` y opcionalmente `referencia`,
`moneda` (tres letras; predeterminada `EUR`) y `observaciones`. Cada línea usa
`producto_id` y `cantidad`. La devolución recibe `motivo` y líneas de
`movimiento_id` y `cantidad`; no acepta repetir el mismo movimiento dentro de
la misma petición.

## 7. Criterios de aceptación

| ID | Criterio verificable |
| --- | --- |
| CA-VEN-01 | Crear una venta válida deja una cabecera `pendiente_pago`, líneas, salidas por lote y stock descontado. |
| CA-VEN-02 | Un fallo en una línea de una venta multilínea no deja cabecera, línea, salida ni stock parcial. |
| CA-VEN-03 | Dos ventas simultáneas de la última unidad producen una única venta y nunca stock negativo. |
| CA-VEN-04 | No se pueden usar clientes, productos, lotes ni ventas de otro tenant o fuera del alcance de un vendedor. |
| CA-VEN-05 | La selección de lotes aplica FEFO y excluye caducados. |
| CA-VEN-06 | Completar no cambia el stock; una segunda finalización se rechaza. |
| CA-VEN-07 | Anular una venta repone una vez sus lotes originales y una repetición se rechaza. |
| CA-VEN-08 | Devoluciones parciales y completas recalculan estados e importes netos, y nunca superan la cantidad vendida. |
| CA-VEN-09 | Un CSV respeta fechas, escapes y la política de estados acordada. **Pendiente:** ratificar y probar esa política para devoluciones. |

## 8. Trazabilidad con pruebas reales

| Regla | Prueba existente | Cobertura o límite |
| --- | --- | --- |
| Transacción de venta multilínea | `inventorySafety.integration.test.ts`: «una venta multilínea insuficiente…» | Comprueba rollback de cabecera, líneas, movimientos y stock. |
| Concurrencia y stock no negativo | `inventorySafety.integration.test.ts`: «dos ventas HTTP simultáneas…» | Comprueba una última unidad y dos peticiones; no cubre otras cargas. |
| Aislamiento cliente/producto por tenant | `inventorySafety.integration.test.ts`: «una venta no acepta cliente ni producto…» | Comprueba que ambos tenants quedan sin cambios. No cubre lotes con ID ajeno enviado directamente porque la API no recibe lote al crear. |
| FEFO y snapshots de IVA | `sales.integration.test.ts`: «confirmar venta crea cabecera…» | Comprueba dos lotes por caducidad, dos salidas, importes y detalle. |
| Anulación única y reposición | `sales.integration.test.ts`: «confirmar venta crea…» | Comprueba reposición, logística y segunda anulación `409`. |
| Devoluciones acumuladas | `sales.integration.test.ts`: «una venta admite devoluciones…» | Comprueba parcial, exceso acumulado `409`, devolución total y stock restaurado. |
| Rollback de anulación/devolución | `inventorySafety.integration.test.ts` | Un trigger que falla al insertar movimiento deja el snapshot intacto. |
| Lote original inexistente | `sales.integration.test.ts`: «anulaciones y devoluciones no reconstruyen…» | Rechaza y mantiene el estado previo. |
| CSV y métricas con devoluciones/estados | Ninguna prueba dedicada | Detalle/lista y parte del resumen calculan netos; falta prueba de CSV. «Hoy» y alto importe usan bruto para ventas parcialmente devueltas. |
| Idempotencia de creación | Ninguna prueba; no hay clave de idempotencia | La unicidad de referencia evita solo duplicados con la misma referencia no nula. |

## 9. Archivos principales

- Backend: `back/modules/sales/`, `back/modules/clients/` y
  `back/modules/movements/movements.model.ts`.
- Esquema: `back/migrations/003_add_sale_tax_snapshots.sql`,
  `004_add_sales_returns.sql`, `005_add_pending_payment_sale_status.sql` y
  `008_scope_clients_by_creator.sql`.
- Interfaz: `front/src/components/sales/`,
  `front/src/components/clients/` y `front/src/utils/permissions.js`.
- Pruebas: `back/tests/sales.integration.test.ts` y
  `back/tests/inventorySafety.integration.test.ts`.

## 10. Pendiente de decisión

1. Confirmar si el CSV debe excluir por completo ventas con devoluciones o
   exportarlas con importes netos; el código hace ambas cosas de forma
   inconsistente (calcula netos, pero filtra solo `completa`).
2. Corregir o ratificar que las métricas «hoy» y «ventas de alto importe» usen
   el total bruto de ventas parcialmente devueltas mientras otras métricas usan
   el importe neto. Es una inconsistencia de cálculo observable.
3. Definir el tratamiento de clientes históricos sin `usuario_id` para los
   vendedores.
4. Definir descuentos comerciales, si se requieren; el esquema tiene campos,
   pero el flujo actual no los recibe ni calcula.
5. Definir idempotencia de creación para reintentos de red. Una referencia no
   sustituye una clave de idempotencia opcional o generada por cliente.

