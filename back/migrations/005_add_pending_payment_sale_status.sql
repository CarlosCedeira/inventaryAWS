ALTER TABLE ventas
  MODIFY COLUMN estado ENUM('borrador','pendiente_pago','completa','anulada','devuelta','parcialmente_devuelta') NOT NULL DEFAULT 'borrador';
