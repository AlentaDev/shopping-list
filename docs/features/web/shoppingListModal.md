# Shopping list modal (web)

## Objetivo

Ofrecer un modal de carrito con los productos seleccionados, permitiendo editar
cantidades, eliminar líneas y ver el total.

## Endpoints

- `PATCH /api/lists/:id/activate` para activar la lista con `ACTIVE`.

## Reglas importantes

- El badge del carrito cuenta líneas únicas, no cantidades.
- El modal se cierra con ESC o clic fuera (sin botón "Cerrar").
- El botón "Añadir productos" navega al catálogo.
- Los items solo se añaden desde el catálogo (no hay alta manual).
- No se admiten notas en los items del carrito.
- **Deprecado:** los items manuales y las notas están en retirada; cualquier cambio futuro debe respetar el flujo solo catálogo.
- Añadir el mismo producto desde el catálogo incrementa la cantidad y muestra toast con foto + nombre.
- Los items se ordenan por categoría independientemente del orden de alta.
- El nombre se edita en línea con un icono de lápiz.
- Si el nombre está vacío, se usa el título genérico configurado en `UI_TEXT`.
- El decremento nunca baja de 1 y el incremento no supera 99.
- Si no hay items se muestra un estado vacío con mensaje.
- Si no hay items, no se muestra "Finalizar lista".
- Al iniciar sesión se crea/recupera el `DRAFT` único (autosave persistido en servidor), puede estar vacío y se reutiliza en los flujos de reusar/editar.
- El `DRAFT` no aparece en el listado principal de listas.
- Al marcar "Finalizar lista", la lista pasa a `ACTIVE` reutilizando el mismo registro.
- Tras finalizar, se limpia el autosave del `DRAFT` actual y se crea un `DRAFT` vacío para mantener el borrador único.
- El borrado de productos es directo (sin modal de confirmación) y muestra toast.
- Durante edición de una lista `ACTIVE`, `isEditing=true` aplica al conjunto (`ACTIVE` + `DRAFT` de edición).
- Si hay recarga (`reload/refresh`) durante esa edición activa, la app debe restaurar ese contexto y continuar en modo edición.
- Esa restauración no puede degradar a un flujo de `DRAFT` normal desacoplado de la `ACTIVE`.
- En edición activa: **Cancelar** desactiva `isEditing` y limpia `DRAFT`; **Finalizar** aplica cambios a `ACTIVE`, desactiva `isEditing` y limpia `DRAFT`.

### Decision rationale

Se mantiene la política de permitir `DRAFT` vacío para que la experiencia web tenga un punto de sincronización estable desde el inicio de sesión, sin esperar al primer item. A cambio de guardar un registro vacío, se obtiene un flujo más consistente para recuperación, edición y reutilización.


### Web source of truth (normativo)

- Web lee y escribe primero en `LOCAL_DRAFT`.
- El autosave sincroniza al `DRAFT` del servidor como backup.
- El `DRAFT` del servidor se usa para bootstrap/recuperación, no como estado primario de edición.
- Flujo ejemplo: editar item -> actualizar `LOCAL_DRAFT` al instante -> lanzar autosave con debounce -> persistir en `DRAFT` remoto.

## Notas de implementación

- Estado local en `features/shopping-list/ShoppingList.tsx`.
- Presentación desacoplada en `features/shopping-list/components/`.
