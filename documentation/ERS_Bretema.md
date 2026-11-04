# Brétema: Especificación de Requisitos del Software

| Campo | Valor |
| --- | --- |
| Versión del documento | 0.2 |
| Fecha | 4 de noviembre de 2026 |
| Estado | Documento operativo, pendiente de validación de producción |
| Producto | Brétema |
| Entrega principal | Inventario y comercial v1 |
| Evolución prevista | Licencias de módulos por tenant y autorización dinámica |
| Cliente y responsables de aceptación | Por identificar |

## 1. Propósito

Definir qué debe entregar Brétema en su primera versión de inventario, qué queda fuera y cómo se comprobará su aceptación. Servirá como referencia para desarrollo, pruebas y revisión con el cliente.

Este documento se basa en el código y la documentación del repositorio, y en las decisiones tratadas durante el proyecto. Describe requisitos del producto, no certifica que todos estén implementados o verificados. Los plazos, precios, soporte y compromisos de servicio requieren un acuerdo adicional.

## 2. Objetivo y contexto

Brétema será una aplicación web para gestionar productos, categorías y existencias por lotes, registrar entradas, salidas y ajustes, y consultar su trazabilidad. Permitirá trabajar con varias empresas manteniendo sus datos separados.

El motor de inventario es la base del módulo comercial ya disponible. Los cambios de existencias deberán conservar su coherencia aunque haya operaciones simultáneas o se produzcan errores.

### 2.1 Terminología

| Término | Definición |
| --- | --- |
| Empresa / tenant | Organización propietaria de sus usuarios y datos; identificada por `tenant_id`. |
| Usuario | Persona autenticada que opera para una empresa. |
| Cliente comercial | Comprador registrado por una empresa; distinto del usuario y de la empresa. |
| Lote | Registro de existencias de un producto, con cantidad, número de lote y caducidad opcionales. |
| Stock físico | Suma de las cantidades de los lotes de un producto, incluidos los caducados. |
| Stock disponible | Suma de cantidades de lotes sin caducidad o con caducidad igual o posterior al día de referencia. |
| Stock caducado | Suma de cantidades de lotes cuya caducidad es anterior al día de referencia. |
| Venta | Operación comercial con cliente y una o más líneas. Descuenta stock por lotes y puede completarse, anularse o devolverse. No equivale a una factura. |

### 2.2 Usuarios y permisos

La aplicación reconoce los roles `owner`, `admin`, `almacen` y `vendedor`. La interfaz oculta acciones no disponibles, pero el backend aplica la autorización efectiva.

| Operación | owner | admin | almacen | vendedor |
| --- | --- | --- | --- | --- |
| Consultar catálogo de productos, categorías e impuestos | Permitida | Permitida | Permitida | Permitida |
| Crear, editar o borrar productos; crear categorías | Permitida | Permitida | Prohibida | Prohibida |
| Consultar y registrar movimientos | Permitida | Permitida | Permitida | Prohibida |
| Gestionar clientes y crear, completar, anular o devolver ventas | Permitida | Permitida | Prohibida | Permitida, dentro de su alcance |
| Consultar métricas o exportar ventas | Permitida | Permitida | Prohibida | Prohibida |
| Gestionar usuarios de su empresa | Permitida | Prohibida | Prohibida | Prohibida |
| Acceder a datos de otra empresa | Prohibida | Prohibida | Prohibida | Prohibida |
| Editar o eliminar movimientos históricos | Prohibida | Prohibida | Prohibida | Prohibida |

Los módulos contratados por tenant todavía no se aplican: todos los tenants activos pueden llegar a las rutas para las que su rol tenga permiso. Esa restricción es trabajo pendiente.

## 3. Alcance

### 3.1 Incluido en inventario v1

- Inicio y cierre de sesión, autorización y aislamiento entre empresas.
- Alta y consulta de categorías propias de cada empresa.
- Alta, consulta, búsqueda, filtrado, edición y borrado lógico de productos.
- Existencias por lotes y diferenciación de stock físico, disponible y caducado.
- Entradas, salidas manuales y ajustes de existencias.
- Historial de movimientos con filtros y detalle.
- Clientes comerciales, ventas por líneas, finalización, anulación y devoluciones.
- Control de concurrencia, transacciones y detección de ediciones desactualizadas.
- Pruebas, instrucciones de despliegue, migraciones y procedimiento de recuperación para la entrega.

