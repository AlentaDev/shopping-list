# Listas agrupadas por categorías (Android)

## Resumen

Android consume snapshots de categoría/subcategoría y agrupa por `categorySnapshot` nivel 1.

## Regla funcional

- `categorySnapshot` es el eje de agrupación.
- `subcategorySnapshot` se conserva como metadata.
- Si falta categoría, el fallback visible es `Sin categoría`.

## Persistencia

- Room fue migrado para guardar columnas nullable de snapshots.
- La rehidratación mantiene la agrupación después de recarga o sync.

## Conflicto de edición

- Si `complete` detecta una lista en edición (`isEditing=true`), Android debe manejar el `409 list_editing_locked`.
- El flujo no debe asumir cierre exitoso sin resolver el lock.

## Notas

- Las listas `DRAFT`, `ACTIVE` y `COMPLETED` usan la misma semántica de agrupación.
- El fallback histórico evita fallos con datos antiguos sin metadata.
