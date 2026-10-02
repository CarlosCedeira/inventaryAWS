-- Amplía la tabla existente `clientes` sin eliminar sus datos históricos.
-- Los clientes anteriores quedan con tenant_id NULL hasta que se les asigne una empresa.
ALTER TABLE clientes
  ADD COLUMN tenant_id INT NULL AFTER id,
  ADD COLUMN telefono VARCHAR(30) NULL AFTER contacto_email,
  ADD COLUMN identificacion_fiscal VARCHAR(30) NULL AFTER telefono,
  ADD COLUMN direccion VARCHAR(255) NULL AFTER identificacion_fiscal,
  MODIFY COLUMN tarifa INT NOT NULL DEFAULT 0,
  ADD KEY idx_cliente_tenant_nombre (tenant_id, nombre),
  ADD UNIQUE KEY uq_cliente_identificacion_tenant (tenant_id, identificacion_fiscal),
  ADD CONSTRAINT fk_cliente_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id);
