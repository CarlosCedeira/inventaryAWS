ALTER TABLE ventas
  MODIFY COLUMN estado ENUM('borrador','confirmada','completa','anulada','devuelta','parcialmente_devuelta') NOT NULL DEFAULT 'borrador';

UPDATE ventas SET estado = 'completa' WHERE id > 0 AND estado = 'confirmada';

ALTER TABLE ventas
  MODIFY COLUMN estado ENUM('borrador','completa','anulada','devuelta','parcialmente_devuelta') NOT NULL DEFAULT 'borrador';

ALTER TABLE lineas_venta
  ADD COLUMN estado ENUM('completa','parcialmente_devuelta','devuelta','cancelada') NOT NULL DEFAULT 'completa' AFTER cantidad,
  ADD COLUMN cantidad_devuelta INT NOT NULL DEFAULT 0 AFTER estado;

CREATE TABLE devoluciones (
  id INT NOT NULL AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  venta_id INT NOT NULL,
  usuario_id INT NOT NULL,
  estado ENUM('confirmada','anulada') NOT NULL DEFAULT 'confirmada',
  motivo VARCHAR(255) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  impuesto_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  fecha_devolucion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_devoluciones_tenant_venta (tenant_id, venta_id),
  CONSTRAINT fk_devolucion_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
  CONSTRAINT fk_devolucion_venta FOREIGN KEY (venta_id) REFERENCES ventas (id),
  CONSTRAINT fk_devolucion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lineas_devolucion (
  id INT NOT NULL AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  devolucion_id INT NOT NULL,
  linea_venta_id INT NOT NULL,
  movimiento_salida_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  impuesto_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  impuesto_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  importe_total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_linea_devolucion_tenant_venta (tenant_id, linea_venta_id),
  KEY idx_linea_devolucion_movimiento (movimiento_salida_id),
  CONSTRAINT fk_linea_devolucion_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
  CONSTRAINT fk_linea_devolucion_devolucion FOREIGN KEY (devolucion_id) REFERENCES devoluciones (id),
  CONSTRAINT fk_linea_devolucion_venta FOREIGN KEY (linea_venta_id) REFERENCES lineas_venta (id),
  CONSTRAINT fk_linea_devolucion_movimiento FOREIGN KEY (movimiento_salida_id) REFERENCES movimientos_inventario (id),
  CONSTRAINT fk_linea_devolucion_producto FOREIGN KEY (producto_id) REFERENCES productos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE movimientos_inventario
  ADD COLUMN linea_devolucion_id INT NULL AFTER linea_venta_id,
  ADD KEY idx_mov_linea_devolucion (linea_devolucion_id),
  ADD CONSTRAINT fk_mov_linea_devolucion FOREIGN KEY (linea_devolucion_id) REFERENCES lineas_devolucion (id);
