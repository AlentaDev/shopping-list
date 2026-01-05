# Catalog - Categories (Phase 1)

## Endpoints

### GET /api/catalog/categories
Returns root categories with their level-1 children.

**Response (200)**
```json
{
  "categories": [
    {
      "id": "12",
      "name": "Food",
      "order": 1,
      "level": 0
    },
    {
      "id": "1201",
      "name": "Fruit",
      "order": 1,
      "level": 1,
      "parentId": "12",
      "published": true
    }
  ]
}
```

### GET /api/catalog/categories/:id
Returns a category detail with subcategories and product summaries.

**Response (200)**
```json
{
  "id": "12",
  "name": "Food",
  "subcategories": [
    {
      "id": "1201",
      "name": "Fruit",
      "products": [
        {
          "id": "p-1",
          "name": "Apple",
          "thumbnail": "https://example.test/apple.png",
          "packaging": "bag",
          "price": 1.5,
          "unitSize": 1,
          "unitFormat": "kg",
          "unitPrice": 1.5,
          "isApproxSize": false
        }
      ]
    }
  ]
}
```

**Response (502)**
```json
{ "error": "catalog_provider_unavailable" }
```

## Implementation Notes
- Backed by Mercadona categories endpoints via the catalog provider.
- IDs are always serialized as strings.
- Cache keys:
  - `mercadona:categories:root` (TTL 24h)
  - `mercadona:categories:{id}` (TTL 6h)
- If the provider fails and cache exists, cached data is returned.