### 3.2 Fuera del alcance de inventario v1

- Facturas, cumplimiento fiscal, contabilidad, impuestos, cobros y pasarelas de pago.
- Proveedores, pedidos de compra, reservas y presupuestos.
- Múltiples almacenes, ubicaciones y transferencias entre almacenes.
- Unidades fraccionarias, conversiones de unidades y variantes avanzadas de producto.
- Aplicaciones móviles nativas, funcionamiento sin conexión e integraciones con terceros.
- Recuperación de contraseña por correo, registro público y panel de gestión de empresas.
- Informes avanzados, importación masiva, exportaciones e integración con lectores o impresoras.
- Migración completa del código a TypeScript o cambio obligatorio a una arquitectura AWS serverless.

Estas exclusiones delimitan la entrega propuesta; incorporarlas requiere revisar alcance, esfuerzo y aceptación.

## 4. Requisitos funcionales de v1

Todos los requisitos de esta sección son obligatorios para aceptar el alcance propuesto, salvo modificación acordada.

| ID | Requisito | Criterio de aceptación |
| --- | --- | --- |
| RF-01 | El sistema deberá autenticar mediante correo y contraseña a un usuario y empresa activos. | Credenciales válidas permiten entrar; credenciales incorrectas o cuentas inactivas se rechazan; nunca se devuelve el hash de contraseña. |
| RF-02 | Toda ruta privada deberá validar la firma y caducidad del token. | Una petición sin token, con firma alterada o con token caducado recibe 401 y no modifica datos. |
| RF-03 | En cada petición protegida, el servidor deberá consultar la identidad autenticada en SQL y aplicar el rol, empresa y estado actuales. | Con el mismo token, desactivar usuario o empresa bloquea la siguiente petición; cambiar el rol modifica el acceso de la siguiente petición según la matriz. Si SQL falla, no se permite continuar la operación. |
| RF-04 | El backend deberá autorizar cada operación por rol; la interfaz deberá reflejar esos permisos. | Un rol no permitido recibe 403 incluso invocando directamente la API. Las opciones no autorizadas no permiten operar desde la interfaz. |
| RF-05 | El sistema deberá permitir cerrar la sesión local. | Al salir se elimina la sesión del navegador y se vuelve al acceso. Esto no supone revocación individual del JWT en el servidor. |
| RF-06 | Toda operación deberá limitarse a la empresa autenticada, incluidas las relaciones con categorías, productos y lotes. | Alterar IDs o enviar otro `tenant_id` no permite consultar ni modificar datos ajenos. La empresa efectiva se determina en el servidor. |
| RF-07 | El usuario deberá poder crear y consultar categorías de su empresa. | Una categoría válida aparece en su selector; una categoría ajena no puede asignarse a su producto. |
| RF-08 | El usuario deberá poder crear un producto con categoría, precios y stock mínimo, sin existencias iniciales. | El alta crea solo la ficha del producto; cualquier lote o cantidad inicial se rechaza y las existencias se incorporan mediante un movimiento de entrada posterior. |
| RF-09 | El usuario deberá poder listar, buscar por nombre, filtrar por categoría y consultar productos. | Los resultados pertenecen a su empresa, excluyen productos eliminados y muestran los stocks correspondientes. |
| RF-10 | El usuario deberá poder editar únicamente los datos maestros del producto. | La edición no acepta lotes ni cantidades; los cambios de existencias se registran mediante un movimiento independiente. |
| RF-11 | La edición de lotes deberá comprobar su versión. | Si el lote cambió desde su lectura, guardar devuelve 409, conserva los datos actuales y solicita recargar la ficha. |
| RF-12 | El borrado de productos deberá ser lógico. | El producto deja de aparecer en consultas operativas y no acepta nuevas operaciones; su historial permanece consultable. |
| RF-13 | Una entrada deberá incrementar existencias y registrar su movimiento. | Para la misma empresa, producto, número de lote y caducidad se incrementa el lote existente; si no existe, se crea. Los campos opcionales vacíos se tratan de forma consistente. |
| RF-14 | Una salida manual deberá descontar una cantidad positiva del lote seleccionado. | La ausencia de lote, un lote ajeno o una cantidad superior a la disponible en ese lote se rechazan sin cambios parciales. |
| RF-15 | Un ajuste deberá fijar la cantidad final del lote seleccionado. | Se permite cero y se registra la diferencia; se rechazan cantidades negativas y ajustes que no cambian la cantidad. |
| RF-16 | Una venta deberá requerir cliente y una o más líneas, descontar stock disponible y registrar las salidas por lote. | No consume lotes caducados. Prioriza la caducidad más próxima, deja los lotes sin fecha para el final y desempata por ID. Si falta stock disponible, responde 409 sin cambios. |
| RF-17 | El historial deberá permitir consultar movimientos por producto, tipo e intervalo de fechas. | Cada movimiento muestra producto, lote cuando corresponda, cantidad, tipo, usuario, fecha, stock anterior y nuevo; solo se muestran datos de la empresa autenticada. |
| RF-18 | Los movimientos históricos no deberán poder editarse ni eliminarse desde la aplicación. | Las correcciones de cantidad generan nuevos movimientos y conservan los anteriores. |
| RF-19 | El usuario autorizado deberá poder completar, anular y devolver una venta. | Completar cambia una venta pendiente a completa; anular o devolver repone el lote original y registra movimientos de entrada en una única transacción. |
| RF-20 | Un vendedor solo deberá operar sus clientes y ventas asignados. | Un ID directo de cliente o venta de otro vendedor no permite leer ni modificar datos. Los clientes antiguos sin asignación requieren una política explícita. |

