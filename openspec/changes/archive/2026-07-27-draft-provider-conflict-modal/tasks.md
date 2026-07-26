# Tasks: Draft Provider Conflict Modal

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~380 (13 files: 2 new, 11 modified) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full modal + hook + threading + test migration | PR 1 | Tightly coupled callback threading; splitting breaks RED→GREEN pairs |

## Phase 1: RED — Modal Component (failing tests first)

- [x] 1.1 Create `apps/web/src/app-shell/components/DraftProviderConflictModal.test.tsx` with failing tests: renders message with provider names, confirm fires `onConfirm`, dismiss fires `onDismiss`, Escape key fires `onDismiss`, backdrop click fires `onDismiss`, focus trap keeps focus inside, `role="dialog"` and `aria-modal="true"` present.
- [x] 1.2 Run `pnpm --filter @app/web test:run` — confirm all modal tests fail (RED).

## Phase 2: GREEN — Modal Component

- [x] 2.1 Create `apps/web/src/app-shell/components/DraftProviderConflictModal.tsx` with presentational modal: `role="dialog"`, `aria-modal="true"`, inline focus trap (auto-focus on mount, Tab/Shift+Tab cycling, focus restore on unmount), Escape handler, backdrop click handler, confirm/dismiss buttons reading `UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.*`.
- [x] 2.2 Add `CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.{TITLE, CONFIRM_LABEL, DISMISS_LABEL}` keys to `apps/web/src/shared/constants/ui.ts`. Leave `DRAFT_PROVIDER_CONFLICT` untouched.
- [x] 2.3 Run `pnpm --filter @app/web test:run` — confirm modal tests pass (GREEN).

## Phase 3: RED — Hook Migration (failing tests first)

- [x] 3.1 Update `apps/web/src/context/useDraftProviderConflict.test.tsx`: replace 5 `window.confirm` spy tests with callback-based tests that `await` a resolving `onDraftProviderConflict` callback. Add tests for confirm (resolves true), dismiss (resolves false), name override, active-edit delegation unchanged, same-provider bypass.
- [x] 3.2 Run `pnpm --filter @app/web test:run` — confirm hook tests fail (RED).

## Phase 4: GREEN — Hook Migration

- [x] 4.1 Modify `apps/web/src/context/useDraftProviderConflict.ts`: add `onDraftProviderConflict` option of type `(input: DraftProviderConflictInput) => Promise<boolean>`, export `DraftProviderConflictInput` and `buildConflictMessage`, replace `window.confirm` branch with `await onDraftProviderConflict(...)`, keep active-edit delegation and `hasActiveEditSession` untouched.
- [x] 4.2 Run `pnpm --filter @app/web test:run` — confirm hook tests pass (GREEN).

## Phase 5: RED — Catalog + ListsContainer Callback Threading (failing tests first)

- [x] 5.1 Update `apps/web/src/features/catalog/Catalog.test.tsx`: replace 5 `window.confirm` tests with tests that pass `onRequestDraftProviderConflict` mock prop and verify it is called on cross-provider selection.
- [x] 5.2 Update `apps/web/src/features/lists/ListsContainer.test.tsx`: replace 3 reuse-conflict `window.confirm` tests with tests that pass `onRequestDraftProviderConflict` mock prop and verify forwarding.
- [x] 5.3 Run `pnpm --filter @app/web test:run` — confirm Catalog and ListsContainer tests fail (RED).

## Phase 6: GREEN — Catalog + ListsContainer Callback Threading

- [x] 6.1 Modify `apps/web/src/features/catalog/Catalog.tsx`: accept `onRequestDraftProviderConflict` prop and forward to `useDraftProviderConflict` options.
- [x] 6.2 Modify `apps/web/src/features/lists/ListsContainer.tsx`: accept `onRequestDraftProviderConflict` prop and forward to `useDraftProviderConflict` options.
- [x] 6.3 Run `pnpm --filter @app/web test:run` — confirm Catalog and ListsContainer tests pass (GREEN).

## Phase 7: RED — AppShell + Navigation (failing tests first)

- [x] 7.1 Update `apps/web/src/app-shell/AppShell.test.tsx`: add test that draft conflict request renders modal, confirm calls `resetDraft` + `navigate`, dismiss leaves draft unchanged, modal does not render when active-edit conflict is active.
- [x] 7.2 Update `apps/web/src/app-shell/useAppShellNavigation.test.ts`: add test that `onRequestDraftProviderConflict` callback is forwarded to both Catalog and ListsContainer branches.
- [x] 7.3 Run `pnpm --filter @app/web test:run` — confirm AppShell and navigation tests fail (RED).

## Phase 8: GREEN — AppShell + Navigation Wiring

- [x] 8.1 Modify `apps/web/src/app-shell/AppShell.tsx`: add `draftProviderConflict` state holding `{resolve, payload}`, render `<DraftProviderConflictModal>` when state is non-null, implement confirm handler (`resetDraft` + `navigate(/{requestedProvider}/catalog)` + `resolve(true)` + clear state) and dismiss handler (`resolve(false)` + clear state), thread callback through navigation.
- [x] 8.2 Modify `apps/web/src/app-shell/useAppShellNavigation.ts`: accept `onRequestDraftProviderConflict` option and forward to Catalog and ListsContainer props.
- [x] 8.3 Run `pnpm --filter @app/web test:run` — confirm all tests pass (GREEN).

## Phase 9: Refactor + Verification

- [x] 9.1 Run `pnpm --filter @app/web test:run` — full suite green, no regressions in active-edit conflict tests.
- [x] 9.2 Run `pnpm typecheck` and `pnpm lint` — no errors.
- [x] 9.3 Verify `UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT` message is unchanged (literal preservation).
- [x] 9.4 Verify active-edit modal JSX, state, and handlers are untouched in `AppShell.tsx`.
