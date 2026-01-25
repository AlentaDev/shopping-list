# Gestión de listas (web)

## Objetivo

Proveer una pantalla dedicada para gestionar listas por estado (`DRAFT`, `ACTIVE`, `COMPLETED`) desde el menú de usuario, con acciones claras por cada estado.

## Endpoints

- `GET /api/lists` (carga de listas)
- `POST /api/lists/:id/duplicate` (duplicar listas completadas)
- `DELETE /api/lists/:id` (borrar listas)
- Cambios de estado (pendiente de endpoint documentado)

## Reglas importantes

- Tabs por estado: **Borradores**, **Activas**, **Historial**.
- Acciones por estado:
  - `DRAFT`: editar, activar, borrar.
  - `ACTIVE`: editar, completar, borrar.
  - `COMPLETED`: ver, duplicar, borrar.
- Estados vacíos:
  - `DRAFT`: CTA “Crear lista”.
  - `ACTIVE` y `COMPLETED`: solo mensaje informativo.

## Notas de implementación

- La pantalla se monta cuando la ruta es `/lists`.
- Los textos de UI se centralizan en `UI_TEXT.LISTS`.
