# Proposal: Repair BonpreuEsclat API Contract

## Intent

Fix the shipped BonpreuEsclat API behavior so category navigation and add-to-list flows match the agreed provider contract, and publish accurate Rest Client endpoint documentation for QA.

## Scope

### In Scope
- Stop hashing Bonpreu category IDs; return canonical upstream string IDs so category routes round-trip.
- Enforce Bonpreu-specific traversal: parent/intermediate categories are navigation-only, and products appear only on the deepest reachable categories.
- Update Bonpreu add-to-list flow so `POST /api/lists/:id/items/from-catalog` uses provider `bonpreuesclat` plus `productId = retailerProductId`, resolved internally through `/api/webproductpagews/v5/products/bop?retailerProductId=...`.
- Refresh API docs with current Rest Client examples for `GET /api/catalog/:provider/categories`, `GET /api/catalog/:provider/categories/:id`, and Bonpreu add-to-list.

### Out of Scope
- Public Bonpreu search endpoints.
- Public single-product catalog endpoint.
- Cross-provider catalog refactors beyond the Bonpreu contract repair.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `bonpreuesclat-catalog-provider`: Bonpreu category IDs remain canonical strings, traversal is provider-specific, and only deepest categories expose products.
- `shopping-list-item-identity`: Bonpreu add-to-list requires provider-compatible payload and internal product lookup by `retailerProductId`.

## Approach

Repair the provider contract at the Bonpreu adapter/provider boundary, then add regression coverage at provider/router/list-mutation level. Keep Mercadona behavior unchanged; Bonpreu and Mercadona intentionally use different traversal rules.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `apps/api/src/modules/catalog/**` | Modified | Bonpreu category serialization, detail traversal, provider tests |
| `apps/api/src/modules/lists/**` | Modified | Bonpreu add-to-list lookup path and contract validation |
| `docs/features/api/catalogCategories.md` | Modified | Real provider-aware Rest Client endpoints |
| `docs/features/api/listCatalogItems.md` | Modified | Bonpreu add-to-list request/response notes |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Existing clients may still hold hashed Bonpreu IDs | Med | Add compatibility handling or document migration in tests/docs |
| Deep-tree traversal may differ from current assumptions | Med | Add provider fixtures covering intermediate and deepest nodes |

## Rollback Plan

Revert Bonpreu provider/list mutation changes and restore previous docs; Mercadona routes remain isolated.

## Dependencies

- Existing Bonpreu provider fixtures and contract tests.

## Success Criteria

- [ ] `GET /api/catalog/bonpreuesclat/categories` returns canonical string IDs that work unchanged in detail requests.
- [ ] Bonpreu category detail returns products only for deepest reachable categories, never parent categories.
- [ ] Bonpreu add-to-list succeeds using `retailerProductId` from category detail and internal product lookup.
- [ ] Rest Client docs match the live API surface without search or public single-product routes.
