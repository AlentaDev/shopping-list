# Catálogo - Categorías (Fase 1)

## Endpoints

### GET /api/catalog/categories
Devuelve categorías raíz con sus categorías hijas de nivel 1.

**Respuesta (200)**
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
Devuelve el detalle de una categoría con subcategorías y resumen de productos.

**Respuesta (200)**
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

**Respuesta (502)**
```json
{ "error": "catalog_provider_unavailable" }
```

## Notas de implementación
- Respaldado por endpoints de categorías de Mercadona vía el provider de catálogo.
- Los IDs siempre se serializan como string.
- Claves de cache:
  - `mercadona:categories:root` (TTL 24h)
  - `mercadona:categories:{id}` (TTL 6h)
- Si el provider falla y existe cache, se devuelve el dato cacheado.
