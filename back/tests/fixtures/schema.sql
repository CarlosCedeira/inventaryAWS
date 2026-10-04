CREATE TABLE IF NOT EXISTS tenants (
id int NOT NULL AUTO_INCREMENT,
nombre varchar(150) NOT NULL,
contacto_email varchar(150) DEFAULT NULL,
tarifa int NOT NULL,
activo tinyint(1) DEFAULT '1',
fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS usuarios (
id int NOT NULL AUTO_INCREMENT,
tenant_id int NOT NULL,
nombre varchar(150) NOT NULL,
email varchar(150) NOT NULL,
password_hash varchar(255) NOT NULL,
rol enum('owner','admin') NOT NULL DEFAULT 'admin',
activo tinyint(1) DEFAULT '1',
fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id),
UNIQUE KEY uq_usuario_email_tenant (tenant_id,email),
CONSTRAINT usuarios_ibfk_1 FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS categorias (
id int NOT NULL AUTO_INCREMENT,
nombre varchar(150) NOT NULL,
descripcion text,
tenant_id int NOT NULL,
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id),
KEY fk_categorias_tenant (tenant_id),
CONSTRAINT fk_categorias_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS impuestos (
id int NOT NULL AUTO_INCREMENT,
nombre varchar(100) NOT NULL,
porcentaje decimal(5,2) NOT NULL,
pais_codigo char(2) NOT NULL DEFAULT 'ES',
activo tinyint NOT NULL DEFAULT '1',
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS productos (
id int NOT NULL AUTO_INCREMENT,
tenant_id int NOT NULL,
nombre varchar(200) NOT NULL,
descripcion text,
categoria_id int DEFAULT NULL,
impuesto_id int DEFAULT NULL,
precio_compra decimal(10,2) NOT NULL DEFAULT '0.00',
precio_venta decimal(10,2) NOT NULL DEFAULT '0.00',
stock_minimo int NOT NULL,
eliminado tinyint(1) NOT NULL DEFAULT '0',
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id),
KEY tenant_id (tenant_id),
KEY productos_ibfk_2 (categoria_id),
KEY idx_productos_impuesto (impuesto_id),
CONSTRAINT productos_ibfk_1 FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
CONSTRAINT productos_ibfk_2 FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE SET NULL,
CONSTRAINT fk_productos_impuesto FOREIGN KEY (impuesto_id) REFERENCES impuestos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS inventario (
id int NOT NULL AUTO_INCREMENT,
tenant_id int NOT NULL,
producto_id int NOT NULL,
cantidad int NOT NULL,
fecha_caducidad date DEFAULT NULL,
numero_lote varchar(100) DEFAULT NULL,
updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (id),
UNIQUE KEY uq_inventario_lote (tenant_id,producto_id,numero_lote,fecha_caducidad),
KEY producto_id (producto_id),
CONSTRAINT inventario_ibfk_1 FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
CONSTRAINT inventario_ibfk_2 FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS movimientos_inventario (
id int NOT NULL AUTO_INCREMENT,
tenant_id int NOT NULL,
producto_id int NOT NULL,
inventario_id int DEFAULT NULL,
tipo enum('entrada','salida','ajuste') NOT NULL,
cantidad int NOT NULL,
stock_anterior int NOT NULL,
stock_nuevo int NOT NULL,
numero_lote varchar(100) DEFAULT NULL,
fecha_caducidad date DEFAULT NULL,
motivo varchar(255) DEFAULT NULL,
descripcion text,
usuario_id int NOT NULL,
updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (id),
KEY idx_mov_tenant_producto (tenant_id,producto_id),
KEY idx_mov_inventario (inventario_id),
KEY idx_mov_tipo (tipo),
KEY idx_mov_usuario (usuario_id),
KEY fk_mov_producto (producto_id),
KEY idx_mov_fecha (created_at),
KEY idx_mov_tenant_fecha (tenant_id,created_at),
CONSTRAINT fk_mov_inventario FOREIGN KEY (inventario_id) REFERENCES inventario (id),
CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id) REFERENCES productos (id),
CONSTRAINT fk_mov_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
CONSTRAINT fk_mov_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS clientes (
id int NOT NULL AUTO_INCREMENT,
tenant_id int NOT NULL,
nombre varchar(150) NOT NULL,
contacto_email varchar(150) DEFAULT NULL,
telefono varchar(30) DEFAULT NULL,
identificacion_fiscal varchar(30) DEFAULT NULL,
direccion varchar(255) DEFAULT NULL,
activo tinyint(1) NOT NULL DEFAULT '1',
tarifa int NOT NULL DEFAULT '0',
fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id),
UNIQUE KEY uq_cliente_identificacion_tenant (tenant_id,identificacion_fiscal),
KEY idx_cliente_tenant_nombre (tenant_id,nombre),
CONSTRAINT fk_cliente_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ventas (
id int NOT NULL AUTO_INCREMENT, tenant_id int NOT NULL, cliente_id int DEFAULT NULL, usuario_id int NOT NULL,
estado enum('borrador','pendiente_pago','completa','anulada','devuelta','parcialmente_devuelta') NOT NULL DEFAULT 'borrador', referencia varchar(64) DEFAULT NULL,
moneda char(3) NOT NULL DEFAULT 'EUR', cliente_nombre varchar(150) DEFAULT NULL, cliente_email varchar(150) DEFAULT NULL,
cliente_identificacion_fiscal varchar(30) DEFAULT NULL, subtotal decimal(12,2) NOT NULL DEFAULT '0.00',
descuento_total decimal(12,2) NOT NULL DEFAULT '0.00', impuesto_total decimal(12,2) NOT NULL DEFAULT '0.00',
total decimal(12,2) NOT NULL DEFAULT '0.00', observaciones text DEFAULT NULL, fecha_confirmacion datetime DEFAULT NULL,
fecha_anulacion datetime DEFAULT NULL, anulada_por int DEFAULT NULL, motivo_anulacion varchar(255) DEFAULT NULL,
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id), UNIQUE KEY uq_venta_tenant_referencia (tenant_id,referencia),
CONSTRAINT fk_venta_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
CONSTRAINT fk_venta_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id),
CONSTRAINT fk_venta_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
CONSTRAINT fk_venta_anulada_por FOREIGN KEY (anulada_por) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS lineas_venta (
id int NOT NULL AUTO_INCREMENT, tenant_id int NOT NULL, venta_id int NOT NULL, producto_id int NOT NULL,
descripcion varchar(200) NOT NULL, cantidad int NOT NULL,
estado enum('completa','parcialmente_devuelta','devuelta','cancelada') NOT NULL DEFAULT 'completa', cantidad_devuelta int NOT NULL DEFAULT 0,
precio_unitario decimal(12,2) NOT NULL,
impuesto_nombre varchar(100) DEFAULT NULL, impuesto_porcentaje decimal(5,2) DEFAULT NULL,
descuento_total decimal(12,2) NOT NULL DEFAULT '0.00', impuesto_total decimal(12,2) NOT NULL DEFAULT '0.00', importe_total decimal(12,2) NOT NULL,
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id), CONSTRAINT fk_linea_venta_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
CONSTRAINT fk_linea_venta_venta FOREIGN KEY (venta_id) REFERENCES ventas (id),
CONSTRAINT fk_linea_venta_producto FOREIGN KEY (producto_id) REFERENCES productos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS devoluciones (
id int NOT NULL AUTO_INCREMENT, tenant_id int NOT NULL, venta_id int NOT NULL, usuario_id int NOT NULL,
estado enum('confirmada','anulada') NOT NULL DEFAULT 'confirmada', motivo varchar(255) NOT NULL,
subtotal decimal(12,2) NOT NULL DEFAULT '0.00', impuesto_total decimal(12,2) NOT NULL DEFAULT '0.00', total decimal(12,2) NOT NULL DEFAULT '0.00',
fecha_devolucion datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id), KEY idx_devoluciones_tenant_venta (tenant_id,venta_id),
CONSTRAINT fk_devolucion_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
CONSTRAINT fk_devolucion_venta FOREIGN KEY (venta_id) REFERENCES ventas (id),
CONSTRAINT fk_devolucion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS lineas_devolucion (
id int NOT NULL AUTO_INCREMENT, tenant_id int NOT NULL, devolucion_id int NOT NULL, linea_venta_id int NOT NULL,
movimiento_salida_id int NOT NULL, producto_id int NOT NULL, cantidad int NOT NULL, precio_unitario decimal(12,2) NOT NULL,
impuesto_porcentaje decimal(5,2) NOT NULL DEFAULT '0.00', impuesto_total decimal(12,2) NOT NULL DEFAULT '0.00', importe_total decimal(12,2) NOT NULL,
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id),
KEY idx_linea_devolucion_tenant_venta (tenant_id,linea_venta_id), KEY idx_linea_devolucion_movimiento (movimiento_salida_id),
CONSTRAINT fk_linea_devolucion_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
CONSTRAINT fk_linea_devolucion_devolucion FOREIGN KEY (devolucion_id) REFERENCES devoluciones (id),
CONSTRAINT fk_linea_devolucion_venta FOREIGN KEY (linea_venta_id) REFERENCES lineas_venta (id),
CONSTRAINT fk_linea_devolucion_movimiento FOREIGN KEY (movimiento_salida_id) REFERENCES movimientos_inventario (id),
CONSTRAINT fk_linea_devolucion_producto FOREIGN KEY (producto_id) REFERENCES productos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE movimientos_inventario ADD COLUMN linea_venta_id INT NULL AFTER inventario_id;
ALTER TABLE movimientos_inventario ADD CONSTRAINT fk_mov_linea_venta FOREIGN KEY (linea_venta_id) REFERENCES lineas_venta (id);
ALTER TABLE movimientos_inventario ADD COLUMN linea_devolucion_id INT NULL AFTER linea_venta_id;
ALTER TABLE movimientos_inventario ADD CONSTRAINT fk_mov_linea_devolucion FOREIGN KEY (linea_devolucion_id) REFERENCES lineas_devolucion (id);
ALTER TABLE productos ADD COLUMN impuesto_id INT NULL AFTER categoria_id;
ALTER TABLE productos ADD CONSTRAINT fk_productos_impuesto FOREIGN KEY (impuesto_id) REFERENCES impuestos (id);
ALTER TABLE lineas_venta ADD COLUMN impuesto_nombre VARCHAR(100) NULL AFTER precio_unitario;
ALTER TABLE lineas_venta ADD COLUMN impuesto_porcentaje DECIMAL(5,2) NULL AFTER impuesto_nombre;

ALTER TABLE ventas MODIFY COLUMN estado ENUM('borrador','confirmada','completa','anulada','devuelta','parcialmente_devuelta') NOT NULL DEFAULT 'borrador';
UPDATE ventas SET estado = 'completa' WHERE id > 0 AND estado = 'confirmada';
ALTER TABLE ventas MODIFY COLUMN estado ENUM('borrador','completa','anulada','devuelta','parcialmente_devuelta') NOT NULL DEFAULT 'borrador';
ALTER TABLE ventas MODIFY COLUMN estado ENUM('borrador','pendiente_pago','completa','anulada','devuelta','parcialmente_devuelta') NOT NULL DEFAULT 'borrador';
ALTER TABLE lineas_venta ADD COLUMN estado ENUM('completa','parcialmente_devuelta','devuelta','cancelada') NOT NULL DEFAULT 'completa' AFTER cantidad;
ALTER TABLE lineas_venta ADD COLUMN cantidad_devuelta INT NOT NULL DEFAULT 0 AFTER estado;

-- Mantiene compatible una base inventario_test creada con el esquema anterior.
ALTER TABLE usuarios
  MODIFY COLUMN rol ENUM('owner','admin','vendedor') NOT NULL DEFAULT 'admin';
UPDATE usuarios SET rol = 'admin' WHERE rol = 'vendedor';
ALTER TABLE usuarios
  MODIFY COLUMN rol ENUM('owner','admin') NOT NULL DEFAULT 'admin';
