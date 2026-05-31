# Design: BonpreuEsclat API-first Multi-provider

## Technical Approach

Implementar un **Provider Strategy backend-only** en `apps/api` para que `:provider` resuelva estrategia real (Mercadona o BonpreuEsclat), normalice a contrato canónico y mantenga compatibilidad temporal con `source` legacy en listas. Se alinea con proposal y specs: `bonpreuesclat-catalog-provider`, `provider-aware-catalog-routing`, `list-provider-ownership`, `list-category-grouping`, `shopping-list-item-identity`.

## Architecture Decisions

| Option | Tradeoff | Decision |
|---|---|---|
| `if/else` por provider en router/use-cases | Rápido, pero acopla flujo y escala mal | ❌ Rechazado |
| Resolver estrategia por `ProviderStrategyResolver` | Más tipos/archivos, pero extensible y testeable | ✅ Elegido |
| Reusar DTO Mercadona en dominio | Menos código inicial, contrato frágil | ❌ Rechazado |
| Contrato canónico + adapters por provider | Más mapping, pero estabilidad cliente | ✅ Elegido |
| 400/422 para conflicto provider draft | Menos semántico para conflicto de recurso | ❌ Rechazado |
| **409** `draft_provider_conflict` con `allowedActions` | Requiere payload de contrato explícito | ✅ Elegido |

## Data Flow

Catalog:

`HTTP /catalog/:provider/* -> CatalogRouter -> ProviderResolver -> CatalogUseCase -> ProviderAdapter -> ExternalClient -> Canonical DTO`

Fallback:

`Provider error -> stale cache? yes: return stale | no: AppError(502/404)`

Add item:

`POST /lists/:id/items/from-catalog -> AddCatalogItem -> validate draft.provider.slug vs input.provider -> fetch product via resolved provider -> snapshot builder -> repository.save`

Conflict:

`provider mismatch + draft active -> AppError(409, draft_provider_conflict, details)`

## Requirement-to-Component Mapping

| Requirement/Scenario | Components | Contract/Adapter | Tests |
|---|---|---|---|
| Canonical normalization (category/search/detail) | `catalog/application/*`, `catalog/domain/catalogTypes.ts` | `BonpreuCatalogAdapter` maps `retailerProductId`, `price.amount`, `imagePaths`, `categoryPath` | Adapter unit tests + router contract tests |
| Missing images -> `thumbnail=null` | `BonpreuCatalogAdapter` | null-safe image mapping | Unit tests with empty/missing `imagePaths` |
| Leaf-only loading + `maxProductsToDecorate=N` | `GetCategoryDetail` (provider-aware), Bonpreu client | Node metadata (`childCategories`, `productCount`) + leaf guard | Use-case tests: intermediate no products, leaf includes N |
| Search cap 30, ignore empty clusters | `SearchCatalog` use-case + adapter | group flatten with cap and empty-group tolerance | Unit tests for >30 and empty clusters |
| Provider strategy resolution + unknown 404 | `ProviderStrategyResolver`, `catalogRouter` | `provider_not_found` stable code | Router tests by provider slug |
| Display name fallback to slug | provider metadata mapper | `provider.displayName ?? provider.slug` | Contract tests |
| Draft provider ownership + 409 payload | `AddCatalogItem`, `lists/application/errors.ts` | `draft_provider_conflict` + `allowedActions` + draft/requested provider blocks | Use-case + API tests |
| Snapshot from `categoryPath[]` + null fallback | `AddCatalogItem` snapshot helper | penúltimo/último; invalid => null | Unit tests for 0/1/3 levels |
| Identity `listId:sourceProductId` + no persistence on missing price | `AddCatalogItem`, repository | id compuesto estable; provider payload contract error | Use-case tests (draft/edit/autosave + missing price) |

## File Changes

