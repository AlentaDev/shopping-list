# Listas agrupadas por categorías (web)

## Resumen

La web agrupa ítems por `categorySnapshot` nivel 1 en `DRAFT`, `ACTIVE` y `COMPLETED`.
`subcategorySnapshot` se persiste como metadata, pero no define la agrupación.

## Reglas

- El backend persiste `categorySnapshot` / `subcategorySnapshot` en alta desde catálogo y autosave.
- La UI no consulta el catálogo para clasificar al renderizar.
- Si falta `categorySnapshot`, se usa `Sin categoría`.
- La agrupación debe ser estable en recargas y rehidratación del draft.

## Comportamiento por estado

- **DRAFT**: usa el snapshot local y el autosave remoto como respaldo.
- **ACTIVE**: muestra la lista agrupada en detalle solo lectura.
- **COMPLETED**: mantiene la misma agrupación para historial y detalle.

## Notas

- El fallback `Sin categoría` existe para ítems históricos sin metadata.
- La subcategoría solo acompaña la clasificación; no cambia el eje de agrupación.
