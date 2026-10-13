-- Añade el rol comercial preservando los roles operativos existentes.
ALTER TABLE usuarios
  MODIFY COLUMN rol ENUM('owner', 'admin', 'almacen', 'vendedor') NOT NULL DEFAULT 'admin';
