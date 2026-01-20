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
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /api/lists/:id

**Response 200**

```json
{
  "id": "uuid",
  "title": "Groceries",
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