| File | Action | Description |
|---|---|---|
| `apps/api/src/modules/catalog/domain/catalogProvider.ts` | Modify | Generalizar interfaces a provider canónico + capacidades Bonpreu |
| `apps/api/src/modules/catalog/domain/catalogTypes.ts` | Modify | Extender DTO canónico (provider metadata, categorías profundas, búsqueda) |
| `apps/api/src/modules/catalog/application/ProviderStrategyResolver.ts` | Create | Resolver slug -> strategy y error determinístico 404 |
| `apps/api/src/modules/catalog/infrastructure/BonpreuCatalogProvider.ts` | Create | Llamadas HTTP Bonpreu (categorías, category products, search, detail) |
| `apps/api/src/modules/catalog/infrastructure/BonpreuHttpClient.ts` | Create | Cliente HTTP Bonpreu con timeout/retry mínimo controlado |
| `apps/api/src/modules/catalog/infrastructure/adapters/BonpreuCatalogAdapter.ts` | Create | Normalización DTO externo -> canónico |
| `apps/api/src/modules/catalog/api/catalogRouter.ts` | Modify | Pasar `provider` a casos de uso y soportar búsqueda/detalle canónicos |
| `apps/api/src/modules/catalog/api/schemas.ts` | Modify | Soportar `bonpreuesclat` + validaciones provider-aware |
| `apps/api/src/modules/catalog/catalogModule.ts` | Modify | Wiring resolver + strategies Mercadona/Bonpreu |
| `apps/api/src/modules/lists/application/AddCatalogItem.ts` | Modify | Resolver provider real, id compuesto, snapshot `categoryPath`, validar `price.amount`, 409 conflicto |
| `apps/api/src/modules/lists/application/errors.ts` | Modify | Nuevos errores: `draft_provider_conflict`, `provider_payload_contract_error` |
| `apps/api/src/modules/lists/api/validation.ts` | Modify | transición `source/provider` y provider multi-slug |
| `apps/api/src/modules/*/*.test.ts` | Modify/Create | cobertura TDD para routing, adapters, errores, compatibilidad Mercadona |

## Interfaces / Contracts

```ts
type ProviderSlug = "mercadona" | "bonpreuesclat";

type DraftProviderConflictDetails = {
  errorCode: "draft_provider_conflict";
  draftProvider: { id: string; slug: string; displayName: string };
  requestedProvider: { id: string; slug: string; displayName: string };
  allowedActions: ["switch_and_clear", "keep_draft_provider"];
  draftSummary: { itemCount: number; updatedAt: string };
};
```

```ts
type ProviderPayloadContractError = {
  errorCode: "provider_payload_contract_error";
  field: "price.amount";
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Bonpreu adapter mappings, leaf detection, search cap 30, displayName fallback, snapshot derivation, id compuesto | Vitest table-driven tests por scenario de spec |
| Integration | Catalog router + resolver + error middleware (404 provider, 502 fallback, 409 conflict payload) | Supertest + provider fakes + stale-cache fixtures |
| E2E | N/A en fase API (Gate 1) | Mantener fuera de scope; validar contratos HTTP con integration tests |

## TDD Order and Verification Hooks

1. Tests resolver provider (known/unknown).  
2. Tests adapter Bonpreu (categoría/search/detail).  
3. Tests use-cases catálogo (leaf-only, `maxProductsToDecorate`).  
4. Tests AddCatalogItem (409, missing `price.amount`, id compuesto).  
5. Tests router/middleware de contrato HTTP.  

Hooks para `sdd-tasks`: etiquetar suites por capability (`bonpreuesclat-catalog-provider`, `list-provider-ownership`) y gate (`gate-api-1`).

## Migration / Rollout

Rollout incremental API-first. Mantener compatibilidad temporal: aceptar `source` legacy mientras se consolida `provider`. Bonpreu se habilita por wiring de strategy; rollback: desactivar strategy Bonpreu y conservar Mercadona-only sin romper contrato existente.

## Open Questions

- [ ] Definir comportamiento exacto para `categoryPath[]` con nodos vacíos/intermedios `null`.
- [ ] Confirmar persistencia de `productCount` (cache interna vs solo respuesta en memoria).
- [ ] Definir regla final de orden/mezcla cuando búsqueda trae `personalized` + `cluster` con resultados.
