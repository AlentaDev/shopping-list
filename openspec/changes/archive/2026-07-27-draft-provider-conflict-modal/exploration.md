## Exploration: draft-provider-conflict-modal

### Current State

The native provider-conflict dialog for non-empty normal drafts is still `window.confirm`, driven by `apps/web/src/context/useDraftProviderConflict.ts` (line 88). The hook is the only place that calls the browser dialog. Its decision tree is unchanged:

1. `requestedProviderId === draftProviderId` → return `true` (silent).
2. `items.length === 0` → `setDraftProviderId(requestedProviderId)`, return `true` (silent).
3. `hasActiveEditSession()` is `true` AND an `onActiveEditConflict` callback is provided → call callback with `{ currentProviderId, requestedProviderId }`, return `false`.
4. Otherwise → call `window.confirm(buildConflictMessage(currentName, requestedName))` and, on accept, `resetDraft(requestedProviderId)`.

`buildConflictMessage` substitutes `{currentProvider}` and `{requestedProvider}` placeholders in `UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT` (`apps/web/src/shared/constants/ui.ts:173`). The hook is consumed by `Catalog.tsx` (cross-provider `handleAddProduct`) and `ListsContainer.tsx` (cross-provider `reuse` action); both call sites pass only `onActiveEditConflict` today, never a draft-provider-conflict callback. `useDraftProviderConflict` is **not** exported from the public context barrel `apps/web/src/context/index.ts`.

The active-edit conflict modal is rendered inline in `AppShell.tsx` (lines 321-362) and uses `UI_TEXT.LISTS.ACTIVE_EDIT_CONFLICT` (lines 305-312). It is owned entirely by `AppShell` state (`ActiveEditConflictState`), driven by `onRequestActiveEditConflict` threaded through `useAppShellNavigation` and feature components. Its confirm handler is `handleCancelEditingAndStartNewList` which calls `cancelListEditing(editingListId)` → `deleteAutosave()` → `clearEditSessionMarker()` → `resetDraft(requestedProviderId)` → `setDraftProviderId(requestedProviderId)` → `setItems([])` → reset cart title/status/editing → `saveLocalDraft({...})` → `navigate("/${requestedProviderId}/catalog")`. Its dismiss handler is `handleDismissActiveEditConflict` which navigates back to the current provider's catalog and clears the conflict state. Tests in `AppShell.editing-session.test.tsx` lock this behavior in (`offers only active-edit conflict actions for cross-provider mutations`, `cancels editing and redirects to the requested provider when the user confirms`).

The two flows are **mutually exclusive by hook logic**: `useDraftProviderConflict` only fires the native dialog (step 4) when `hasActiveEditSession()` is `false`. They are also semantically distinct: the draft flow's confirm only calls `resetDraft(requestedProviderId)` and returns a boolean — it does NOT navigate, save local draft, cancel server-side editing, or delete autosave. The active-edit flow's confirm does all of those. A `mode` discriminator, a `DraftProviderConflictState`, an `onRequestDraftProviderConflict` prop, and a `UI_TEXT.LISTS.DRAFT_PROVIDER_CONFLICT` block do **not** exist in the working tree (only `openspec/config.yaml` is uncommitted). The prior Engram observation (`#851`, `#853`) describing a unified modal is **stale** and contradicted by the real code; the user-supplied constraint explicitly invalidates it.

Tests in `Catalog.test.tsx` and `ListsContainer.test.tsx` currently spy on `window.confirm` (e.g., `Catalog.test.tsx:236`, `ListsContainer.test.tsx:378`) to assert the cross-provider add and reuse flows; `useDraftProviderConflict.test.tsx` likewise uses `vi.spyOn(window, "confirm")` for the `shows confirm with explicit provider labels`, `keeps draft intact when confirm is cancelled`, and `requestedProviderName override` scenarios. Those tests will need to migrate to a callback spy.

### Affected Areas