**Estado implementado:** RF-03 se cumple en el código actual: tras validar el
JWT, el middleware consulta en MySQL la cuenta y el tenant activos y reconstruye
el usuario autenticado con el rol vigente. La evidencia está en
`back/tests/sessionAuthorization.integration.test.ts`. Esto no equivale a una
revocación global tras cambio de contraseña.

## 5. Reglas de negocio

| ID | Regla |
| --- | --- |
| RN-01 | Las cantidades se expresan en unidades enteras. El stock no puede quedar negativo. Entradas y salidas requieren cantidades positivas; el ajuste permite cero. |
| RN-02 | El stock físico se calcula desde los lotes y equivale a stock disponible más stock caducado, usando el mismo día de referencia. |
| RN-03 | Un lote que caduca hoy sigue disponible durante ese día. La zona horaria de referencia debe fijarse en el despliegue. |
| RN-04 | Todo cambio de cantidad debe quedar registrado con usuario, empresa, producto, lote y saldos anterior y posterior. |
| RN-05 | Las salidas manuales pueden utilizarse para retirar material caducado; las ventas no pueden venderlo. |
| RN-06 | Los precios deben ser numéricos y no negativos. La regla actual exige precio de venta mayor o igual al de compra; modificarla requiere acuerdo. |
| RN-07 | El nombre de producto debe tener entre 3 y 80 caracteres y su descripción como máximo 300; el número de lote, como máximo 50. |
| RN-08 | El nombre de categoría debe tener entre 3 y 50 caracteres y su descripción como máximo 200. |
| RN-09 | Dos operaciones concurrentes no pueden consumir las mismas existencias. Con una unidad disponible y dos ventas de una unidad, solo una puede completarse. |

El código actual de ventas ordena por caducidad, no por fecha de entrada. Por ello esta ERS especifica prioridad por caducidad (FEFO); las referencias históricas a FIFO son imprecisas.

## 6. Datos e interfaces

### 6.1 Modelo lógico existente

| Entidad | Contenido principal |
| --- | --- |
| Empresa | Identidad y estado activo de la organización. |
| Usuario | Empresa, nombre, correo, hash de contraseña, rol y estado activo. |
| Categoría | Empresa, nombre y descripción. |
| Producto | Empresa, categoría, nombre, descripción, precios, stock mínimo y borrado lógico. |
| Inventario / lote | Empresa, producto, cantidad, número de lote y caducidad. |
| Movimiento | Empresa, producto, lote, tipo, cantidad, saldos, motivo, usuario y fecha. |
| Cliente | Empresa, datos comerciales, usuario asignado y estado activo. |
| Venta y línea de venta | Empresa, cliente, usuario, estado, importes, productos y cantidades históricas. |
| Devolución | Venta, motivo, líneas y movimientos de reposición del lote original. |

La edición no deberá permitir relacionar entidades de distintas empresas. La documentación del esquema y las migraciones deberán acompañar cualquier cambio estructural.

### 6.2 Interfaces

