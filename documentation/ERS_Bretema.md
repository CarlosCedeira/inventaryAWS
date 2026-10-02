# Brétema: Especificación de Requisitos del Software

| Campo | Valor |
| --- | --- |
| Versión del documento | 0.1 |
| Fecha | 22 de septiembre de 2026 |
| Estado | Borrador para revisión y acuerdo |
| Producto | Brétema |
| Entrega principal | Motor de inventario v1 |
| Evolución prevista | Clientes y ventas, pendiente de concretar |
| Cliente y responsables de aceptación | Por identificar |

## 1. Propósito

Definir qué debe entregar Brétema en su primera versión de inventario, qué queda fuera y cómo se comprobará su aceptación. Servirá como referencia para desarrollo, pruebas y revisión con el cliente.

Este documento se basa en el código y la documentación del repositorio, y en las decisiones tratadas durante el proyecto. Describe requisitos del producto, no certifica que todos estén implementados o verificados. Los plazos, precios, soporte y compromisos de servicio requieren un acuerdo adicional.

## 2. Objetivo y contexto

Brétema será una aplicación web para gestionar productos, categorías y existencias por lotes, registrar entradas, salidas y ajustes, y consultar su trazabilidad. Permitirá trabajar con varias empresas manteniendo sus datos separados.

El motor de inventario será la base del futuro módulo de ventas. Los cambios de existencias deberán conservar su coherencia aunque haya operaciones simultáneas o se produzcan errores.

### 2.1 Terminología

| Término | Definición |
| --- | --- |
| Empresa / tenant | Organización propietaria de sus usuarios y datos; identificada por `tenant_id`. |
| Usuario | Persona autenticada que opera para una empresa. |
| Cliente comercial | Comprador registrado en la futura fase de clientes; distinto del usuario y de la empresa. |
| Lote | Registro de existencias de un producto, con cantidad, número de lote y caducidad opcionales. |
| Stock físico | Suma de las cantidades de los lotes de un producto, incluidos los caducados. |
| Stock disponible | Suma de cantidades de lotes sin caducidad o con caducidad igual o posterior al día de referencia. |
| Stock caducado | Suma de cantidades de lotes cuya caducidad es anterior al día de referencia. |
| Venta rápida | Salida de stock desde productos; en v1 no equivale a una factura ni a una venta comercial completa. |

### 2.2 Usuarios y permisos

La aplicación reconoce los roles `owner` y `admin`. La política actual permite a ambos operar con productos, categorías, movimientos y ventas rápidas. La asignación de roles y el alta de empresas y usuarios se realizan fuera de una pantalla de administración de v1.

| Operación | owner | admin |
| --- | --- | --- |
| Consultar y gestionar productos y categorías | Permitida | Permitida |
| Consultar historial y registrar movimientos | Permitida | Permitida |
| Registrar ventas rápidas | Permitida | Permitida |
| Acceder a datos de otra empresa | Prohibida | Prohibida |
| Editar o eliminar movimientos históricos | Prohibida | Prohibida |

Esta matriz refleja la política existente y debe ratificarse para la entrega. Restringir movimientos solo a `admin`, excluyendo a `owner`, no se ha acordado como requisito.

## 3. Alcance

### 3.1 Incluido en inventario v1

- Inicio y cierre de sesión, autorización y aislamiento entre empresas.
- Alta y consulta de categorías propias de cada empresa.
- Alta, consulta, búsqueda, filtrado, edición y borrado lógico de productos.
- Existencias por lotes y diferenciación de stock físico, disponible y caducado.
- Entradas, salidas manuales y ajustes de existencias.
- Historial de movimientos con filtros y detalle.
- Venta rápida con descuento de existencias y registro de movimientos.
- Control de concurrencia, transacciones y detección de ediciones desactualizadas.
- Pruebas, instrucciones de despliegue, migraciones y procedimiento de recuperación para la entrega.

### 3.2 Fuera del alcance de inventario v1

