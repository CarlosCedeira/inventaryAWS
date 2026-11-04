# Brétema: especificación funcional de productos

## 1. Propósito y alcance

Este documento define el comportamiento funcional del catálogo de productos de
Brétema. Es la referencia para producto, desarrollo y pruebas de la vista
**Productos** y de las operaciones que dependen directamente de ella.

Incluye:

- Consulta, búsqueda, filtrado y ordenación del catálogo.
- Alta, edición y borrado lógico de productos.
- Alta y consulta de categorías.
- Consulta de impuestos disponibles para asignarlos a un producto.
- Visualización del stock agregado, lotes, caducidad, alertas y métricas.
- Inicio de un movimiento con el producto ya seleccionado.

No incluye la ejecución ni las reglas completas de los movimientos de stock,
ventas, clientes, proveedores o facturación. Esas operaciones conservan sus
propias especificaciones, aunque la vista Productos muestre información
derivada de ellas.

## 2. Usuarios y permisos

Todos los accesos requieren una sesión autenticada y los datos se limitan a la
empresa (`tenant`) de la sesión.

| Acción | owner | admin | warehouse | seller |
| --- | --- | --- | --- | --- |
| Consultar catálogo, detalle, categorías e impuestos | Sí | Sí | Sí | Sí |
| Buscar, filtrar y ordenar | Sí | Sí | Sí | Sí |
| Consultar productos sin ventas recientes | Sí | Sí | Sí | No |
| Crear categorías | Sí | Sí | No | No |
| Crear, editar o borrar productos | Sí | Sí | No | No |
| Abrir un movimiento desde un producto | Sí | Sí | Según permisos del módulo de movimientos | No |

La interfaz debe ocultar o deshabilitar las acciones de gestión cuando el rol
no sea `owner` ni `admin`. El backend es la autoridad final y debe responder
`403` si alguien intenta invocar una acción no permitida directamente.

## 3. Conceptos y reglas de negocio

| ID | Regla |
| --- | --- |
| RN-PRO-01 | Un producto pertenece a una única empresa y solo es visible y operable desde ella. |
| RN-PRO-02 | Un producto activo tiene nombre, descripción, categoría, impuesto, precio de compra, precio de venta y stock mínimo. |
| RN-PRO-03 | El nombre debe tener entre 3 y 80 caracteres y solo puede contener letras, números, espacios y `_.(),-`. |
| RN-PRO-04 | La descripción es obligatoria y no puede superar 300 caracteres. |
| RN-PRO-05 | La categoría debe existir y pertenecer a la empresa de la sesión. |
| RN-PRO-06 | El impuesto es obligatorio al crear un producto y debe estar activo. |
| RN-PRO-07 | Los precios son numéricos, no negativos y el precio de venta no puede ser inferior al de compra. Los precios de venta se muestran sin IVA. |
| RN-PRO-08 | El stock mínimo es un entero mayor o igual que cero. |
| RN-PRO-09 | El stock no se modifica desde la edición del producto: cualquier cambio de existencias se realiza mediante movimientos y queda trazado. |
| RN-PRO-10 | Borrar un producto es un borrado lógico. Deja de aparecer en operaciones ordinarias y no admite nuevas operaciones, pero se conserva su historial. |
| RN-PRO-11 | El stock físico suma todos los lotes; el disponible excluye los lotes caducados. Un lote que caduca hoy todavía está disponible durante ese día. |
| RN-PRO-12 | Se considera stock bajo cuando el stock disponible es menor o igual que el mínimo configurado; se considera sin stock cuando el disponible es cero o negativo. |
| RN-PRO-13 | Una categoría tiene nombre de 3 a 50 caracteres, descripción obligatoria de hasta 200 caracteres y pertenece a una única empresa. |

## 4. Casos de uso

### CU-PRO-01. Consultar el catálogo

**Actor:** cualquier usuario con acceso al catálogo.

**Precondiciones:** sesión válida y empresa activa.

**Flujo principal:**

1. El usuario abre el espacio de trabajo Productos.
2. El sistema obtiene los productos activos de su empresa y las categorías disponibles.
3. Mientras carga, muestra filas de espera.
4. Al terminar, muestra la tabla y las métricas calculadas sobre el catálogo recibido.

**Resultado:** solo se muestran productos no eliminados de la empresa activa.

**Alternativas:** si falla la carga de productos o de categorías, se muestra un
aviso independiente con la opción de reintentar.

