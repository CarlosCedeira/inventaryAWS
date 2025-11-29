# Funcionalidades y tareas pendientes

## 1. UI / Frontend

### 1.1 Tabla productos

- [✓] Posibilidad de añadir más márgenes a los lados en la versión de escritorio.

- [✓] Cambiar margenes de la tabla y card layout en version tablet y movil

  - [✓] Tabla productos
  - [✓] Card layout

- [] Componente que englobe:

  - [] Buscar por...
    - [] Buscar por nombre.
    - [] Buscar por numero de lote.
    - [] Buscar por SKU.
    - [] Buscar por codigo de barras.
  - [] Categoria.
  - [] Cantidad.
  - [] Precio.
  - [] Caducidad.

- [] Añadir una vista predefinida que represente el orden de los elementos en la página web.

- [✓] Crear nuevos componentes similares a Publicado para:

  - [✓] Recomendado
  - [✓] Destacado
  - [✓] Ranking

- [✓] Publicado destacado y recomendado tienen que aparecer debajo de editar y cerrar.

- [✓] Eliminar filas en versión móvil:

  - [✓] Precio de compra
  - [✓] Categoría

- [] Cambiar input de texto a select en:

  - [✓] Categoría
  - [] Variante
  - [] Valor

- [] Formatear las fechas tanto en la salida como en la entrada.

- [✓] Spiner al activar el modal.

- [] Añadir contexto en Publicado para que las animaciones estén sincronizadas.

- [] Boton para añadir formulario activa card layout vacio y editable.

### 1.2 Nav

- [] Añadir en la parte inferio del nav el nombre y la foto de avatar del usuario.

- [] En dispositivos moviles el nav se tiene que ocultar al hacer click sobre un elemento.

## 2. Backend / Sanitización

- [] Hacer una lista de las rutas que hay que sanitizar en:

  - Backend
  - Frontend

- [] Sistema de gestion de usuarios

- [] Añadir filtrado por tenant_id

## 2. Base de datos

- [] Cambiar las categorias de fiajs a personalizadas por tenant_id

- [] Elimninar las tablas tipo_variante y vlaor_variante por datos json y modificar las relaciones de otras tablas

- [] Investigar mas campos necesarios para el producto como marca, peso, medida etc.

## 3. Test unitarios

### 1. Productos

- [✓] Carga inicial

- [ ] Buscar productos

- [ ] Ordenar productos

- [✓] Formato de fecha

- [ ] Publicado

- [ ] Destacado

- [ ] Ranking
