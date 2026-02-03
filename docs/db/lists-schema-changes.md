# Cambios previstos en BD (listas)

## Objetivo

Documentar los cambios de esquema necesarios para soportar el nuevo flujo de listas en la web.

## Tabla `lists`

### Nuevas columnas

- `activated_at TIMESTAMPTZ NULL`
  - Fecha en la que una lista pasa a `ACTIVE`.
  - Se usa para ordenar el listado de activas.
- `is_editing BOOLEAN NOT NULL DEFAULT FALSE`
  - Indica si la lista activa está en edición.
  - Se usa para bloquear la edición en móvil.

### Consideraciones

- Mantener `status` (`DRAFT`, `ACTIVE`, `COMPLETED`).
- El autosave draft sigue marcado con `is_autosave_draft = true` y no aparece en el listado general.

## Índices sugeridos

- `lists_owner_user_id_idx` ya existe.
- Añadir índice compuesto si fuera necesario para ordenaciones frecuentes:
  - `(owner_user_id, activated_at DESC)` para activas.
  - `(owner_user_id, updated_at DESC)` para historial.

## Migraciones

- Añadir una migración que incluya ambas columnas y, opcionalmente, los índices de apoyo.
