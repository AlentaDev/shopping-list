# BonpreuEsclat (API)

## Objetivo

Incorporar BonpreuEsclat en la API multi-provider sin romper compatibilidad con Mercadona, manteniendo contrato canónico de catálogo y reglas determinísticas de ownership en listas.

## Endpoints relevantes

- `GET /api/catalog/:provider/categories`
- `GET /api/catalog/:provider/categories/:categoryId`
- `GET /api/catalog/:provider/search?q=...`
- `POST /api/lists/:id/items/from-catalog`

## Reglas clave

- Resolución provider-aware por `:provider` con 404 determinístico (`provider_not_found`) cuando el provider no existe.
- Bonpreu usa contrato canónico de catálogo; `provider.displayName` hace fallback a `slug` si falta metadata.
- Búsqueda de Bonpreu capada a 30 resultados y tolerante a clusters vacíos.
- Navegación por categorías:
  - Categoría intermedia: no devuelve productos.
  - Categoría hoja: solicita productos con `maxProductsToDecorate=productCount`.
- Al añadir producto desde catálogo a draft:
  - `id` estable: `listId:sourceProductId`.
  - Si `price.amount` falta o es inválido, no persiste y devuelve error de contrato de provider.
  - Conflicto de provider con draft activo: `409 draft_provider_conflict` con `allowedActions` estables.
  - Snapshot de categoría/subcategoría derivado de `categoryPath` (0/1 niveles => fallback `null`, >=2 niveles => penúltimo/último).

## Notas de implementación

- Integración Bonpreu backend-only en módulo `catalog` (adapter + http client + provider strategy), sin llamadas directas desde frontend.
- Routing y wiring multi-provider resueltos en `catalogRouter` + `catalogModule` con `ProviderStrategyResolver`.
- Validaciones de payload y conflictos de ownership en capa de aplicación/listas (`AddCatalogItem`) con errores estables para Web/Android.
