# Lists (Phase 1)

## Resumen

El módulo de listas permite crear y gestionar listas de compra para usuarios autenticados. Los invitados no persisten listas en el servidor.

## Endpoints

### POST /api/lists

**Request**

```json
{
  "title": "Groceries"
}
```

**Response 201**

```json
{
  "id": "uuid",
  "title": "Groceries",
  "status": "DRAFT",
  "itemCount": 0,
  "activatedAt": null,
  "isEditing": false,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/lists

**Response 200**

```json
{
  "lists": [
    {
      "id": "uuid",
      "title": "Groceries",
      "status": "ACTIVE",
      "itemCount": 12,
      "activatedAt": "2024-01-01T00:00:00.000Z",
      "isEditing": false,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Notas**

- El listado general excluye el autosave draft y listas en estado `DRAFT`.
- Orden por fecha más reciente (Activas: `activatedAt`, Historial: `updatedAt`).

### GET /api/lists/autosave

**Response 200**

```json
{
  "id": "uuid",
  "title": "Autosave",
  "items": [
    {
      "id": "uuid",
      "kind": "manual",
      "name": "Milk",
      "qty": 1,
      "checked": false,
      "note": "Optional note",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

Si no hay borrador autosave, responde con `null`.

### PUT /api/lists/autosave

**Request**

```json
{
  "title": "Autosave",
  "items": [
    {
      "id": "uuid",
      "kind": "manual",
      "name": "Milk",
      "qty": 1,
      "checked": false,
      "note": "Optional note"
    }
  ]
}
```

**Response 200**

```json
{
  "id": "uuid",
  "title": "Autosave",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/lists/:id

**Response 200**

```json
{
  "id": "uuid",
  "title": "Groceries",
  "status": "ACTIVE",
  "isEditing": false,
  "activatedAt": "2024-01-01T00:00:00.000Z",
  "itemCount": 1,
  "items": [
    {
      "id": "uuid",
      "name": "Milk",
      "qty": 1,
      "checked": false,
      "note": "Optional note",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PATCH /api/lists/:id/status

**Request**

```json
{
  "status": "ACTIVE"
}
```

Para completar la lista y sincronizar items marcados:

```json
{
  "status": "COMPLETED",
  "checkedItemIds": ["uuid"]
}
```

**Response 200**

```json
{
  "id": "uuid",
  "status": "ACTIVE",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### DELETE /api/lists/:id

**Response 200**

```json
{
  "ok": true
}
```

### DELETE /api/lists/autosave

**Response 204**

Sin contenido (autosave descartado).

### POST /api/lists/:id/items

**Request**

```json
{
  "name": "Milk",
  "qty": 2,
  "note": "Optional note"
}
```

**Response 201**

```json
{
  "id": "uuid",
  "name": "Milk",
  "qty": 2,
  "checked": false,
  "note": "Optional note",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PATCH /api/lists/:id/items/:itemId

**Request**

```json
{
  "checked": true,
  "qty": 3,
  "note": "Updated note"
}
```

**Response 200**

```json
{
  "id": "uuid",
  "name": "Milk",
  "qty": 3,
  "checked": true,
  "note": "Updated note",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### DELETE /api/lists/:id/items/:itemId

**Response 200**

```json
{
  "ok": true
}
```

### POST /api/lists/:id/duplicate

Duplica una lista completada creando una nueva lista en `DRAFT` con los mismos items sin marcar.

### POST /api/lists/:id/reuse

Reusa una lista completada creando una nueva lista en `DRAFT` con los mismos items sin marcar.

> Nota: `/api/lists/:id/duplicate` se mantiene por compatibilidad, pero el endpoint preferido es `/api/lists/:id/reuse`.

### PATCH /api/lists/:id/editing

Marca una lista activa como en edición (`isEditing=true`).

**Response 200**

```json
{
  "id": "uuid",
  "isEditing": true,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Response 201**

```json
{
  "id": "uuid",
  "title": "Groceries",
  "status": "DRAFT",
  "items": [
    {
      "id": "uuid",
      "name": "Milk",
      "qty": 1,
      "checked": false,
      "note": "Optional note",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Notas de implementación

- Todas las rutas requieren sesión autenticada.
- La persistencia por defecto es en memoria mediante `InMemoryListRepository` (hay alternativa Postgres).
- La autorización restringe el acceso a las listas del propietario.
- Validación de payloads con Zod y errores uniformes de validación.
- La duplicación solo aplica a listas en estado `COMPLETED`.

## Cambios previstos (API)

- Añadir soporte de `isEditing` para marcar listas activas en edición (y bloquear edición en móvil).
- Persistir `activatedAt` cuando una lista pasa a `ACTIVE`.
- Ajustar `GET /api/lists` para incluir `status`, `itemCount`, `activatedAt` y excluir autosave/draft.
- Renombrar el concepto `duplicate` como `reusar` en documentación y UI (el endpoint puede mantenerse con el mismo path).
