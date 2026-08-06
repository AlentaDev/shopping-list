# Design: Draft Provider Conflict Modal

## Technical Approach

Replace `window.confirm` in `useDraftProviderConflict` with an async
`onDraftProviderConflict` option that AppShell resolves through a per-conflict
`Promise<boolean>`. Add a presentational `DraftProviderConflictModal` sibling
to the active-edit block. Keep `UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT`
literal; add only title + label keys. Active-edit branch, `Promise<boolean>`
signature, and consumer call sites stay untouched.

## Architecture Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Hook resolution source | `onDraftProviderConflict(input) => Promise<boolean>` option | Mirrors `onActiveEditConflict`; consumer signature unchanged; no churn for Catalog/ListsContainer |
| 2 | Modal state owner | `AppShell` keeps `{resolve, payload}` per conflict | AppShell already owns `activeEditConflict`; proposal mandates AppShell ownership |
| 3 | Modal composition | New `app-shell/components/DraftProviderConflictModal.tsx` (presentational) | Out-of-scope rule forbids a shared modal abstraction; mirrors `AutosaveConflictModal` |
| 4 | Focus management | Inline focus trap (auto-focus on mount, capture Tab/Shift+Tab, restore on close) | AGENTS.md forbids new libraries; 2 buttons only |
| 5 | Test migration | New prop `onRequestDraftProviderConflict` on Catalog + ListsContainer; tests await a resolving callback | Strict-TDD requires red→green per file; `vi.spyOn(window,"confirm")` becomes impossible |
| 6 | UI_TEXT keys | Add `CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.{TITLE, CONFIRM_LABEL, DISMISS_LABEL}`; leave `DRAFT_PROVIDER_CONFLICT` untouched | Spec mandates literal message + centralized labels |

## Data Flow

```
User adds in Catalog  ─┐
User reuses in Lists  ─┤
                       ▼
useDraftProviderConflict.confirmAndReset({ requestedProviderId, requestedProviderName? })
   ├─ same provider?  → resolve true
   ├─ empty draft?    → setDraftProviderId → resolve true
   ├─ active edit?    → onActiveEditConflict(...) → resolve false  (unchanged)
   └─ non-empty x-provider → onDraftProviderConflict(input)        (NEW)
                                ▼
AppShell.handleRequestDraftProviderConflict
   setDraftProviderConflict({ resolve, currentProviderId,
                               requestedProviderId, requestedProviderName? })
                                ▼
           <DraftProviderConflictModal />   ← new
   Confirm  → resetDraft + navigate(/{requestedProvider}/catalog)
              → resolve(true)  → setState(null)
   Dismiss / Escape / backdrop → resolve(false) → setState(null)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app-shell/components/DraftProviderConflictModal.tsx` | Create | Presentational modal: `role="dialog"`, `aria-modal="true"`, inline focus trap, Escape + backdrop dismiss. Reads `UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.*` |
| `app-shell/components/DraftProviderConflictModal.test.tsx` | Create | Renders message with provider names; confirm/dismiss; Escape + backdrop dismiss; focus trap |
| `app-shell/AppShell.tsx` | Modify | Add `draftProviderConflict` state + resolver; render new modal; thread callback to navigation |
| `app-shell/AppShell.test.tsx` | Modify | New test: draft request renders modal; confirm → `resetDraft` + `navigate`; dismiss leaves draft |
| `app-shell/useAppShellNavigation.ts` | Modify | Accept and forward `onRequestDraftProviderConflict` to Catalog + ListsContainer |
| `app-shell/useAppShellNavigation.test.ts` | Modify | Assert callback forwarded to both branches |
| `context/useDraftProviderConflict.ts` | Modify | Replace `window.confirm` with `onDraftProviderConflict` option; export `buildConflictMessage`; keep active-edit + `hasActiveEditSession` |
| `context/useDraftProviderConflict.test.tsx` | Modify | Migrate 5 confirm tests to await a callback; keep silent, active-edit, name-override |
| `features/catalog/Catalog.tsx` | Modify | Accept `onRequestDraftProviderConflict` and forward to `useDraftProviderConflict` |
| `features/catalog/Catalog.test.tsx` | Modify | Replace 5 `window.confirm` tests with callback prop tests |
| `features/lists/ListsContainer.tsx` | Modify | Accept `onRequestDraftProviderConflict` and forward to `useDraftProviderConflict` |
| `features/lists/ListsContainer.test.tsx` | Modify | Replace 3 reuse-conflict `window.confirm` tests with callback prop tests |
| `shared/constants/ui.ts` | Modify | Add `CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.{TITLE, CONFIRM_LABEL, DISMISS_LABEL}` only |

## Interfaces / Contracts

```ts
// useDraftProviderConflict.ts
export type DraftProviderConflictInput = {
  currentProviderId: string;
  requestedProviderId: string;
  requestedProviderName?: string;
  message: string; // pre-built from UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT
};
type UseDraftProviderConflictOptions = {
  onActiveEditConflict?: (input: ActiveEditConflictInput) => void;
  onDraftProviderConflict?: (input: DraftProviderConflictInput) => Promise<boolean>;
};

// DraftProviderConflictModal.tsx
type DraftProviderConflictModalProps = {
  isOpen: boolean;
  message: string;
  currentProviderName: string;
  requestedProviderName: string;
  onConfirm: () => void;
  onDismiss: () => void;
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Hook (CORE 100%) | Same provider, empty draft, active-edit delegation, name override, x-provider confirm + dismiss | `useDraftProviderConflict.test.tsx` — `await` a callback that resolves true/false |
| Modal (IMPORTANT 80%) | Literal message + provider names; focus moves in; Escape + backdrop dismiss; confirm/dismiss fire props | New `DraftProviderConflictModal.test.tsx` — RTL + `userEvent` |
| Catalog (IMPORTANT 80%) | Prop forwarded; x-provider confirm resets draft + adds item; dismiss keeps draft; active-edit delegation | `Catalog.test.tsx` — pass mock `onRequestDraftProviderConflict` |
| ListsContainer (IMPORTANT 80%) | Prop forwarded; reuse confirm → `/reuse` + `onOpenList`; dismiss skips `/reuse`; active-edit delegation | `ListsContainer.test.tsx` — pass mock `onRequestDraftProviderConflict` |
| AppShell (IMPORTANT 80%) | Modal renders only on state; confirm → `resetDraft` + `navigate`; dismiss leaves draft; coexists with active-edit modal | `AppShell.test.tsx` — extend mocks; one new test |
| Navigation (IMPORTANT 80%) | Callback forwarded to both branches | `useAppShellNavigation.test.ts` |

Strict-TDD: RED modal → 5 hook → 5 Catalog → 3 ListsContainer → AppShell + navigation. GREEN: modal, hook option, AppShell state, threading, UI_TEXT keys. REFACTOR preserves behavior.

## Migration / Rollout

No migration. Same call sites swap a sync prompt for an async modal. No data/API/flag changes. Rollback = revert.

## Open Questions

- [ ] Modal title (`"¿Cambiar de proveedor?"`) and confirm label (`"Sí, cambiar"`) — both tweaked via `UI_TEXT`. No blockers.
