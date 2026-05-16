# Snapshots de lista + lock de edición (API)

## Resumen

El backend guarda snapshots de categoría al agregar ítems desde catálogo y al autosave.
Además, `complete` rechaza el cierre cuando la lista activa sigue bloqueada por edición.

## Contratos

- `POST /api/lists/:id/items/from-catalog` persiste `categorySnapshot` y `subcategorySnapshot`.
- `PUT /api/lists/autosave` acepta snapshots opcionales y los conserva en la respuesta.
- `GET /api/lists`, `GET /api/lists/:id`, `reuse` y `complete` exponen las snapshots sin exigir backfill.

## Bloqueo de edición

- Si una `ACTIVE` tiene edición activa (`isEditing=true`), `POST /api/lists/:id/complete` responde `409`.
- Error canónico: `list_editing_locked`.
- La API no debe completar silenciosamente sobre una sesión de edición abierta.

## Notas

- Las listas históricas sin snapshots siguen siendo válidas.
- `subcategorySnapshot` es metadata opcional; no afecta identidad ni agrupación.