- `apps/web/src/context/useDraftProviderConflict.ts` — drop `window.confirm`, emit a new `onDraftProviderConflict` callback carrying the same payload shape as the active-edit one (`{ currentProviderId, requestedProviderId }`) plus the resolved `requestedProviderName` override and the return-from-confirm flow; preserve the existing decision tree verbatim.
- `apps/web/src/context/useDraftProviderConflict.test.tsx` — replace `vi.spyOn(window, "confirm")` with a callback spy; add coverage that the new callback receives the correct payload and that `confirmAndReset` resolves `false` when the callback returns false (or the modal is dismissed) and `true` when the modal is confirmed.
- `apps/web/src/app-shell/AppShell.tsx` — add `DraftProviderConflictState` (sibling to `ActiveEditConflictState`), a `handleRequestDraftProviderConflict` callback, a `handleConfirmDraftProviderConflict` that calls `resetDraft(requestedProviderId)` and resolves the pending `confirmAndReset` promise to `true`, a `handleDismissDraftProviderConflict` that resolves the pending promise to `false`, and a JSX block rendering the new modal. Thread the resolve mechanism from the hook back up through a `ref` or a per-call resolve function (the hook returns a `Promise<boolean>`, so the composition layer must await it).
- `apps/web/src/app-shell/components/DraftProviderConflictModal.tsx` (new) — presentational, receives `currentProviderId`, `requestedProviderId`, optional `requestedProviderName`, `onConfirm`, `onDismiss`; renders the same `role="dialog" aria-modal="true"` shell used by the active-edit modal, with `UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT` as the body and new `UI_TEXT` keys for TITLE and the two button labels.
- `apps/web/src/app-shell/useAppShellNavigation.ts` — add `onRequestDraftProviderConflict` to `UseAppShellNavigationArgs` and `MainContentParams`; pass it through to `Catalog` and `ListsContainer` alongside `onRequestActiveEditConflict`.
- `apps/web/src/app-shell/useAppShellNavigation.test.ts` and `useAppShellNavigation.legacy.test.tsx` — add the new callback to the mock factory's `useAppShellNavigation` stub (currently mocks `onRequestActiveEditConflict` only).
- `apps/web/src/features/catalog/Catalog.tsx` — pass `onRequestDraftProviderConflict` to `useDraftProviderConflict` so the hook can emit it on a non-empty cross-provider add with no edit session.
- `apps/web/src/features/catalog/Catalog.test.tsx` — swap the `vi.spyOn(window, "confirm")` assertions in `keeps the current draft provider when a cross-provider add is cancelled`, `resets the draft only when a cross-provider mutation is confirmed`, and `switches an empty draft to the requested provider before the first mutation` to callback-based assertions; the test that already uses `onRequestActiveEditConflict` for the edit-session case stays as-is.
- `apps/web/src/features/lists/ListsContainer.tsx` — same callback thread-through for the `reuse` path.
- `apps/web/src/features/lists/ListsContainer.test.tsx` — swap `window.confirm` spies in the cross-provider reuse scenarios for the new callback spy.
- `apps/web/src/shared/constants/ui.ts` — add a new `UI_TEXT.LISTS.DRAFT_PROVIDER_CONFLICT` (or `UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL`) block with `TITLE`, `CANCEL_LABEL`, `CONFIRM_LABEL`; the existing `UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT` MESSAGE string is preserved untouched.
- `openspec/specs/provider-aware-catalog-routing/spec.md` and `openspec/specs/list-provider-ownership/spec.md` — no behavioral change; no delta spec required unless the orchestrator wants a new requirement that codifies the in-app modal UX. The existing `draft_provider_conflict` server contract is unaffected.

### Approaches

1. **Reuse the active-edit modal with a `mode: 'active-edit' | 'draft'` flag** — Generalize the AppShell `ActiveEditConflictState` into a discriminated union, branch the JSX by mode, and let the hook emit a `mode` payload instead of two callbacks.
   - Pros: Single modal component, single state shape, single render path.
   - Cons: Touches the active-edit state and render block, which violates the "presentation-focused change, not a refactor of edit mode" constraint. The two flows have different side effects (active-edit cancels server-side editing + autosave; draft only calls `resetDraft`); a single state object must encode both, and the existing active-edit test suite would need parity re-validation. The prior Engram memory records this attempt but it is not in the current tree, so any diff would still be a meaningful refactor of edit-mode code. Diff size grows and crosses the 400-line budget risk.
   - Effort: High.

2. **Dedicated presentational modal + sibling AppShell state** — Extract `DraftProviderConflictModal.tsx` in `app-shell/components/`, add `DraftProviderConflictState` (sibling to the active-edit one), keep the active-edit modal block and state untouched. `useDraftProviderConflict` emits a new `onDraftProviderConflict` callback (the hook still emits the active-edit one when an edit session exists). The hook needs a way to await the modal result — a per-call resolver function stored in a ref keyed by an opaque `conflictId`, or a `useState<{ resolve, payload } | null>` driven flow.
   - Pros: Zero refactor of active-edit code or tests. Mutually exclusive render is already guaranteed by the hook's edit-session check. Preserves all existing semantics verbatim. Tightest diff and lowest regression risk. Stays within the 400-line budget.
   - Cons: Two near-identical modal shells (overlap is purely visual: dialog backdrop, heading, paragraph, two buttons). No shared primitive; future visual drift is possible. Promise resolution from hook to composition layer needs a small `ref`/state pattern.
   - Effort: Low.

3. **Extract a generic `<ProviderConflictModal>` primitive reused by both flows** — AppShell renders two instances driven by independent state; the active-edit block is refactored to consume the primitive with no behavior change. Both modals use the same component but pass different copy and handlers.
   - Pros: Visual consistency is enforced by the primitive; a future visual change touches one place.
   - Cons: Touches the active-edit JSX block (even with a no-behavior-change promise, the existing `AppShell.editing-session.test.tsx` must pass unchanged, and the render structure must remain `role="dialog" aria-modal="true"`). This is a refactor of edit-mode presentation. Wider diff, more review surface, and crosses the constraint "presentation-focused change, not a refactor of edit mode." Two-state-but-one-component adds a tiny mental hop vs. Approach 2.
   - Effort: Medium.

### Recommendation

Adopt **Approach 2**: a dedicated `DraftProviderConflictModal` in `app-shell/components/` plus sibling AppShell state, leaving the active-edit modal and its tests untouched.

