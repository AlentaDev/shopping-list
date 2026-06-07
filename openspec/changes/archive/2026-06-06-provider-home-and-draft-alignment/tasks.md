# Tasks: Provider Home and Draft Alignment

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 550-750 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Draft provider contracts end-to-end | PR 1 | Web/API contracts, reducers, autosave tests; docs included |
| 2 | Home + catalog provider-entry flow | PR 2 | Depends on PR 1; routing, Home UI_TEXT, mutation guard wiring |
| 3 | Reuse/edit conflict branching | PR 3 | Depends on PR 2; dedicated active-edit UX, list actions, docs |

## Phase 1: Foundation Contracts

- [x] 1.1 RED: extend `apps/web/src/context/ListContext.test.tsx` for single `draftProviderId`, empty-draft persistence, and reset semantics.
- [x] 1.2 GREEN: update `apps/web/src/context/ListContextValue.ts` and `apps/web/src/context/ListContext.tsx` with `draftProviderId` setter/reset helpers.
- [x] 1.3 RED: extend `apps/web/src/features/shopping-list/services/{AutosaveService,AutosaveAdapter}.test.ts` and `useAutosaveRecovery.test.tsx` for explicit provider handshakes.
- [x] 1.4 GREEN: update `apps/web/src/features/shopping-list/services/{types.ts,AutosaveService.ts,useAutosaveDraft.ts,useAutosaveRecovery.ts}` and `adapters/AutosaveAdapter.ts` to carry provider on local/remote drafts.
- [x] 1.5 RED/GREEN: extend `apps/api/src/modules/lists/api/validation.test.ts`, `application/{GetAutosaveDraft,UpsertAutosaveDraft,ReuseList,UpdateListStatus}.test.ts`, then require/persist `providerId` in matching `.ts` files.

## Phase 2: Home and Routing

- [x] 2.1 RED: update `apps/web/src/app-shell/useAppShellNavigation.test.ts` for `/` as canonical Home and `/catalog` → `/{lastProvider}/catalog` or `/`.
- [x] 2.2 GREEN: modify `apps/web/src/app-shell/useAppShellNavigation.ts` to remove hidden default-provider fallback.
- [x] 2.3 RED: extend `apps/web/src/app-shell/AppShell.test.tsx` and `components/CatalogHome.tsx` tests for anonymous draft guidance and explicit provider entry.
- [x] 2.4 GREEN: update `apps/web/src/app-shell/{AppShell.tsx,components/CatalogHome.tsx}` and `apps/web/src/shared/constants/ui.ts` to persist provider choice from Home.
- [x] 2.5 RED/GREEN: extend `apps/web/src/features/catalog/Catalog.test.tsx`, then guard add-to-list mutations in `apps/web/src/features/catalog/Catalog.tsx` while allowing cross-provider browsing.

## Phase 3: Reuse and Active Edit Conflicts

- [x] 3.1 RED: extend `apps/web/src/features/lists/ListsContainer.test.tsx` for generic reuse conflicts versus active-edit-only actions.
- [x] 3.2 GREEN: update `apps/web/src/features/lists/{ListsContainer.tsx,services/ListsService.ts,services/adapters/ListAdapter.ts}` to surface provider metadata and conflict branches.
- [x] 3.3 RED/GREEN: extend `apps/web/src/app-shell/AppShell.editing-session.test.tsx`, then wire dedicated active-edit conflict UX in `apps/web/src/app-shell/AppShell.tsx` without changing `finish-edit`/`reuse` semantics.

## Phase 4: Documentation and Verification

- [x] 4.1 Update `docs/features/web/{app-shell-composition-root.md,provider-aware-catalog-routing.md,lists-management.md}` and `docs/features/api/list-provider-ownership.md` with the new draft-provider rules.
- [x] 4.2 Run targeted Vitest suites for the touched Web/API files and confirm scenarios: single draft per account, browse-any-provider, mutation-only blocking, dedicated active-edit conflict path.
