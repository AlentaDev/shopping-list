## Verification Report

**Change**: repair-bonpreuesclat-api-contract
**Version**: N/A
**Mode**: Standard

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 12 |
| Tasks complete | 12 |
| Tasks incomplete | 0 |

### Build & Tests Execution
**Build**: ✅ Passed
```text
apps/api
- pnpm verify ✅
  - eslint ✅
  - tsc --noEmit ✅
  - vitest run ✅ (52 files, 271 tests)
  - tsc -p tsconfig.json ✅

apps/web
- pnpm verify ✅
  - eslint ✅ with 7 warnings / 0 errors
  - tsc --noEmit ✅
  - vitest run ✅ (64 files, 409 tests)
  - tsc -b && vite build ✅
```

**Tests**: ✅ Passed overall
```text
apps/api
- pnpm verify
- Result: 52 test files passed, 271 tests passed, 0 failed

apps/web
- pnpm verify
- Result: 64 test files passed, 409 tests passed, 0 failed

apps/web coverage gate
- pnpm test:coverage ✅
- Result: 64 test files passed, 409 tests passed, 0 failed
- Coverage analyzer:
  - IMPORTANT lines: 91.29% ✅ above 80% enforced threshold
  - CORE lines: 93.37% ⚠️ below manual 100% target, warning-only per repo 100/80/0 policy
```

**Coverage**: 91.29% IMPORTANT / threshold: 80% → ✅ Above

### Spec Compliance Matrix
| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Rest Client Documentation Matches the Bonpreu Public Surface | Rest Client examples stay within the shipped surface | `apps/api/test/bonpreuDocs.test.ts > keeps catalog examples within the shipped public surface` | ✅ COMPLIANT |
| Canonical Bonpreu Product Normalization | Category response maps to canonical product contract | `BonpreuCatalogProvider.test.ts > loads products only for the deepest reachable category`; `BonpreuCatalogProvider.test.ts > maps products from Bonpreu productGroups decoratedProducts shape` | ✅ COMPLIANT |
| Canonical Bonpreu Product Normalization | Missing image paths keep product usable | `BonpreuCatalogProvider.test.ts > preserves null thumbnail when Bonpreu product detail has no image path` | ✅ COMPLIANT |
| Canonical Bonpreu Product Normalization | Category ID round-trips without hashing | `BonpreuCatalogProvider.test.ts > returns canonical string ids for root and first-level categories`; `BonpreuCatalogProvider.test.ts > supports temporary legacy hashed ids when they match a fetched node`; `GetCategoryDetail.test.ts > round-trips canonical Bonpreu ids for deepest categories`; `catalogRouter.test.ts > accepts canonical Bonpreu string ids in category detail routes` | ✅ COMPLIANT |
| Leaf-Only Product Loading for Deep Trees | Intermediate category does not trigger product list | `BonpreuCatalogProvider.test.ts > keeps intermediate nodes navigation-only`; `GetCategoryDetail.test.ts > returns intermediate category without products` | ✅ COMPLIANT |
| Leaf-Only Product Loading for Deep Trees | Leaf category loads full declared volume | `BonpreuCatalogProvider.test.ts > loads products only for the deepest reachable category`; `BonpreuCatalogProvider.test.ts > maps products from Bonpreu productGroups decoratedProducts shape` | ✅ COMPLIANT |
| Leaf-Only Product Loading for Deep Trees | Deeper child keeps parent navigation-only | `BonpreuCatalogProvider.test.ts > keeps intermediate nodes navigation-only`; `Catalog.test.tsx > renders Bonpreu deeper navigation buttons from detail ids` | ✅ COMPLIANT |
| Bonpreu Add-to-List Resolves Internal Product Lookup | Bonpreu category detail product can be added to list | `AddCatalogItem.test.ts > adds Bonpreu items using retailerProductId through the requested provider`; `router.test.ts > forwards Bonpreu add-to-list payload using provider and retailerProductId` | ✅ COMPLIANT |
| Bonpreu Add-to-List Resolves Internal Product Lookup | Failed Bonpreu lookup prevents persistence | `AddCatalogItem.test.ts > does not persist Bonpreu items when retailerProductId lookup fails` | ✅ COMPLIANT |
| Rest Client Documentation Matches Bonpreu Add-to-List Contract | Rest Client body matches the live Bonpreu contract | `apps/api/test/bonpreuDocs.test.ts > documents Bonpreu add-to-list with retailerProductId and internal lookup only` | ✅ COMPLIANT |

