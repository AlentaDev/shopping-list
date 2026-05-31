# Tasks: BonpreuEsclat API-first Multi-provider

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 620-900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk (session strategy: ask-always) |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Provider strategy + Bonpreu adapter/client + canonical mappings | PR 1 | Base: feature/tracker branch; includes unit tests for resolver+adapter |
| 2 | Catalog routing/use-cases wired by provider and deterministic 404/metadata fallback | PR 2 | Base: PR 1 branch; includes integration tests for category/search/detail |
| 3 | List add-from-catalog ownership, 409 conflict, identity/snapshot rules, docs | PR 3 | Base: PR 2 branch; includes AddCatalogItem tests + docs/features/api |

## Phase 1: Foundation (Provider Strategy + Canonical Types)

- [x] 1.1 RED: crear tests en `apps/api/src/modules/catalog/application/ProviderStrategyResolver.test.ts` (known/unknown provider); verify: `pnpm --filter @shopping-list/api test ProviderStrategyResolver.test.ts`.
- [x] 1.2 GREEN: crear `apps/api/src/modules/catalog/application/ProviderStrategyResolver.ts` y error estable `provider_not_found`; verify: comando 1.1.
- [x] 1.3 REFACTOR: ajustar `apps/api/src/modules/catalog/domain/catalogProvider.ts` y `catalogTypes.ts` para contrato canónico/provider metadata; verify: `pnpm --filter @shopping-list/api test src/modules/catalog --runInBand`.

## Phase 2: Core Bonpreu Catalog Implementation

- [x] 2.1 RED: tests adapter en `.../infrastructure/adapters/BonpreuCatalogAdapter.test.ts` para image null, search cap 30, empty clusters, displayName fallback; verify: `pnpm --filter @shopping-list/api test BonpreuCatalogAdapter.test.ts`.
- [x] 2.2 GREEN: crear `BonpreuCatalogAdapter.ts` y `BonpreuHttpClient.ts` (categories/search/detail); verify: comando 2.1.
- [x] 2.3 RED: tests de `GetCategoryDetail` leaf-only (`maxProductsToDecorate=productCount`) e intermedio sin productos; verify: `pnpm --filter @shopping-list/api test GetCategoryDetail`.
- [x] 2.4 GREEN/REFACTOR: crear `BonpreuCatalogProvider.ts` y wiring en `catalogModule.ts`; verify: `pnpm --filter @shopping-list/api test src/modules/catalog --runInBand`.

## Phase 3: Integration & List Ownership Rules

- [x] 3.1 RED: tests router en `catalogRouter.test.ts` para strategy por `:provider` y 404 determinístico; verify: `pnpm --filter @shopping-list/api test catalogRouter.test.ts`.
- [x] 3.2 GREEN: modificar `catalogRouter.ts` y `schemas.ts` para provider-aware routing y contrato canónico; verify: comando 3.1.
- [x] 3.3 RED: tests `AddCatalogItem.test.ts` para 409 `draft_provider_conflict`, missing `price.amount` sin persistencia, `id=listId:sourceProductId`, `categoryPath` 0/1/3 niveles; verify: `pnpm --filter @shopping-list/api test AddCatalogItem.test.ts`.
- [x] 3.4 GREEN/REFACTOR: modificar `AddCatalogItem.ts`, `lists/application/errors.ts`, `lists/api/validation.ts`; verify: `pnpm --filter @shopping-list/api test src/modules/lists --runInBand`.

## Phase 4: Verification Gate API + Documentation

- [x] 4.1 Ejecutar suite Gate 1 (catalog+lists compatibility Mercadona/Bonpreu) y corregir regresiones; verify: `pnpm --filter @shopping-list/api test`.
- [x] 4.2 Actualizar `docs/features/api/bonpreu-esclat.md` con contrato 409, payload error provider y reglas leaf/search; verify: `pnpm --filter @shopping-list/api test && pnpm --filter @shopping-list/api typecheck`.
