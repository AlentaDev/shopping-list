# Gestión de listas (web)

## Objetivo

Proveer una pantalla dedicada para gestionar listas por estado desde el menú de usuario. El borrador en progreso se gestiona en el modal de lista y no aparece en este listado.

## Endpoints

- `GET /api/lists` (carga de listas)
- `POST /api/lists/:id/duplicate` (reusar listas del historial)
- `DELETE /api/lists/:id` (borrar listas)
- Cambios de estado (pendiente de endpoint documentado)

## Reglas importantes

### Listado general

- Tabs por estado: **Activas**, **Historial**.
- Orden: fecha más nueva primero.
- No se muestran listas sin items.
- Nombre de la lista: máximo 35 caracteres, truncado con `…`.
- Estados vacíos: mostrar mensaje informativo.

### Activas (listado)

- Cada tarjeta muestra: nombre, nº de productos, fecha de activación y botón de borrar.
- Click en la tarjeta abre el detalle.
- Borrar abre un **modal** de confirmación (“no se puede recuperar”).
- Si falla el backend al borrar: toast de error y no se elimina en UI.

### Activas (detalle)

- Se muestran productos + total.
- Botones: **Editar**, **Cerrar**, **Borrar**.
- Borrar reutiliza el modal de confirmación del listado.

#### Editar lista activa

- Siempre se avisa: “No se podrá usar en móvil mientras se edita”.
- Si hay draft con items, se añade aviso: “Perderás la lista que estás confeccionando”.
- Si el draft está vacío, no se muestra esa parte del mensaje.
- Al editar, se marca `isEditing=true` en la lista activa.
- En móvil, una lista activa en edición se muestra solo lectura con aviso fijo.

### Historial (listado)

- Cada tarjeta muestra: nombre, nº de productos e icono de borrar.
- Click en la tarjeta abre el detalle.
- Borrar abre modal de confirmación.

### Historial (detalle)

- Se muestran productos + total.
- Botones: **Cerrar**, **Reusar**, **Borrar**.
- Reusar convierte la lista en draft.
- Solo se avisa de pérdida de draft si el draft tiene items.
- Borrar reutiliza el modal de confirmación del listado.

### Estado en móvil

- Si una lista activa está en edición (`isEditing=true`), en móvil solo se permite ver y se muestra aviso fijo de edición.

## Notas de implementación

- La pantalla se monta cuando la ruta es `/lists`.
- Los textos de UI se centralizan en `UI_TEXT.LISTS`.
  - Sub-objetos sugeridos: `UI_TEXT.LISTS.ACTIVE`, `UI_TEXT.LISTS.HISTORY`, `UI_TEXT.LISTS.DETAIL`.

### Estados de carga y feedback

- Skeletons en listado mientras carga.
- Placeholder en detalle para items (3–5 filas) y total.
- Botones con estado loading + disabled en borrar / reusar / editar.
- Banner de carga en detalle (“Cargando lista…”).
- Spinner pequeño junto al total si tarda en calcular/cargar.
- Bloqueo de doble click en acciones.
- Timeout amable (“Estamos tardando más de lo esperado”) con opción de reintentar.
- Toast solo para errores (no para loading).
- Banner offline: desactivar acciones de API si no hay red.
