# Apply Progress: stabilize-provider-wiring-and-architecture-boundaries

## Slices

- Slice 1 — API Bonpreu provider wiring with legacy list backfill gate
- Slice 2 — Frontend boundary repair for app-shell and cross-feature ownership
- Slice 3 — Provider composition evidence / ApiAwakeContext keep-remove decision
- Slice 4 — Android logging hardening for release-safe network/provider observability
- Slice 5 — Bonpreu API docs sync for provider-aware mutation and rollout contract
- Mode: Standard (project TDD contract followed; strict SDD TDD mode not injected)
- Delivery:
  - Slice 1: feature-branch-chain, PR #1 targeting the feature/tracker branch
  - Slice 2: feature-branch-chain, PR #2 targeting the Slice 1 branch
  - Slice 3: feature-branch-chain, PR #3 targeting the Slice 2 branch
  - Slice 4: feature-branch-chain, PR #4 targeting the Slice 3 branch
  - Slice 5: feature-branch-chain, PR #5 targeting the Slice 4 branch

## Completed Tasks

- [x] 1.1 RED: Extended `AddCatalogItem` tests for Bonpreu success, provider conflict, unresolved draft providers, and missing ownership without Mercadona fallback.
- [x] 1.2 RED: Added `buildRouter()` composition coverage proving lists wiring receives a provider resolver instead of `catalogModule.provider`.
- [x] 1.3 GREEN: Wired catalog resolver exposure through `catalogModule`, router composition, lists module composition, and `AddCatalogItem` execution.
- [x] 1.4 GREEN: Added in-memory and Postgres backfill coverage for NULL/blank/legacy Mercadona provider ownership only, including padded legacy `mercadona` values in both runtimes.
- [x] 1.5 REFACTOR/rollout gate: Updated the backfill SQL semantics to trim legacy ownership consistently and added a deployment-path migration under `apps/api/database/migrations/013_backfill_list_provider.sql`.
- [x] 2.1 RED: Tightened shell boundary coverage to reject feature internal imports from `app-shell/*` and cross-feature internal imports from `features/*`.
- [x] 2.2 GREEN: Refactored `AppShell` and `useAppShellNavigation` to consume feature public entrypoints only.
- [x] 2.3 GREEN: Moved read-only list detail modal ownership into `features/lists/components/ListDetailModal.tsx` and kept list detail behavior covered by UI tests.
- [x] 2.4 REFACTOR: Centralized category grouping in `shared/utils/groupItemsByCategory.ts` and updated both list-detail and shopping-list consumers.
- [x] 3.1 RED: Expanded `apps/web/src/providers/AppProviders.test.tsx` with provider-order evidence showing `/health` wakes `ApiAwakeProvider` before `AuthProvider` bootstraps auth, including a macrotask check proving `getCurrentUser()` still stays blocked while `/health` remains unresolved, while descendant consumers can read both auth and list state.
- [x] 3.2 GREEN: Kept `ApiAwakeProvider` in `AppProviders` because the new composition evidence proves it gates `AuthProvider` bootstrap and remains observable by descendants; no `AppProviders.tsx` or `ApiAwakeContext.tsx` code change was required.
- [x] 4.1 RED: Added JVM coverage for debug verbosity, release-safe metadata logging, and deterministic rejection of release-capable local API URLs in the Android network stack.
- [x] 4.2 GREEN: Introduced BuildConfig-driven Android network logging policy, safe release metadata-only interceptor behavior, and preserved the existing `localRelease` build block.
- [x] 5.1 DOCS: Updated `docs/features/api/listCatalogItems.md` and `docs/features/api/list-provider-ownership.md` to document Bonpreu/Mercadona provider-aware mutation flow, `draft_provider_conflict`, deterministic unresolved-provider failure, mandatory pre-rollout backfill, and the rollout order that rejects mutation-time fallback.

## TDD Evidence

