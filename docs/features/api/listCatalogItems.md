# Add list items from Mercadona catalog

## Summary
Allows authenticated users to add list items from the Mercadona catalog by productId while storing a snapshot of pricing and presentation data.

> **Deprecated:** manual items are being removed from the API, database, and web. All future changes must assume catalog-only items.

## Endpoints
### POST `/api/lists/:id/items/from-catalog`
Adds a catalog item snapshot to a list owned by the authenticated user.

#### Request body
```json
{
  "source": "mercadona",
  "productId": "123",
  "qty": 2
}
```

#### Response (201)
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

#### Errors
- `400 validation_error` for invalid payloads.
- `401 not_authenticated` when no session exists.
- `403 forbidden` when the list does not belong to the user.
- `404 list_not_found` when the list does not exist.
- `502 catalog_provider_failed` when the catalog provider fails.

## Notes
- The list item stores a snapshot of Mercadona product data (`display_name`, `thumbnail`, and `price_instructions`) to keep lists stable if catalog data changes.
- Responses normalize catalog items into a `kind` + `name` shape with optional catalog fields.
