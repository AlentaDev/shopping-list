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
- Añadir el mismo producto desde el catálogo incrementa la cantidad y muestra toast con foto + nombre.
- Los items se ordenan por categoría independientemente del orden de alta.
- El nombre se edita en línea con un icono de lápiz.
- Si el nombre está vacío, se usa el título genérico configurado en `UI_TEXT`.
- El decremento nunca baja de 1 y el incremento no supera 99.
- Si no hay items se muestra un estado vacío con mensaje.
- Si no hay items, no se muestra "Finalizar lista".
- Al marcar "Finalizar lista", la lista pasa a `ACTIVE` reutilizando el mismo registro.
- Tras finalizar, se elimina el autosave actual y no se crea un borrador nuevo hasta añadir un item.
- El borrado de productos es directo (sin modal de confirmación) y muestra toast.

## Notas de implementación

- Estado local en `features/shopping-list/ShoppingList.tsx`.
- Presentación desacoplada en `features/shopping-list/components/`.
