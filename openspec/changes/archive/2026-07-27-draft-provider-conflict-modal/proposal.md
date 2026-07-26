# Proposal: Draft Provider Conflict Modal

## Intent

Replace the native confirmation shown for a non-empty draft when a user selects a different provider with an accessible in-app modal. Preserve draft ownership rules and the existing conflict message while making the choice consistent with application UI.

## Scope

### In Scope
- Add a dedicated draft-only provider-conflict modal owned by `AppShell`.
- Replace `window.confirm` in `useDraftProviderConflict` with an asynchronous callback/result flow.
- On acceptance, reset the draft and navigate to the selected provider; on dismissal, keep the draft unchanged.
- Preserve `UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT` literally; add only title and action-label keys.
- Thread the draft callback through Catalog and list-reuse flows and migrate affected tests.

### Out of Scope
- Changes to the active-edit modal, active-list editing, autosave cancellation, or edit-session behavior.
- API, Android, provider-ownership server contract, or shared modal abstraction.

## Capabilities

### New Capabilities
- `draft-provider-conflict-modal`: In-app resolution of non-empty draft provider conflicts.

### Modified Capabilities
- None.

## Approach

Create `DraftProviderConflictModal.tsx` as a presentational sibling to the active-edit UI. Keep independent AppShell state and resolve the hook's `Promise<boolean>` through a per-conflict resolver. The hook continues to delegate active edit sessions only to the existing active-edit callback. Confirming resets the draft and routes to `/:provider/catalog`; dismissing resolves `false` without mutation.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `apps/web/src/context/useDraftProviderConflict.ts` | Modified | Callback-based draft conflict flow |
| `apps/web/src/app-shell/AppShell.tsx` | Modified | Draft-only state, resolution, navigation |
| `apps/web/src/app-shell/components/DraftProviderConflictModal.tsx` | New | Accessible modal UI |
| `apps/web/src/app-shell/useAppShellNavigation.ts` | Modified | Callback wiring |
| `apps/web/src/features/catalog/`, `features/lists/` | Modified | Forward callback and tests |
| `apps/web/src/shared/constants/ui.ts` | Modified | Add title and action labels only |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Async modal result breaks mutation sequencing | Med | Test confirm/dismiss promise paths |
| Reuse loses requested display-name override | Low | Carry override in modal payload and tests |
| Active-edit behavior regresses | Low | Keep its state, JSX, and handlers untouched |

## Rollback Plan

Revert the modal, callback wiring, and tests as one change to restore the prior native confirmation path; no persisted data or API migration is involved.

## Dependencies

- Existing `ListContext` reset and AppShell navigation APIs.

## Success Criteria

- [ ] Non-empty cross-provider draft actions show the dedicated modal with the unchanged conflict message.
- [ ] Confirm resets the draft and opens the requested provider catalog; dismiss keeps the draft intact.
- [ ] Active-edit conflicts retain their existing modal and behavior.
- [ ] Focused hook, Catalog, ListsContainer, navigation, and modal tests pass within the 400-line review forecast.