### CU-PRO-02. Buscar, filtrar y ordenar

**Actor:** cualquier usuario con acceso al catálogo.

**Flujo principal:**

1. El usuario puede escribir un texto para buscar por nombre.
2. Puede seleccionar una categoría o todas las categorías.
3. Puede ordenar por stock disponible, precio de compra o fecha de caducidad,
   en orden ascendente o descendente.
4. El sistema actualiza la tabla sin mostrar productos de otras empresas.

**Reglas específicas:**

- La búsqueda y el filtro de categoría se obtienen desde la API.
- La ordenación se aplica en el cliente al conjunto ya cargado.
- Los productos sin fecha de caducidad se colocan al final al ordenar por
  caducidad ascendente.

### CU-PRO-03. Consultar detalle y estado de un producto

**Actor:** cualquier usuario con acceso al catálogo.

**Flujo principal:**

1. El usuario selecciona una fila del catálogo.
2. El sistema abre el detalle del producto y sus lotes activos.
3. El usuario puede cerrar el detalle y el catálogo se recarga para reflejar
   cambios recientes.

**Resultado:** el detalle no expone lotes ni datos de otra empresa. Si el
producto ya no existe o fue eliminado, la API responde `404`.

### CU-PRO-04. Crear una categoría

**Actor:** `owner` o `admin`.

**Flujo principal:**

1. El usuario pulsa **Nueva categoría**.
2. Introduce nombre y descripción.
3. El sistema valida los campos y crea la categoría en su empresa.
4. Muestra confirmación y actualiza el selector de categorías.

**Resultado:** la categoría recién creada puede seleccionarse al crear o editar
un producto.

### CU-PRO-05. Crear un producto

**Actor:** `owner` o `admin`.

**Precondiciones:** existen al menos una categoría propia y un impuesto activo.

**Flujo principal:**

1. El usuario pulsa **Nuevo producto**.
2. El sistema carga categorías e impuestos actuales.
3. El usuario informa nombre, descripción, categoría, IVA, precios y stock mínimo.
4. El sistema valida los datos en el cliente y los envía al backend.
5. El backend vuelve a validarlos, comprueba la categoría y el impuesto, y crea
   el producto dentro de una transacción.
6. Se muestra confirmación y se actualiza el catálogo.

**Stock inicial:** el alta crea únicamente la ficha del producto, sin lote ni
existencias. Para incorporar stock, el usuario debe registrar después una
entrada desde el módulo Movimientos.

### CU-PRO-06. Editar datos maestros

**Actor:** `owner` o `admin`.

**Flujo principal:**

1. El usuario abre el detalle de un producto y selecciona editar.
2. El sistema carga los datos actuales, categorías e impuestos.
3. El usuario modifica los datos maestros permitidos.
4. El sistema valida, guarda y actualiza el catálogo.

**Campos editables:** nombre, descripción, categoría, IVA, precio de compra,
precio de venta y stock mínimo.

**Restricción:** no se pueden modificar lotes ni cantidades desde este flujo;
el backend rechaza un cuerpo de actualización que incluya `inventario`.

### CU-PRO-07. Eliminar un producto

**Actor:** `owner` o `admin`.

**Flujo principal:**

1. El usuario solicita eliminar el producto desde su detalle.
2. El sistema solicita confirmación.
3. Si confirma, el backend marca el producto como eliminado.
4. El producto desaparece del catálogo activo y se conserva su histórico.

**Alternativas:** si el identificador es inválido se devuelve `400`; si el
producto no pertenece a la empresa, no existe o ya estaba eliminado, `404`.

### CU-PRO-08. Registrar un movimiento desde el catálogo

**Actor:** usuario con permisos de movimientos.

**Flujo principal:**

1. El usuario pulsa **Movimiento** en la fila de un producto.
2. Se abre el formulario de movimientos con ese producto preseleccionado.
3. Tras guardar el movimiento, se recarga el catálogo y, en escritorio, la
   lista de actividad reciente.

Este caso de uso no cambia las reglas de entradas, salidas o ajustes; solo
conecta el catálogo con dicho módulo.

## 5. Especificación de interfaz

### 5.1 Cabecera y acciones

La vista muestra el valor de inventario, calculado como `stock_total ×
precio_compra`, y las acciones **Nueva categoría** y **Nuevo producto** para
los roles de gestión.

### 5.2 Métricas