- Fichas de clientes comerciales, ventas con múltiples líneas y devoluciones comerciales.
- Facturas, cumplimiento fiscal, contabilidad, impuestos, cobros y pasarelas de pago.
- Proveedores, pedidos de compra, reservas y presupuestos.
- Múltiples almacenes, ubicaciones y transferencias entre almacenes.
- Unidades fraccionarias, conversiones de unidades y variantes avanzadas de producto.
- Aplicaciones móviles nativas, funcionamiento sin conexión e integraciones con terceros.
- Recuperación de contraseña por correo, registro público y panel de gestión de usuarios o empresas.
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
| RF-08 | El usuario deberá poder crear un producto con categoría, precios, stock mínimo y lote inicial. | Producto, lote y movimiento de entrada se guardan juntos; cualquier fallo revierte la operación completa. |
| RF-09 | El usuario deberá poder listar, buscar por nombre, filtrar por categoría y consultar productos. | Los resultados pertenecen a su empresa, excluyen productos eliminados y muestran los stocks correspondientes. |
| RF-10 | El usuario deberá poder editar datos del producto y existencias de los lotes admitidos por la ficha. | Un cambio de cantidad genera ajuste; cambiar únicamente el nombre no genera un movimiento de stock. |
| RF-11 | La edición de lotes deberá comprobar su versión. | Si el lote cambió desde su lectura, guardar devuelve 409, conserva los datos actuales y solicita recargar la ficha. |
| RF-12 | El borrado de productos deberá ser lógico. | El producto deja de aparecer en consultas operativas y no acepta nuevas operaciones; su historial permanece consultable. |
| RF-13 | Una entrada deberá incrementar existencias y registrar su movimiento. | Para la misma empresa, producto, número de lote y caducidad se incrementa el lote existente; si no existe, se crea. Los campos opcionales vacíos se tratan de forma consistente. |
| RF-14 | Una salida manual deberá descontar una cantidad positiva del lote seleccionado. | La ausencia de lote, un lote ajeno o una cantidad superior a la disponible en ese lote se rechazan sin cambios parciales. |
| RF-15 | Un ajuste deberá fijar la cantidad final del lote seleccionado. | Se permite cero y se registra la diferencia; se rechazan cantidades negativas y ajustes que no cambian la cantidad. |
| RF-16 | La venta rápida deberá descontar únicamente stock disponible y registrar las salidas por lote. | No consume lotes caducados. Prioriza la caducidad más próxima, deja los lotes sin fecha para el final y desempata por ID. Si falta stock disponible, responde 409 sin cambios. |
| RF-17 | El historial deberá permitir consultar movimientos por producto, tipo e intervalo de fechas. | Cada movimiento muestra producto, lote cuando corresponda, cantidad, tipo, usuario, fecha, stock anterior y nuevo; solo se muestran datos de la empresa autenticada. |
| RF-18 | Los movimientos históricos no deberán poder editarse ni eliminarse desde la aplicación. | Las correcciones de cantidad generan nuevos movimientos y conservan los anteriores. |

**Estado pendiente conocido:** RF-03 todavía no se cumple. El middleware actual verifica el JWT y utiliza sus datos sin volver a consultar SQL en cada petición.

## 5. Reglas de negocio

| ID | Regla |
| --- | --- |
| RN-01 | Las cantidades se expresan en unidades enteras. El stock no puede quedar negativo. Entradas, salidas y stock inicial requieren cantidades positivas; el ajuste permite cero. |
| RN-02 | El stock físico se calcula desde los lotes y equivale a stock disponible más stock caducado, usando el mismo día de referencia. |
| RN-03 | Un lote que caduca hoy sigue disponible durante ese día. La zona horaria de referencia debe fijarse en el despliegue. |
| RN-04 | Todo cambio de cantidad debe quedar registrado con usuario, empresa, producto, lote y saldos anterior y posterior. |
| RN-05 | Las salidas manuales pueden utilizarse para retirar material caducado; las ventas rápidas no pueden venderlo. |
| RN-06 | Los precios deben ser numéricos y no negativos. La regla actual exige precio de venta mayor o igual al de compra; modificarla requiere acuerdo. |
| RN-07 | El nombre de producto debe tener entre 3 y 80 caracteres y su descripción como máximo 300; el número de lote, como máximo 50. |
| RN-08 | El nombre de categoría debe tener entre 3 y 50 caracteres y su descripción como máximo 200. |
| RN-09 | Dos operaciones concurrentes no pueden consumir las mismas existencias. Con una unidad disponible y dos ventas de una unidad, solo una puede completarse. |