**Compliance summary**: 10/10 scenarios compliant

### Correctness (Static Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| Canonical Bonpreu category IDs and deepest-only traversal | ✅ Implemented | `BonpreuCatalogProvider.ts` returns canonical `categoryId` strings publicly, keeps a temporary legacy hash matcher only for tolerant lookup, and loads products only when the matched node has no children. |
| Provider-aware Bonpreu add-to-list lookup | ✅ Implemented | `AddCatalogItem.ts` resolves the requested provider before `getProduct(productId)` and persists `source=bonpreuesclat` plus `sourceProductId=retailerProductId`. |
| Router/schema contract accepts Bonpreu canonical IDs | ✅ Implemented | `categoryDetailParamsSchema` accepts non-whitespace slash-safe strings, and router tests prove canonical Bonpreu IDs round-trip through `GET /api/catalog/:provider/categories/:id`. |
| Bonpreu web navigation compatibility | ✅ Implemented | Web adapter preserves `subcategoryId`, `useCatalog` falls back to a root leaf when needed, and `Catalog.tsx` renders navigation-only Bonpreu detail sections as follow-up buttons instead of a false empty state. |
| Rest Client docs endpoint/body alignment | ✅ Implemented | Docs now use only public provider-aware category endpoints, Bonpreu add-to-list uses `provider=bonpreuesclat` + `productId=retailerProductId`, and examples include the shipped `/300x300.webp` thumbnail normalization. |
| Archive readiness | ✅ Unblocked | All tasks are complete, both package verify gates are green, the web coverage gate is green, and all in-scope spec scenarios have passing runtime evidence. |

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| Return canonical upstream Bonpreu IDs on public category routes | ✅ Yes | `BonpreuCatalogProvider.ts` exposes `categoryId` unchanged in root/detail responses. |
| Keep Bonpreu traversal provider-specific | ✅ Yes | Intermediate Bonpreu nodes remain navigation-only; Mercadona behavior was not unified. |
| Use tree inspection for deepest reachable node | ✅ Yes | Detail logic branches on actual `childCategories.length`, not a fixed depth assumption. |
| Resolve Bonpreu add-to-list through internal provider lookup | ✅ Yes | `listsModule.ts` wires all catalog providers and `AddCatalogItem.ts` resolves per-request provider lookup internally. |
| Web deeper navigation remains a compatibility layer, not an API change | ✅ Yes | Web preserves detail subcategory IDs and renders them as UI navigation while public API routes stay unchanged. |

### Issues Found
**CRITICAL**: None.

**WARNING**:
- `apps/web pnpm verify` passes with 7 existing ESLint warnings (0 errors). They do not block the package verify script but still represent cleanup debt outside this change's contract.
- `apps/web pnpm test:coverage` passes, but CORE remains at 93.37% vs the repo's manual 100% target. The analyzer reports this as warning-only under the project's 100/80/0 policy.
- Verification was executed against the current dirty workspace state, not a clean committed snapshot; archive is technically unblocked, but final archive should use the intended reviewed tree.

**SUGGESTION**:
- Keep the new `apps/api/test/bonpreuDocs.test.ts` docs-contract coverage as the minimum regression guard whenever these QA docs change.
- Address the existing web ESLint warnings and CORE coverage debt in a separate cleanup change instead of coupling more scope into this repair.

### Verdict
PASS WITH WARNINGS
Formal verify is green: all 12 tasks are complete, both package verify gates and the web coverage gate pass, every in-scope spec scenario has passing runtime evidence, and archive is unblocked. Remaining notes are non-blocking repo debt warnings.
