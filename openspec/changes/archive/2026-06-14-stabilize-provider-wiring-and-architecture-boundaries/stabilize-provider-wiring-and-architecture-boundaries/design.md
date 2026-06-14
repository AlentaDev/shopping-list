# Design: Stabilize Provider Wiring and Architecture Boundaries

## Technical Approach

Implement this change as chained slices, not one PR. Slice 1 is the release gate: prove provider-aware list mutations with failing API tests, expose a resolver/registry from `catalogModule`, wire it into `listsModule`, and ship a mandatory legacy-list backfill before strict production rollout. Later slices keep behavior stable while tightening `apps/web` boundaries and hardening Android logging per `android-network-logging-safety`.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|---|---|---|---|
| API provider wiring | Keep singleton provider injection; expose resolver through catalog public contract | Singleton is smaller but wrong for multi-provider drafts | Export a resolver/registry contract from `apps/api/src/modules/catalog/public.ts` and inject it into `createListsModule()` |
| List mutation ownership | Resolve provider in router; resolve in `AddCatalogItem`; silently fallback to Mercadona | Router resolution leaks business rule into `web`; silent fallback hides broken data and makes rollout unsafe | `AddCatalogItem` resolves `draft.provider.slug` inside application using injected resolver and fails explicitly when list ownership cannot be resolved |
| Legacy list compatibility | Runtime fallback forever; deploy strict wiring first; backfill before rollout | Runtime fallback reduces safety and masks defects; deploy-first risks production breakage | Treat missing `provider_id` as a deployment/data defect and require `provider_id = provider-mercadona` backfill before slice 1 reaches production |
| Web boundary repair | Allow direct feature internals; add shell-facing facades/shared utilities | Direct imports preserve drift | `app-shell` consumes stable feature entrypoints/facades only; cross-feature pure logic moves to `shared` |
| `ApiAwakeContext` | Remove immediately; keep indefinitely; decide from tests | Immediate removal is risky, indefinite keep stays implicit | Add provider-order evidence tests first; keep/remove only if tests prove no consumer dependency |
| Android logging | Keep BODY logging; disable all logging; build-config policy | BODY logging leaks data; no logging hurts diagnosis | Build-config driven logging policy: verbose only in local/debug, metadata-only or disabled in release-capable variants |

## Data Flow

Slice 1 API path:

    POST /api/lists/:id/items/from-catalog
      → lists/api/router.ts (Zod validates requested provider)
      → AddCatalogItem.execute()
      → listRepository.findById()
      → resolve list ownership (`provider_id` already backfilled in production)
      → resolveListProviderSlug(list.providerId)
      → catalogProviderResolver.resolve(draftSlug)
      → provider.getProduct(productId)
      → save snapshot to repository

Conflict and unresolved provider both fail before mutation execution; no mutation-time Mercadona fallback is allowed.

Web path after slice 2:

    AppShell / useAppShellNavigation
      → feature public facades (`@src/features/*`)
      → feature-owned services/components
      → shared pure utilities (no feature-to-feature imports)

