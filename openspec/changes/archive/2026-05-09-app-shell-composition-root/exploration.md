## Exploration: app-shell-composition-root

### Current State
- `App.tsx` renders `AppShell` as the top-level UI composition entry (`@src/app-shell/AppShell`).
- `AppShell` currently orchestrates navigation/auth flow, header actions, cart modal state, list opening flow, and cross-feature wiring (`catalog`, `lists`, `shopping-list`, `auth`, `toast`, contexts).
- The repository currently has **two app-shell trees** (`src/app-shell/*` and `src/features/app-shell/*`) with duplicated files and mixed imports. Tests under `features/app-shell` import runtime code from `@src/app-shell/*`, signaling architecture drift.
- This creates the conflict: strict feature isolation discourages feature-to-feature coupling, but `AppShell` must legitimately compose multiple features.

### Affected Areas
- `apps/web/src/App.tsx` — current composition root entrypoint.
- `apps/web/src/app-shell/AppShell.tsx` — real orchestration layer used by app runtime.
- `apps/web/src/app-shell/useAppShellNavigation.ts` — route-to-feature resolver and navigation coordinator.
- `apps/web/src/app-shell/components/AppHeader.tsx` — shell-level header UI and global actions.
- `apps/web/src/features/app-shell/*` — duplicated shell implementation/tests causing boundary ambiguity.
- `apps/web/src/providers/AppProviders.tsx` — global provider composition, adjacent to shell responsibility boundaries.
- `apps/web/src/main.tsx` — bootstrapping + provider/shell composition entrypoint.
- `apps/web/src/App.test.tsx` and `apps/web/src/features/app-shell/*.test.tsx` — test suite currently tied to mixed shell locations.

### Approaches
1. **Keep AppShell as a feature (`features/app-shell`) and allow explicit feature-to-feature exception** — Document app-shell as a “meta-feature” that may import other features.
   - Pros: Minimal physical movement if future work aligns everything under `features/app-shell`.
   - Cons: Semantically misleading (composition is not product business capability), normalizes rule exceptions, and weakens import policy clarity.
   - Effort: Medium.

2. **Promote AppShell to top-level composition layer (`src/app-shell`) outside `features/`** — Treat shell as application composition root with explicit allowed dependency direction (composition -> features/context/shared/providers).
   - Pros: Clean boundary semantics, resolves rule conflict without exceptions, preserves feature isolation, and matches current runtime usage in `App.tsx`.
   - Cons: Requires migration cleanup of duplicate `features/app-shell` tree and test relocation/update.
   - Effort: Medium.

3. **Embed composition into `App.tsx` directly and remove dedicated shell module** — Place all orchestration in `App.tsx`.
   - Pros: Single root file, no extra folder.
   - Cons: Rapid growth of an unstructured god component, reduced testability, weak separation of concerns.
   - Effort: Low initially, High long-term maintenance.

### Recommendation
Adopt **Approach 2**: formalize `src/app-shell/` as a **composition layer** (not a business feature), with `App.tsx` as thin entrypoint and `AppShell` as composition coordinator.

Why: this aligns with the user decision, resolves the architectural contradiction directly, and keeps feature-first intact by preserving `features/*` as isolated business/UI modules while shell owns cross-feature orchestration only.

### Migration Boundaries (proposal-ready)
- **Stays in `features/*`:**
  - Business/UI capability logic (catalog, lists, shopping-list, auth, mobile-app).
  - Feature services/adapters and feature-local components.
- **Moves / remains in `app-shell/*`:**
  - Route/state orchestration across features.
  - Global chrome (header, shell layout) and cross-feature UI composition.
  - Global interaction wiring (open cart event handling, top-level modal open/close coordination).
- **Must NOT move into shell:**
  - Feature business rules, DTO adapters, remote data orchestration belonging to a single feature.

### Dependency Rules Impact
- Add explicit frontend rule set:
  - `features/*` MUST NOT import from other `features/*`.
  - `features/*` MUST NOT import from `app-shell/*`.
  - `app-shell/*` MAY import from `features/*`, `context/*`, `shared/*`.
  - `App.tsx` SHOULD only compose `AppShell`.
  - `providers/*` stay infrastructure-level and MUST NOT depend on feature internals.

### Testing Impact
- Keep TDD for migration slices.
- Reclassify/locate shell tests as composition tests (IMPORTANT tier, target >=80% in file-level coverage).
- Update imports in shell tests to a single canonical path (`@src/app-shell/*`) and delete duplicate test targets under `features/app-shell` once migrated.
- Preserve CORE 100% strategy in contexts/services unaffected; shell tests should focus on orchestration behaviors (navigation gating, cross-feature wiring, modal coordination).

### Risks
- Duplicate tree cleanup can create temporary import breaks if done in large batch.
- If boundaries are not documented, future contributors may reintroduce shell logic into features (or vice versa).
- Over-centralizing logic in `AppShell` can create a monolith unless orchestration helpers remain segmented.

### Ready for Proposal
Yes — ready to proceed to `sdd-propose` with a scoped incremental plan:
1) establish architectural rule update,
2) converge to single `src/app-shell` implementation,
3) align tests/imports,
4) remove duplicate tree safely.
