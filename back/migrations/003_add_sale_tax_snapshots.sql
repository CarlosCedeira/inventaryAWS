ALTER TABLE lineas_venta
  ADD COLUMN impuesto_nombre VARCHAR(100) NULL AFTER precio_unitario,
  ADD COLUMN impuesto_porcentaje DECIMAL(5,2) NULL AFTER impuesto_nombre;