| Task | RED | GREEN | REFACTOR |
|---|---|---|---|
| 1.1 | Added failing `AddCatalogItem` expectations for Bonpreu resolver flow, unresolved ownership, and fallback rejection | Resolver-based implementation now passes all mutation cases | Shared provider test helpers keep scenarios focused |
| 1.2 | Added failing `buildRouter()` composition test for resolver injection | Router now passes `catalogModule.providerResolver` into lists composition | Hoisted mocks keep composition test isolated |
| 1.3 | Existing/new RED tests failed under singleton-provider wiring | Resolver contract is now exposed and consumed across catalog/lists wiring | Persisted provider resolution separated into domain helper |
| 1.4 | Added failing backfill coverage for padded legacy `mercadona` ownership in runtime repositories | In-memory and Postgres backfill now normalize `  mercadona  ` to `provider-mercadona` while leaving Bonpreu untouched | Shared coverage now guards both blank and trimmed legacy ownership semantics |
| 1.5 | Added failing deployment-path migration evidence for the backfill SQL and aligned module-local SQL expectations | Deployment migration `013_backfill_list_provider.sql` now ships in `database:migrate` path and trims legacy ownership consistently | Module-local rollout SQL and deployment SQL now share the same trimmed Mercadona semantics |
| 2.1 | Strengthened `appShellBoundary.test.ts` and `useAppShellNavigation.test.ts` so public-entrypoint expectations fail when shell code reaches into feature internals | Boundary tests now pass only when `app-shell/*` imports feature roots and feature-to-feature internals are removed | Regex guards now distinguish feature public roots from internal subpaths |
| 2.2 | Updated RED tests failed while `AppShell` imported shopping-list services directly and navigation pulled catalog from an internal file | `AppShell` now uses `@src/features/shopping-list` exports and navigation uses `@src/features/catalog` | Public feature indexes now act as stable shell-facing facades |
| 2.3 | `ListsScreen` depended on `features/shopping-list/components/ListModal`, which violated the new boundary guard | Read-only detail rendering now lives in `features/lists/components/ListDetailModal.tsx` and existing modal UI tests remain green | The lists feature now owns its own detail presentation without borrowing shopping-list UI internals |
| 2.4 | Cross-feature adapter coverage exposed shared grouping logic living under `shopping-list/services` | Shared grouping now lives in `shared/utils/groupItemsByCategory.ts`, with the shopping-list service reduced to a thin wrapper | Generic shared grouping keeps category ordering stable for both list item shapes |
| 3.1 | Added provider-composition coverage that would fail if auth bootstrapped before `/health`, if `getCurrentUser()` escaped on the next macrotask while `/health` was still pending, or if descendants could not consume auth/list state through `AppProviders` | `AppProviders.test.tsx` now proves `/health` runs before `getCurrentUser()`, `getCurrentUser()` stays blocked after an extra macrotask while `apiAwake=false`, `apiAwake` flips from `false` to `true`, and descendant probes read auth/list context successfully | One probe component now captures provider-order evidence without coupling tests to provider internals |
| 3.2 | Re-read `AuthContext.tsx`, `AppShell.tsx`, and `ApiAwakeContext.tsx` against the new evidence before deciding on removal | Evidence showed `ApiAwakeProvider` is still required to gate auth bootstrap and shell handshake semantics, so the implementation stays unchanged | The keep/remove decision is now explicit, test-backed, and safe from speculative provider removal |
| 4.1 | Added failing Android JVM tests for debug verbosity, production-target `prodDebug` safety, combined `isDebugBuild + isReleaseCapable` handling, and release-capable local/private URL rejection in the network logging path | `NetworkModule` and `DebugInterceptor` now satisfy all logging safety expectations under the strengthened policy | Test-only log sinks and deterministic clocks keep the Android logging checks isolated from `android.util.Log` |
| 4.2 | RED tests failed while Android always enabled BODY logs and dumped full request/response details whenever `DEBUG=true`, including production-target debug variants | BuildConfig now declares both `IS_RELEASE_CAPABLE` and `IS_PRODUCTION_API_TARGET`, `NetworkModule` resolves a logging policy from build config, and any release-capable or production-targeted variant downgrades to metadata-only debug logs plus `HttpLoggingInterceptor.Level.NONE` | Logging policy resolution is isolated in `NetworkLoggingPolicy.kt`, which now hard-fails release-capable local/private API hosts even if a variant slips past Gradle gating |
| 5.1 | N/A — docs-only slice aligned to already shipped wiring/tests from slices 1-4 | API docs now describe resolver-based Bonpreu/Mercadona mutation flow, explicit conflict/unresolved-provider behavior, and rollout/backfill ordering | The rollout rationale is chunked into scan-friendly sections so reviewers can verify why mutation-time fallback is intentionally rejected |

## Review Fix Follow-up