El código actual de venta rápida ordena por caducidad, no por fecha de entrada. Por ello esta ERS especifica prioridad por caducidad (FEFO); algunas notas anteriores del repositorio lo denominan FIFO de forma imprecisa.

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

La edición no deberá permitir relacionar entidades de distintas empresas. La documentación del esquema y las migraciones deberán acompañar cualquier cambio estructural.

### 6.2 Interfaces

- Interfaz web React con vistas de acceso, productos y movimientos, y formularios operativos.
- API HTTP JSON Express: `/auth`, `/productos`, `/movimientos` y `/ventas`.
- `/ventas/:productId` corresponde actualmente a venta rápida de un producto, no a una entidad comercial de venta.
- Base MySQL como fuente persistente de usuarios, empresas, productos y existencias.
- No se exige integración externa en v1. El proveedor de alojamiento se decidirá al preparar el despliegue.

## 7. Requisitos no funcionales

| ID | Requisito | Verificación de aceptación |
| --- | --- | --- |
| RNF-01 | Los cambios de stock y sus movimientos deberán ser atómicos. | Provocar un fallo al insertar un movimiento revierte también el stock, tanto en entradas como salidas, ajustes y ventas rápidas. |
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
| RF-03 | `back/tests/sessionAuthorization.integration.test.ts`; cuatro casos pendientes de superar. |
| RF-06 a RF-12 | `back/tests/products.integration.test.ts`, tests de validadores, versiones y conflictos; completar casos no cubiertos. |
| RF-13 a RF-18 | `back/tests/movements.integration.test.ts`, `back/tests/quickSales.test.ts` y revisión del recorrido completo. |
| RNF-01, RNF-02, aislamiento | `back/tests/inventorySafety.integration.test.ts` y `back/tests/integration/mysql.test.ts`; cada suite requiere su configuración de base de pruebas. |
| RNF-06 | Tests del frontend y recorrido manual documentado en los dispositivos acordados. |
| RNF-08 a RNF-10 | Actas de prueba de migración, restauración y carga; todavía pendientes de aportar. |

La presencia de un archivo de tests no acredita cobertura completa de todos los requisitos asociados. Cada criterio pendiente necesita su evidencia antes de aceptar la entrega.

### 8.1 Última evidencia disponible

En la sesión de migración a TypeScript del 20 de septiembre de 2026 se obtuvo: comprobación de tipos correcta, 35 tests unitarios de backend correctos, 8 tests de frontend correctos y 23 tests de integración correctos con 4 fallos de autorización ya existentes. También se comprobó la carga de la aplicación CommonJS.

Estos son resultados históricos de aquella ejecución, no una certificación de producción ni una nueva ejecución del 22 de septiembre. Al redactar esta ERS se revisó el código, pero no se volvieron a ejecutar los tests.

## 9. Entrega y aceptación de inventario v1

La entrega deberá incluir código versionado, esquema y migraciones, instrucciones de configuración y despliegue, pruebas ejecutables, procedimiento de copia y restauración y registro de limitaciones conocidas.

Para aceptar v1 se deberá:

1. Ratificar el alcance, las exclusiones y la matriz de permisos.
2. Corregir RF-03 y superar los cuatro casos pendientes de autorización.
3. Ejecutar los tests y resolver los fallos que afecten a los requisitos de esta entrega.
4. Completar un recorrido de acceso, categoría, producto, entrada, salida, ajuste, venta rápida, historial y borrado lógico, comprobando rechazo de operaciones ajenas.
5. Verificar actualización de una base anterior y restauración de una copia en un entorno separado.
6. Acordar y verificar los parámetros operativos pendientes de RNF-06 y RNF-08 a RNF-10.
7. Registrar la aceptación, incidencias aceptadas y versión entregada, con una etiqueta propuesta `v1.0.0`.

Los fallos de aislamiento entre empresas, pérdida o inconsistencia de existencias y acceso de cuentas desactivadas bloquean la aceptación de producción bajo este alcance. El desarrollo de la siguiente fase puede comenzar antes de esa aceptación.