| Métrica | Definición | Acción al pulsarla |
| --- | --- | --- |
| Productos | Número de productos activos visibles | Solo informativa |
| Lotes activos | Suma de lotes con unidades disponibles | Solo informativa |
| Unidades disponibles | Suma del stock vendible | Solo informativa |
| Stock bajo | Productos con stock disponible menor o igual al mínimo, incluidos los sin stock | Activa o quita ese filtro |
| Caducidad | Productos caducados o que caducan hoy o en los próximos 30 días | Activa o quita ese filtro |
| Sin ventas 30d | Productos con stock y sin ventas confirmadas en los últimos 30 días | Activa o quita ese filtro |

El filtro de métrica es exclusivo: activar uno sustituye al anterior. La vista
indica cuántos productos coinciden y ofrece **Quitar filtro**.

### 5.3 Barra de herramientas y tabla

| Elemento | Comportamiento |
| --- | --- |
| Buscar producto | Busca coincidencias parciales por nombre. |
| Categoría | Filtra por una categoría propia o muestra todas. |
| Ordenar por | Permite predefinido, stock disponible, precio de compra o caducidad. |
| Dirección | Menor/próxima o mayor/lejano, según el campo elegido. |
| Encabezado Disponible / Estado stock | Alterna entre unidades disponibles y comparación porcentual con el stock mínimo. |
| Encabezado Caducidad / Días restantes | Alterna entre fecha y tiempo restante. |
| Fila de producto | Abre el detalle del producto. |
| Movimiento | Abre el alta de movimiento con el producto seleccionado. |

Cada fila muestra nombre, stock mínimo, categoría, disponible, lotes activos,
precio de venta sin IVA, IVA, próxima caducidad y estado. El estado utiliza
etiquetas para **Sin stock**, **Stock bajo**, **Stock correcto**, **Stock
caducado** y **Caduca pronto** cuando corresponda.

### 5.4 Estados de la vista

- **Carga:** se muestran esqueletos en lugar de datos definitivos.
- **Vacío:** se informa que no hay productos o que ningún producto coincide con
  el filtro activo.
- **Error de catálogo:** mensaje de error y botón **Reintentar**.
- **Error de categorías:** aviso independiente y botón para reintentar la carga
  de categorías.
- **Guardado:** los botones del formulario se bloquean mientras se crea o edita.
- **Error de formulario:** se muestra el mensaje devuelto por la validación o
  por la API sin cerrar el modal.

## 6. Formularios y validaciones

### Producto

| Campo | Obligatorio | Validación |
| --- | --- | --- |
| Nombre | Sí | 3–80 caracteres; caracteres permitidos según RN-PRO-03. |
| Descripción | Sí | Máximo 300 caracteres. |
| Categoría | Sí | Identificador entero positivo de una categoría propia. |
| IVA aplicable | Sí en alta | Identificador entero positivo de un impuesto activo. |
| Precio de compra | Sí | Número mayor o igual que cero, con dos decimales en la interfaz. |
| Precio de venta sin IVA | Sí | Número mayor o igual que el precio de compra. |
| Stock mínimo | Sí | Entero mayor o igual que cero. |

### Categoría

| Campo | Obligatorio | Validación |
| --- | --- | --- |
| Nombre | Sí | 3–50 caracteres; letras, números, espacios, `_` y `-`. |
| Descripción | Sí | Máximo 200 caracteres. |

La validación de la interfaz mejora la experiencia, pero el backend debe volver
a validar siempre el cuerpo recibido.

## 7. Contrato de API

Todas las rutas requieren `Authorization: Bearer <token>`. Los errores esperados
se devuelven como `{ "error": "mensaje" }`; los errores no controlados devuelven
`500` con `Error interno del servidor`.

| Método y ruta | Uso | Roles |
| --- | --- | --- |
| `GET /productos` | Lista productos activos con stock agregado. | owner, admin, warehouse, seller |
| `GET /productos/:id` | Obtiene el detalle y los lotes activos de un producto. | owner, admin, warehouse, seller |
| `GET /productos/buscar/:name` | Busca productos por nombre. | owner, admin, warehouse, seller |
| `GET /productos/categoria/:categoryId` | Lista productos de una categoría. | owner, admin, warehouse, seller |
| `GET /productos/categorias` | Lista categorías de la empresa. | owner, admin, warehouse, seller |
| `GET /productos/impuestos` | Lista impuestos activos. | owner, admin, warehouse, seller |
| `GET /productos/sin-ventas` | Devuelve IDs de productos con stock y sin ventas recientes. | owner, admin, warehouse |
| `POST /productos/categorias` | Crea una categoría. | owner, admin |
| `POST /productos/newProduct` | Crea un producto sin existencias iniciales. | owner, admin |
| `PUT /productos/actualizar/:id` | Actualiza datos maestros. | owner, admin |
| `PATCH /productos/eliminar/:id` | Marca un producto como eliminado. | owner, admin |