- Slice 2 review fix — modal parity: added RED coverage for `ListDetailModal` body scroll locking and Escape-to-close, then restored the legacy modal behavior for the read-only detail flow.
- Slice 2 review fix — boundary guard: static import scanning now covers `import ... from`, side-effect imports, `@src/*`, `@/*`, and relative imports so app-shell/tests cannot hide feature-internal dependencies behind alias variation.
- Slice 2 review fix — legacy navigation test: switched `useAppShellNavigation.legacy.test.tsx` from `@src/features/catalog/Catalog` to the feature public entrypoint.
- Slice 2 review fix — fallback label dedupe: `ListDetailGroupingAdapter` now reuses `FALLBACK_CATEGORY` from `shared/utils/groupItemsByCategory.ts` instead of duplicating the label inline.
- Slice 2 re-review fix — legacy auth bootstrap: `AppShell.legacy.test.tsx` now stubs `/health` in the outside-click scenario so `ApiAwakeProvider` can wake `AuthProvider` and prove the authenticated user-menu close behavior instead of rendering anonymous auth buttons.
- Slice 2 re-review fix — static re-export guard: `collectStaticImports()` now captures `export { ... } from` and `export * from` dependencies, and the boundary tests preserve the intentional `features/app-shell/index.ts` fallback exception while still blocking new cross-feature internals.
- Slice 2 re-review fix — centralized fallback copy: `UI_TEXT.LISTS.CATEGORY_FALLBACK` now owns the category fallback label, `groupItemsByCategory.ts` consumes it, and list-detail/shopping-list adapters defer fallback semantics to the shared utility instead of duplicating display text.
- Slice 2 final cleanup — app-shell test boundary mocks: `AppShell.legacy.test.tsx` now mocks the public `@src/features/shopping-list` facade instead of `services/LocalDraftSyncService`, so app-shell tests stay aligned with runtime ownership and avoid feature-internal test coupling.
- Slice 2 final cleanup — AST dependency scanner: `appShellImportBoundary.ts` now parses imports, re-exports, and `vi.mock()`/`vi.doMock()`/`vi.unmock()` specifiers via TypeScript AST, which closes the mock-specifier blind spot without flagging fixture strings embedded in guard tests.
- Slice 2 re-review note — duplicated list action button logic in `ListsScreen.tsx` and `ListDetailModal.tsx` was intentionally left unchanged in this batch to avoid scope creep beyond the requested reliability/boundary fixes.
- Slice 3 review fix — auth bootstrap macrotask guard: `AppProviders.test.tsx` now advances one timer tick while `/health` is still unresolved and asserts `getCurrentUser()` remains blocked, closing the gap where a broken composition could have deferred auth bootstrap to the next macrotask.
- Slice 4 implementation note — release-capable Android logging now records only safe metadata (`method`, `host`, `status`, `duration`, retry presence) and never logs headers, cookies, auth tokens, payload bodies, stack traces, or personal/list URL paths.
- Slice 4 implementation note — `localRelease` remains disabled at the Gradle variant layer, and the runtime logging policy adds a second guard that throws if any release-capable build somehow resolves `10.0.2.2`, `localhost`, or `127.0.0.1` as its API host.
- Slice 4 review fix — `prodDebug` and any other production-targeted variant now force safe metadata logging even when `DEBUG=true`; release-capable safety also wins if both debug and release-capable flags are true.
- Slice 4 review fix — release-capable URL blocking now also rejects straightforward private-host targets (`192.168.x.x`, `172.16-31.x.x`, `169.254.x.x`, `10.x.x.x`, `host.docker.internal`, `.local`) without changing the existing `10.0.2.2` block.
- Slice 4 batch-scope note — this warning-fix batch touched only Android logging files under `apps/mobile-android/` plus OpenSpec progress tracking; prior API/web diffs belong to Slices 1-3 and were intentionally preserved, not modified here.
- Slice 5 doc review fix — clarified that resolver-owned draft/list provider ownership must match the requested `source` or return `409 draft_provider_conflict`, and aligned `provider_not_found` to cover unresolved persisted ownership or an unregistered/unresolvable provider slug without implying Mercadona fallback.

## Verification