- Interfaz web React con acceso, espacio de inventario, espacio comercial y configuración de usuarios para `owner`.
- API HTTP JSON Express: `/auth`, `/productos`, `/movimientos`, `/clientes`, `/ventas` y `/usuarios`.
- `POST /ventas` crea una venta con `cliente_id` y `lineas`; `POST /ventas/:id/completar`, `/anular` y `/devolver` gestionan sus cambios de estado.
- Base MySQL como fuente persistente de usuarios, empresas, productos y existencias.
- No se exige integración externa en v1. El proveedor de alojamiento se decidirá al preparar el despliegue.

## 7. Requisitos no funcionales

| ID | Requisito | Verificación de aceptación |
| --- | --- | --- |
| RNF-01 | Los cambios de stock y sus movimientos deberán ser atómicos. | Provocar un fallo al insertar un movimiento revierte también el stock, tanto en entradas como salidas, ajustes y ventas. |
| RNF-02 | El sistema deberá preservar consistencia ante concurrencia. | Tests con MySQL real demuestran ausencia de stock negativo y rechazo de ediciones desactualizadas. |
| RNF-03 | La seguridad deberá aplicarse en el servidor. | Se verifican aislamiento, permisos y validación mediante peticiones directas, sin depender de controles del navegador. |
| RNF-04 | El despliegue deberá proteger credenciales y comunicaciones. | HTTPS configurado, secretos fuera del repositorio y de respuestas y logs, contraseñas con hash y CORS limitado a los orígenes acordados. |
| RNF-05 | Los errores deberán ser comprensibles y trazables. | La API distingue errores de validación, autenticación, autorización, recurso inexistente y conflicto; los errores internos no exponen detalles sensibles y se correlacionan mediante identificador de petición. |
| RNF-06 | La interfaz deberá ser utilizable en escritorio y móvil. | Se completa el recorrido de aceptación en navegadores y tamaños acordados, incluyendo formularios, tablas, errores y navegación con teclado. |
| RNF-07 | Los cambios deberán poder verificarse de forma repetible. | Comprobación TypeScript y suites de backend y frontend ejecutables; pruebas de integración sobre una base aislada de desarrollo y producción. |
| RNF-08 | La instalación y actualización deberán estar documentadas. | Se puede preparar el entorno y actualizar una base anterior siguiendo instrucciones y migraciones versionadas, comprobando conservación de datos. |
| RNF-09 | Deberá existir un procedimiento de copia y restauración. | Una copia se restaura en una base separada y se comprueban usuarios, productos, lotes y movimientos; se registra fecha, resultado y responsable. |
| RNF-10 | El rendimiento deberá evaluarse con una carga acordada. | Antes de aceptar producción se documentan volumen de productos y movimientos, usuarios concurrentes, entorno y tiempos máximos aceptables; se ejecuta la prueba correspondiente. |

No se han acordado todavía disponibilidad, tiempo máximo de respuesta, frecuencia de copias, pérdida máxima de datos admisible (RPO), tiempo de recuperación (RTO), retención ni navegadores soportados. No deben interpretarse como garantías implícitas.

## 8. Verificación y trazabilidad

| Requisitos | Evidencia existente o comprobación necesaria |
| --- | --- |
| RF-01, RF-02, RF-04 | `back/tests/auth.integration.test.ts` y pruebas adicionales de token alterado y caducado según cobertura efectiva. |
| RF-03 | `back/tests/sessionAuthorization.integration.test.ts`; cubre cookie, desactivación, cambios de rol, combinación inválida y `/auth/me`. |
| RF-06 a RF-12 | `back/tests/products.integration.test.ts`, tests de validadores, versiones y conflictos; completar casos no cubiertos. |
| RF-13 a RF-18 | Pruebas unitarias e integración de movimientos y ventas; completar recorrido manual. |
| RF-19, RF-20 | `back/tests/sales.integration.test.ts` e `inventorySafety.integration.test.ts`; falta ampliar evidencia para dos vendedores y clientes antiguos sin asignación. |
| RNF-01, RNF-02, aislamiento | `back/tests/inventorySafety.integration.test.ts` y `back/tests/integration/mysql.test.ts`; la primera cubre concurrencia, rollback y tenants con MySQL de pruebas. |
| RNF-06 | Tests del frontend y recorrido manual documentado en los dispositivos acordados. |
| RNF-08 a RNF-10 | Actas de prueba de migración, restauración y carga; todavía pendientes de aportar. |

La presencia de un archivo de tests no acredita cobertura completa de todos los requisitos asociados. Cada criterio pendiente necesita su evidencia antes de aceptar la entrega.

