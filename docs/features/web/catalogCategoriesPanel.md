# Panel de categorías (UI)

## Resumen

Panel lateral en la UI que permite mostrar/ocultar categorías del catálogo y resaltarlas de forma local.

## Endpoints

- `GET /api/catalog/categories`

## Ejemplos

### Request

```
GET /api/catalog/categories
```

### Response

```json
{
  "categories": [
    {
      "id": "string",
      "name": "string",
      "order": 1,
      "level": 0,
      "parentId": "string",
      "published": true
    }
  ]
}
```

## Notas de implementación

- El panel se abre/cierra desde la cabecera y solo solicita datos la primera vez que se abre.
- Estados manejados: `idle`, `loading`, `error`, `success`.
- Solo se muestran categorías de nivel 0 y 1.
- Los clics en una tarjeta actualizan el `activeCategoryId` local para resaltar la selección.
