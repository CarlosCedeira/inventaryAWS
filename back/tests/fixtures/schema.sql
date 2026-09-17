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
rol enum('admin','vendedor') DEFAULT 'vendedor',
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

CREATE TABLE IF NOT EXISTS productos (
id int NOT NULL AUTO_INCREMENT,
tenant_id int NOT NULL,
nombre varchar(200) NOT NULL,
descripcion text,
categoria_id int DEFAULT NULL,
precio_compra decimal(10,2) NOT NULL DEFAULT '0.00',
precio_venta decimal(10,2) NOT NULL DEFAULT '0.00',
stock_minimo int NOT NULL,
eliminado tinyint(1) NOT NULL DEFAULT '0',
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id),
KEY tenant_id (tenant_id),
KEY productos_ibfk_2 (categoria_id),
CONSTRAINT productos_ibfk_1 FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
CONSTRAINT productos_ibfk_2 FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE SET NULL
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
