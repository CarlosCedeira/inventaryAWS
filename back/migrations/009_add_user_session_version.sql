-- Revoca sesiones emitidas antes de un restablecimiento de contraseña.
ALTER TABLE usuarios
  ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER password_hash;