- `pnpm vitest run src/app/router.test.ts src/modules/lists/application/AddCatalogItem.test.ts src/modules/lists/infrastructure/InMemoryListRepository.test.ts src/modules/lists/infrastructure/PostgresListRepository.test.ts`
- `pnpm vitest run src/modules/lists/infrastructure/InMemoryListRepository.test.ts src/modules/lists/infrastructure/PostgresListRepository.test.ts src/modules/lists/infrastructure/migrations/backfillListProviderDeployment.test.ts` *(RED → GREEN warning-fix cycle)*
- `pnpm vitest run src/app/router.test.ts src/modules/lists/application/AddCatalogItem.test.ts src/modules/lists/infrastructure/InMemoryListRepository.test.ts src/modules/lists/infrastructure/PostgresListRepository.test.ts src/modules/lists/infrastructure/migrations/backfillListProviderDeployment.test.ts`
- `pnpm vitest run src/app-shell/appShellBoundary.test.ts src/app-shell/useAppShellNavigation.test.ts src/app-shell/AppShell.test.tsx src/app-shell/AppShell.editing-session.test.tsx src/features/lists/components/ListsScreen.test.tsx src/features/lists/services/adapters/ListDetailGroupingAdapter.test.ts src/features/shopping-list/services/groupItemsByCategory.test.ts`
- `pnpm vitest run src/features/lists/components/ListDetailModal.test.tsx src/app-shell/appShellImportBoundary.test.ts src/app-shell/appShellBoundary.test.ts src/app-shell/useAppShellNavigation.legacy.test.tsx` *(RED → GREEN review-fix cycle)*
- `pnpm vitest run src/app-shell/appShellBoundary.test.ts src/app-shell/appShellImportBoundary.test.ts src/app-shell/useAppShellNavigation.test.ts src/app-shell/useAppShellNavigation.legacy.test.tsx src/app-shell/AppShell.test.tsx src/app-shell/AppShell.editing-session.test.tsx src/features/lists/components/ListDetailModal.test.tsx src/features/lists/components/ListsScreen.test.tsx src/features/lists/services/adapters/ListDetailGroupingAdapter.test.ts src/features/shopping-list/services/groupItemsByCategory.test.ts`
- `pnpm typecheck`
- `pnpm -C apps/web test:run src/app-shell/AppShell.legacy.test.tsx` *(RED reproduction for the unauthenticated outside-click failure, then GREEN after `/health` bootstrap fix)*
- `pnpm -C apps/web test:run src/app-shell/AppShell.legacy.test.tsx src/app-shell/appShellImportBoundary.test.ts src/app-shell/appShellBoundary.test.ts src/features/lists/services/adapters/ListDetailGroupingAdapter.test.ts src/features/shopping-list/services/adapters/ShoppingListItemAdapter.test.ts`
- `pnpm -C apps/web test:run src/app-shell/appShellBoundary.test.ts src/app-shell/useAppShellNavigation.test.ts src/app-shell/useAppShellNavigation.legacy.test.tsx src/features/lists/components/ListDetailModal.test.tsx src/features/lists/components/ListsScreen.test.tsx src/features/shopping-list/services/groupItemsByCategory.test.ts`
- `pnpm -C apps/web test:run`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web test:run src/app-shell/appShellImportBoundary.test.ts src/app-shell/appShellBoundary.test.ts src/app-shell/AppShell.legacy.test.tsx src/features/lists/services/adapters/ListDetailGroupingAdapter.test.ts`
- `pnpm -C apps/web test:run src/app-shell/appShellBoundary.test.ts src/app-shell/appShellImportBoundary.test.ts src/app-shell/useAppShellNavigation.test.ts src/app-shell/useAppShellNavigation.legacy.test.tsx src/app-shell/AppShell.test.tsx src/app-shell/AppShell.editing-session.test.tsx src/app-shell/AppShell.legacy.test.tsx src/features/lists/components/ListDetailModal.test.tsx src/features/lists/components/ListsScreen.test.tsx src/features/lists/services/adapters/ListDetailGroupingAdapter.test.ts src/features/shopping-list/services/groupItemsByCategory.test.ts`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web test:run src/providers/AppProviders.test.tsx src/context/ApiAwakeContext.test.tsx src/context/AuthContext.test.tsx src/app-shell/AppShell.legacy.test.tsx`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web test:run src/providers/AppProviders.test.tsx src/context/ApiAwakeContext.test.tsx src/context/AuthContext.test.tsx`
- `pnpm -C apps/web typecheck`
- `./gradlew :app:testLocalDebugUnitTest --tests com.alentadev.shopping.core.network.NetworkModuleLoggingPolicyTest --tests com.alentadev.shopping.core.network.DebugInterceptorTest` *(RED compile failure before implementation, then GREEN after policy/interceptor hardening)*
- `./gradlew :app:testLocalDebugUnitTest --tests com.alentadev.shopping.core.network.NetworkPolicyAlignmentTest --tests com.alentadev.shopping.core.network.NetworkModuleLoggingPolicyTest --tests com.alentadev.shopping.core.network.DebugInterceptorTest`
- `./gradlew :app:testLocalDebugUnitTest --tests com.alentadev.shopping.core.network.NetworkModuleLoggingPolicyTest --tests com.alentadev.shopping.core.network.DebugInterceptorTest --tests com.alentadev.shopping.core.network.NetworkPolicyAlignmentTest` *(review-warning RED → GREEN cycle for prod-target safety, combined flags, and private-host blocking)*
- `./gradlew :app:testProdDebugUnitTest --tests com.alentadev.shopping.core.network.NetworkModuleLoggingPolicyTest --tests com.alentadev.shopping.core.network.DebugInterceptorTest`
- Manual docs verification: confirmed the updated content lives in `docs/features/api/listCatalogItems.md` and `docs/features/api/list-provider-ownership.md`, and inspected root/API package scripts to confirm no automated markdown/docs validation command exists for this repo.

## Notes

- Mutation-time fallback to Mercadona was removed only for strict mutation execution; read compatibility helpers remain available for legacy read flows.
- Repository reads now preserve persisted provider ownership so mutation logic can detect missing ownership instead of silently normalizing it away.
- Production rollout now has a deployment-facing migration in `apps/api/database/migrations/013_backfill_list_provider.sql`; the module-local SQL remains aligned rollout documentation/evidence for the lists module.
- Postgres runtime backfill and both SQL artifacts now treat padded legacy `mercadona` ownership the same way via `btrim(provider_id) = 'mercadona'`.
- `app-shell/*` now imports only feature public entrypoints; the boundary guard also blocks cross-feature internal imports inside `features/*`.
- The boundary guard now treats `vi.mock()`/`vi.doMock()`/`vi.unmock()` module specifiers as real dependencies, so test-only mocks cannot quietly bypass app-shell/feature boundary rules.
- `features/lists` owns the read-only detail modal, so list detail UI no longer depends on `features/shopping-list` components.
- Category grouping is now shared through `shared/utils/groupItemsByCategory.ts`, while `shopping-list/services/groupItemsByCategory.ts` stays as a thin compatibility wrapper for existing feature-local imports.
- `ListDetailGroupingAdapter.ts` no longer imports the shared fallback constant directly because fallback labeling is fully owned by `groupItemsByCategory.ts`.
- The read-only list detail modal now preserves the legacy close interaction contract: close button, Escape dismissal, and body scroll lock.
- Boundary scanning must ignore its own fixture-bearing guard tests; otherwise import-like strings inside test fixtures create false positives unrelated to real module dependencies.
- Authenticated shell tests that rely on `AuthProvider` bootstrap must satisfy `ApiAwakeProvider` first; otherwise `/api/users/me` never runs and the shell legitimately renders the anonymous Login/Registro actions.
- Re-export scanning surfaces the intentional `features/app-shell/index.ts` compatibility bridge as a cross-feature exception, so the guard must keep that single fallback file explicitly whitelisted while still rejecting any new feature-to-`app-shell` dependency.
- `ApiAwakeProvider` still has a real runtime job even though `useApiAwake()` has a permissive fallback: without the provider, `AuthProvider` would treat `apiAwake` as immediately `true` and skip the intended `/health` gate before bootstrap.
- `AppProviders` composition evidence is now explicit: `ApiAwakeProvider` must remain outside `AuthProvider`, and `ListProvider` descendants continue working inside the same tree without introducing feature logic into `providers/`.
- The composition test must flush at least one macrotask while `/health` is still pending; otherwise the suite can miss a regression where `AuthProvider` defers bootstrap with `window.setTimeout(..., 0)` instead of blocking on `apiAwake`.
- Android release-safe logging cannot rely on `BuildConfig.DEBUG` alone because the release/local safety contract is about publishable variants, so `IS_RELEASE_CAPABLE` is now emitted from Gradle and combined with the API base URL for deterministic safety validation.
- Release-safe Android metadata logging must avoid full URLs because list/resource paths can reveal personal or provider-linked identifiers; logging only host/method/status/duration keeps diagnostics useful without leaking list data.
- Production-targeted Android debug variants also require safe logging, so the policy now treats API target and release capability as authoritative safety inputs instead of trusting the debug build type alone.
- Straightforward private-host blocking is worth duplicating at runtime because Gradle variant gating protects `localRelease`, but release-capable builds can still become unsafe if a different private host is wired accidentally.
- Slice 5 docs now make the production prerequisite explicit: backfill legacy list ownership to `provider-mercadona` before enabling strict resolver-based mutations, because mutation-time fallback would hide broken data and make rollout verification unreliable.
