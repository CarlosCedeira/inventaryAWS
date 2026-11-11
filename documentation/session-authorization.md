# Autorización de sesión vigente

Cada petición protegida valida la firma y caducidad del JWT de la cookie
`bretema_session` y, después, consulta MySQL con el identificador de usuario,
tenant y versión de sesión firmados. Solo se autoriza una cuenta y empresa
activas con la misma versión de sesión; el rol usado por las rutas es el
recuperado en esa consulta, no el incluido en el token.

Por ello, desactivar una cuenta o tenant, cambiar el rol o restablecer la
contraseña se aplica en la siguiente petición protegida. El restablecimiento
incrementa `session_version`, por lo que revoca los JWT emitidos antes del cambio.