### 8.1 Última evidencia disponible

La evidencia local del 4 de noviembre de 2026 recoge 32 pruebas unitarias,
16 pruebas de autenticación, 3 de productos y 5 pruebas críticas de ventas
correctas con MySQL de pruebas. Son resultados locales sin publicar, no una
certificación de producción; el detalle se mantiene en
`documentation/informe-progreso-local-2026-11-04.md`.

## 9. Entrega y aceptación de inventario v1

La entrega deberá incluir código versionado, esquema y migraciones, instrucciones de configuración y despliegue, pruebas ejecutables, procedimiento de copia y restauración y registro de limitaciones conocidas.

Para aceptar v1 se deberá:

1. Ratificar el alcance, las exclusiones y la matriz de permisos.
2. Ejecutar y registrar la evidencia de RF-03 en el entorno de pruebas dedicado.
3. Ejecutar los tests y resolver los fallos que afecten a los requisitos de esta entrega.
4. Completar un recorrido de acceso, categoría, producto, entrada, salida, ajuste, venta, anulación, devolución, historial y borrado lógico, comprobando rechazo de operaciones ajenas.
5. Verificar actualización de una base anterior y restauración de una copia en un entorno separado.
6. Acordar y verificar los parámetros operativos pendientes de RNF-06 y RNF-08 a RNF-10.
7. Registrar la aceptación, incidencias aceptadas y versión entregada, con una etiqueta propuesta `v1.0.0`.

Los fallos de aislamiento entre empresas, pérdida o inconsistencia de existencias y acceso de cuentas desactivadas bloquean la aceptación de producción bajo este alcance. El desarrollo de la siguiente fase puede comenzar antes de esa aceptación.

## 10. Límites actuales del módulo comercial

Clientes, ventas por líneas, finalización, anulación y devoluciones ya forman
parte del código local. La venta exige cliente activo y conserva los importes,
impuestos, líneas y movimientos históricos. El consumo de stock es FEFO y las
operaciones de creación, anulación y devolución se realizan en transacciones.

No forman parte del alcance actual facturas, cobros, contabilidad, pasarelas de
pago ni garantías de idempotencia ante reintentos de la misma solicitud. Esa
última capacidad requiere una clave de idempotencia y pruebas específicas antes
de poder afirmarla como requisito cumplido.

## 11. Decisiones pendientes y gestión de cambios

| ID | Decisión pendiente | Responsable propuesto |
| --- | --- | --- |
| D-01 | Identificar cliente, interlocutor y responsable de aceptación. | Cliente y responsable del proyecto |
| D-02 | Ratificar permisos de owner y admin, incluidas vistas y acciones. | Responsable del producto |
| D-03 | Fijar alojamiento, dominio, zona horaria y orígenes permitidos. | Responsable técnico y cliente |
| D-04 | Acordar carga, navegadores, dispositivos y tiempos aceptables. | Cliente y responsable técnico |
| D-05 | Acordar copias, retención, RPO, RTO y responsable de restauración. | Cliente y responsable técnico |
| D-06 | Resolver tratamiento de productos con stock al borrarlos y exposición de lotes agotados en la ficha. | Responsable del producto |
| D-07 | Definir módulos contratados por tenant y su comportamiento al caducar o cambiar de plan. | Cliente y responsable del producto |
| D-08 | Establecer presupuesto, calendario, mantenimiento y soporte. | Cliente y responsable del proyecto |

Cada cambio deberá registrar solicitud, requisitos afectados, impacto en datos, pruebas, coste y plazo, y la decisión de aceptación. Una vez acordado, se actualizará la versión de esta ERS. Las ideas de documentos antiguos o listas de tareas no amplían por sí solas el alcance aprobado.

## 12. Fuentes del proyecto

- `README.md`: descripción general y API; contiene referencias históricas que deben contrastarse con el código.
- `arquitectura_flujos_invariantes_testing_md.md`: flujos e invariantes originales.
- `back/modules/auth/`: autenticación y autorización actuales.
- `back/modules/inventory/`, `movements/`, `clients/` y `sales/`: comportamiento del motor y área comercial.
- `back/tests/README.md` y suites: procedimientos y cobertura disponible.
- `back/migrations/001_normalize_user_roles.sql`: normalización de roles.
- `front/src/`: interfaz y servicios HTTP.

**Aprobación del documento:** pendiente. Fecha, versión aceptada y responsables se registrarán al acordar el alcance.
