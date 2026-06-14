# Añadir items a lista desde catálogo

## Resumen
Permite a usuarios autenticados añadir items a una lista desde el catálogo del provider dueño del borrador (`mercadona` o `bonpreuesclat`) por `productId`, guardando un snapshot de precio y presentación.

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

- `source` acepta `mercadona` o `bonpreuesclat`.
- El request declara el provider solicitado, pero la ejecución usa como fuente de verdad el provider del draft/lista resuelto por el backend.

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
- `404 provider_not_found` cuando el ownership persistido del draft/lista no se puede resolver a un provider registrado, o cuando el slug de provider resultante no está registrado/resoluble. La mutación falla antes de ejecutar `getProduct()` y no hace fallback implícito a Mercadona.
- `409 draft_provider_conflict` cuando el `source` pedido no coincide con `draft.provider.slug`. El payload incluye `allowedActions = ["switch_and_clear", "keep_draft_provider"]`.
- `502 catalog_provider_failed` cuando falla el provider de catálogo.

## Flujo de mutación provider-aware

1. La API valida el payload y el `source` solicitado.
2. La mutación carga la lista y resuelve su ownership persistido (`provider_id`).
3. El backend traduce ese ownership al slug del draft/lista y resuelve el provider real mediante el registry/resolver de catálogo.
4. Si el provider resuelto del draft/lista no coincide con el `source` pedido, la API responde `409 draft_provider_conflict`.
5. Solo entonces se ejecuta `provider.getProduct(productId)` y se persiste el snapshot.

### Reglas importantes

- `bonpreuesclat` usa exactamente el mismo flujo provider-aware que `mercadona`; no tiene wiring especial fuera del resolver.
- No existe fallback en tiempo de mutación hacia Mercadona cuando falta o no se puede resolver el provider del draft/lista.
- Un request Bonpreu contra un draft Mercadona devuelve conflicto explícito; no cambia el provider implícitamente.

## Rollout y compatibilidad

Antes de llevar esta validación estricta a producción, las listas legacy deben estar backfilleadas a `provider_id = provider-mercadona`.

Orden requerido:

1. Ejecutar el backfill sobre listas con `provider_id` `NULL`, vacío o legacy `mercadona`.
2. Verificar que las listas Bonpreu existentes permanezcan intactas.
3. Recién después desplegar el wiring estricto basado en resolver.

Se rechaza el fallback en tiempo de mutación porque escondería defectos de datos/despliegue y permitiría mutaciones con ownership inconsistente.

## Notas
- El item de lista guarda un snapshot de datos de producto del provider resuelto (`display_name`, `thumbnail`, `price_instructions`) para mantener estabilidad si cambia el catálogo.
- Las respuestas normalizan items de catálogo a una forma `kind` + `name` con campos opcionales de catálogo.
