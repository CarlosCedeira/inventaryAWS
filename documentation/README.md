# Documentación Técnica — SaaS de Gestión de Inventario

## Descripción general

Aplicación web SaaS orientada a pequeñas empresas y distribuidores para la gestión de:

* Inventario por lotes
* Movimientos de stock
* Categorías
* Ventas rápidas
* Control multiempresa (multi-tenant)
* Autenticación mediante JWT

La arquitectura está basada en:

* Frontend: React + Bootstrap
* Backend: Node.js + Express
* Base de datos: MySQL
* Autenticación: JWT

---

# Arquitectura general

## Frontend

Tecnologías utilizadas:

* React
* React Router
* Bootstrap
* Victory Charts

Responsabilidades:

* Gestión de interfaz
* Formularios
* Visualización de inventario
* Gestión de sesiones
* Consumo de API REST

---

## Backend

Tecnologías utilizadas:

* Node.js
* Express
* mysql2
* JWT
* bcrypt

Arquitectura modular:

```txt
modules/
├── auth/
├── inventory/
├── movements/
└── quickSales/
```

Cada módulo contiene:

```txt
controller
service
model
routes
validators
```

---

# Sistema Multi-Tenant

La aplicación utiliza separación lógica por empresa mediante:

```sql
tenant_id
```

Todas las consultas principales filtran por:

```sql
WHERE tenant_id = ?
```

Esto permite:

* Compartir infraestructura
* Aislar datos entre empresas
* Escalabilidad SaaS

---

# Autenticación

## Login

Ruta:

```http
POST /auth/login
```

Body:

```json
{
  "email": "usuario@empresa.com",
  "password": "password"
}
```

Respuesta:

```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "tenant_id": 1,
    "nombre": "Admin",
    "email": "admin@empresa.com",
    "rol": "admin"
  }
}
```

---

## JWT

El token incluye:

* id usuario
* tenant_id
* nombre
* email
* rol

Middleware de protección:

```js
requireAuth
```

Obtiene:

```js
req.user
req.tenantId
```

---

# Módulo de Inventario

## Productos

### Campos principales

| Campo         | Descripción          |
| ------------- | -------------------- |
| nombre        | Nombre del producto  |
| descripcion   | Descripción          |
| categoria_id  | Categoría asociada   |
| precio_compra | Precio de compra     |
| precio_venta  | Precio de venta      |
| stock_minimo  | Nivel mínimo         |
| eliminado     | Borrado lógico       |
| created_at    | Fecha creación       |
| updated_at    | Última actualización |

---

## Inventario por lotes

La aplicación trabaja mediante lotes independientes.

Cada producto puede tener múltiples registros de inventario.

Campos:

| Campo           | Descripción            |
| --------------- | ---------------------- |
| cantidad        | Stock del lote         |
| numero_lote     | Identificador del lote |
| fecha_caducidad | Caducidad              |
| created_at      | Fecha creación         |
| updated_at      | Última actualización   |

Ventajas:

* Control FIFO
* Gestión de caducidades
* Trazabilidad
* Entradas parciales

---

## Endpoints de productos

### Obtener productos

```http
GET /productos
```

---

### Obtener producto por ID

```http
GET /productos/:id
```

---

### Buscar productos

```http
GET /productos/buscar/:name
```

---

### Filtrar por categoría

```http
GET /productos/categoria/:categoryId
```

---

### Crear producto

```http
POST /productos/newProduct
```

---

### Actualizar producto

```http
PUT /productos/actualizar/:id
```

---

### Eliminar producto

```http
PATCH /productos/eliminar/:id
```

El borrado es lógico.

---

# Categorías

## Endpoints

### Obtener categorías

```http
GET /productos/categorias
```

### Crear categoría

```http
POST /productos/categorias
```

---

# Módulo de Movimientos

Permite registrar:

* entradas
* salidas
* ajustes
* devoluciones
* mermas

---

## Tipos de movimiento

| Tipo       | Descripción              |
| ---------- | ------------------------ |
| entrada    | Incrementa stock         |
| salida     | Reduce stock             |
| ajuste     | Ajusta stock total       |
| devolucion | Añade stock              |
| merma      | Reduce stock por pérdida |

---

