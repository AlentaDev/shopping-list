# Panel de categorías (UI)

## Resumen

Panel lateral en la UI que muestra categorías del catálogo y resalta la selección activa local.

La experiencia de catálogo muestra el detalle de la categoría seleccionada y reinicia el scroll al cambiar para que el contenido aparezca desde arriba.

## Endpoints

- `GET /api/catalog/categories`
- `GET /api/catalog/categories/:id`

## Ejemplos

### Solicitud

```
GET /api/catalog/categories
```

### Respuesta

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

### Solicitud

```
GET /api/catalog/categories/:id
```

### Respuesta

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

- En desktop el panel permanece siempre visible dentro del layout del catálogo; ya no existe botón flotante ni trigger en la cabecera.
- La grilla de productos conserva su desplazamiento lateral para convivir con el panel fijo de desktop.
- En mobile el acceso sigue siendo mediante un trigger inline que abre un overlay/modal y la selección de categoría lo cierra automáticamente.
- Estados manejados: `idle`, `loading`, `error`, `success`.
- El panel renderiza árboles de categorías de forma recursiva: raíces (nivel 0) como tarjetas redondeadas y niveles anidados como listas indentadas.
- Solo se expande la rama activa (ancestros de la categoría seleccionada). El resto de ramas permanece colapsado para mantener la legibilidad.
- Al hacer click en una categoría padre (en desktop) se selecciona automáticamente la primera hoja más profunda de esa rama; nunca se carga el listado potencialmente enorme de la categoría padre.
- En mobile, el click en un padre expande/contrae sus hijos, permitiendo navegar nivel a nivel hasta una hoja.
- La hoja seleccionada se resalta con el estilo verde existente (`bg-emerald-50 text-emerald-700`).
- Las hermanas de la hoja activa (mismo padre) permanecen visibles y clicables directamente.
- El modelo `CatalogCategoryNode` usa `level: number` y `parentId` para soportar profundidades arbitrarias; actualmente se valida hasta 4 niveles.
- Al seleccionar una categoría se solicita el detalle y el listado se renderiza por subcategorías.
- Al cambiar de categoría el scroll se reinicia antes de que se pinte el contenido.
