# Panel de categorías (UI)

## Resumen

Panel lateral en la UI que permite mostrar/ocultar categorías del catálogo y resaltarlas de forma local.

La experiencia de catálogo muestra el detalle de la categoría seleccionada y reinicia el scroll al cambiar para que el contenido aparezca desde arriba.

## Endpoints

- `GET /api/catalog/categories`
- `GET /api/catalog/categories/:id`

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

### Request

```
GET /api/catalog/categories/:id
```

### Response

```json
{
  "category": {
    "id": "string",
    "name": "string",
    "sections": [
      {
        "subcategoryName": "string",
        "products": []
      }
    ]
  }
}
```

## Notas de implementación

- El panel se abre/cierra desde la cabecera y solo solicita datos la primera vez que se abre.
- Estados manejados: `idle`, `loading`, `error`, `success`.
- Solo se muestran categorías de nivel 0 y 1.
- Los clics en una tarjeta actualizan el `activeCategoryId` local para resaltar la selección.
- Al seleccionar una categoría se solicita el detalle y el listado se renderiza por subcategorías.
- Al cambiar de categoría el scroll se reinicia antes de que se pinte el contenido.