## Sistema FIFO

Las salidas consumen stock por orden:

1. Fecha de caducidad más próxima
2. ID más antiguo

Esto permite:

* Minimizar pérdidas
* Gestión correcta de almacén
* Trazabilidad

---

## Tabla movimientos_inventario

Campos relevantes:

| Campo          | Descripción         |
| -------------- | ------------------- |
| producto_id    | Producto afectado   |
| inventario_id  | Lote afectado       |
| tipo           | Tipo movimiento     |
| cantidad       | Cantidad modificada |
| stock_anterior | Stock antes         |
| stock_nuevo    | Stock después       |
| motivo         | Motivo              |
| descripcion    | Descripción         |
| usuario_id     | Usuario responsable |
| created_at     | Fecha movimiento    |

---

## Endpoints de movimientos

### Obtener movimientos

```http
GET /movimientos
```

---

### Crear movimiento

```http
POST /movimientos
```

Ejemplo:

```json
{
  "tipo": "entrada",
  "producto_id": 1,
  "cantidad": 5,
  "numero_lote": "A-100",
  "fecha_caducidad": "2026-12-31"
}
```

---

# Módulo de Ventas Rápidas

Permite registrar ventas directamente desde el listado de productos.

Funcionamiento:

* Reduce stock
* Aplica FIFO
* Registra movimiento automático
* Actualiza inventario

---

## Endpoint

```http
PUT /ventas/:productId
```

Body:

```json
{
  "cantidad": 3
}
```

---

# Validaciones

El sistema incluye validaciones:

* nombres
* cantidades
* precios
* fechas
* categorías
* stock

Ejemplos:

* stock no negativo
* precio venta >= precio compra
* categorías válidas
* fechas correctas

---

# Seguridad

## Medidas implementadas

* JWT
* bcrypt
* separación tenant
* validaciones backend
* middleware autenticación
* prepared statements

---

# Base de datos

## Tablas principales

| Tabla                  | Función               |
| ---------------------- | --------------------- |
| tenants                | Empresas              |
| usuarios               | Usuarios              |
| categorias             | Categorías            |
| productos              | Productos             |
| inventario             | Lotes                 |
| movimientos_inventario | Historial movimientos |

---

# Sistema de timestamps

La aplicación utiliza:

```sql
created_at
updated_at
```

Ejemplo:

```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
ON UPDATE CURRENT_TIMESTAMP
```

Ventajas:

* Auditoría
* Historial
* Analítica
* Sincronización
* Depuración

---

# Frontend

## Funcionalidades

* Login
* Listado productos
* Búsqueda
* Filtros
* Ordenación
* Modal edición
* Gestión movimientos
* Ventas rápidas
* Indicadores de stock bajo
* Caducidades

---

# Flujo de actualización de stock

## Entrada

```txt
Movimiento entrada
→ Inserta o actualiza lote
→ Actualiza inventario
→ Registra movimiento
```

---

## Salida

```txt
Movimiento salida
→ Selecciona lotes FIFO
→ Reduce cantidades
→ Registra movimientos
```

---

# Escalabilidad futura

El sistema está preparado para añadir:

* panel administrativo
* roles avanzados
* dashboard analítico
* exportación Excel/PDF
* API pública
* aplicación móvil
* notificaciones
* alertas automáticas
* compras y proveedores
* pedidos
* clientes
* facturación
* ERP modular

---

# Recomendaciones futuras

## Backend

* añadir ORM
* logs centralizados
* tests automáticos
* rate limiting
* refresh tokens
* dockerización

---

## Frontend

* React Query
* Zustand
* virtualización tablas
* gráficos analíticos
* PWA

---

# Estado actual del proyecto

El sistema actualmente dispone de:

✅ Gestión multiempresa
✅ Inventario por lotes
✅ FIFO
✅ Movimientos
✅ Ventas rápidas
✅ Autenticación JWT
✅ Borrado lógico
✅ Validaciones backend
✅ Frontend React
✅ Arquitectura modular
✅ Sistema preparado para timestamps

---

# Objetivo del proyecto

Construir una plataforma SaaS modular de gestión de inventario orientada a pequeñas empresas y distribuidores con capacidad de crecer progresivamente hacia un ERP ligero.
