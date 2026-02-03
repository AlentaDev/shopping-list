# Shopping list modal (web)

## Objetivo

Ofrecer un modal de carrito con los productos seleccionados usando datos mock en
frontend, permitiendo editar cantidades, eliminar líneas y ver el total.

## Endpoints

- `PATCH /api/lists/:id/status` para activar la lista con `ACTIVE`.

## Reglas importantes

- El badge del carrito cuenta líneas únicas, no cantidades.
- El modal se cierra con ESC, clic fuera o el botón "Cerrar".
- Los items se ordenan por categoría independientemente del orden de alta.
- El nombre se edita en línea con un icono de lápiz.
- Si el nombre está vacío, se usa el título genérico configurado en `UI_TEXT`.
- El decremento nunca baja de 1 incluso si se manipula el HTML.
- Si no hay items se muestra un estado vacío con mensaje.
- Al marcar "Confirmar lista", la lista pasa a `ACTIVE` reutilizando el mismo registro.
- Tras confirmar, el borrador local/autosave se limpia (sin items) y vuelve al título genérico.
- El borrado de productos es directo (sin modal de confirmación).

## Notas de implementación

- Estado local en `features/shopping-list/ShoppingList.tsx`.
- Presentación desacoplada en `features/shopping-list/components/`.
