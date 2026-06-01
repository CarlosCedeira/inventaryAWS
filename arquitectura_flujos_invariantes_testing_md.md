# Arquitectura funcional y consolidación del sistema

## Objetivo

Este documento define:
- Flujos operativos.
- Invariantes del sistema.
- Casos límite.
- Pruebas manuales repetibles.

Su objetivo es consolidar el núcleo del sistema de inventario y convertir comportamiento implícito en conocimiento explícito.

---

# 1. Login

## Flujo

```text
Usuario introduce email y password
↓
Frontend envía credenciales
↓
Backend valida email/password
↓
Backend busca usuario activo
↓
Comprueba password con bcrypt
↓
Genera JWT con tenant_id
↓
Frontend guarda sesión
```

## Invariantes

- Sin token no hay acceso.
- El token debe contener tenant_id.
- Usuario inactivo no puede acceder.
- Password nunca se devuelve al frontend.

## Casos límite

- Email vacío.
- Password vacía.
- Token inválido.
- Token expirado.
- Tenant inactivo.

## Pruebas manuales

- Login válido.
- Login inválido.
- Token manipulado.
- Logout manual.

---

# 2. Crear categoría

## Flujo

```text
Usuario crea categoría
↓
Frontend valida
↓
Backend valida
↓
Backend crea categoría con tenant_id
↓
Frontend actualiza selector
```

## Invariantes

- Toda categoría pertenece a un tenant.
- Nombre obligatorio.
- Longitud válida.

## Casos límite

- Nombre vacío.
- Nombre muy largo.
- Caracteres inválidos.

## Pruebas manuales

- Crear categoría válida. [done]
- Crear categoría inválida. [done]
- Usar categoría al crear producto. [done]

---

# 3. Crear producto

## Flujo

```text
Usuario crea producto
↓
Frontend valida datos
↓
Backend valida producto e inventario
↓
Backend verifica categoría
↓
Backend crea producto
↓
Backend crea lote inicial
↓
Backend registra movimiento inicial
```

## Invariantes

- Todo producto pertenece a un tenant.
- Precio venta >= precio compra.
- Cantidad inicial positiva.
- Crear producto con stock debe generar movimiento.

## Casos límite

- Categoría inválida.
- Cantidad negativa.
- Fecha inválida.
- Precio inválido.

## Pruebas manuales

- Crear producto válido.
- Revisar movimiento inicial.
- Intentar crear producto inválido.

---

# 4. Editar producto

## Flujo

```text
Usuario edita producto
↓
Backend valida cambios
↓
Backend actualiza producto
↓
Backend compara cantidades
↓
Backend registra ajustes si cambia stock
```

## Invariantes

- Cambiar stock debe generar ajuste.
- Cambiar nombre no genera movimiento.
- Stock total debe mantenerse consistente.

## Casos límite

- Cantidad negativa.
- Lote inexistente.
- Cambio de categoría inválida.

## Pruebas manuales

- Editar nombre. [done]
- Editar cantidad. [done]
- Revisar historial. [done]

---

# 5. Crear entrada

## Flujo

```text
Usuario registra entrada
↓
Backend valida
↓
Busca lote existente
↓
Suma stock o crea lote
↓
Registra movimiento entrada
```

## Invariantes

- Entrada siempre suma stock. [done]
- Toda entrada genera movimiento. [done]
- Entrada mismo lote suma cantidad. [X]

## Casos límite

- Entrada sin lote.
- Fecha inválida.
- Producto eliminado.

## Pruebas manuales

- Entrada válida.
- Entrada mismo lote.
- Entrada nuevo lote.

---

# 6. Crear salida

## Flujo

```text
Usuario registra salida
↓
Frontend obliga a seleccionar producto y lote existente
↓
Backend valida stock del lote seleccionado
↓
Descuenta stock de ese lote
↓
Registra movimiento salida con trazabilidad de lote
```

## Invariantes

- Salida nunca deja stock negativo.
- La salida manual afecta al lote seleccionado por el usuario.
- El lote seleccionado debe pertenecer al producto y al tenant actual.
- Toda salida debe quedar trazada.

