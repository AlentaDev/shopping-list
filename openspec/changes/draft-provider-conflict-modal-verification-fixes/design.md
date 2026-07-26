# Design: Draft Provider Conflict Modal Verification Fixes

## Technical Approach

Repair only the evidence and build blockers identified in the prior change’s failed verification report. Keep the existing async AppShell resolver and draft-only modal behavior unchanged; use RED-GREEN-REFACTOR to make the web runner isolated, prove the three missing runtime clauses, then regenerate verification evidence. No delta capability spec, API, active-edit, or E2E work is required.

## Architecture Decisions

| Decision | Option / tradeoff | Choice and rationale |
|---|---|---|
| Build boundary | Rewrite the AppShell import-boundary utility vs. supply its existing Node type dependency | Remove unused AppShell state, add the existing Node typings to the web compiler’s `types`, and keep the import-boundary implementation intact. This fixes the real compiler errors without changing its boundary rules. |
| Catalog source type | Widen `ListItem.source` globally vs. narrow at the Catalog item-construction boundary | Use the existing `SupportedProviderId` contract for `source`; do not widen list-domain data or alter routing. Catalog has the known supported-provider contract, so this is type correction only. |
| Storage isolation | Preserve process/file-backed state vs. establish fresh test storage per test | Reset a canonical in-memory `localStorage` for each Vitest test and restore any test-local replacement. This removes cross-suite/order leakage under Node 26. The fingerprint error case will explicitly make its storage access throw, so isolation cannot hide fallback handling. |
| Runtime proof | Export private handlers or add E2E vs. exercise existing AppShell callback wiring | Extend AppShell integration tests through the callback already passed to navigation. This observes the real Promise resolution and route effects without production API changes or E2E expansion. |

## Data Flow

```text
feature callback -> AppShell.onRequestDraftProviderConflict(input)
                 -> { input, resolve } state -> DraftProviderConflictModal
confirm          -> resetDraft + navigate -> resolve(true) -> clear state
```

Tests start with fresh storage. The dedicated fingerprint test temporarily replaces/spies on its `getItem` path to throw, asserts fallback and warning behavior, then restores it; other tests must not inherit that failure or another suite’s storage object.

## File Changes

| File | Action | Description |
|---|---|---|
| `apps/web/src/app-shell/AppShell.tsx` | Modify | Remove unused `isLandingPage`; do not alter resolver or active-edit handlers. |
| `apps/web/tsconfig.app.json` | Modify | Include existing Node typings so `node:path` in the boundary utility compiles. |
| `apps/web/src/features/catalog/Catalog.tsx` | Modify | Type `ListItem.source` with the existing supported-provider union at item creation. |
| `apps/web/src/test/setup.ts` | Modify | Establish and clear deterministic storage for every test. |
| `apps/web/src/shared/utils/deviceFingerprint.test.ts` | Modify | Preserve explicit throwing-storage fallback coverage against the isolated store. |
| `apps/web/src/app-shell/AppShell.test.tsx` | Modify | Assert no native confirm call, confirm Promise `true`, and dismiss Promise `false` with unchanged route. |
| `apps/web/src/features/catalog/Catalog.test.tsx` | Modify if baseline requires | Restore test-local storage/fixtures and correct only assertions contradicted by current UI. |
| `apps/web/src/features/lists/ListsContainer.test.tsx` | Modify if baseline requires | Stabilize fixtures/async assertions only; retain active-edit delegation behavior. |
| `openspec/changes/draft-provider-conflict-modal/verify-report.md` | Modify during verify | Replace failed evidence only after repeated green authoritative runs and build. |

## Interfaces / Contracts

No public contract changes. The existing callback remains:

```ts
onRequestDraftProviderConflict?: (input: DraftProviderConflictInput) => Promise<boolean>;
```

`true` retains the current reset-and-navigate outcome; `false` retains the current draft and route. Active-edit precedence remains untouched.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Integration | AppShell native-confirm absence; confirm/dismiss Promise and route outcomes | Add failing assertions first through captured navigation callback, then make them green without product changes. |
| Unit | `deviceFingerprint` storage failure fallback | Inject a throwing `getItem`, assert generated result and warning, and restore storage after the test. |
| Integration | Authoritative web suite isolation | Run `pnpm --filter @app/web test:run` at least twice after targeted RED/GREEN runs; fix only deterministic fixtures/assertions. |
| Build | All reported type errors | Run `pnpm --filter @app/web build`. |
| E2E | None | Explicitly out of scope. |

## Migration / Rollout

No migration required. No persisted-data format, endpoint, or user-visible behavior changes.

## Open Questions

- [ ] None. Apply must verify the per-test storage replacement works with the repository’s Node 26 runtime before accepting the repeated suite baseline.