Android path after slice 4:

    BuildConfig flags/flavor
      → NetworkModule logging policy
      → HttpLoggingInterceptor + DebugInterceptor redaction/disablement

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/app/router.ts` | Modify | Inject catalog resolver/registry into lists composition instead of singleton provider |
| `apps/api/src/modules/catalog/public.ts` | Modify | Export resolver/registry contract for cross-module consumption |
| `apps/api/src/modules/catalog/catalogModule.ts` | Modify | Return provider registry/resolver alongside router/providers |
| `apps/api/src/modules/lists/listsModule.ts` | Modify | Accept resolver dependency and pass it to `AddCatalogItem` |
| `apps/api/src/modules/lists/application/AddCatalogItem.ts` | Modify | Resolve draft provider explicitly; fail deterministically when missing |
| `apps/api/src/app/router.test.ts` or `apps/api/src/modules/lists/api/router.test.ts` | Modify/Create | Add TDD coverage for Bonpreu wiring, conflict, and unresolved provider |
| `apps/web/src/app-shell/AppShell.tsx` | Modify | Replace direct feature-service imports with shell-facing facades |
| `apps/web/src/app-shell/useAppShellNavigation.ts` | Modify | Keep composition-only routing through public feature entrypoints |
| `apps/web/src/providers/AppProviders.test.tsx` | Modify | Assert provider ownership/order and `ApiAwakeContext` evidence |
| `apps/web/src/features/lists/components/ListDetailModal.tsx` | Create | Own read-only list detail UI inside `lists` instead of importing `shopping-list` internals |
| `apps/web/src/shared/utils/groupItemsByCategory.ts` | Create | Shared pure grouping utility used by both `lists` and `shopping-list` |
| `apps/mobile-android/app/build.gradle.kts` | Modify | Expose logging policy flags and preserve blocked `localRelease` |
| `apps/mobile-android/app/src/main/java/com/alentadev/shopping/core/network/di/NetworkModule.kt` | Modify | Wire interceptors from build-config policy |
| `apps/mobile-android/app/src/main/java/com/alentadev/shopping/core/network/DebugInterceptor.kt` | Modify | Redact or suppress sensitive request/response data |
| `docs/features/api/listCatalogItems.md` | Modify | Document provider-aware mutation contract for Mercadona and Bonpreu |

## Interfaces / Contracts

```ts
// apps/api/src/modules/catalog/public.ts
export interface CatalogProviderResolver {
  resolve(slug: string): CatalogProvider;
}

// apps/api/src/modules/lists/listsModule.ts
type ListsModuleDependencies = {
  catalogProviderResolver: CatalogProviderResolver;
}
```

`AddCatalogItem` keeps the public request contract (`provider`, `productId`, `qty`) but uses the draft provider as execution source of truth. Unknown draft provider returns the existing stable provider-resolution error (`provider_not_found`) before `getProduct()` runs.

Read flows (`GetList`, `ListLists`) may continue normalizing legacy values for compatibility, but slice 1 production readiness depends on persisted list ownership being backfilled first rather than relying on mutation-time correction.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `AddCatalogItem` resolves Bonpreu/Mercadona correctly and short-circuits conflicts/unresolved providers | Red-first Vitest cases in `AddCatalogItem.test.ts` |
| Integration | Router/module composition passes resolver from catalog to lists | Express/router tests around `buildRouter()` or lists route wiring |
| Integration | Legacy backfill updates null/blank/legacy-mercadona `provider_id` rows to `provider-mercadona` | Repository tests for `backfillMissingProvider()` in Postgres and in-memory implementations |
| Unit | `AppProviders` proves provider ordering and `ApiAwakeContext` dependency | React Testing Library composition tests |
| Unit | `app-shell` and feature boundary guards | Update `appShellBoundary.test.ts` and affected feature tests |
| Unit | Android logging policy for debug vs release-capable variants | Kotlin/JVM tests for policy/interceptor behavior; verify no body/secret logging |
| E2E | None for this change | Existing behavior stays covered by targeted unit/integration tests |

## Migration / Rollout

Deliver as reviewable slices under the 400-line budget: (1) API resolver wiring + legacy-list backfill gate + tests, (2) web boundaries, (3) `ApiAwakeContext` evidence decision, (4) Android logging, (5) API docs.

Slice 1 rollout is mandatory and ordered:
1. Run `listRepository.backfillMissingProvider("provider-mercadona")` against the production persistence mode before enabling strict resolver-based mutations.
2. Verify the backfill updated legacy rows (`NULL`, blank, or legacy `mercadona`) and leaves Bonpreu-owned lists untouched.
3. Deploy resolver-based list mutations only after the backfill is confirmed.

Acceptance criterion for slice 1: production data has no lists missing provider ownership, and strict runtime semantics remain in place (`draft_provider_conflict` for cross-provider requests, `provider_not_found` for unresolved ownership, no silent fallback to Mercadona during mutations).

## Open Questions

- [ ] Should unresolved draft providers keep `provider_not_found` or receive a dedicated 409/422 code? Current design keeps the existing stable error unless the user asks for a new contract.
