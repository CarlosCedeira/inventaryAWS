# Autorización de sesión vigente

Cada petición protegida valida la firma y caducidad del JWT de la cookie
`bretema_session` y, después, consulta MySQL con el identificador de usuario y
tenant firmado. Solo se autoriza una cuenta y empresa activas; el rol usado por
las rutas es el recuperado en esa consulta, no el incluido en el token.

Por ello, desactivar una cuenta o tenant, o cambiar el rol, se aplica en la
siguiente petición protegida. Esta medida no revoca por sí sola JWT emitidos
antes de un cambio de contraseña.