## Casos límite

- Salida mayor que stock del lote seleccionado.
- Producto sin stock.
- Producto con varios lotes.
- Lote inexistente o de otro producto.

## Pruebas manuales

- Salida válida.
- Salida insuficiente. [done]
- Salida sobre un lote concreto. [done]
- Intentar salida sin seleccionar lote. [done]

---

# 7. Crear ajuste

## Flujo

```text
Usuario ajusta stock
↓
Frontend obliga a seleccionar producto y lote existente
↓
Backend obtiene stock actual del lote y calcula la diferencia
↓
Actualiza exactamente ese lote
↓
Registra movimiento ajuste
```

## Invariantes

- Ajuste deja stock exacto en el lote seleccionado.
- El lote ajustado debe pertenecer al producto y al tenant actual.
- Ajuste debe registrarse.
- Ajuste no puede romper consistencia.

## Casos limite

- Ajuste mismo valor.
- Ajuste negativo.
- Lote inexistente.
- Producto sin lotes con stock seleccionables desde el modal de movimientos.

## Pruebas manuales

- Ajuste hacia arriba.
- Ajuste hacia abajo.
- Ajuste sin cambios.
- Intentar ajuste sin seleccionar lote.

---
# 8. Venta rápida

## Flujo

```text
Usuario vende desde tabla
↓
Backend valida stock
↓
Backend aplica FIFO
↓
Backend registra salida
↓
Frontend actualiza tabla
```

## Invariantes

- Venta rápida es una salida.
- Respeta FIFO.
- Genera movimiento.

## Casos límite

- Vender más que stock.
- Doble click.
- Dos ventas simultáneas.

## Pruebas manuales

- Venta válida.
- Venta insuficiente.
- Revisar movimientos.

---

# 9. Consultar productos

## Flujo

```text
Frontend solicita productos
↓
Backend filtra tenant
↓
Backend calcula stock
↓
Frontend renderiza tabla
```

## Invariantes

- Solo productos del tenant.
- Productos eliminados no aparecen.
- Stock total debe ser correcto.

## Casos límite

- Producto sin stock.
- Producto eliminado.
- Stock bajo.

## Pruebas manuales

- Buscar producto.
- Filtrar categoría.
- Revisar estados visuales.

---

# 10. Consultar movimientos

## Flujo

```text
Frontend solicita historial
↓
Backend filtra tenant
↓
Backend ordena movimientos
↓
Frontend renderiza historial
```

## Invariantes

- Todo movimiento pertenece a un tenant.
- El historial no se modifica.
- Debe existir trazabilidad.

## Casos límite

- Muchos movimientos.
- Producto eliminado.
- Movimiento sin lote.

## Pruebas manuales

- Crear movimientos.
- Revisar orden.
- Revisar detalle.

---

# 11. Borrado lógico de producto

## Flujo

```text
Usuario elimina producto
↓
Backend marca eliminado=1
↓
Producto desaparece
↓
Historial permanece
```

## Invariantes

- No se eliminan movimientos.
- Producto eliminado no acepta operaciones.
- Solo afecta al tenant actual.

## Casos límite

- Producto inexistente.
- Producto con stock.
- Producto con movimientos.

## Pruebas manuales

- Eliminar producto.
- Revisar historial.
- Intentar vender eliminado.

---

# Invariantes globales del sistema

## Seguridad

- Todo pertenece a un tenant.
- Ningún tenant puede acceder a otro.
- Backend nunca confía solo en frontend.

## Inventario

- El stock nunca puede ser negativo.
- El stock total es la suma de lotes.
- Venta rápida aplica FIFO.
- Salida manual afecta al lote seleccionado.

## Movimientos

- Toda modificación de stock debe generar movimiento.
- Los movimientos son históricos.
- Deben registrar stock anterior y nuevo.

## Consistencia

- Operaciones críticas dentro de transacciones.
- Una operación fallida no deja datos parciales.
- El sistema debe mantener trazabilidad completa.
