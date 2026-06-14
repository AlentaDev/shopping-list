# Tasks: Repair BonpreuEsclat API Contract

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 420-560 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 provider contract -> PR 2 list wiring -> PR 3 docs/follow-up note |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Repair Bonpreu category contract and router validation | PR 1 | Includes provider/use-case/router tests; safe base slice |
| 2 | Make add-to-list provider-aware for Bonpreu lookup | PR 2 | Depends on PR 1 or can rebase cleanly if isolated |
| 3 | Update Rest Client docs and capture frontend follow-up | PR 3 | Keep docs with final API surface |

## Phase 1: Catalog contract RED-GREEN-REFACTOR

- [x] 1.1 RED: Extend `apps/api/src/modules/catalog/infrastructure/BonpreuCatalogProvider.test.ts` for canonical string IDs, hash-compat lookup, intermediate nodes without products, deepest-node products, and variable-depth branches.
- [x] 1.2 GREEN: Update `apps/api/src/modules/catalog/infrastructure/BonpreuCatalogProvider.ts` to serialize canonical IDs, inspect real child trees, and fetch products only for deepest reachable nodes.
- [x] 1.3 REFACTOR: Tighten Bonpreu helpers in `BonpreuCatalogProvider.ts` so temporary legacy hash matching stays isolated and Mercadona behavior is untouched.

## Phase 2: Catalog application and API contract

- [x] 2.1 RED: Extend `apps/api/src/modules/catalog/application/GetCategoryDetail.test.ts` and `apps/api/src/modules/catalog/api/catalogRouter.test.ts` for navigation-only intermediate responses and Bonpreu UUID/string route params.
- [x] 2.2 GREEN: Update `apps/api/src/modules/catalog/api/schemas.ts` and any category-detail mapping paths so canonical Bonpreu IDs round-trip unchanged through `GET /api/catalog/:provider/categories/:id`.
- [x] 2.3 REFACTOR: Review `apps/api/src/modules/catalog/catalogModule.ts` and related wiring only if needed to keep provider-specific traversal isolated behind the provider boundary.

## Phase 3: List mutation RED-GREEN-REFACTOR

- [x] 3.1 RED: Extend `apps/api/src/modules/lists/application/AddCatalogItem.test.ts` for Bonpreu success using `retailerProductId`, controlled provider failure, and no persistence on lookup failure.
- [x] 3.2 GREEN: Update `apps/api/src/modules/lists/application/AddCatalogItem.ts` and `apps/api/src/modules/lists/listsModule.ts` to resolve the requested provider explicitly before `getProduct(productId)`.
- [x] 3.3 REFACTOR: Update `apps/api/src/modules/lists/application/providerDto.ts` and `apps/api/src/modules/lists/api/router.test.ts` only as needed to keep provider DTOs and mutation wiring consistent.

## Phase 4: Docs and follow-up

- [x] 4.1 Update `docs/features/api/catalogCategories.md` to document only `GET /api/catalog/:provider/categories` and `GET /api/catalog/:provider/categories/:id` with canonical Bonpreu IDs.
- [x] 4.2 Update `docs/features/api/listCatalogItems.md` with Bonpreu `POST /api/lists/:id/items/from-catalog` examples using `provider` plus `retailerProductId`, and note there is no public Bonpreu product endpoint.
- [x] 4.3 Record frontend follow-up only: `apps/web/src/features/catalog/services/adapters/CatalogAdapter.ts` may need deeper subcategory ID support later, but no frontend implementation belongs in this change.
