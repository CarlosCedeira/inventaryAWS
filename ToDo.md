# Funcionalidades y tareas pendientes

## 1. UI / Frontend

### 1.1 Tabla productos







### 1.2 Nav

- [] Añadir en la parte inferio del nav el nombre y la foto de avatar del usuario.

- [] En dispositivos moviles el nav se tiene que ocultar al hacer click sobre un elemento.

## 2. Backend / Sanitización

- [] Hacer una lista de las rutas que hay que sanitizar en:

  - Backend
  - Frontend

- [] Sistema de gestion de usuarios

- [] Añadir filtrado por tenant_id

### Sesiones y autenticación

- [✓] Invalidar las sesiones existentes al restablecer una contraseña: añadir una migración con `session_version` en `usuarios`, incluirla en el JWT y rechazar en `requireAuth` los tokens cuya versión no coincida con la de MySQL.
- [✓] Añadir una prueba de integración: después de restablecer una contraseña, un JWT emitido antes del cambio debe responder `401`, y el inicio de sesión con la contraseña nueva debe funcionar.

## 2. Base de datos

- [] Cambiar las categorias de fiajs a personalizadas por tenant_id.

- [✓] Elimninar las tablas tipo_variante y vlaor_variante por datos json.

- [] Modificar las relaciones de otras tablas.

- [] Investigar mas campos necesarios para el producto como marca, peso, medida etc.

## 3. Test unitarios

### Backend: seguridad, permisos e integración

- [ ] Completar una matriz de permisos por endpoint y rol (`owner`, `admin`, `almacen`, `vendedor`), priorizando completar, anular, devolver y exportar ventas.
- [ ] Comprobar que un vendedor no puede consultar, completar, anular ni devolver ventas de otro vendedor del mismo tenant.
- [ ] Comprobar que un vendedor no puede consultar ni modificar clientes asignados a otro vendedor del mismo tenant.
- [ ] Añadir una prueba de concurrencia para dos devoluciones simultáneas sobre la última unidad vendida: solo una debe completarse y no se debe duplicar el stock ni el importe devuelto.
- [ ] Añadir pruebas de ciclo de vida de sesión: logout y expiración del JWT. La invalidación de tokens tras el restablecimiento de contraseña está cubierta.
- [ ] Probar el rate limit de `/auth/login`: debe bloquear nuevos intentos al superar el límite y permitirlos de nuevo al acabar la ventana configurada.
- [ ] Crear una suite que aplique todas las migraciones sobre una base vacía y compruebe claves, índices y restricciones de tenant resultantes.
- [ ] Reparar o eliminar el script `npm run test:integration:sql`, cuyo archivo objetivo no existe actualmente.
- [ ] Ejecutar las suites de integración HTTP/MySQL con `inventario_test` antes de cada despliegue; deben ejecutarse en serie, nunca en paralelo.

### 1. Productos

- [✓] Carga inicial

- [ ] Buscar productos

- [ ] Ordenar productos

- [✓] Formato de fecha

- [ ] Publicado

- [ ] Destacado

- [ ] Ranking