Why:
- The user constraint forbids refactoring edit mode; Approach 2 is the only one that strictly respects that.
- The two flows are already gated to be mutually exclusive by `useDraftProviderConflict`'s `hasActiveEditSession()` check, so two independent states cannot render at once.
- Their side effects differ: the draft flow's confirm only calls `resetDraft(requestedProviderId)` and resolves `confirmAndReset` to `true`; the active-edit flow cancels server-side editing, deletes autosave, clears the edit marker, and navigates. Coupling them in one state object would entangle those responsibilities.
- Diff is presentation-only, fits the 400-line budget, and keeps the change isolated to the catalog/lists draft path.
- The prior Engram memory's "shared modal" claim is stale and contradicted by the working tree; the task's explicit validation requirement rules out reviving it.

The `confirmAndReset` `Promise<boolean>` contract from the hook to feature components is preserved. The composition layer needs a way to resolve that promise when the user clicks the modal: a `Map<conflictId, (result: boolean) => void>` keyed per call, stored in a `useRef` inside `AppShell`, is the cleanest pattern (avoids stale-state races and lets `Catalog`/`ListsContainer` continue to `await` `confirmAndReset` without changing their public contract). Feature components get a new `onRequestDraftProviderConflict` prop and forward it to the hook; the existing `onRequestActiveEditConflict` prop is kept untouched.

The hook signature evolves to: `useDraftProviderConflict({ onActiveEditConflict?, onDraftProviderConflict? })`. The `confirmAndReset` call site now passes only `requestedProviderId` and `requestedProviderName` (the optional name override from `ListsContainer` reuse path is preserved). The dialog/MESSAGE source remains `UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT` unchanged; new keys for `TITLE`, `CANCEL_LABEL`, and `CONFIRM_LABEL` are added in `UI_TEXT` (e.g., under `UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL` or `UI_TEXT.LISTS.DRAFT_PROVIDER_CONFLICT`) and consumed only by the new modal.

### Risks

- **Promise plumbing between hook and composition layer**: `confirmAndReset` is async; the modal lives in `AppShell`. A per-call `Map<conflictId, resolve>` stored in a `useRef` in `AppShell` is required so the hook can register a resolver and `AppShell` can invoke it on confirm/dismiss. Without this, the hook would need a new context, which violates CORE=100% boundaries and the "presentation-focused" scope.
- **`requestedProviderName` override regression**: `ListsContainer.tsx` currently passes `list.provider?.displayName` as `requestedProviderName` so the message reads the persisted list's display name. The new modal must accept and substitute that override too; losing it would regress the reuse path.
- **Mutual-exclusivity assumption**: if a future caller invokes both callbacks in the same render, two modals could appear. The hook already enforces this; the test suite must assert that the new callback is **not** fired when an edit session exists (mirroring the existing `useDraftProviderConflict.test.tsx` test `delegates to onActiveEditConflict and skips confirm when an edit session exists`).
- **Native dialog semantics differ from modal semantics**: `window.confirm` is synchronous and blocks the main thread. The new modal is async; if a test or caller depends on a synchronous return after dismiss, the `await` discipline must be preserved. Existing `Catalog.test.tsx` and `ListsContainer.test.tsx` already `await` the relevant click, so no caller change is required.
- **New `UI_TEXT` keys**: adding `TITLE` and button labels is required (the native dialog provided them via browser default). This is additive, not a violation of "preserve existing messages," but the proposal/spec must call it out.
- **Stale Engram memory (`#851`, `#853`)**: any future agent reading Engram will see the "shared modal" claim. After this change lands, a follow-up `mem_update` (or new observation) should mark the prior one as superseded. This is a documentation hygiene risk, not a code risk.
- **Test migration surface**: six `vi.spyOn(window, "confirm")` blocks across three test files must be rewritten to assert the new callback. The diff includes test refactors that are not strictly new tests.

### Ready for Proposal

Yes. The change is small, isolated, presentation-only, and stays within the 400-line review budget. The orchestrator should tell the user:

- Approach: dedicated `DraftProviderConflictModal` + sibling AppShell state (Approach 2). Reuse of the active-edit modal is rejected because it requires refactoring active-edit code and violates the "no edit-mode refactor" constraint.
- Scope: `useDraftProviderConflict` (drop `window.confirm`, emit new callback), `AppShell` (sibling state + handler + modal render), `useAppShellNavigation` (new prop), `Catalog`/`ListsContainer` (new prop forwarding), `shared/constants/ui.ts` (new TITLE + button labels), three test files (callback spies), and a new `app-shell/components/DraftProviderConflictModal.tsx`.
- Out of scope: active-edit modal, `UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT` MESSAGE string, server-side `draft_provider_conflict` contract, edit session semantics, navigation behavior on confirm/dismiss.
- Confirmation requested from the user: TITLE wording and button labels for the new modal (suggested: TITLE `"¿Cambiar de proveedor?"`, CANCEL `"Cancelar"`, CONFIRM `"Vaciar y continuar"`) — they are new UI text and should be approved before implementation.
