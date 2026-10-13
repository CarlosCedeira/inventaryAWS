-- Permite asignar el rol de almacén sin modificar los roles existentes.
ALTER TABLE usuarios
  MODIFY COLUMN rol ENUM('owner', 'admin', 'almacen') NOT NULL DEFAULT 'admin';