## 10. Propuesta de fase posterior: clientes y ventas

Esta sección es una propuesta de evolución, no una funcionalidad ya entregada ni un compromiso incluido en inventario v1. Deberá aprobarse y detallarse antes de convertirse en el alcance de una nueva entrega.

| ID | Requisito propuesto | Criterio de aceptación propuesto |
| --- | --- | --- |
| FUT-01 | Gestionar clientes comerciales por empresa: alta, consulta, búsqueda, edición y desactivación. | Una empresa no puede consultar ni utilizar clientes de otra; desactivar un cliente conserva su histórico. |
| FUT-02 | Registrar ventas con una o más líneas y cliente opcional. | Cada línea conserva producto, cantidad, descripción e importe aplicados; cambios posteriores del catálogo no alteran la venta histórica. |
| FUT-03 | Confirmar ventas utilizando el motor de existencias existente. | Venta, líneas, descuento de lotes y movimientos se guardan en una única transacción; el fallo de una línea revierte toda la confirmación. |
| FUT-04 | Evitar duplicados al repetir una confirmación. | Reintentar la misma operación devuelve la venta ya creada sin descontar stock una segunda vez. |
| FUT-05 | Consultar listado y detalle de ventas y su relación con movimientos y cliente. | Los importes y cantidades del detalle coinciden con los registrados al confirmar. |
| FUT-06 | Anular una venta mediante una operación trazable. | Se conserva la venta original y se registra la reposición que corresponda una sola vez, con usuario y motivo. La política de reposición y devoluciones debe concretarse. |

Antes de implementar esta fase se acordarán campos de cliente, estados de venta, moneda, redondeo, descuentos, impuestos, devoluciones parciales y política para lotes caducados o productos eliminados. La incorporación de facturación o cobros requiere ampliar expresamente el alcance.

La venta rápida actual no garantiza idempotencia comercial: impedir vender la misma última unidad no equivale a impedir duplicados si hay stock suficiente. FUT-04 requiere una solución y pruebas específicas.

## 11. Decisiones pendientes y gestión de cambios

| ID | Decisión pendiente | Responsable propuesto |
| --- | --- | --- |
| D-01 | Identificar cliente, interlocutor y responsable de aceptación. | Cliente y responsable del proyecto |
| D-02 | Ratificar permisos de owner y admin, incluidas vistas y acciones. | Responsable del producto |
| D-03 | Fijar alojamiento, dominio, zona horaria y orígenes permitidos. | Responsable técnico y cliente |
| D-04 | Acordar carga, navegadores, dispositivos y tiempos aceptables. | Cliente y responsable técnico |
| D-05 | Acordar copias, retención, RPO, RTO y responsable de restauración. | Cliente y responsable técnico |
| D-06 | Resolver tratamiento de productos con stock al borrarlos y exposición de lotes agotados en la ficha. | Responsable del producto |
| D-07 | Concretar alcance, prioridades y aceptación de clientes y ventas. | Cliente y responsable del producto |
| D-08 | Establecer presupuesto, calendario, mantenimiento y soporte. | Cliente y responsable del proyecto |

Cada cambio deberá registrar solicitud, requisitos afectados, impacto en datos, pruebas, coste y plazo, y la decisión de aceptación. Una vez acordado, se actualizará la versión de esta ERS. Las ideas de documentos antiguos o listas de tareas no amplían por sí solas el alcance aprobado.

## 12. Fuentes del proyecto

- `README.md`: descripción general y API; contiene referencias históricas que deben contrastarse con el código.
- `arquitectura_flujos_invariantes_testing_md.md`: flujos e invariantes originales.
- `back/modules/auth/`: autenticación y autorización actuales.
- `back/modules/inventory/`, `movements/` y `quickSales/`: comportamiento del motor.
- `back/tests/README.md` y suites: procedimientos y cobertura disponible.
- `back/migrations/001_normalize_user_roles.sql`: normalización de roles.
- `front/src/`: interfaz y servicios HTTP.

**Aprobación del documento:** pendiente. Fecha, versión aceptada y responsables se registrarán al acordar el alcance.
