## Exploration: bonpreu-esclat

### Current State
El backend de catálogo está acoplado a Mercadona en tipos, provider y cache keys (`SUPPORTED_PROVIDER_SLUGS = ["mercadona"]`, `MercadonaCatalogProvider`, `mercadona:*` keys). Los casos de uso de catálogo no reciben provider en `execute`, y el router valida provider pero no lo usa para enrutar internamente. En listas, `AddCatalogItem` solo acepta `provider: "mercadona"`, consume `MercadonaProductDetail`, genera `id` con `idGenerator` (no con `listId:sourceProductId`) y aplica fallback de categoría a `"Sin categoría"`, que contradice el pre-SDD (debe quedar `null/null` cuando no hay niveles válidos).

### Affected Areas
- `docs/features/api/bonpreu-esclat-pre-sdd.md` — fuente de verdad funcional y decisiones cerradas para SDD.
- `apps/api/src/modules/catalog/api/schemas.ts` — limita providers a mercadona; debe abrirse a bonpreuesclat.
- `apps/api/src/modules/catalog/api/catalogRouter.ts` — hoy valida `:provider` pero no enruta por provider real.
- `apps/api/src/modules/catalog/catalogModule.ts` — wiring hardcodeado a `MercadonaCatalogProvider`.
- `apps/api/src/modules/catalog/domain/catalogProvider.ts` — contrato centrado en DTO Mercadona; no modelo neutral multi-provider.
- `apps/api/src/modules/catalog/application/getRootCategories.ts` — mapeo de profundidad fija (0/1) y cache key mercadona-only.
- `apps/api/src/modules/catalog/application/getCategoryDetail.ts` — respuesta por subcategorías Mercadona, sin árbol completo ni reglas hoja Bonpreu.
- `apps/api/src/modules/lists/application/AddCatalogItem.ts` — tipado/flujo Mercadona-only, snapshot y reglas de categoría no alineadas al pre-SDD.
- `apps/api/src/modules/lists/api/validation.ts` — `source/provider` dependen de schema catalog con único provider.
- `apps/api/src/modules/lists/application/errors.ts` y `apps/api/src/app/errors/errorMiddleware.ts` — base para nuevo error de contrato provider y `draft_provider_conflict` (409).
- `apps/api/src/modules/catalog/api/catalogRouter.test.ts` y `apps/api/src/modules/lists/application/AddCatalogItem.test.ts` — tests actuales a extender con TDD para Bonpreu.

### Approaches
1. **Provider Strategy con contrato canónico interno** — introducir un contrato de catálogo interno común (categorías, búsqueda, producto detalle, add-to-list snapshot input) y adapters por provider (Mercadona/Bonpreu) detrás de un resolver por slug.
   - Pros: Escala a multi-provider, minimiza condicionales en use cases, protege compatibilidad Mercadona con pruebas por adapter, facilita transición `source -> providerId`.
   - Cons: Mayor inversión inicial en refactor de contratos y tests de integración de adapters.
   - Effort: High

2. **Extensión incremental sobre contrato actual** — mantener contratos Mercadona y añadir ramas Bonpreu puntuales en router/use cases con tipos union y mapeos específicos.
   - Pros: Entrega más rápida en API-first para primer slice Bonpreu.
   - Cons: Incrementa deuda técnica y acoplamiento, riesgo alto de regresiones al tocar categorías/proveedor en draft, dificulta siguientes providers.
   - Effort: Medium

### Recommendation
Recomiendo **Approach 1 (Provider Strategy)**, ejecutado por slices pequeños API-first para respetar gates. Es la opción que mejor alinea el pre-SDD (contrato global único, transición segura sin romper Mercadona, provider behind interfaces). **Supuestos explícitos** para propuesta: (a) se mantiene legacy `source` temporal en DTO donde aplique, (b) `providerId` sigue siendo fuente de verdad de lista, (c) fallback `provider.displayName -> slug` se conserva. **Puntos de decisión pendientes para sdd-propose**: definir error code exacto para provider invalid payload + mapping HTTP, confirmar política definitiva de campos legacy de unidad/pack en persistencia, y cerrar regla de nodos vacíos/intermedios en `categoryPath[]`.

### Risks
- Riesgo de regresión en Mercadona por refactor de contratos compartidos si no se cubren tests de compatibilidad (router + use cases + adapters).
- Riesgo de inconsistencias en DRAFT/autosave si cambia identidad de item o validación provider sin respetar `id=listId:sourceProductId` acordado.
- Riesgo de performance/carga en Bonpreu si no se aplica estrictamente regla de cargar productos solo en hoja y `maxProductsToDecorate=productCount`.
- Riesgo de UX incoherente Web/Android si el contrato de error `draft_provider_conflict` no queda estable por `errorCode` + `allowedActions`.

### Ready for Proposal
Yes — el cambio está listo para `sdd-propose` con foco en API-first y alcance acotado por slices. El orquestador debe pedir al usuario confirmar los 3 decision points pendientes (error code/mapping, legacy unit fields strategy, categoryPath con nodos vacíos) antes de congelar propuesta.
