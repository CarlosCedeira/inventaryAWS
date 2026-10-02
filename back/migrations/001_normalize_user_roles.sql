-- Ejecutar una sola vez antes de desplegar la versión con roles owner/admin.
-- Conserva los administradores existentes y convierte los vendedores en admin.
ALTER TABLE usuarios
  MODIFY COLUMN rol ENUM('owner', 'admin', 'vendedor') NOT NULL DEFAULT 'admin';

UPDATE usuarios
SET rol = 'admin'
WHERE rol = 'vendedor';

ALTER TABLE usuarios
  MODIFY COLUMN rol ENUM('owner', 'admin') NOT NULL DEFAULT 'admin';
