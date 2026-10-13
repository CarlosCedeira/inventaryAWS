-- Las ventas ya guardan su creador en ventas.usuario_id. Los detalles de venta,
-- líneas y devoluciones quedan acotados a través de esa relación; solo los
-- clientes necesitan registrar explícitamente quién los creó.
ALTER TABLE clientes
  ADD COLUMN usuario_id INT NULL AFTER tenant_id,
  ADD KEY idx_cliente_tenant_usuario (tenant_id, usuario_id),
  ADD CONSTRAINT fk_cliente_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id);
