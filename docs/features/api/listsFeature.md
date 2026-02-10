# Lists (Phase 1)

## Resumen

El módulo de listas permite crear y gestionar listas de compra para usuarios autenticados. Los invitados no persisten listas en el servidor.
Existe un **único `DRAFT` por usuario** y siempre es el autosave persistido en servidor. En el modelo actual corresponde a `status=DRAFT` con `is_autosave_draft` cuando aplica. Puede estar vacío y se reutiliza entre flujos (crear, `ReuseList`, editar).

### Decision rationale

Se prefiere permitir `DRAFT` vacío para mantener contratos API estables y unificados en todos los flujos. Esta decisión evita lógica especial de creación diferida del autosave y facilita la recuperación de sesión con menor complejidad en cliente y servidor.

> **Deprecado:** los items manuales están en proceso de eliminación y se retirarán de la API, la base de datos y la web. Todas las evoluciones futuras deben asumir listas **solo de catálogo**.

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

- El listado general excluye listas en estado `DRAFT`.
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
      "kind": "catalog",
      "name": "Milk",
      "qty": 1,
      "checked": false,
      "source": "mercadona",
      "sourceProductId": "123",
      "thumbnail": "https://cdn.example.com/milk.png",
      "price": 1.25,
      "unitSize": 1,
      "unitFormat": "L",
      "unitPrice": 1.25,
      "isApproxSize": false,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

Si no hay `DRAFT`, responde con `204`.
El autosave se crea o recupera al autenticarse (puede estar vacío) y se actualiza cuando el frontend guarda cambios del `LOCAL_DRAFT` o del propio `DRAFT`.

### PUT /api/lists/autosave

**Request**

```json
{
  "title": "Autosave",
  "items": [
    {
      "id": "uuid",
      "kind": "catalog",
      "name": "Milk",
      "qty": 1,
      "checked": false,
      "source": "mercadona",
      "sourceProductId": "123",
      "thumbnail": "https://cdn.example.com/milk.png",
      "price": 1.25,
      "unitSize": 1,
      "unitFormat": "L",
      "unitPrice": 1.25,
      "isApproxSize": false
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

Sobrescribe el `DRAFT` con el contenido enviado (incluyendo el caso vacío).

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
      "kind": "catalog",
      "name": "Milk",
      "qty": 1,
      "checked": false,
      "source": "mercadona",
      "sourceProductId": "123",
      "thumbnail": "https://cdn.example.com/milk.png",
      "price": 1.25,
      "unitSize": 1,
      "unitFormat": "L",
      "unitPrice": 1.25,
      "isApproxSize": false,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PATCH /api/lists/:id/activate

**Request**

```json
{
  "status": "ACTIVE"
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

**Regla:** solo se permite activar si el `DRAFT` tiene items. Tras activar, se crea un `DRAFT` vacío para mantener el borrador único.

### POST /api/lists/:id/complete

Completa una lista activa y sincroniza items marcados.

**Request**

```json
{
  "checkedItemIds": ["uuid"]
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

Sin contenido (`DRAFT` descartado).

### POST /api/lists/:id/items/from-catalog

**Request**

```json
{
  "source": "mercadona",
  "productId": "123",
  "qty": 2
}
```

**Response 201**

```json
{
  "id": "uuid",
  "kind": "catalog",
  "name": "Milk",
  "qty": 2,
  "checked": false,
  "source": "mercadona",
  "sourceProductId": "123",
  "thumbnail": "https://cdn.example.com/milk.png",
  "price": 1.25,
  "unitSize": 1,
  "unitFormat": "L",
  "unitPrice": 1.25,
  "isApproxSize": false,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PATCH /api/lists/:id/items/:itemId

**Request**

```json
{
  "checked": true,
  "qty": 3
}
```

**Response 200**

```json
{
  "id": "uuid",
  "kind": "catalog",
  "name": "Milk",
  "qty": 3,
  "checked": true,
  "source": "mercadona",
  "sourceProductId": "123",
  "thumbnail": "https://cdn.example.com/milk.png",
  "price": 1.25,
  "unitSize": 1,
  "unitFormat": "L",
  "unitPrice": 1.25,
  "isApproxSize": false,
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

### POST /api/lists/:id/reuse

Caso de uso **ReuseList**: reusa una lista completada sobrescribiendo el `DRAFT` único con los mismos items sin marcar.

**Response 201**

```json
{
  "id": "uuid",
  "title": "Groceries",
  "status": "DRAFT",
  "items": [
    {
      "id": "uuid",
      "kind": "catalog",
      "name": "Milk",
      "qty": 1,
      "checked": false,
      "source": "mercadona",
      "sourceProductId": "123",
      "thumbnail": "https://cdn.example.com/milk.png",
      "price": 1.25,
      "unitSize": 1,
      "unitFormat": "L",
      "unitPrice": 1.25,
      "isApproxSize": false,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PATCH /api/lists/:id/editing

Marca una lista activa como en edición (`isEditing=true`) o la desactiva (`isEditing=false`).

**Request**

```json
{
  "isEditing": true
}
```

**Response 200**

```json
{
  "id": "uuid",
  "isEditing": true,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### POST /api/lists/:id/finish-edit

Aplica el borrador autosave a la lista `ACTIVE`, pone `isEditing=false` y reinicia el `DRAFT` único a vacío.

## Notas de implementación

- Todas las rutas requieren sesión autenticada.
- La persistencia por defecto es en memoria mediante `InMemoryListRepository` (hay alternativa Postgres).
- La autorización restringe el acceso a las listas del propietario.
- Validación de payloads con Zod y errores uniformes de validación.
- La duplicación solo aplica a listas en estado `COMPLETED`.

## Cambios previstos (API)

- Sin cambios pendientes relevantes.
