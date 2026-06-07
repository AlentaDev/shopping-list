## Exploration: repair-bonpreuesclat-api-contract

### Current State
- API mounts under `/api` with live routers for `auth`, `catalog`, `lists`, and `users`, plus `GET /health`.
- Catalog currently exposes only `GET /api/catalog/:provider/categories` and `GET /api/catalog/:provider/categories/:id`.
- Bonpreu root-category responses hash external `categoryId` values before returning them, but Bonpreu category-detail lookup still searches the raw upstream `categoryId`, so IDs returned by the first endpoint do not round-trip into the second endpoint.
- Bonpreu search and product-detail normalization exist in spec/adapter/http-client code, but no public router/use case currently exposes them.
- API docs are drifted: `docs/features/api/catalogCategories.md` still documents legacy non-provider catalog routes, and archived Bonpreu docs referenced by the archive report are not present in `docs/features/api/`.
- Lists already support provider-aware mutations, but `apps/api/src/modules/lists/application/providerDto.ts` still only maps `mercadona`, so Bonpreu display names fall back to the raw slug.

### Affected Areas
- `apps/api/src/modules/catalog/infrastructure/BonpreuCatalogProvider.ts` — likely root cause; root IDs are transformed but detail lookup expects the original upstream ID.
- `apps/api/src/modules/catalog/infrastructure/BonpreuCatalogProvider.test.ts` — current tests validate raw Bonpreu IDs directly, so they miss the round-trip failure seen by real clients.
- `apps/api/src/modules/catalog/api/catalogRouter.ts` — confirms current public surface is limited to categories + category detail.
- `apps/api/src/modules/catalog/infrastructure/adapters/BonpreuCatalogAdapter.ts` — contains search normalization rules that are currently not reachable through any HTTP endpoint.
- `apps/api/src/modules/catalog/domain/catalogProvider.ts` — provider contract includes `getProduct`, but the module does not expose a product-detail route/use case.
- `apps/web/src/features/catalog/services/CatalogService.ts` — proves clients use the returned category IDs verbatim, so the Bonpreu ID mismatch hits real navigation.
- `apps/api/src/modules/lists/application/providerDto.ts` — stale provider display-name mapping for Bonpreu list DTOs.
- `docs/features/api/catalogCategories.md` — stale endpoint documentation for Rest Client usage.

### Approaches
1. **Repair the shipped Bonpreu categories contract first** — make Bonpreu category IDs round-trip correctly, add regression tests at provider/router level, and publish the real current Rest Client endpoint set.
   - Pros: smallest high-value slice, directly targets the likely production bug, and gives QA a trustworthy way to reproduce/verify.
   - Cons: does not close the larger spec gap around Bonpreu search/product detail.
   - Effort: Medium.

2. **Complete the full Bonpreu catalog contract** — fix the category ID bug and also add public search/product-detail routes/use cases so the live API matches the Bonpreu spec more closely.
   - Pros: aligns implementation with the archived/spec'd Bonpreu contract and removes dead adapter capability.
   - Cons: wider scope, higher review risk, and likely exceeds a single small bugfix slice once docs/tests are included.
   - Effort: High.

### Recommendation
Choose **Repair the shipped Bonpreu categories contract first**. The strongest evidence points to a real round-trip bug in `BonpreuCatalogProvider`: the API returns hashed category IDs, then fails to resolve those same IDs on detail requests. That explains “API not returning as agreed” without inventing new requirements. Proposal scope should also include endpoint documentation for Rest Client and a small DTO doc cleanup for provider naming.

### Risks
- The exact intended Bonpreu public surface is partially ambiguous because the main spec mentions category, search, and product-detail normalization, but the live router only exposes category routes.
- Some archived Bonpreu final docs referenced in `archive-report.md` are missing from `docs/features/api`, so documentation history is incomplete.
- If current clients already persisted hashed Bonpreu category IDs anywhere, any fix must preserve backward compatibility or provide a tolerant lookup path.
- Full contract repair may exceed the 400-line review budget if it mixes router expansion, provider refactor, tests, and docs in one slice.

### Ready for Proposal
Yes — propose a focused API bugfix/documentation change: Bonpreu category ID round-trip repair, Rest Client endpoint documentation, and explicit confirmation of whether search/product-detail endpoints are part of this change or a follow-up.
