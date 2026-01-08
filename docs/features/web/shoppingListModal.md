# Shopping list modal (web)

## Objetivo

Ofrecer un modal de carrito con los productos seleccionados usando datos mock en
frontend, permitiendo editar cantidades, eliminar líneas y ver el total.

## Endpoints

No aplica en esta iteración (mock local).

## Reglas importantes

- El badge del carrito cuenta líneas únicas, no cantidades.
- El modal se cierra con ESC, clic fuera o el botón "Cerrar".
- Los items se ordenan por categoría independientemente del orden de alta.
- Antes de guardar se solicita un nombre para la lista.
- El decremento nunca baja de 1 incluso si se manipula el HTML.
- No hay integración backend en esta iteración.

## Notas de implementación

- Estado local en `features/shopping-list/ShoppingList.tsx`.
- Presentación desacoplada en `features/shopping-list/components/`.
