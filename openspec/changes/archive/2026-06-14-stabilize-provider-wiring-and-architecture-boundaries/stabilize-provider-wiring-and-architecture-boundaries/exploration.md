## Exploration: stabilize-provider-wiring-and-architecture-boundaries

### Current State
- `apps/web/src/main.tsx` boots `AppProviders` and `App`, while `apps/web/src/App.tsx` correctly keeps `AppShell` as the thin composition entrypoint.
- `apps/web/src/providers/AppProviders.tsx` is a simple provider stack (`ToastProvider -> ApiAwakeProvider -> AuthProvider -> ListProvider`), but there is no explicit contract test for provider ordering/dependencies beyond a smoke render test.
- `apps/web/src/app-shell/AppShell.tsx` is still carrying infrastructure and feature-service wiring directly: it reads and writes local storage through shopping-list autosave services, calls `cancelListEditing`, manages handshake banners, and coordinates feature transitions.
- `apps/web/src/app-shell/useAppShellNavigation.ts` is the real routing/composition coordinator and correctly owns route resolution, but it imports feature internals directly instead of staying on stable feature entrypoints/facades.
- Frontend boundaries are still porous outside app-shell: `features/lists/components/ListsScreen.tsx` imports `@src/features/shopping-list/components/ListModal`, and `features/lists/services/adapters/ListDetailGroupingAdapter.ts` imports `@src/features/shopping-list/services/groupItemsByCategory`, which violates the project rule that one feature must not depend on another feature’s internals.
- The repository already contains a guard test in `apps/web/src/app-shell/appShellBoundary.test.ts`, but current runtime code contradicts that intent because `AppShell.tsx` imports `@src/features/shopping-list/services/*` directly.
- On the backend, `apps/api/src/modules/catalog/catalogModule.ts` already builds a multi-provider resolver (`mercadona` + `bonpreuesclat`) for catalog routes with cache/stale fallback, but `apps/api/src/app/router.ts` passes only `catalogModule.provider` into `createListsModule(...)`.
- That means list mutations are wired to a single default catalog provider instance even though `AddCatalogItem` accepts both provider slugs; the composition layer resolves provider-aware catalog reads, but not provider-aware catalog item mutations.

### Affected Areas
- `apps/web/src/providers/AppProviders.tsx` — provider order is a hidden dependency (`AuthProvider` depends on `ApiAwakeProvider`, shell depends on all of them) and needs a stronger wiring contract.
- `apps/web/src/providers/AppProviders.test.tsx` — current coverage is only a render smoke test, so provider boundary regressions can slip in unnoticed.
- `apps/web/src/app-shell/AppShell.tsx` — composition root currently reaches into feature services and local persistence details, creating shell-to-feature-internal coupling.
- `apps/web/src/app-shell/useAppShellNavigation.ts` — owns route composition and should remain the boundary point for shell-level navigation rules.
- `apps/web/src/app-shell/appShellBoundary.test.ts` — already encodes desired architecture rules and exposes current drift that should be stabilized before broader changes.
- `apps/web/src/features/lists/components/ListsScreen.tsx` — imports shopping-list UI internals across feature boundaries.
- `apps/web/src/features/lists/services/adapters/ListDetailGroupingAdapter.ts` — imports shopping-list service internals across feature boundaries.
- `apps/web/src/context/ListContext.tsx` and `apps/web/src/context/AuthContext.tsx` — CORE frontend state/services that any provider or shell refactor must preserve with 100% coverage discipline.
- `apps/api/src/app/router.ts` — central wiring currently couples list item mutations to the default catalog provider instead of a provider resolver/registry.
- `apps/api/src/modules/catalog/catalogModule.ts` — already contains the provider set and is the natural place to expose a provider registry/resolver abstraction for other modules.
- `apps/api/src/modules/lists/listsModule.ts` and `apps/api/src/modules/lists/application/AddCatalogItem.ts` — current dependency shape assumes one injected provider instance, which is unstable for multi-provider list flows.

### Approaches
1. **Stabilize explicit composition contracts first** — keep `app-shell/` as the only composition root, move shell dependencies to stable feature entrypoints/facades, and make backend list mutations depend on a provider resolver/registry instead of a single provider instance.
   - Pros: fixes the real architecture leak, aligns with existing specs/ADR, protects future provider work, and makes TDD targets clearer in CORE layers.
   - Cons: requires coordinated web and API slices plus boundary test updates.
   - Effort: High.

2. **Patch violations in place without changing wiring contracts** — remove the most obvious imports or add narrow exceptions while keeping current provider/module composition largely intact.
   - Pros: smaller short-term diff.
   - Cons: leaves the backend single-provider miswiring in place, preserves hidden provider-order assumptions, and invites future regressions because boundaries remain implicit.
   - Effort: Medium.

### Recommendation
Choose **Stabilize explicit composition contracts first**. The biggest risk is NOT cosmetic drift — it is that the frontend boundary rules and backend provider wiring already disagree with the intended architecture. A proposal should treat this as a stabilization refactor with TDD guardrails: first lock provider/app-shell boundaries with tests, then introduce a provider resolver contract for list mutations, then remove cross-feature/internal imports through feature-owned facades or shared pure utilities.

### Risks
- `AppShell` currently violates its own boundary test intent by importing feature service internals; implementation work will stay brittle until shell-facing APIs are formalized.
- `buildRouter()` currently injects only the default catalog provider into lists, so Bonpreu/other provider mutations are at risk of calling the wrong backend provider implementation.
- `features/lists` currently depends on `features/shopping-list` internals, so moving code without a clear ownership decision could trigger accidental cross-feature regressions.
- TDD scope is non-trivial: frontend CORE (`context/`) must keep 100% coverage, and backend wiring needs new tests at module/composition level because current unit tests do not prove multi-provider wiring end-to-end.
- Review-size risk is high; this should likely be planned as chained work units instead of a single large apply phase.

### Ready for Proposal
Yes — the proposal should scope this as an architectural stabilization change with two explicit tracks: (1) web composition/provider boundary hardening, and (2) backend provider resolver wiring for list mutations, both driven by tests before refactor.
