# Tasks: Stabilize Provider Wiring and Architecture Boundaries

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 700-950 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | API resolver wiring + legacy backfill gate | PR 1 | Independent slice; include RED/GREEN/REFACTOR and rollout verification |
| 2 | Web shell/feature boundary repair | PR 2 | Depends on PR 1 only for review order |
| 3 | Provider composition evidence / `ApiAwakeContext` | PR 3 | Depends on PR 2 tests/facades |
| 4 | Android logging hardening | PR 4 | Independent code path; keep review isolated |
| 5 | Bonpreu API docs | PR 5 | Final docs sync after shipped wiring |

## Phase 1: Slice 1 — API Provider Wiring

- [x] 1.1 RED: extend `apps/api/src/modules/lists/application/AddCatalogItem.test.ts` for Bonpreu success, `draft_provider_conflict`, unresolved provider, and no mutation-time Mercadona fallback.
- [x] 1.2 RED: add composition tests in `apps/api/src/app/router.test.ts` or `apps/api/src/modules/lists/api/router.test.ts` proving `buildRouter()` injects a resolver, not `catalogModule.provider`.
- [x] 1.3 GREEN: update `apps/api/src/modules/catalog/public.ts`, `catalogModule.ts`, `apps/api/src/app/router.ts`, `apps/api/src/modules/lists/listsModule.ts`, and `AddCatalogItem.ts` to resolve `draft.provider.slug` through the catalog registry.
- [x] 1.4 GREEN: cover `backfillMissingProvider()` in `apps/api/src/modules/lists/infrastructure/PostgresListRepository.test.ts` and `InMemoryListRepository` tests, using `provider-mercadona` for NULL/blank/legacy rows only.
- [x] 1.5 REFACTOR/rollout gate: verify `apps/api/src/modules/lists/infrastructure/migrations/20260523_backfill_list_provider.sql` execution criteria — updates missing ownership to `provider-mercadona`, leaves Bonpreu-owned lists untouched, and must run before strict production rollout.

## Phase 2: Slice 2 — Web Boundary Repair

- [x] 2.1 RED: tighten `apps/web/src/app-shell/appShellBoundary.test.ts` and `useAppShellNavigation.test.ts` to fail on shell imports of `features/*/services/*` internals.
- [x] 2.2 GREEN: refactor `apps/web/src/app-shell/AppShell.tsx` and `useAppShellNavigation.ts` to consume only stable public entrypoints from `apps/web/src/features/lists/index.ts` and `features/shopping-list/index.ts`.
- [x] 2.3 GREEN: replace cross-feature UI dependency by moving read-only detail ownership into `apps/web/src/features/lists/components/ListDetailModal.tsx` and updating `ListsScreen.tsx` tests.
- [x] 2.4 REFACTOR: move shared grouping logic into `apps/web/src/shared/utils/groupItemsByCategory.ts`; update `ListDetailGroupingAdapter.ts` and `features/shopping-list/services/groupItemsByCategory.test.ts`.

## Phase 3: Slice 3 — Provider Composition Evidence

 - [x] 3.1 RED: expand `apps/web/src/providers/AppProviders.test.tsx` with provider-order and descendant-consumer evidence for `ApiAwakeProvider`, `AuthProvider`, and `ListProvider`.
 - [x] 3.2 GREEN: update `apps/web/src/providers/AppProviders.tsx` and `apps/web/src/context/ApiAwakeContext.tsx` only if tests prove `ApiAwakeContext` is unnecessary; otherwise keep it with explicit ordering assertions.

## Phase 4: Slice 4 — Android Logging Hardening

- [x] 4.1 RED: add JVM tests around `apps/mobile-android/app/src/main/java/com/alentadev/shopping/core/network/di/NetworkModule.kt` and `DebugInterceptor.kt` for debug verbosity, release redaction, and blocked local release behavior.
- [x] 4.2 GREEN: wire BuildConfig-driven logging flags in `apps/mobile-android/app/build.gradle.kts`, `NetworkModule.kt`, and `DebugInterceptor.kt` without weakening the existing `localRelease` block.

## Phase 5: Slice 5 — Bonpreu API Docs

- [x] 5.1 Update `docs/features/api/listCatalogItems.md` and `docs/features/api/list-provider-ownership.md` with Bonpreu mutation flow, conflict contract, backfill prerequisite, and rollout order.