### 7.1 Representación resumida de producto

Las operaciones de listado, búsqueda y filtro devuelven una matriz de objetos
con, al menos, los siguientes campos:

```json
{
  "producto_id": 42,
  "producto_nombre": "Café molido",
  "producto_descripcion": "Paquete de 250 g",
  "categoria_id": 3,
  "producto_categoria": "Alimentación",
  "impuesto_id": 1,
  "impuesto_nombre": "IVA general",
  "impuesto_porcentaje": "21.00",
  "precio_compra": "2.50",
  "precio_venta": "4.00",
  "stock_minimo": 5,
  "stock_total": "12",
  "stock_fisico": "12",
  "stock_disponible": "10",
  "stock_caducado": "2",
  "lotes_activos": 2,
  "fecha_caducidad": "2026-11-20"
}
```

Los valores numéricos procedentes de MySQL pueden llegar como cadenas; la
interfaz debe convertirlos antes de calcular, comparar u ordenar.

### 7.2 Cuerpo de alta de producto

```json
{
  "producto_nombre": "Café molido",
  "producto_descripcion": "Paquete de 250 g",
  "categoria_id": 3,
  "impuesto_id": 1,
  "precio_compra": 2.5,
  "precio_venta": 4,
  "stock_minimo": 5
}
```

No se permiten `cantidad`, `numero_lote` ni `fecha_caducidad` en esta ruta. Si
se reciben, responde `400`; el stock se añade posteriormente mediante una
entrada en Movimientos. Una creación correcta devuelve `201` con `message` y
`productoId`.

### 7.3 Cuerpo de actualización

```json
{
  "nombre": "Café molido",
  "descripcion": "Paquete de 250 g",
  "categoria_id": 3,
  "impuesto_id": 1,
  "precio_compra": 2.5,
  "precio_venta": 4,
  "stock_minimo": 5
}
```

Una actualización correcta devuelve `200` con el mensaje de confirmación. No
debe incluir un campo `inventario`.

## 8. Criterios de aceptación

| ID | Criterio verificable |
| --- | --- |
| CA-PRO-01 | Un usuario solo ve productos y categorías de su propia empresa. |
| CA-PRO-02 | Los roles de solo consulta no ven acciones de alta, edición o borrado y reciben `403` si las invocan por API. |
| CA-PRO-03 | La búsqueda por nombre, el filtro por categoría y la ordenación devuelven o muestran el conjunto esperado. |
| CA-PRO-04 | Un producto con stock disponible igual o inferior al mínimo se marca como stock bajo; con cero se marca sin stock. |
| CA-PRO-05 | Los lotes caducados no forman parte del stock disponible y la vista los identifica. |
| CA-PRO-06 | No se puede crear ni actualizar un producto con campos obligatorios inválidos, precio de venta inferior al de compra, categoría ajena o impuesto inactivo. |
| CA-PRO-07 | Al crear un producto no se genera ningún lote ni movimiento; el stock solo se añade mediante una entrada posterior en Movimientos. |
| CA-PRO-08 | Al editar un producto, sus cantidades no cambian y no se crea un movimiento de stock. |
| CA-PRO-09 | Al eliminar un producto, desaparece de los listados operativos, no puede recibir operaciones nuevas y su historial permanece disponible. |
| CA-PRO-10 | Los estados de carga, vacío, error y reintento son visibles y utilizables. |

## 9. Trazabilidad y decisiones pendientes

- La funcionalidad de catálogo se implementa principalmente en
  `front/src/components/products/` y `back/modules/inventory/`.
- Las pruebas de integración relacionadas se encuentran en
  `back/tests/products.integration.test.ts`.
- La especificación general de requisitos y permisos está en
  [ERS_Bretema.md](ERS_Bretema.md).
- El alta de producto no admite lote ni stock inicial. Toda existencia debe
  registrarse posteriormente mediante un movimiento de entrada.
- Debe mantenerse una única fuente de verdad para el contrato de API. Si el
  proyecto adopta OpenAPI, este documento debe enlazarlo en vez de duplicar sus
  detalles técnicos.
