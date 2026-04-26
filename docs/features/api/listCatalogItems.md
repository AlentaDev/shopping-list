# Añadir items a lista desde catálogo Mercadona

## Resumen
Permite a usuarios autenticados añadir items a una lista desde el catálogo de Mercadona por `productId`, guardando un snapshot de precio y presentación.

> **Deprecated:** manual items are being removed from the API, database, and web. All future changes must assume catalog-only items.

## Endpoints
### POST `/api/lists/:id/items/from-catalog`
Añade un snapshot de item de catálogo a una lista del usuario autenticado.

#### Body de request
```json
{
  "source": "mercadona",
  "productId": "123",
  "qty": 2
}
```

#### Respuesta (201)
```json
{
  "id": "item_123",
  "kind": "catalog",
  "name": "Whole Milk",
  "qty": 2,
  "checked": false,
  "updatedAt": "2024-01-01T10:00:00.000Z",
  "thumbnail": "https://cdn.example.com/milk-thumb.jpg",
  "price": 1.35,
  "unitSize": 1,
  "unitFormat": "L",
  "unitPrice": 1.35,
  "isApproxSize": false,
  "source": "mercadona",
  "sourceProductId": "123"
}
```

#### Errores
- `400 validation_error` para payload inválido.
- `401 not_authenticated` cuando no hay sesión.
- `403 forbidden` cuando la lista no pertenece al usuario.
- `404 list_not_found` cuando la lista no existe.
- `502 catalog_provider_failed` cuando falla el provider de catálogo.

## Notas
- El item de lista guarda un snapshot de datos de producto de Mercadona (`display_name`, `thumbnail`, `price_instructions`) para mantener estabilidad si cambia el catálogo.
- Las respuestas normalizan items de catálogo a una forma `kind` + `name` con campos opcionales de catálogo.
