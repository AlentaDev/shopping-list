# Design: Repair BonpreuEsclat API Contract

## Technical Approach

Repair the shipped Bonpreu contract at the provider boundary without widening the public API. The change keeps the existing routes and makes Bonpreu conform to the approved behavior: canonical upstream string category IDs, provider-specific traversal, deepest-only product loading, and provider-aware internal product lookup for add-to-list.

## Architecture Decisions

| Decision | Options | Choice |
|---|---|---|
| Bonpreu category identity | Keep numeric hash bridge / return canonical upstream IDs | Return canonical upstream string IDs everywhere on Bonpreu category routes |
| Traversal semantics | Unify Bonpreu to Mercadona / keep provider-specific traversal | Keep Mercadona and Bonpreu intentionally different |
| Leaf detection | Fixed depth rule / inspect actual child tree | Use tree inspection; deepest reachable node is source of truth |
| Add-to-list lookup | Public Bonpreu product endpoint / internal provider lookup | Resolve `retailerProductId` internally via `catalogProvider.getProduct()` |
| Compatibility for old hashed IDs | Ignore / tolerant temporary lookup | Accept them temporarily only if they can be reverse-matched from the fetched tree; docs switch immediately to canonical IDs |

**Rationale**
- Hashing is the root contract bug.
- Bonpreu exposes a navigable tree, while Mercadona exposes direct category detail.
- Variable depth is an upstream property, so fixed levels cannot be Bonpreu truth.
- Add-to-list already depends on `catalogProvider.getProduct()`; this design only makes provider selection explicit.

## Data Flow

### Bonpreu category navigation

```text
GET /api/catalog/bonpreuesclat/categories
  -> catalogRouter -> GetRootCategories -> BonpreuCatalogProvider
  -> Bonpreu categories tree
  -> flatten root + first visible children with canonical string IDs

GET /api/catalog/bonpreuesclat/categories/:id
  -> catalogRouter -> GetCategoryDetail -> BonpreuCatalogProvider
  -> resolve node by canonical ID (or temporary hash-compatible match)
  -> if node has children: return navigation children, no products
  -> else: fetch product page with maxProductsToDecorate = productCount
```

### Bonpreu add-to-list

```text
POST /api/lists/:id/items/from-catalog
  body { provider: "bonpreuesclat", productId: retailerProductId }
  -> lists router (Zod)
  -> provider-aware AddCatalogItem wiring
  -> selected catalog provider.getProduct(productId)
  -> BonpreuHttpClient GET /api/webproductpagews/v5/products/bop?... 
  -> persist snapshot with source=bonpreuesclat, sourceProductId=retailerProductId
```

## File Changes

| File | Action | Description |
|---|---|---|
| `apps/api/src/modules/catalog/infrastructure/BonpreuCatalogProvider.ts` | Modify | Remove deterministic numeric hashing, add canonical-ID serialization, distinguish navigation nodes vs deepest leaf nodes, and keep Bonpreu-specific traversal logic isolated from Mercadona. |
| `apps/api/src/modules/catalog/infrastructure/BonpreuCatalogProvider.test.ts` | Modify | Add round-trip, intermediate-node, deepest-leaf, variable-depth, and compatibility tests. |
| `apps/api/src/modules/catalog/api/schemas.ts` | Modify | Ensure category detail param validation accepts canonical Bonpreu UUID/string IDs used by the live API. |
| `apps/api/src/modules/catalog/application/GetCategoryDetail.test.ts` | Modify | Lock the mapped contract for navigation-only intermediate responses and leaf product responses. |
| `apps/api/src/modules/lists/listsModule.ts` | Modify | Replace single injected catalog provider dependency with provider resolution/wiring so add-to-list uses the requested provider. |
| `apps/api/src/modules/lists/application/AddCatalogItem.ts` | Modify | Resolve the provider-aware catalog lookup before persistence and preserve snapshot rules. |
| `apps/api/src/modules/lists/application/AddCatalogItem.test.ts` | Modify | Add Bonpreu success/failure coverage for `retailerProductId` lookup and no-persist-on-provider-failure. |
| `apps/api/src/modules/lists/application/providerDto.ts` | Modify | Add Bonpreu display name so DTOs stay consistent with provider-aware flows. |
| `docs/features/api/catalogCategories.md` | Modify | Document only the live provider-aware category endpoints with Bonpreu examples using canonical IDs. |
| `docs/features/api/listCatalogItems.md` | Modify | Document Bonpreu add-to-list using `provider=bonpreuesclat` and `productId=retailerProductId`, calling the lookup internal. |

## Interfaces / Contracts

```ts
type BonpreuCategoryNodeDto = {
  id: string;
  name: string;
  order: number;
  level: 0 | 1;
  parentId?: string;
};

type AddCatalogItemBody = {
  provider: "mercadona" | "bonpreuesclat";
  productId: string; // Bonpreu: retailerProductId from category detail
  qty?: number;
};
```

No new public endpoints. No Bonpreu search route. No public single-product route.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit (CORE 100%) | Bonpreu provider ID round-trip, leaf detection, `maxProductsToDecorate`, provider-aware add-to-list lookup | Vitest on provider/use-case classes |
| Integration | Catalog router validation and list router mutation contract | Existing Express router tests with Bonpreu payloads |
| Frontend regression | Bonpreu category navigation with canonical IDs and empty-product intermediate states | Update service-level mocks if needed; otherwise manual QA against live API contract |
| E2E | None for this change | Keep out of scope unless API-only verification proves insufficient |

## Migration / Rollout

No data migration required. Rollout is immediate for docs and canonical IDs. Compatibility is request-level only: if old hashed Bonpreu IDs can still be recognized from the fetched tree, accept them temporarily in detail lookup; otherwise treat them as unsupported legacy client state and document cache/local-state reset for QA.

## Open Questions

- [ ] The current web catalog flow drops subcategory IDs in `apps/web/src/features/catalog/services/adapters/CatalogAdapter.ts`; if Bonpreu trees require deeper navigation than today, that is a separate frontend follow-up, not part of this API repair.
